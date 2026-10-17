const { Module, Grammar, Vocabulary, Phrasebook, Conversation, Message, Test, TestResult, User, ModuleResult, ExamResult, Specialty } = require('../models');
const { UNLOCK_ALL_MODULES, PASS_THRESHOLD } = require('../config/features');
const { getPatientReply, getPatientReplyStream, generateFeedback, checkGrammar, generatePatientScenario, tryParseScenario } = require('../services/gemini.service');
const { normalizeSpecialtyCode, getCurriculumMilestones, getExamScenario } = require('../services/curriculum.service');

// Bemor haqida talabaga ko'rsatsa bo'ladigan qism (tashxis va kutilgan javoblar YASHIRIN qoladi)
const buildCaseBrief = (patientContext) => {
  const sc = tryParseScenario(patientContext);
  if (!sc) return null;
  const mc = sc.medical_condition || {};
  return {
    role_play: sc.role_play || null,
    setting: sc.setting || null,
    counterpart_label: sc.counterpart_label || 'Patient',
    patient: sc.patient_profile ? {
      name: sc.patient_profile.name, age: sc.patient_profile.age, gender: sc.patient_profile.gender,
      personality_trait: sc.patient_profile.personality_trait,
    } : null,
    chief_complaint: mc.chief_complaint || null,
    duration: mc.duration || null,
    symptoms: Array.isArray(mc.symptoms) ? mc.symptoms.slice(0, 6) : [],
  };
};

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

    const isCompleted = combinedScore >= PASS_THRESHOLD || bestChatScore >= PASS_THRESHOLD;

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
    const specialty = await Specialty.findByPk(req.user.specialty_id);
    const specialtyCode = normalizeSpecialtyCode(specialty ? (specialty.code || specialty.name_uz || specialty.name) : 'GEN_MED');

    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'description', 'description_uz', 'description_ru', 'description_en', 'order_index'],
    });

    const milestones = getCurriculumMilestones(specialtyCode, modules.length);
    const examResults = await ExamResult.findAll({
      where: { student_id: req.user.id, specialty_id: req.user.specialty_id }
    });
    const examResMap = {};
    examResults.forEach(r => { examResMap[r.exam_type] = r; });

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

      const is_completed = bestScore >= PASS_THRESHOLD || (modRes && modRes.is_completed);

      // Ushbu moduldan avvalgi oraliq imtihon topshirilganmi?
      let examBlocked = false;
      for (const ms of milestones) {
        if (ms.after_module < m.order_index) {
          const er = examResMap[ms.id];
          if (!er || !er.is_passed) {
            examBlocked = true;
            break;
          }
        }
      }

      const is_unlocked = UNLOCK_ALL_MODULES || (prevPassed && !examBlocked);
      
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

// Modul talaba uchun ochiq ekanligini tekshirish (1-modul har doim ochiq, keyingilar avvalgilar 60%+ o'tilgan bo'lsa va oraliq imtihon topshirilgan bo'lsa)
const checkModuleUnlocked = async (studentId, specialtyId, targetModule) => {
  if (!targetModule) return { unlocked: false };
  if (targetModule.order_index <= 1) return { unlocked: true };

  if (UNLOCK_ALL_MODULES) return { unlocked: true }; // test rejimi: ketma-ketlik sharti o'chirilgan

  const specialty = await Specialty.findByPk(specialtyId);
  const specialtyCode = normalizeSpecialtyCode(specialty ? (specialty.code || specialty.name_uz || specialty.name) : 'GEN_MED');

  const prevModules = await Module.findAll({
    where: {
      specialty_id: specialtyId,
      order_index: { [Op.lt]: targetModule.order_index }
    },
    order: [['order_index', 'ASC']]
  });

  for (let pm of prevModules) {
    const mr = await ModuleResult.findOne({
      where: { student_id: studentId, module_id: pm.id }
    });
    const conv = await Conversation.findOne({
      where: { student_id: studentId, module_id: pm.id, status: 'completed' },
      order: [['overall_score', 'DESC']]
    });
    const bestScore = Math.max(
      conv ? (conv.overall_score || 0) : 0,
      mr ? (mr.combined_score || mr.best_chat_score || 0) : 0
    );
    const passed = (mr && mr.is_completed) || bestScore >= PASS_THRESHOLD;
    if (!passed) {
      return { unlocked: false };
    }
  }

  // Moduldan oldin oraliq imtihon bormi? Agar bo'lsa, u ham topshirilgan bo'lishi kerak!
  const milestones = getCurriculumMilestones(specialtyCode, 18);
  for (const ms of milestones) {
    if (ms.after_module < targetModule.order_index) {
      const er = await ExamResult.findOne({
        where: {
          student_id: studentId,
          specialty_id: specialtyId,
          exam_type: ms.id
        }
      });
      if (!er || !er.is_passed) {
        return { unlocked: false, blockedByExam: ms.title };
      }
    }
  }

  return { unlocked: true };
};

