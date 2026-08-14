const { Module, Vocabulary, Phrasebook, Conversation, Message, Test, TestResult, User, ModuleResult } = require('../models');
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
      if (c.overall_score > bestChatScore) bestChatScore = c.overall_score;
      if (c.grammar_score > bestGrammar) bestGrammar = c.grammar_score;
      if (c.vocabulary_score > bestVocab) bestVocab = c.vocabulary_score;
      if (c.fluency_score > bestFluency) bestFluency = c.fluency_score;
      if (c.pronunciation_score > bestPron) bestPron = c.pronunciation_score;
      if (c.clinical_score > bestClinical) bestClinical = c.clinical_score;
    });

    let bestQuizScore = 0;
    tests.forEach(t => {
      if (t.score > bestQuizScore) bestQuizScore = t.score;
    });

    const hasChat = convs.length > 0;
    const hasQuiz = tests.length > 0;
    let combinedScore = 0;
    if (hasChat && hasQuiz) {
      combinedScore = Math.round((bestChatScore + bestQuizScore) / 2);
    } else if (hasChat) {
      combinedScore = bestChatScore;
    } else if (hasQuiz) {
      combinedScore = bestQuizScore;
    }

    const isCompleted = (bestChatScore >= 60 && bestQuizScore >= 60) || combinedScore >= 70;

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
      const testResult = await TestResult.findOne({
        where: { student_id: req.user.id, module_id: m.id },
        order: [['score', 'DESC']],
      });
      
      const testScore = testResult ? testResult.score : 0;
      const chatScore = conv ? conv.overall_score : 0;
      const hasAnyScore = !!(testResult || conv);
      const avg_score = hasAnyScore ? Math.round((testScore + chatScore) / 2) : null;

      // 60% dan oshsa yakunlangan hisoblanadi
      const is_completed = testScore >= 60 && chatScore >= 60;
      const is_unlocked = prevPassed;
      
      results.push({
        ...m.toJSON(),
        is_completed: is_completed,
        best_score: avg_score,
        is_unlocked: is_unlocked
      });
      
      // Keyingi modul faqat ushbu modul kamida 60% bilan yakunlanganda ochiladi
      prevPassed = is_completed && (avg_score !== null && avg_score >= 60);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id ────────────────────────────
const getModuleById = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      attributes: { exclude: ['patient_context', 'final_challenge_context'] },
    });
    if (!module) return res.status(404).json({ error: 'Modul topilmadi' });
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/modules/:id/progress ───────────────────
const getModuleProgress = async (req, res) => {
  try {
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
        score: testResult.score
      } : null,
      module_result: moduleResult || null
    });
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

    // Gemini AI Feedback (yoki test rejim uchun 100%)
    let feedback;
    if (req.body.test_mode) {
      feedback = {
        grammar_score: 10, vocabulary_score: 10, fluency_score: 10, pronunciation_score: 10, clinical_score: 10, overall_score: 100,
        general_feedback: "Test rejimida muvaffaqiyatli (100%) yakunlandi.",
        errors: []
      };
    } else {
      feedback = await generateFeedback(messages);
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
    const { answers } = req.body; // { questionId: 'A', ... }
    const tests = await Test.findAll({ where: { module_id: req.params.id } });

    let correct = 0;
    const results = tests.map((t) => {
      const isCorrect = String(answers[t.id]).toLowerCase() === String(t.correct_option).toLowerCase();
      if (isCorrect) correct++;
      return {
        question_id: t.id,
        your_answer: answers[t.id],
        correct_answer: t.correct_option,
        is_correct: isCorrect,
      };
    });

    const score = Math.round((correct / tests.length) * 100);

    await TestResult.create({
      student_id: req.user.id,
      module_id: req.params.id,
      score,
      correct,
      total: tests.length,
      results
    });

    // Modul yakuniy natijasini saqlash va yangilash
    await recalculateAndSaveModuleResult(req.user.id, req.params.id);

    res.json({ score, correct, total: tests.length, results });
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

    const completedModules = await TestResult.findAll({
      where: { student_id: req.user.id },
    });

    const { Op } = require('sequelize');
    const conversations = await Conversation.findAll({
      where: { student_id: req.user.id, status: 'completed', overall_score: { [Op.gt]: 0 } },
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [{ model: Module, as: 'module', attributes: ['title'] }],
    });

    const avgScore = conversations.length
      ? Math.round(conversations.reduce((s, c) => s + c.overall_score, 0) / conversations.length)
      : 0;

    res.json({
      total_modules: modules.length,
      completed_modules: completedModules.length,
      progress_percent: modules.length
        ? Math.round((completedModules.length / modules.length) * 100)
        : 0,
      average_score: avgScore,
      recent_activity: conversations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getModules, getModuleById, getVocabulary, getPhrasebook,
  startConversation, sendMessage, finalizeConversation,
  getFeedback, getMessages, getTests, submitTest,
  grammarCheck, getDashboard, getModuleProgress
};
