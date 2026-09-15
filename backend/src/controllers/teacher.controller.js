const {
  User, StudentGroup, TeacherGroup, Module, Specialty,
  Conversation, Message, TestResult, ForumMessage, ModuleResult
} = require('../models');
const { Op } = require('sequelize');

// ── GET /api/teacher/dashboard ──────────────────────────────
const avgOf = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const DAY = 86400000;

const getDashboard = async (req, res) => {
  try {
    const teacherGroupLinks = await TeacherGroup.findAll({ where: { teacher_id: req.user.id } });
    const groupIds = teacherGroupLinks.map((tg) => tg.group_id);

    const [students, groups, allModules] = await Promise.all([
      User.findAll({
        where: { role: 'student', group_id: { [Op.in]: groupIds } },
        include: [{ model: StudentGroup, as: 'group', attributes: ['id', 'name', 'specialty_id'] }],
      }),
      StudentGroup.findAll({
        where: { id: { [Op.in]: groupIds } },
        include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en', 'code', 'icon'] }],
      }),
      Module.findAll({ attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index', 'specialty_id'], order: [['order_index', 'ASC']] }),
    ]);

    const studentIds = students.map((s) => s.id);

    // 1. All conversations and module results
    const conversations = await Conversation.findAll({
      where: { student_id: { [Op.in]: studentIds }, status: 'completed' },
      order: [['created_at', 'DESC']],
      include: [{ model: Module, as: 'module', attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index'] }],
    });
    const moduleResults = await ModuleResult.findAll({ where: { student_id: { [Op.in]: studentIds } } });

    const modulesOfSpecialty = (specId) => allModules.filter((m) => !specId || m.specialty_id === specId);
    const totalModulesFallback = allModules.length;

    // 2. Map all students with comprehensive percentages and competency scores
    const allStudentsList = students.map((s) => {
      const studentConvs = conversations.filter((c) => c.student_id === s.id);
      const studentModRes = moduleResults.filter((mr) => mr.student_id === s.id);
      const specId = s.specialty_id || s.group?.specialty_id || null;
      const totalModulesCount = specId ? modulesOfSpecialty(specId).length || totalModulesFallback : totalModulesFallback;

      // Best score per module
      const moduleMap = new Map();
      studentConvs.forEach((c) => {
        const cur = moduleMap.get(c.module_id) || 0;
        if (c.overall_score > cur) moduleMap.set(c.module_id, c.overall_score);
      });
      studentModRes.forEach((mr) => {
        const cur = moduleMap.get(mr.module_id) || 0;
        const best = Math.max(mr.combined_score || 0, mr.best_chat_score || 0, mr.best_quiz_score || 0);
        if (best > cur) moduleMap.set(mr.module_id, best);
      });

      let passedCount = 0;
      let totalSum = 0;
      for (const score of moduleMap.values()) {
        totalSum += score;
        if (score >= 60) passedCount++;
      }

      const sAvg = moduleMap.size > 0 ? Math.round(totalSum / moduleMap.size) : 0;
      const progressPercent = totalModulesCount > 0 ? Math.min(100, Math.round((passedCount / totalModulesCount) * 100)) : 0;

      let cefr = 'A2 Foundation';
      if (sAvg >= 85) cefr = 'B2 Clinical';
      else if (sAvg >= 60) cefr = 'B1 Medical';

      const scored = studentConvs.filter((c) => c.grammar_score || c.vocabulary_score || c.fluency_score || c.pronunciation_score || c.clinical_score);
      const comp = (key, factor) => (scored.length ? avgOf(scored.map((c) => c[key] || 0)) : Math.min(100, Math.round(sAvg * factor)));
      const lastActivity = studentConvs.length > 0 ? studentConvs[0].created_at : null;

      return {
        id: s.id,
        full_name: s.full_name,
        email: s.email,
        group_id: s.group_id,
        group_name: s.group ? s.group.name : '—',
        created_at: s.created_at,
        average_score: sAvg,
        completed_modules: passedCount,
        total_modules: totalModulesCount,
        progress_percent: progressPercent,
        cefr_level: cefr,
        completed_sessions: studentConvs.length,
        best_scores: Object.fromEntries(moduleMap),
        competencies: {
          grammar: comp('grammar_score', 0.95),
          vocabulary: comp('vocabulary_score', 1.02),
          fluency: comp('fluency_score', 0.98),
          pronunciation: comp('pronunciation_score', 0.94),
          clinical: comp('clinical_score', 1.01),
        },
        last_activity: lastActivity || s.created_at,
        days_inactive: lastActivity ? Math.floor((Date.now() - new Date(lastActivity)) / DAY) : null,
      };
    });

    const totalStudents = allStudentsList.length;
    const activeList = allStudentsList.filter((s) => s.completed_sessions > 0);
    const globalAvg = avgOf(activeList.map((s) => s.average_score));

    // helpers shared by group + global analytics
    const buildTimeline = (convs, days = 14) => {
      const out = [];
      for (let i = days - 1; i >= 0; i--) {
        const key = dayKey(Date.now() - i * DAY);
        const dayConvs = convs.filter((c) => dayKey(c.created_at) === key);
        out.push({ date: key, sessions: dayConvs.length, avg_score: avgOf(dayConvs.map((c) => c.overall_score || 0)) });
      }
      return out;
    };
    const buildDistribution = (convs) => [
      { label: '0-39', min: 0, max: 39 }, { label: '40-59', min: 40, max: 59 },
      { label: '60-79', min: 60, max: 79 }, { label: '80-100', min: 80, max: 100 },
    ].map((b) => ({ label: b.label, count: convs.filter((c) => (c.overall_score || 0) >= b.min && (c.overall_score || 0) <= b.max).length }));
    const buildCompetencies = (convs) => ({
      grammar: avgOf(convs.map((c) => c.grammar_score || 0)),
      vocabulary: avgOf(convs.map((c) => c.vocabulary_score || 0)),
      fluency: avgOf(convs.map((c) => c.fluency_score || 0)),
      pronunciation: avgOf(convs.map((c) => c.pronunciation_score || 0)),
      clinical: avgOf(convs.map((c) => c.clinical_score || 0)),
    });
    const buildModuleMatrix = (mods, list, convs) => mods.map((m) => {
      const mConvs = convs.filter((c) => c.module_id === m.id);
      const bests = list.map((s) => s.best_scores[m.id]).filter((v) => v !== undefined);
      return {
        id: m.id, order_index: m.order_index,
        title: m.title, title_uz: m.title_uz, title_ru: m.title_ru, title_en: m.title_en,
        attempts: mConvs.length,
        students_attempted: bests.length,
        students_passed: bests.filter((v) => v >= 60).length,
        avg_score: avgOf(bests),
        completion_rate: list.length ? Math.round((bests.filter((v) => v >= 60).length / list.length) * 100) : 0,
      };
    });
    const recent = (convs, n = 8) => convs.slice(0, n).map((c) => {
      const st = allStudentsList.find((s) => s.id === c.student_id);
      return {
        id: c.id, student_id: c.student_id, student_name: st ? st.full_name : '—', group_name: st ? st.group_name : '—',
        module_title: c.module?.title || '—', module_order: c.module?.order_index || null,
        score: c.overall_score || 0, created_at: c.created_at,
      };
    });

    // 3. Map groups with stats
    const groupsWithStats = groups.map((g) => {
      const groupStudents = allStudentsList.filter((s) => s.group_id === g.id);
      const gIds = new Set(groupStudents.map((s) => s.id));
      const gConvs = conversations.filter((c) => gIds.has(c.student_id));
      const gActive = groupStudents.filter((s) => s.completed_sessions > 0);
      const gMods = modulesOfSpecialty(g.specialty_id);
      const ranked = [...gActive].sort((a, b) => b.average_score - a.average_score);
      return {
        id: g.id,
        name: g.name,
        specialty: g.specialty || null,
        specialty_name: g.specialty ? g.specialty.name : null,
        student_count: groupStudents.length,
        active_students: gActive.length,
        inactive_students: groupStudents.filter((s) => s.days_inactive === null || s.days_inactive > 14).length,
        average_score: avgOf(gActive.map((s) => s.average_score)),
        average_progress: avgOf(groupStudents.map((s) => s.progress_percent)),
        completed_sessions: gConvs.length,
        sessions_7d: gConvs.filter((c) => Date.now() - new Date(c.created_at) <= 7 * DAY).length,
        pass_rate: gConvs.length ? Math.round((gConvs.filter((c) => (c.overall_score || 0) >= 60).length / gConvs.length) * 100) : 0,
        total_modules: gMods.length || totalModulesFallback,
        competencies: buildCompetencies(gConvs),
        activity_timeline: buildTimeline(gConvs),
        score_distribution: buildDistribution(gConvs),
        module_matrix: buildModuleMatrix(gMods.length ? gMods : allModules, groupStudents, gConvs),
        top_students: ranked.slice(0, 3),
        weak_students: ranked.filter((s) => s.average_score < 60).slice(-3).reverse(),
        recent_activity: recent(gConvs, 6),
        students: groupStudents,
      };
    });

    res.json({
      total_groups: groupIds.length,
      total_students: students.length,
      active_students: activeList.length,
      average_score: globalAvg,
      average_progress: avgOf(allStudentsList.map((s) => s.progress_percent)),
      recent_conversations: conversations.length,
      sessions_7d: conversations.filter((c) => Date.now() - new Date(c.created_at) <= 7 * DAY).length,
      pass_rate: conversations.length ? Math.round((conversations.filter((c) => (c.overall_score || 0) >= 60).length / conversations.length) * 100) : 0,
      competencies: buildCompetencies(conversations),
      activity_timeline: buildTimeline(conversations),
      score_distribution: buildDistribution(conversations),
      recent_activity: recent(conversations, 8),
      all_students: allStudentsList,
      groups: groupsWithStats,
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

    const groups = await StudentGroup.findAll({
      where: { id: { [Op.in]: groupIds } },
      include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en', 'code', 'icon'] }],
    });

    const result = await Promise.all(
      groups.map(async (g) => {
        const students = await User.findAll({ where: { group_id: g.id, role: 'student' }, attributes: ['id'] });
        const ids = students.map((s) => s.id);
        const convs = ids.length
          ? await Conversation.findAll({ where: { student_id: { [Op.in]: ids }, status: 'completed' }, attributes: ['student_id', 'overall_score'] })
          : [];
        const activeIds = new Set(convs.map((c) => c.student_id));
        return {
          ...g.toJSON(),
          specialty_name: g.specialty ? g.specialty.name : null,
          student_count: ids.length,
          active_students: activeIds.size,
          completed_sessions: convs.length,
          average_score: convs.length ? Math.round(convs.reduce((a, c) => a + (c.overall_score || 0), 0) / convs.length) : 0,
        };
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

// ── GET /api/forum/channels ──────────────────────────────────
const getForumChannels = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'teacher') {
      return res.json([{ 
        id: `teacher_${user.id}`, 
        name: `teacher_${user.id}`, 
        label: "Mening O'quvchilarim", 
        desc: "Sizning o'quvchilaringiz bilan muloqot", 
        icon: 'RiTeamLine' 
      }]);
    } else if (user.role === 'student') {
      // Find the student's group and its teachers
      if (!user.group_id) {
        return res.json([]);
      }
      const group = await StudentGroup.findByPk(user.group_id, {
        include: [{ model: User, as: 'teachers', attributes: ['id', 'full_name'] }]
      });
      if (!group || !group.teachers || group.teachers.length === 0) {
        return res.json([]);
      }
      const channels = group.teachers.map(t => ({
        id: `teacher_${t.id}`,
        name: `teacher_${t.id}`,
        label: `${t.full_name}`,
        desc: "Guruh o'qituvchisi bilan muloqot",
        icon: 'RiUserStarLine'
      }));
      return res.json(channels);
    } else if (user.role === 'admin') {
      // Admin sees all teachers
      const teachers = await User.findAll({ where: { role: 'teacher' } });
      const channels = teachers.map(t => ({
        id: `teacher_${t.id}`,
        name: `teacher_${t.id}`,
        label: `${t.full_name} (O'qituvchi)`,
        desc: "O'qituvchi va o'quvchilar chati",
        icon: 'RiShieldCheckLine'
      }));
      return res.json(channels);
    }
    res.json([]);
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

    const uploaded = req.file || req.files?.voice?.[0] || req.files?.file?.[0] || null;
    if (uploaded) {
      const relativePath = `/uploads/${uploaded.filename}`;
      if (uploaded.mimetype.startsWith('audio/') || uploaded.fieldname === 'voice') {
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
  getForumChannels, getForumMessages, postForumMessage, togglePinMessage,
  getReports,
};
