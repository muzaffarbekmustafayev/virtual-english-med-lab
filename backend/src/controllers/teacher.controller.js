const {
  User, StudentGroup, TeacherGroup, Module,
  Conversation, Message, TestResult, ForumMessage
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

    res.json({ student, conversations, testResults });
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
    const messages = await ForumMessage.findAll({
      include: [{ model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/forum/messages ─────────────────────────────────
const postForumMessage = async (req, res) => {
  try {
    const { message_text } = req.body;
    if (!message_text) return res.status(400).json({ error: 'Xabar bo\'sh bo\'lishi mumkin emas' });

    const msg = await ForumMessage.create({ sender_id: req.user.id, message_text });
    const full = await ForumMessage.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] }],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboard, getGroups, getGroupStudents,
  getStudentProgress, getTranscript,
  getForumMessages, postForumMessage,
};
