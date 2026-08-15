const { Module, Grammar, Vocabulary, Phrasebook, Conversation, Message, Test, TestResult, User, ModuleResult } = require('../models');
const { getPatientReply, generateFeedback, checkGrammar, generatePatientScenario } = require('../services/gemini.service');

// Modul natijalarini har safar qayta hisoblab saqlash
const recalculateAndSaveModuleResult = async (studentId, moduleId) => {
  try {
    const convs = await Conversation.findAll({
      where: { student_id: studentId, module_id: moduleId, status: 'completed' }
    });
    const tests = await TestResult.findAll({
      where: { student_id: studentId, module_id: moduleId }
    });

    const attemptsCount = convs.length + tests.length;

    let bestChatScore = 0;
    let bestGrammar = 0;
    let bestVocab = 0;
    let bestFluency = 0;
    let bestPron = 0;
    let bestClinical = 0;

    convs.forEach(c => {
      if ((c.overall_score || 0) > bestChatScore) bestChatScore = c.overall_score;
      if ((c.grammar_score || 0) > bestGrammar) bestGrammar = c.grammar_score;
      if ((c.vocabulary_score || 0) > bestVocab) bestVocab = c.vocabulary_score;
      if ((c.fluency_score || 0) > bestFluency) bestFluency = c.fluency_score;
      if ((c.pronunciation_score || 0) > bestPron) bestPron = c.pronunciation_score;
      if ((c.clinical_score || 0) > bestClinical) bestClinical = c.clinical_score;
    });

    let bestQuizScore = 0;
    tests.forEach(t => {
      if ((t.score || 0) > bestQuizScore) bestQuizScore = t.score;
    });

    // Weighted composite score: 30% quiz + 70% clinical chat when both attempted
    let combinedScore = 0;
    if (bestChatScore > 0 && bestQuizScore > 0) {
      combinedScore = Math.round(bestQuizScore * 0.3 + bestChatScore * 0.7);
    } else if (bestChatScore > 0) {
      combinedScore = bestChatScore;
    } else if (bestQuizScore > 0) {
      combinedScore = bestQuizScore;
    }

    const isCompleted = combinedScore >= 60 || bestChatScore >= 60;

    let [modRes] = await ModuleResult.findOrCreate({
      where: { student_id: studentId, module_id: moduleId },
      defaults: {
        student_id: studentId,
        module_id: moduleId
      }
    });

    await modRes.update({
      best_chat_score: bestChatScore,
      best_quiz_score: bestQuizScore,
      combined_score: combinedScore,
      best_grammar: bestGrammar,
      best_vocab: bestVocab,
      best_fluency: bestFluency,
      best_pronunciation: bestPron,
      best_clinical: bestClinical,
      attempts_count: attemptsCount,
      is_completed: isCompleted,
      last_attempt_at: new Date()
    });

    return modRes;
  } catch (err) {
    console.error('recalculateAndSaveModuleResult error:', err);
  }
};


// ── GET /api/student/modules ─────────────────────────────────
// Talabaning mutaxassisligiga mos modullar
const getModules = async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'description', 'order_index'],
    });

    let prevPassed = true; // 1-modul har doim ochiq bo'ladi

    const results = [];
    
    for (let m of modules) {
      const conv = await Conversation.findOne({
        where: { student_id: req.user.id, module_id: m.id, status: 'completed' },
        order: [['overall_score', 'DESC']],
      });
      const modRes = await ModuleResult.findOne({
        where: { student_id: req.user.id, module_id: m.id }
      });
      
      const chatScore = conv ? (conv.overall_score || 0) : 0;
      const combinedScore = modRes ? (modRes.combined_score || 0) : chatScore;
      const bestScore = Math.max(chatScore, combinedScore);

      const is_completed = bestScore >= 60 || (modRes && modRes.is_completed);
      const is_unlocked = prevPassed;
      
      results.push({
        ...m.toJSON(),
        is_completed: is_completed,
        best_score: bestScore > 0 ? bestScore : null,
        is_unlocked: is_unlocked
      });
      
      prevPassed = is_completed;
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { Op } = require('sequelize');

// Modul talaba uchun ochiq ekanligini tekshirish (1-modul har doim ochiq, keyingilar avvalgilar 60%+ o'tilgan bo'lsa)
const checkModuleUnlocked = async (studentId, specialtyId, targetModule) => {
  if (!targetModule) return { unlocked: false };
  if (targetModule.order_index <= 1) return { unlocked: true };

  const prevModules = await Module.findAll({
    where: {
      specialty_id: specialtyId,
      order_index: { [Op.lt]: targetModule.order_index }
    },
    order: [['order_index', 'ASC']]
  });

  for (let pm of prevModules) {
    const conv = await Conversation.findOne({
      where: { student_id: studentId, module_id: pm.id, status: 'completed' },
      order: [['overall_score', 'DESC']]
    });
    const passed = conv && conv.overall_score >= 60;
    if (!passed) {
      return { unlocked: false };
    }
  }

  return { unlocked: true };
};

// ── GET /api/student/modules/:id ────────────────────────────
const getModuleById = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      attributes: { exclude: ['patient_context', 'final_challenge_context'] },
    });
    if (!module) return res.status(404).json({ error: 'Modul topilmadi' });

    const { unlocked } = await checkModuleUnlocked(req.user.id, req.user.specialty_id, module);
    if (!unlocked) return res.status(403).json({ error: 'Modul qulflangan. Avvalgi modullarni kamida 60% ga yakunlang.' });

    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id/progress ───────────────────
