const {
  User, StudentGroup, TeacherGroup, Module,
  Conversation, Message, TestResult, ForumMessage, ModuleResult
} = require('../models');
const { Op } = require('sequelize');

// ── GET /api/teacher/dashboard ──────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const teacherGroupLinks = await TeacherGroup.findAll({ where: { teacher_id: req.user.id } });
    const groupIds = teacherGroupLinks.map((tg) => tg.group_id);

    const students = await User.findAll({
      where: { role: 'student', group_id: { [Op.in]: groupIds } },
    });

    const conversations = await Conversation.findAll({
      where: {
        student_id: { [Op.in]: students.map((s) => s.id) },
        status: 'completed',
      },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    const avgScore = conversations.length
      ? Math.round(conversations.reduce((s, c) => s + c.overall_score, 0) / conversations.length)
      : 0;

    res.json({
      total_groups: groupIds.length,
      total_students: students.length,
      average_score: avgScore,
      recent_conversations: conversations.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/teacher/groups ──────────────────────────────────
const getGroups = async (req, res) => {
  try {
    const links = await TeacherGroup.findAll({ where: { teacher_id: req.user.id } });
    const groupIds = links.map((l) => l.group_id);

    const groups = await StudentGroup.findAll({ where: { id: { [Op.in]: groupIds } } });

    const result = await Promise.all(
      groups.map(async (g) => {
        const studentCount = await User.count({ where: { group_id: g.id, role: 'student' } });
        return { ...g.toJSON(), student_count: studentCount };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/teacher/groups/:groupId/students ────────────────
const getGroupStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student', group_id: req.params.groupId },
      attributes: ['id', 'full_name', 'email', 'current_level', 'created_at'],
    });

    const result = await Promise.all(
      students.map(async (s) => {
        const lastConv = await Conversation.findOne({
          where: { student_id: s.id, status: 'completed' },
          order: [['created_at', 'DESC']],
          include: [{ model: Module, as: 'module', attributes: ['title'] }],
        });
        const avgScore = await Conversation.findAll({
          where: { student_id: s.id, status: 'completed' },
        }).then((convs) =>
          convs.length
            ? Math.round(convs.reduce((sum, c) => sum + c.overall_score, 0) / convs.length)
            : 0
        );

        return {
          ...s.toJSON(),
          average_score: avgScore,
          last_module: lastConv ? lastConv.module?.title : null,
          last_activity: lastConv ? lastConv.created_at : null,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/teacher/students/:studentId/progress ────────────
const getStudentProgress = async (req, res) => {
  try {
    const student = await User.findByPk(req.params.studentId, {
      attributes: ['id', 'full_name', 'email', 'current_level'],
    });
    if (!student) return res.status(404).json({ error: 'Talaba topilmadi' });

    const conversations = await Conversation.findAll({
      where: { student_id: req.params.studentId },
      include: [{ model: Module, as: 'module', attributes: ['id', 'title', 'order_index'] }],
      order: [['created_at', 'DESC']],
    });

    const testResults = await TestResult.findAll({
      where: { student_id: req.params.studentId },
    });

    const moduleResults = await ModuleResult.findAll({
      where: { student_id: req.params.studentId },
      include: [{ model: Module, as: 'module', attributes: ['id', 'title', 'order_index'] }]
    });

    res.json({ student, conversations, testResults, moduleResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/teacher/conversations/:id/transcript ────────────
const getTranscript = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id, {
      include: [
        { model: Message, as: 'messages', order: [['created_at', 'ASC']] },
        { model: Module,  as: 'module',   attributes: ['title'] },
      ],
    });
    if (!conversation) return res.status(404).json({ error: 'Sessiya topilmadi' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/forum/messages ──────────────────────────────────
const getForumMessages = async (req, res) => {
  try {
    const { channel } = req.query;
    const where = {};
    if (channel && channel !== 'all') {
      where.channel = channel;
    }

    const messages = await ForumMessage.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
        {
          model: ForumMessage,
          as: 'parent',
          include: [{ model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] }],
        },
      ],
      order: [
        ['is_pinned', 'DESC'],
        ['created_at', 'ASC'],
      ],
      limit: 100,
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/forum/messages ─────────────────────────────────
const postForumMessage = async (req, res) => {
  try {
    const { message_text, channel, reply_to_id } = req.body;
    let file_url = req.body.file_url || null;
    let audio_url = req.body.audio_url || null;

    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('audio/')) {
        audio_url = relativePath;
      } else {
        file_url = relativePath;
      }
    }

    if (!message_text && !file_url && !audio_url) {
      return res.status(400).json({ error: 'Xabar matni yoki fayl bo\'lishi kerak' });
    }

    const msg = await ForumMessage.create({
      sender_id: req.user.id,
      message_text: message_text || '',
      channel: channel || 'general',
      reply_to_id: reply_to_id ? parseInt(reply_to_id) : null,
      file_url,
      audio_url,
    });

    const full = await ForumMessage.findByPk(msg.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
        {
          model: ForumMessage,
          as: 'parent',
          include: [{ model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] }],
        },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/forum/messages/:id/pin ─────────────────────────
const togglePinMessage = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Faqat o\'qituvchi va adminlar xabarni pin qila oladi' });
    }
    const msg = await ForumMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Xabar topilmadi' });

    msg.is_pinned = !msg.is_pinned;
    await msg.save();

    const full = await ForumMessage.findByPk(msg.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
        {
          model: ForumMessage,
          as: 'parent',
          include: [{ model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] }],
        },
      ],
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/teacher/reports ─────────────────────────────────
const getReports = async (req, res) => {
  try {
    const { group_id, module_id, search } = req.query;

    let groupIds = [];
    if (req.user.role === 'admin') {
      const allGroups = await StudentGroup.findAll();
      groupIds = allGroups.map(g => g.id);
    } else {
      const links = await TeacherGroup.findAll({ where: { teacher_id: req.user.id } });
      groupIds = links.map(l => l.group_id);
    }

    const availableGroups = await StudentGroup.findAll({
      where: { id: { [Op.in]: groupIds } },
      attributes: ['id', 'name']
    });
    const availableModules = await Module.findAll({
      attributes: ['id', 'title', 'order_index'],
      order: [['order_index', 'ASC']]
    });

    let targetGroupIds = groupIds;
    if (group_id && group_id !== 'all') {
      targetGroupIds = [parseInt(group_id)];
    }

    const userWhere = {
      role: 'student',
      group_id: { [Op.in]: targetGroupIds }
    };

    if (search) {
      userWhere.full_name = { [Op.like]: `%${search}%` };
    }

    const students = await User.findAll({
      where: userWhere,
      include: [{ model: StudentGroup, as: 'group', attributes: ['id', 'name'] }],
      attributes: ['id', 'full_name', 'email', 'current_level', 'created_at']
    });

    const reportRows = await Promise.all(
      students.map(async (s) => {
        const convWhere = { student_id: s.id, status: 'completed' };
        if (module_id && module_id !== 'all') {
          convWhere.module_id = parseInt(module_id);
        }

        const convs = await Conversation.findAll({ where: convWhere });
        const testWhere = { student_id: s.id };
        if (module_id && module_id !== 'all') {
          testWhere.module_id = parseInt(module_id);
        }
        const testResults = await TestResult.findAll({ where: testWhere });

        const modResWhere = { student_id: s.id };
        if (module_id && module_id !== 'all') {
          modResWhere.module_id = parseInt(module_id);
        }
        const moduleResults = await ModuleResult.findAll({ where: modResWhere });

        const count = Math.max(convs.length, moduleResults.length);
        
        let avgGrammar = 0;
        let avgVocab = 0;
        let avgFluency = 0;
        let avgPron = 0;
        let avgClinical = 0;
        let avgOverall = 0;
        let quizAvg = 0;

        if (convs.length > 0) {
          avgGrammar = Math.round(convs.reduce((a, b) => a + (b.grammar_score || 0), 0) / convs.length);
          avgVocab = Math.round(convs.reduce((a, b) => a + (b.vocabulary_score || 0), 0) / convs.length);
          avgFluency = Math.round(convs.reduce((a, b) => a + (b.fluency_score || 0), 0) / convs.length);
          avgPron = Math.round(convs.reduce((a, b) => a + (b.pronunciation_score || 0), 0) / convs.length);
          avgClinical = Math.round(convs.reduce((a, b) => a + (b.clinical_score || 0), 0) / convs.length);
          avgOverall = Math.round(convs.reduce((a, b) => a + (b.overall_score || 0), 0) / convs.length);
        } else if (moduleResults.length > 0) {
          avgGrammar = Math.round(moduleResults.reduce((a, b) => a + (b.best_grammar || 0), 0) / moduleResults.length);
          avgVocab = Math.round(moduleResults.reduce((a, b) => a + (b.best_vocab || 0), 0) / moduleResults.length);
          avgFluency = Math.round(moduleResults.reduce((a, b) => a + (b.best_fluency || 0), 0) / moduleResults.length);
          avgPron = Math.round(moduleResults.reduce((a, b) => a + (b.best_pronunciation || 0), 0) / moduleResults.length);
          avgClinical = Math.round(moduleResults.reduce((a, b) => a + (b.best_clinical || 0), 0) / moduleResults.length);
          avgOverall = Math.round(moduleResults.reduce((a, b) => a + (b.combined_score || b.best_chat_score || 0), 0) / moduleResults.length);
        }

        if (testResults.length > 0) {
          quizAvg = Math.round(testResults.reduce((a, b) => a + (b.score || 0), 0) / testResults.length);
        } else if (moduleResults.length > 0) {
          quizAvg = Math.round(moduleResults.reduce((a, b) => a + (b.best_quiz_score || 0), 0) / moduleResults.length);
        }

        const lastConv = convs.length
          ? convs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          : null;

        return {
          student_id: s.id,
          full_name: s.full_name,
          email: s.email,
          group_name: s.group ? s.group.name : '—',
          completed_sessions: count,
          quiz_score: quizAvg,
          grammar_score: avgGrammar,
          vocab_score: avgVocab,
          fluency_score: avgFluency,
          pron_score: avgPron,
          clinical_score: avgClinical,
          overall_score: avgOverall,
          last_activity: lastConv ? lastConv.created_at : s.created_at
        };
      })
    );

    const totalStudents = reportRows.length;
    const overallAvg = totalStudents
      ? Math.round(reportRows.reduce((a, b) => a + b.overall_score, 0) / totalStudents)
      : 0;
    const grammarAvg = totalStudents
      ? Math.round(reportRows.reduce((a, b) => a + b.grammar_score, 0) / totalStudents)
      : 0;
    const vocabAvg = totalStudents
      ? Math.round(reportRows.reduce((a, b) => a + b.vocab_score, 0) / totalStudents)
      : 0;
    const clinicalAvg = totalStudents
      ? Math.round(reportRows.reduce((a, b) => a + b.clinical_score, 0) / totalStudents)
      : 0;

    res.json({
      groups: availableGroups,
      modules: availableModules,
      summary: {
        total_students: totalStudents,
        average_overall: overallAvg,
        average_grammar: grammarAvg,
        average_vocab: vocabAvg,
        average_clinical: clinicalAvg,
      },
      reports: reportRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboard, getGroups, getGroupStudents,
  getStudentProgress, getTranscript,
  getForumMessages, postForumMessage, togglePinMessage,
  getReports,
};