// ── GET /api/student/modules/:id ────────────────────────────
const getModuleById = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en', 'code', 'icon', 'student_role'] }],
    });
    if (!module) return res.status(404).json({ error: 'Modul topilmadi' });

    const { unlocked } = await checkModuleUnlocked(req.user.id, req.user.specialty_id, module);
    if (!unlocked) return res.status(403).json({ error: 'Modul qulflangan. Avvalgi modullarni kamida 60% ga yakunlang.' });

    const next = await Module.findOne({
      where: {
        specialty_id: module.specialty_id,
        order_index: { [Op.gt]: module.order_index }
      },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index']
    });

    const prev = await Module.findOne({
      where: {
        specialty_id: module.specialty_id,
        order_index: { [Op.lt]: module.order_index }
      },
      order: [['order_index', 'DESC']],
      attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index']
    });

    const data = module.toJSON ? module.toJSON() : { ...module };
    data.case_brief = buildCaseBrief(data.patient_context);          // xavfsiz qisqacha ma'lumot
    delete data.patient_context;                                       // to'liq ssenariy (tashxis) talabaga yuborilmaydi
    delete data.final_challenge_context;
    if (typeof data.reference_dialogue === 'string') { try { data.reference_dialogue = JSON.parse(data.reference_dialogue); } catch (_) { data.reference_dialogue = []; } }
    data.next_module = next ? (next.toJSON ? next.toJSON() : next) : null;
    data.prev_module = prev ? (prev.toJSON ? prev.toJSON() : prev) : null;

    res.json(data);
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
      attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index']
    });
    if (next) nextModule = next.toJSON ? next.toJSON() : { ...next };

    const evaluationObj = lastConversation ? {
      score: lastConversation.overall_score || 0,
      passed: (lastConversation.overall_score || 0) >= PASS_THRESHOLD,
      feedback: parsedFeedback.general_feedback || 'Klinik muloqot muvaffaqiyatli yakunlandi.',
      details: {
        grammar: lastConversation.grammar_score || 8,
        vocabulary: lastConversation.vocabulary_score || 8,
        fluency: lastConversation.fluency_score || 8,
        pronunciation: lastConversation.pronunciation_score || 8,
        clinical: lastConversation.clinical_score || 8,
        target_vocab_used: parsedFeedback.target_vocab_used || [],
        target_phrases_used: parsedFeedback.target_phrases_used || [],
        errors: (parsedFeedback.errors || []).map(err => ({
          original: err.original || err.incorrect || '',
          correction: err.corrected || err.correction || '',
          explanation: err.explanation || ''
        }))
      }
    } : null;

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
      evaluation: evaluationObj,
      test_result: testResult ? {
        score: testResult.score,
        correct: testResult.correct,
        total: testResult.total,
        passed: (testResult.score || 0) >= PASS_THRESHOLD
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
    const parsed = items.map(item => {
      const g = item.toJSON ? item.toJSON() : { ...item };
      if (typeof g.examples === 'string') {
        try { g.examples = JSON.parse(g.examples); } catch (_) { g.examples = []; }
      }
      if (typeof g.common_mistakes === 'string') {
        try { g.common_mistakes = JSON.parse(g.common_mistakes); } catch (_) { g.common_mistakes = []; }
      }
      return g;
    });
    res.json(parsed);
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

    // Chala qolgan (baholanmagan) active sessiyalarni o'chirish — ular "completed" 0 ball
    // sifatida saqlansa, talaba/guruh/admin statistikasini buzadi
    const stale = await Conversation.findAll({
      where: { student_id: req.user.id, module_id: req.params.id, status: 'active' },
      attributes: ['id'],
    });
    if (stale.length) {
      const staleIds = stale.map((c) => c.id);
      await Message.destroy({ where: { conversation_id: staleIds } });
      await Conversation.destroy({ where: { id: staleIds } });
    }

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
    const text = req.body.text || req.body.message || req.body.content || '';
    if (!text.trim()) return res.status(400).json({ error: 'Xabar matni bo\'sh bo\'lishi mumkin emas' });

    let conversation = null;
    const reqId = req.params.id;
    if (reqId && reqId !== 'undefined' && reqId !== 'null') {
      conversation = await Conversation.findByPk(reqId, {
        include: [{ model: Module, as: 'module' }],
      });
    }

    // Agar sessiya topilmasa, boshqa talabaga tegishli bo'lsa yoki completed bo'lsa, yangi aktiv sessiya yaratamiz
    if (!conversation || conversation.student_id !== req.user.id || conversation.status === 'completed') {
      const targetModuleId = Number(req.body.module_id || req.query.module_id || (conversation?.module_id) || 1);
      const targetMod = await Module.findByPk(targetModuleId);
      const patientContext = targetMod?.patient_context || "Patient presents with a general medical complaint.";
      const { generatePatientScenario } = require('../services/gemini.service');
      const dynamicScenario = await generatePatientScenario(patientContext);

      conversation = await Conversation.create({
        student_id: req.user.id,
        module_id: targetModuleId,
        attempt_type: 'practice',
        status: 'active',
        dynamic_scenario: dynamicScenario,
      });
    }

    // Talaba xabarini saqlash
    await Message.create({
      conversation_id: conversation.id,
      sender: 'student',
      text_content: text.trim(),
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
    const { getPatientReply } = require('../services/gemini.service');
    const patientReply = await getPatientReply(conversation.dynamic_scenario, history, text.trim());

    // AI bemor javobini saqlash
    await Message.create({
      conversation_id: conversation.id,
      sender: 'patient',
      text_content: patientReply,
    });

    res.json({
      reply: patientReply,
      message: patientReply,
      conversation_id: conversation.id,
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('sendMessage xato:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/conversation/:id/message/stream ────────
// Server-Sent Events orqali real-time javob qaytarish
const sendMessageStream = async (req, res) => {
  try {
    const text = req.query.text || '';
    if (!text.trim()) {
      res.status(400).json({ error: 'Xabar matni bo\'sh bo\'lishi mumkin emas' });
      return;
    }

    let conversation = await Conversation.findByPk(req.params.id, {
      include: [{ model: Module, as: 'module' }],
    });

    if (!conversation || conversation.student_id !== req.user.id || conversation.status === 'completed') {
      const targetModuleId = conversation?.module_id || req.query.module_id || 4;
      const targetMod = await Module.findByPk(targetModuleId);
      const patientContext = targetMod?.patient_context || "Patient presents with a general medical complaint.";
      const dynamicScenario = await generatePatientScenario(patientContext);

      conversation = await Conversation.create({
        student_id: req.user.id,
        module_id: targetModuleId,
        attempt_type: 'practice',
        status: 'active',
        dynamic_scenario: dynamicScenario,
      });
    }

    await Message.create({
      conversation_id: conversation.id,
      sender: 'student',
      text_content: text.trim(),
    });

    const prevMessages = await Message.findAll({
      where: { conversation_id: conversation.id },
      order: [['created_at', 'ASC']],
    });

    const history = prevMessages.slice(0, -1).map((m) => ({
      role: m.sender === 'student' ? 'user' : 'model',
      parts: [{ text: m.text_content }],
    }));

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await getPatientReplyStream(
      conversation.dynamic_scenario,
      history,
      text.trim(),
      (chunk) => {
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ chunk, conversation_id: conversation.id })}\n\n`);
      },
      async (fullText) => {
        // Save final message to DB
        await Message.create({
          conversation_id: conversation.id,
          sender: 'patient',
          text_content: fullText,
        });

        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    );
  } catch (err) {
    console.error('sendMessageStream xato:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// ── POST /api/student/conversation/:id/audio ────────
// Audio recording ni qabul qilib Gemini'ga uzatish (streaming-siz)
const sendAudioMessage = async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'Audio base64 data is required' });
      return;
    }

    let conversation = null;
    const reqId = req.params.id;
    if (reqId && reqId !== 'undefined' && reqId !== 'null') {
      conversation = await Conversation.findByPk(reqId, {
        include: [{ model: Module, as: 'module' }],
      });
    }

    if (!conversation || conversation.student_id !== req.user.id || conversation.status === 'completed') {
      const targetModuleId = Number(req.body.module_id || req.query.module_id || (conversation?.module_id) || 1);
      const targetMod = await Module.findByPk(targetModuleId);
      const patientContext = targetMod?.patient_context || "Patient presents with a general medical complaint.";
      const { generatePatientScenario } = require('../services/gemini.service');
      const dynamicScenario = await generatePatientScenario(patientContext);

      conversation = await Conversation.create({
        student_id: req.user.id,
        module_id: targetModuleId,
        attempt_type: 'practice',
        status: 'active',
        dynamic_scenario: dynamicScenario,
      });
    }

    const prevMessages = await Message.findAll({
      where: { conversation_id: conversation.id },
      order: [['created_at', 'ASC']],
    });

    const history = prevMessages.map((m) => ({
      role: m.sender === 'student' ? 'user' : 'model',
      parts: [{ text: m.text_content }],
    }));

    const { getPatientAudioReplyStream } = require('../services/gemini.service');
    
    // We will just wrap the stream in a promise to get the final results
    const { finalTranscript, finalReply } = await new Promise((resolve, reject) => {
      getPatientAudioReplyStream(
        conversation.dynamic_scenario,
        history,
        audioBase64,
        (chunk) => {}, // Ignore chunks
        (transcript, reply) => resolve({ finalTranscript: transcript, finalReply: reply })
      ).catch(reject);
    });

    // Save doctor's transcribed speech
    await Message.create({
      conversation_id: conversation.id,
      sender: 'student',
      text_content: finalTranscript,
    });

    // Save AI patient's reply
    await Message.create({
      conversation_id: conversation.id,
      sender: 'patient',
      text_content: finalReply,
    });

    res.json({
      transcript: finalTranscript,
      reply: finalReply,
      message: finalReply,
      conversation_id: conversation.id,
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('sendAudioMessage xato:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/conversation/:id/finalize ─────────────
// Suhbatni yakunlash va AI Feedback olish
const finalizeConversation = async (req, res) => {
  try {
    let conversation = await Conversation.findByPk(req.params.id);
    if (!conversation || conversation.student_id !== req.user.id) {
      conversation = await Conversation.findOne({
        where: { student_id: req.user.id },
        order: [['created_at', 'DESC']]
      });
    }
    if (!conversation) return res.status(404).json({ error: 'Sessiya topilmadi' });

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

    const evaluationUnified = {
      score: feedback.overall_score || 0,
      passed: (feedback.overall_score || 0) >= PASS_THRESHOLD,
      feedback: feedback.general_feedback || 'Klinik muloqot muvaffaqiyatli yakunlandi.',
      details: {
        grammar: feedback.grammar_score || 8,
        vocabulary: feedback.vocabulary_score || 8,
        fluency: feedback.fluency_score || 8,
        pronunciation: feedback.pronunciation_score || 8,
        clinical: feedback.clinical_score || 8,
        target_vocab_used: feedback.target_vocab_used || [],
        target_phrases_used: feedback.target_phrases_used || [],
        errors: (feedback.errors || []).map(err => ({
          original: err.original || err.incorrect || '',
          correction: err.corrected || err.correction || '',
          explanation: err.explanation || ''
        }))
      }
    };

    res.json({
      ...feedback,
      evaluation: evaluationUnified,
      details: evaluationUnified.details,
      score: evaluationUnified.score,
      passed: evaluationUnified.passed
    });
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
    const passed = score >= PASS_THRESHOLD;

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

    // Get all completed conversations within student specialty
    const allConvs = await Conversation.findAll({
      where: {
        student_id: req.user.id,
        module_id: { [Op.in]: moduleIds },
        status: 'completed',
        overall_score: { [Op.gt]: 0 }
      },
      order: [['created_at', 'DESC']],
      include: [{ model: Module, as: 'module', attributes: ['title', 'title_uz', 'title_ru', 'title_en', 'order_index'] }],
    });

    // Count unique completed modules (where score >= PASS_THRESHOLD)
    const passedModuleIds = new Set();
    moduleResults.forEach(mr => {
      if ((mr.is_completed || mr.combined_score >= PASS_THRESHOLD || mr.best_chat_score >= PASS_THRESHOLD) && moduleIds.includes(mr.module_id)) {
        passedModuleIds.add(mr.module_id);
      }
    });
    allConvs.forEach(c => {
      if (c.overall_score >= PASS_THRESHOLD && moduleIds.includes(c.module_id)) {
        passedModuleIds.add(c.module_id);
      }
    });

    const totalCount = modules.length || 10;
    const completedCount = Math.min(totalCount, passedModuleIds.size);
    const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

    // Calculate true average of best scores per attempted module
    const moduleBestScores = new Map();
    let bestGrammarSum = 0, bestVocabSum = 0, bestFluencySum = 0, bestPronSum = 0, bestClinicalSum = 0;
    let countedCompetencies = 0;

    allConvs.forEach(c => {
      const current = moduleBestScores.get(c.module_id) || 0;
      if (c.overall_score > current) moduleBestScores.set(c.module_id, c.overall_score);
    });
    moduleResults.forEach(mr => {
      const current = moduleBestScores.get(mr.module_id) || 0;
      const best = Math.max(mr.combined_score || 0, mr.best_chat_score || 0, mr.best_quiz_score || 0);
      if (best > current) moduleBestScores.set(mr.module_id, best);

      if (mr.best_grammar || mr.best_vocab || mr.best_fluency || mr.best_pronunciation || mr.best_clinical) {
        bestGrammarSum += mr.best_grammar || 0;
        bestVocabSum += mr.best_vocab || 0;
        bestFluencySum += mr.best_fluency || 0;
        bestPronSum += mr.best_pronunciation || 0;
        bestClinicalSum += mr.best_clinical || 0;
        countedCompetencies++;
      }
    });

    let avgScore = 0;
    if (moduleBestScores.size > 0) {
      let sum = 0;
      for (const val of moduleBestScores.values()) {
        sum += val;
      }
      avgScore = Math.round(sum / moduleBestScores.size);
    }

    // Build structured module scores table
    const moduleScoresList = modules.map(m => {
      const mr = moduleResults.find(r => r.module_id === m.id);
      const conv = allConvs.find(c => c.module_id === m.id);
      const quizScore = mr ? mr.best_quiz_score : null;
      const chatScore = mr ? mr.best_chat_score : (conv ? conv.overall_score : null);
      const combined = mr ? (mr.combined_score || chatScore || quizScore) : (conv ? conv.overall_score : null);
      const isPassed = (combined && combined >= PASS_THRESHOLD) || (mr && mr.is_completed) || passedModuleIds.has(m.id);

      return {
        id: m.id,
        order_index: m.order_index,
        title: m.title,
        title_uz: m.title_uz,
        title_ru: m.title_ru,
        title_en: m.title_en,
        quiz_score: quizScore,
        chat_score: chatScore,
        score: combined,
        is_completed: isPassed,
        attempts: mr ? mr.attempts_count : (conv ? 1 : 0),
        last_attempt_at: mr ? mr.last_attempt_at : (conv ? conv.created_at : null)
      };
    });

    // Compute CEFR level
    let cefrLevel = 'A2 Foundation';
    if (avgScore >= 85) cefrLevel = 'B2 Clinical Pro';
    else if (avgScore >= PASS_THRESHOLD) cefrLevel = 'B1 Medical';

    const competencies = {
      grammar: countedCompetencies > 0 ? Math.round(bestGrammarSum / countedCompetencies) : Math.min(100, Math.round(avgScore * 0.95)),
      vocabulary: countedCompetencies > 0 ? Math.round(bestVocabSum / countedCompetencies) : Math.min(100, Math.round(avgScore * 1.02)),
      fluency: countedCompetencies > 0 ? Math.round(bestFluencySum / countedCompetencies) : Math.min(100, Math.round(avgScore * 0.98)),
      pronunciation: countedCompetencies > 0 ? Math.round(bestPronSum / countedCompetencies) : Math.min(100, Math.round(avgScore * 0.94)),
      clinical: countedCompetencies > 0 ? Math.round(bestClinicalSum / countedCompetencies) : Math.min(100, Math.round(avgScore * 1.01)),
    };

    res.json({
      stats: {
        total_modules: totalCount,
        completed_modules: completedCount,
        progress_pct: progressPercent,
        avg_score: avgScore,
        cefr_level: cefrLevel
      },
      total_modules: totalCount,
      completed_modules: completedCount,
      progress_percent: progressPercent,
      average_score: avgScore,
      cefr_level: cefrLevel,
      competencies,
      module_results: moduleScoresList,
      recent_activity: allConvs.slice(0, 6),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/curriculum ─────────────────────────────
// Modullar va ular orasidagi Oraliq / Yakuniy imtihonlarni (Milestones) dinamik integratsiya qilib qaytaradi
const getCurriculum = async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.user.specialty_id);
    const specialtyCode = normalizeSpecialtyCode(specialty ? (specialty.code || specialty.name_uz || specialty.name) : 'GEN_MED');

    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'description', 'description_uz', 'description_ru', 'description_en', 'order_index'],
    });

    const totalModules = modules.length;
    const milestones = getCurriculumMilestones(specialtyCode, totalModules);

    // Barcha modul natijalarini olish
    const moduleResults = await ModuleResult.findAll({
      where: { student_id: req.user.id }
    });
    const modResMap = {};
    moduleResults.forEach(r => { modResMap[r.module_id] = r; });

    // Barcha imtihon natijalarini olish
    const examResults = await ExamResult.findAll({
      where: { student_id: req.user.id, specialty_id: req.user.specialty_id }
    });
    const examResMap = {};
    examResults.forEach(r => { examResMap[r.exam_type] = r; });

    let prevCompleted = true; // 1-modul har doim ochiq
    const curriculumItems = [];

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      const mr = modResMap[m.id];
      const isCompleted = mr ? (mr.is_completed || mr.combined_score >= PASS_THRESHOLD || mr.best_chat_score >= PASS_THRESHOLD) : false;
      const isUnlocked = UNLOCK_ALL_MODULES || prevCompleted;

      curriculumItems.push({
        kind: 'module',
        id: m.id,
        order_index: m.order_index,
        title: m.title,
        title_uz: m.title_uz,
        title_ru: m.title_ru,
        title_en: m.title_en,
        description: m.description,
        description_uz: m.description_uz,
        description_ru: m.description_ru,
        description_en: m.description_en,
        is_completed: isCompleted,
        best_score: mr ? (mr.combined_score || mr.best_chat_score || null) : null,
        is_unlocked: isUnlocked,
      });

      // Ushbu moduldan keyin oraliq yoki yakuniy imtihon bormi?
      const ms = milestones.find(mil => mil.after_module === m.order_index);
      if (ms) {
        // Ushbu imtihon qamrab olgan modullarning holati
        const coveredDone = ms.covered_modules.every(idx => {
          const modAtIdx = modules.find(mod => mod.order_index === idx);
          if (!modAtIdx) return true;
          const r = modResMap[modAtIdx.id];
          return r ? (r.is_completed || r.combined_score >= PASS_THRESHOLD || r.best_chat_score >= PASS_THRESHOLD) : false;
        });

        const er = examResMap[ms.id];
        const isExamPassed = er ? er.is_passed : false;
        const isExamUnlocked = UNLOCK_ALL_MODULES || coveredDone;

        curriculumItems.push({
          kind: 'exam',
          id: ms.id,
          exam_type: ms.id,
          type: ms.type, // 'midterm' | 'final'
          after_module: ms.after_module,
          covered_modules: ms.covered_modules,
          title: ms.title,
          title_uz: ms.title_uz,
          title_ru: ms.title_ru,
          title_en: ms.title_en,
          badge: ms.badge,
          badge_en: ms.badge_en,
          badge_ru: ms.badge_ru,
          description_uz: ms.description_uz,
          description_ru: ms.description_ru,
          description_en: ms.description_en,
          is_unlocked: isExamUnlocked,
          is_completed: isExamPassed,
          is_passed: isExamPassed,
          score: er ? er.overall_score : null,
          quiz_score: er ? er.quiz_score : null,
          chat_score: er ? er.chat_score : null,
          attempts_count: er ? er.attempts_count : 0,
        });

        if (!UNLOCK_ALL_MODULES) {
          prevCompleted = isExamPassed;
        }
      } else {
        if (!UNLOCK_ALL_MODULES) {
          prevCompleted = isCompleted;
        }
      }
    }

    res.json({
      specialty: {
        id: specialty?.id,
        code: specialtyCode,
        name: specialty?.name,
        name_uz: specialty?.name_uz,
        name_ru: specialty?.name_ru,
        name_en: specialty?.name_en,
      },
      total_modules: totalModules,
      milestones: milestones,
      items: curriculumItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/exams/:examType ────────────────────────
// Muayyan imtihon tafsilotlari (qoidalar, qamrov, ssenariy xulosasi)
const getExamDetails = async (req, res) => {
  try {
    const { examType } = req.params;
    const specialty = await Specialty.findByPk(req.user.specialty_id);
    const specialtyCode = normalizeSpecialtyCode(specialty ? (specialty.code || specialty.name_uz || specialty.name) : 'GEN_MED');

    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index'],
    });

    const milestones = getCurriculumMilestones(specialtyCode, modules.length);
    const ms = milestones.find(m => m.id === examType);
    if (!ms) return res.status(404).json({ error: 'Imtihon turi topilmadi' });

    // Qamrab olingan modullar
    const coveredModulesList = modules.filter(m => ms.covered_modules.includes(m.order_index));

    // Bemor ssenariysi (brief)
    const rawScenario = getExamScenario(specialtyCode, examType);
    const caseBrief = {
      role_play: rawScenario.role_play,
      setting: rawScenario.setting,
      counterpart_label: rawScenario.counterpart_label,
      patient: rawScenario.patient_profile ? {
        name: rawScenario.patient_profile.name,
        age: rawScenario.patient_profile.age,
        gender: rawScenario.patient_profile.gender,
        personality_trait: rawScenario.patient_profile.personality_trait,
      } : null,
      chief_complaint: rawScenario.medical_condition?.chief_complaint,
      duration: rawScenario.medical_condition?.duration,
      symptoms: rawScenario.medical_condition?.symptoms || [],
    };

    // Oldingi imtihon natijasi
    const examResult = await ExamResult.findOne({
      where: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType
      }
    });

    res.json({
      exam: ms,
      specialty: {
        code: specialtyCode,
        name: specialty?.name_uz || specialty?.name
      },
      covered_modules: coveredModulesList,
      case_brief: caseBrief,
      previous_result: examResult || null,
      pass_threshold: 70
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/exams/:examType/quiz ───────────────────
// Imtihonga tegishli test savollarini olish
const getExamQuiz = async (req, res) => {
  try {
    const { examType } = req.params;
    const specialty = await Specialty.findByPk(req.user.specialty_id);
    const specialtyCode = normalizeSpecialtyCode(specialty ? (specialty.code || specialty.name_uz || specialty.name) : 'GEN_MED');

    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'order_index'],
    });

    const milestones = getCurriculumMilestones(specialtyCode, modules.length);
    const ms = milestones.find(m => m.id === examType);
    if (!ms) return res.status(404).json({ error: 'Imtihon turi topilmadi' });

    const coveredModuleIds = modules
      .filter(m => ms.covered_modules.includes(m.order_index))
      .map(m => m.id);

    // Tegishli modullarning test savollari
    const allTests = await Test.findAll({
      where: { module_id: { [Op.in]: coveredModuleIds } },
      attributes: [
        'id', 'module_id',
        'question', 'question_uz', 'question_ru', 'question_en',
        'option_a', 'option_a_uz', 'option_a_ru', 'option_a_en',
        'option_b', 'option_b_uz', 'option_b_ru', 'option_b_en',
        'option_c', 'option_c_uz', 'option_c_ru', 'option_c_en',
        'option_d', 'option_d_uz', 'option_d_ru', 'option_d_en',
      ]
    });

    // Random shuffle va 10 ta savol tanlash
    const shuffled = allTests.sort(() => 0.5 - Math.random()).slice(0, 10);

    res.json({
      exam_type: examType,
      total_questions: shuffled.length,
      questions: shuffled
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/exams/:examType/quiz/submit ───────────
// Imtihon testini topshirish va baholash
const submitExamQuiz = async (req, res) => {
  try {
    const { examType } = req.params;
    const { answers } = req.body; // { testId: 'A', ... }
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Javoblar yuborilmadi' });
    }

    const testIds = Object.keys(answers).map(Number);
    const tests = await Test.findAll({ where: { id: { [Op.in]: testIds } } });

    let correctCount = 0;
    const details = [];

    tests.forEach(t => {
      const selected = (answers[t.id] || '').toUpperCase();
      const isCorrect = selected === t.correct_option?.toUpperCase();
      if (isCorrect) correctCount++;
      details.push({
        test_id: t.id,
        selected_option: selected,
        correct_option: t.correct_option,
        is_correct: isCorrect,
        explanation: t.explanation_uz || t.explanation || ''
      });
    });

    const totalQuestions = tests.length || 1;
    const quizScore = Math.round((correctCount / totalQuestions) * 100);

    let [examRes] = await ExamResult.findOrCreate({
      where: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType
      },
      defaults: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType,
        quiz_score: quizScore,
        quiz_details: details,
        attempts_count: 1,
        last_attempt_at: new Date()
      }
    });

    await examRes.update({
      quiz_score: quizScore,
      quiz_details: details,
      attempts_count: (examRes.attempts_count || 0) + 1,
      last_attempt_at: new Date()
    });

    res.json({
      quiz_score: quizScore,
      correct_count: correctCount,
      total_questions: totalQuestions,
      details: details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/exams/:examType/conversation ──────────
// Imtihon AI Virtual bemori bilan suhbat boshlash
const startExamConversation = async (req, res) => {
  try {
    const { examType } = req.params;
    const specialty = await Specialty.findByPk(req.user.specialty_id);
    const specialtyCode = normalizeSpecialtyCode(specialty ? (specialty.code || specialty.name_uz || specialty.name) : 'GEN_MED');

    const modules = await Module.findAll({
      where: { specialty_id: req.user.specialty_id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'order_index'],
    });

    const milestones = getCurriculumMilestones(specialtyCode, modules.length);
    const ms = milestones.find(m => m.id === examType);
    if (!ms) return res.status(404).json({ error: 'Imtihon turi topilmadi' });

    // Ushbu imtihonga mos modul (after_module ga mos modul)
    const targetModule = modules.find(m => m.order_index === ms.after_module) || modules[modules.length - 1];

    const examScenario = getExamScenario(specialtyCode, examType);

    // Yangi Conversation yaratish
    const conversation = await Conversation.create({
      student_id: req.user.id,
      module_id: targetModule.id,
      attempt_type: 'final_challenge',
      status: 'active',
      dynamic_scenario: JSON.stringify(examScenario)
    });

    // Bemorning birinchi kirish xabari
    const patientName = examScenario.patient_profile?.name || 'Patient';
    const chief = examScenario.medical_condition?.chief_complaint || "I need medical help.";
    const firstText = `Hello doctor, I'm ${patientName}. ${chief}. Please help me.`;

    const firstMsg = await Message.create({
      conversation_id: conversation.id,
      sender_role: 'patient',
      content: firstText
    });

    // ExamResult bilan bog'lash
    let [examRes] = await ExamResult.findOrCreate({
      where: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType
      },
      defaults: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType,
        conversation_id: conversation.id
      }
    });
    await examRes.update({ conversation_id: conversation.id });

    res.json({
      conversation_id: conversation.id,
      exam_type: examType,
      patient_scenario: {
        role_play: examScenario.role_play,
        setting: examScenario.setting,
        counterpart_label: examScenario.counterpart_label,
        patient: examScenario.patient_profile,
        chief_complaint: chief
      },
      first_message: firstMsg
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/student/exams/:examType/finalize ──────────────
// Imtihon suhbatini yakunlash va to'liq yakuniy bahoni hisoblash
const finalizeExamConversation = async (req, res) => {
  try {
    const { examType } = req.params;
    const { conversation_id } = req.body;

    const conv = await Conversation.findByPk(conversation_id, {
      include: [{ model: Message, as: 'messages', order: [['id', 'ASC']] }]
    });
    if (!conv) return res.status(404).json({ error: 'Suhbat topilmadi' });

    const specialty = await Specialty.findByPk(req.user.specialty_id);
    const specialtyCode = specialty ? specialty.code : 'GEN_MED';
    const examScenario = getExamScenario(specialtyCode, examType);

    // AI Baholash (generateFeedback)
    const messages = conv.messages || [];
    const evaluation = await generateFeedback(messages, JSON.stringify(examScenario), req.user.role || 'student');

    const chatScore = evaluation.overall_score || 0;

    await conv.update({
      status: 'completed',
      grammar_score: evaluation.grammar_score || 0,
      vocabulary_score: evaluation.vocabulary_score || 0,
      fluency_score: evaluation.fluency_score || 0,
      pronunciation_score: evaluation.pronunciation_score || 0,
      clinical_score: evaluation.clinical_score || 0,
      overall_score: chatScore,
      general_feedback: evaluation.general_feedback || ''
    });

    // ExamResult ni yangilash
    let examRes = await ExamResult.findOne({
      where: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType
      }
    });

    const quizScore = examRes ? (examRes.quiz_score || 0) : 0;
    // Composite: 30% quiz + 70% OSCE clinical communication
    const finalScore = Math.round(quizScore * 0.3 + chatScore * 0.7);
    const isPassed = finalScore >= 70 || chatScore >= 70;

    if (!examRes) {
      examRes = await ExamResult.create({
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType,
        quiz_score: quizScore,
        chat_score: chatScore,
        overall_score: finalScore,
        grammar_score: evaluation.grammar_score || 0,
        vocab_score: evaluation.vocabulary_score || 0,
        fluency_score: evaluation.fluency_score || 0,
        pronunciation_score: evaluation.pronunciation_score || 0,
        clinical_score: evaluation.clinical_score || 0,
        is_passed: isPassed,
        evaluation: evaluation,
        conversation_id: conv.id,
        last_attempt_at: new Date()
      });
    } else {
      await examRes.update({
        chat_score: chatScore,
        overall_score: finalScore,
        grammar_score: evaluation.grammar_score || 0,
        vocab_score: evaluation.vocabulary_score || 0,
        fluency_score: evaluation.fluency_score || 0,
        pronunciation_score: evaluation.pronunciation_score || 0,
        clinical_score: evaluation.clinical_score || 0,
        is_passed: isPassed,
        evaluation: evaluation,
        conversation_id: conv.id,
        last_attempt_at: new Date()
      });
    }

    res.json({
      exam_type: examType,
      quiz_score: quizScore,
      chat_score: chatScore,
      final_score: finalScore,
      is_passed: isPassed,
      evaluation: evaluation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/student/exams/:examType/results ────────────────
const getExamResults = async (req, res) => {
  try {
    const { examType } = req.params;
    const examRes = await ExamResult.findOne({
      where: {
        student_id: req.user.id,
        specialty_id: req.user.specialty_id,
        exam_type: examType
      }
    });

    if (!examRes) {
      return res.json({ completed: false });
    }

    res.json({
      completed: true,
      result: examRes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getModules, getModuleById, getGrammar, getVocabulary, getPhrasebook,
  startConversation,
  sendMessage,
  sendMessageStream,
  sendAudioMessage,
  finalizeConversation,
  getFeedback, getMessages, getTests, submitTest,
  grammarCheck, getDashboard, getModuleProgress,
  getCurriculum, getExamDetails, getExamQuiz, submitExamQuiz,
  startExamConversation, finalizeExamConversation, getExamResults
};