const getModuleProgress = async (req, res) => {
  try {
    const currentModule = await Module.findByPk(req.params.id, {
      attributes: ['id', 'order_index', 'specialty_id']
    });
    if (!currentModule) return res.status(404).json({ error: 'Modul topilmadi' });

    const { unlocked } = await checkModuleUnlocked(req.user.id, req.user.specialty_id, currentModule);
    if (!unlocked) return res.status(403).json({ error: 'Modul qulflangan. Avvalgi modullarni kamida 60% ga yakunlang.' });

    const lastConversation = await Conversation.findOne({
      where: { student_id: req.user.id, module_id: req.params.id, status: 'completed' },
      order: [['overall_score', 'DESC']],
    });
    
    const testResult = await TestResult.findOne({
      where: { student_id: req.user.id, module_id: req.params.id },
      order: [['score', 'DESC']],
    });

    let parsedFeedback = {};
    if (lastConversation && lastConversation.general_feedback) {
      try {
        parsedFeedback = JSON.parse(lastConversation.general_feedback);
      } catch(e) {}
    }

    const moduleResult = await ModuleResult.findOne({
      where: { student_id: req.user.id, module_id: req.params.id }
    });

    // Keyingi modulni topish (Op.gt bilan eng birinchi tartibdagi)
    let nextModule = null;
    const next = await Module.findOne({
      where: {
        specialty_id: currentModule.specialty_id,
        order_index: { [Op.gt]: currentModule.order_index }
      },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'order_index']
    });
    if (next) nextModule = { id: next.id, title: next.title, order_index: next.order_index };

    res.json({
      last_conversation: lastConversation ? {
        id: lastConversation.id,
        grammar_score: lastConversation.grammar_score,
        vocabulary_score: lastConversation.vocabulary_score,
        fluency_score: lastConversation.fluency_score,
        pronunciation_score: lastConversation.pronunciation_score,
        clinical_score: lastConversation.clinical_score,
        overall_score: lastConversation.overall_score,
        general_feedback: parsedFeedback.general_feedback || '',
        errors: parsedFeedback.errors || []
      } : null,
      test_result: testResult ? {
        score: testResult.score,
        correct: testResult.correct,
        total: testResult.total
      } : null,
      module_result: moduleResult || null,
      next_module: nextModule
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id/grammar ────────────────────
const getGrammar = async (req, res) => {
  try {
    const items = await Grammar.findAll({
      where: { module_id: req.params.id },
      order: [['step_order', 'ASC'], ['id', 'ASC']],
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id/vocabulary ─────────────────
const getVocabulary = async (req, res) => {
  try {
    const words = await Vocabulary.findAll({
      where: { module_id: req.params.id },
      order: [['id', 'ASC']],
    });
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id/phrasebook ─────────────────
const getPhrasebook = async (req, res) => {
  try {
    const phrases = await Phrasebook.findAll({
      where: { module_id: req.params.id },
      order: [['step_order', 'ASC']],
    });
    res.json(phrases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/modules/:id/conversation ──────────────
// Yangi dialog sessiyasi ochish
const startConversation = async (req, res) => {
  try {
    const { attempt_type = 'first_attempt' } = req.body;
    const module = await Module.findByPk(req.params.id);
    if (!module) return res.status(404).json({ error: 'Modul topilmadi' });

    // Avvalgi active sessiyani yopish (agar chala qolgan bo'lsa)
    await Conversation.update(
      { status: 'completed' },
      { where: { student_id: req.user.id, module_id: req.params.id, status: 'active' } }
    );

    // Attempt type ga qarab tegishli kontekstni tanlash
    const patientContext =
      attempt_type === 'final_challenge'
        ? module.final_challenge_context
        : module.patient_context;

    // Generate specific scenario for this session
    const dynamicScenario = await generatePatientScenario(patientContext);

    const conversation = await Conversation.create({
      student_id: req.user.id,
      module_id: req.params.id,
      attempt_type,
      status: 'active',
      dynamic_scenario: dynamicScenario,
    });

    res.status(201).json({ conversation_id: conversation.id, attempt_type });
  } catch (err) {
    console.error('startConversation xato:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/conversation/:id/message ──────────────
// Talabaning xabarini qabul qilib, Gemini AI bemor javobini qaytarish
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Xabar matni bo\'sh bo\'lishi mumkin emas' });

    const conversation = await Conversation.findByPk(req.params.id, {
      include: [{ model: Module, as: 'module' }],
    });
    if (!conversation) return res.status(404).json({ error: 'Sessiya topilmadi' });
    if (conversation.student_id !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    if (conversation.status === 'completed')
      return res.status(400).json({ error: 'Bu sessiya allaqachon yakunlangan' });

    // Talaba xabarini saqlash
    await Message.create({
      conversation_id: conversation.id,
      sender: 'student',
      text_content: text,
    });

    // Suhbat tarixini Gemini uchun shakllantirish
    const prevMessages = await Message.findAll({
      where: { conversation_id: conversation.id },
      order: [['created_at', 'ASC']],
    });

    // Gemini history format: [{role: 'user'|'model', parts: [{text}]}]
    const history = prevMessages.slice(0, -1).map((m) => ({
      role: m.sender === 'student' ? 'user' : 'model',
      parts: [{ text: m.text_content }],
    }));

    // Gemini AI dan bemor javobini olish (dynamic_scenario bilan)
    const patientReply = await getPatientReply(conversation.dynamic_scenario, history, text);

    // AI bemor javobini saqlash
    await Message.create({
      conversation_id: conversation.id,
      sender: 'patient',
      text_content: patientReply,
    });

    res.json({ reply: patientReply });
  } catch (err) {
    console.error('sendMessage xato:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/conversation/:id/finalize ─────────────
// Suhbatni yakunlash va AI Feedback olish
const finalizeConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Sessiya topilmadi' });
    if (conversation.student_id !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });

    const messages = await Message.findAll({
      where: { conversation_id: conversation.id },
      order: [['created_at', 'ASC']],
    });

    if (messages.length < 2 && !req.body.test_mode)
      return res.status(400).json({ error: 'Baholash uchun kamida bitta xabar kerak' });

    // Modulning asosiy Vocabulary va Phrasebook iboralarini yuklash
    const [vocabularies, phrases, currentMod] = await Promise.all([
      Vocabulary.findAll({ where: { module_id: conversation.module_id } }),
      Phrasebook.findAll({ where: { module_id: conversation.module_id } }),
      Module.findByPk(conversation.module_id, { attributes: ['id', 'title'] }),
    ]);

    // Gemini AI Feedback (yoki test rejim uchun 100%)
    let feedback;
    if (req.body.test_mode) {
      feedback = {
        grammar_score: 10, vocabulary_score: 10, fluency_score: 10, pronunciation_score: 10, clinical_score: 10, overall_score: 100,
        target_vocab_used: vocabularies.slice(0, 3).map(v => v.word),
        target_phrases_used: phrases.slice(0, 2).map(p => p.phrase),
        general_feedback: "Test rejimida muvaffaqiyatli (100%) yakunlandi.",
        errors: []
      };
    } else {
      feedback = await generateFeedback(messages, {
        vocabulary: vocabularies.map(v => v.word),
        phrases: phrases.map(p => p.phrase),
        moduleTitle: currentMod?.title || ''
      });
    }

    // Natijalarni saqlash
    await conversation.update({
      status: 'completed',
      grammar_score:       feedback.grammar_score       || 0,
      vocabulary_score:    feedback.vocabulary_score    || 0,
      fluency_score:       feedback.fluency_score       || 0,
      pronunciation_score: feedback.pronunciation_score || 0,
      clinical_score:      feedback.clinical_score      || 0,
      overall_score:       feedback.overall_score       || 0,
      general_feedback:    JSON.stringify(feedback),
    });

    // Modul yakuniy natijasini saqlash va yangilash
    await recalculateAndSaveModuleResult(conversation.student_id, conversation.module_id);

    res.json(feedback);
  } catch (err) {
    console.error('finalize xato:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/conversation/:id/feedback ──────────────
const getFeedback = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Sessiya topilmadi' });
    if (conversation.student_id !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });

    const feedback = conversation.general_feedback
      ? JSON.parse(conversation.general_feedback)
      : null;

    res.json({
      grammar_score:       conversation.grammar_score,
      vocabulary_score:    conversation.vocabulary_score,
      fluency_score:       conversation.fluency_score,
      pronunciation_score: conversation.pronunciation_score,
      clinical_score:      conversation.clinical_score,
      overall_score:       conversation.overall_score,
      ...feedback,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/conversation/:id/messages ──────────────
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Sessiya topilmadi' });
    if (conversation.student_id !== req.user.id)
      return res.status(403).json({ error: 'Ruxsat yo\'q' });

    const messages = await Message.findAll({
      where: { conversation_id: req.params.id },
      order: [['created_at', 'ASC']],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id/tests ──────────────────────
const getTests = async (req, res) => {
  try {
    const tests = await Test.findAll({
      where: { module_id: req.params.id },
      // attributes: { exclude: ['correct_option'] }, // To'g'ri javobni yashirish (Test rejim uchun ochiq)
      order: [['id', 'ASC']],
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/modules/:id/tests/submit ──────────────
const submitTest = async (req, res) => {
  try {
    const { answers = {} } = req.body; // { questionId: 'A', ... }
    const tests = await Test.findAll({ where: { module_id: req.params.id } });

    let correct = 0;
    const results = tests.map((t) => {
      const isCorrect = String(answers[t.id] || '').toLowerCase().trim() === String(t.correct_option || '').toLowerCase().trim();
      if (isCorrect) correct++;
      return {
        question_id: t.id,
        your_answer: answers[t.id],
        correct_answer: t.correct_option,
        is_correct: isCorrect,
      };
    });

    const total = tests.length || 1;
    const score = Math.round((correct / total) * 100);
    const passed = score >= 60;

    await TestResult.create({
      student_id: req.user.id,
      module_id: req.params.id,
      score,
      correct,
      total,
      results
    });

    // Modul yakuniy natijasini saqlash va yangilash
    await recalculateAndSaveModuleResult(req.user.id, req.params.id);

    res.json({ score, correct, total, passed, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/grammar-check ─────────────────────────
const grammarCheck = async (req, res) => {
  try {
    const { text, mode } = req.body;
    if (!text) return res.status(400).json({ error: 'Matn bo\'sh bo\'lishi mumkin emas' });

    const result = await checkGrammar(text, mode || 'clinical');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/dashboard ──────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      attributes: ['id', 'title', 'order_index'],
    });

    const moduleIds = modules.map(m => m.id);

    // Get all completed module results
    const moduleResults = await ModuleResult.findAll({
      where: {
        student_id: req.user.id,
        module_id: { [Op.in]: moduleIds }
      }
    });

    // Get all completed conversations
    const allConvs = await Conversation.findAll({
      where: {
        student_id: req.user.id,
        status: 'completed',
        overall_score: { [Op.gt]: 0 }
      },
      order: [['created_at', 'DESC']],
      include: [{ model: Module, as: 'module', attributes: ['title', 'order_index'] }],
    });

    // Count unique completed modules (where score >= 60)
    const passedModuleIds = new Set();
    moduleResults.forEach(mr => {
      if (mr.is_completed || mr.combined_score >= 60 || mr.best_chat_score >= 60) {
        passedModuleIds.add(mr.module_id);
      }
    });
    allConvs.forEach(c => {
      if (c.overall_score >= 60) {
        passedModuleIds.add(c.module_id);
      }
    });

    const completedCount = passedModuleIds.size;
    const totalCount = modules.length || 10;
    const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

    // Calculate true average of best scores per attempted module
    const moduleBestScores = new Map();
    allConvs.forEach(c => {
      const current = moduleBestScores.get(c.module_id) || 0;
      if (c.overall_score > current) moduleBestScores.set(c.module_id, c.overall_score);
    });
    moduleResults.forEach(mr => {
      const current = moduleBestScores.get(mr.module_id) || 0;
      const best = Math.max(mr.combined_score || 0, mr.best_chat_score || 0);
      if (best > current) moduleBestScores.set(mr.module_id, best);
    });

    let avgScore = 0;
    if (moduleBestScores.size > 0) {
      let sum = 0;
      for (const val of moduleBestScores.values()) {
        sum += val;
      }
      avgScore = Math.round(sum / moduleBestScores.size);
    }

    res.json({
      total_modules: totalCount,
      completed_modules: completedCount,
      progress_percent: progressPercent,
      average_score: avgScore,
      recent_activity: allConvs.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getModules, getModuleById, getGrammar, getVocabulary, getPhrasebook,
  startConversation, sendMessage, finalizeConversation,
  getFeedback, getMessages, getTests, submitTest,
  grammarCheck, getDashboard, getModuleProgress
};
