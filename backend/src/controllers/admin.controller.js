const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { resolveEnrollment } = require('../services/enrollment.service');
const {
  User, Specialty, StudentGroup, TeacherGroup,
  Module, Grammar, Vocabulary, Phrasebook, Test,
  Conversation, TestResult, ForumMessage,
} = require('../models');

// ── GET /api/admin/overview ──────────────────────────────────
const avgOf = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

const getOverview = async (req, res) => {
  try {
    const [studentsCount, teachersCount, adminsCount, modulesCount, completedConvsCount,
           grammarCount, vocabCount, phraseCount, testCount, forumCount] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'teacher' } }),
      User.count({ where: { role: 'admin' } }),
      Module.count(),
      Conversation.count({ where: { status: 'completed' } }),
      Grammar.count(), Vocabulary.count(), Phrasebook.count(), Test.count(), ForumMessage.count(),
    ]);

    // Fetch all specialties, modules, groups, teachers, and students (with results)
    const [specialties, allModules, allGroups, teacherLinks, allTeachers, allStudents] = await Promise.all([
      Specialty.findAll({ order: [['name', 'ASC']] }),
      Module.findAll({ attributes: ['id', 'title', 'title_uz', 'title_ru', 'title_en', 'order_index', 'specialty_id'] }),
      StudentGroup.findAll({ attributes: ['id', 'name', 'specialty_id'], order: [['name', 'ASC']] }),
      TeacherGroup.findAll({ attributes: ['teacher_id', 'group_id'] }),
      User.findAll({ where: { role: 'teacher' }, attributes: ['id', 'full_name', 'specialty_id'] }),
      User.findAll({
        where: { role: 'student' },
        attributes: ['id', 'full_name', 'email', 'specialty_id', 'group_id', 'created_at'],
        include: [
          {
            model: Conversation,
            where: { status: 'completed' },
            attributes: ['id', 'overall_score', 'grammar_score', 'vocabulary_score', 'fluency_score', 'pronunciation_score', 'clinical_score', 'module_id', 'created_at'],
            required: false,
          },
          { model: TestResult, attributes: ['id', 'score', 'module_id', 'created_at'], required: false },
        ],
        order: [['full_name', 'ASC']],
      }),
    ]);

    const allConversations = allStudents.flatMap((st) =>
      (st.Conversations || []).map((c) => ({ ...c.toJSON(), student_id: st.id, student_name: st.full_name, group_id: st.group_id }))
    );
    const globalAvgScore = avgOf(allConversations.map((c) => c.overall_score || 0));
    const groupById = new Map(allGroups.map((g) => [g.id, g]));
    const moduleById = new Map(allModules.map((m) => [m.id, m]));
    const specById = new Map(specialties.map((s) => [s.id, s]));
    const teacherById = new Map(allTeachers.map((t) => [t.id, t]));
    const teachersOfGroup = new Map();
    teacherLinks.forEach((l) => {
      if (!teachersOfGroup.has(l.group_id)) teachersOfGroup.set(l.group_id, []);
      const t = teacherById.get(l.teacher_id);
      if (t) teachersOfGroup.get(l.group_id).push({ id: t.id, full_name: t.full_name });
    });

    const enrichStudent = (st, groupName) => {
      const convs = st.Conversations || [];
      const tests = st.TestResults || [];
      const convScores = convs.map((c) => c.overall_score || 0);
      const last = convs.reduce((m, c) => (!m || new Date(c.created_at) > new Date(m) ? c.created_at : m), null);
      return {
        id: st.id,
        full_name: st.full_name,
        email: st.email,
        created_at: st.created_at,
        group_name: groupName,
        completed_conversations: convs.length,
        tests_taken: tests.length,
        avg_score: avgOf(convScores),
        last_activity: last,
      };
    };

    // Map analytics per specialty
    const specialtiesAnalytics = specialties.map((spec) => {
      const specId = spec.id;
      const specModules = allModules.filter((m) => m.specialty_id === specId);
      const specGroups = allGroups.filter((g) => g.specialty_id === specId);
      const specGroupIds = new Set(specGroups.map((g) => g.id));
      const specStudents = allStudents.filter(
        (st) => st.specialty_id === specId || (st.group_id && specGroupIds.has(st.group_id))
      );
      const specTeachers = allTeachers.filter((t) => t.specialty_id === specId
        || specGroups.some((g) => (teachersOfGroup.get(g.id) || []).some((x) => x.id === t.id)));

      const specConvs = [];
      const enrichedGroups = specGroups.map((group) => {
        const groupStudents = specStudents.filter((st) => st.group_id === group.id);
        const enrichedStudents = groupStudents.map((st) => enrichStudent(st, group.name));
        const groupConvs = groupStudents.flatMap((st) => st.Conversations || []);
        specConvs.push(...groupConvs);
        return {
          id: group.id,
          name: group.name,
          student_count: groupStudents.length,
          completed_conversations: groupConvs.length,
          avg_score: avgOf(groupConvs.map((c) => c.overall_score || 0)),
          teachers: teachersOfGroup.get(group.id) || [],
          students: enrichedStudents,
        };
      });

      const ungroupedStudents = specStudents.filter((st) => !st.group_id || !specGroupIds.has(st.group_id));
      if (ungroupedStudents.length > 0) {
        const enrichedUngrouped = ungroupedStudents.map((st) => enrichStudent(st, 'Guruhsiz'));
        const ungroupedConvs = ungroupedStudents.flatMap((st) => st.Conversations || []);
        specConvs.push(...ungroupedConvs);
        enrichedGroups.push({
          id: 0,
          name: 'Guruh biriktirilmagan',
          student_count: ungroupedStudents.length,
          completed_conversations: ungroupedConvs.length,
          avg_score: avgOf(ungroupedConvs.map((c) => c.overall_score || 0)),
          teachers: [],
          students: enrichedUngrouped,
        });
      }

      const activeStudents = specStudents.filter((st) => (st.Conversations || []).length > 0).length;
      return {
        id: spec.id,
        name: spec.name,
        name_uz: spec.name_uz, name_ru: spec.name_ru, name_en: spec.name_en,
        code: spec.code, icon: spec.icon,
        total_students: specStudents.length,
        student_count: specStudents.length,
        active_students: activeStudents,
        total_teachers: specTeachers.length,
        total_groups: specGroups.length,
        total_modules: specModules.length,
        total_conversations: specConvs.length,
        avg_score: avgOf(specConvs.map((c) => c.overall_score || 0)),
        competencies: {
          grammar: avgOf(specConvs.map((c) => c.grammar_score || 0)),
          vocabulary: avgOf(specConvs.map((c) => c.vocabulary_score || 0)),
          fluency: avgOf(specConvs.map((c) => c.fluency_score || 0)),
          pronunciation: avgOf(specConvs.map((c) => c.pronunciation_score || 0)),
          clinical: avgOf(specConvs.map((c) => c.clinical_score || 0)),
        },
        groups: enrichedGroups,
      };
    });

    // Global Academic Groups Leaderboard Ranking
    const groupsRanking = allGroups.map((group) => {
      const spec = specById.get(group.specialty_id);
      const groupStudents = allStudents.filter((st) => st.group_id === group.id);
      const convs = groupStudents.flatMap((st) => st.Conversations || []);
      const tests = groupStudents.flatMap((st) => st.TestResults || []);
      return {
        id: group.id,
        name: group.name,
        specialty_name: spec ? spec.name : 'Biriktirilmagan',
        specialty_id: group.specialty_id,
        student_count: groupStudents.length,
        active_students: groupStudents.filter((st) => (st.Conversations || []).length > 0).length,
        completed_conversations: convs.length,
        tests_taken: tests.length,
        avg_score: avgOf(convs.map((c) => c.overall_score || 0)),
        teachers: teachersOfGroup.get(group.id) || [],
      };
    }).sort((a, b) => b.avg_score - a.avg_score || b.completed_conversations - a.completed_conversations || b.student_count - a.student_count);

    // ── Time-based analytics ──
    const now = Date.now();
    const DAY = 86400000;
    const since = (days) => new Date(now - days * DAY);
    const activeIds = (days) => new Set(allConversations.filter((c) => new Date(c.created_at) >= since(days)).map((c) => c.student_id));
    const timeline = [];
    for (let i = 13; i >= 0; i--) {
      const key = dayKey(now - i * DAY);
      const dayConvs = allConversations.filter((c) => dayKey(c.created_at) === key);
      timeline.push({ date: key, sessions: dayConvs.length, avg_score: avgOf(dayConvs.map((c) => c.overall_score || 0)) });
    }
    const buckets = [
      { label: '0-39', min: 0, max: 39 }, { label: '40-59', min: 40, max: 59 },
      { label: '60-79', min: 60, max: 79 }, { label: '80-100', min: 80, max: 100 },
    ].map((b) => ({ ...b, count: allConversations.filter((c) => (c.overall_score || 0) >= b.min && (c.overall_score || 0) <= b.max).length }));

    // ── Module performance ──
    const moduleStats = allModules.map((m) => {
      const convs = allConversations.filter((c) => c.module_id === m.id);
      const spec = specById.get(m.specialty_id);
      const studentIds = new Set(convs.map((c) => c.student_id));
      const passed = convs.filter((c) => (c.overall_score || 0) >= 60).length;
      return {
        id: m.id, title: m.title, title_uz: m.title_uz, title_ru: m.title_ru, title_en: m.title_en,
        order_index: m.order_index, specialty_name: spec ? spec.name : '—', specialty_code: spec ? spec.code : null,
        attempts: convs.length, students: studentIds.size,
        avg_score: avgOf(convs.map((c) => c.overall_score || 0)),
        pass_rate: convs.length ? Math.round((passed / convs.length) * 100) : 0,
      };
    }).filter((m) => m.attempts > 0).sort((a, b) => b.attempts - a.attempts);

    // ── Top students & recent activity ──
    const rankedStudents = allStudents
      .map((st) => ({ ...enrichStudent(st, st.group_id && groupById.get(st.group_id) ? groupById.get(st.group_id).name : '—'),
        specialty_name: st.specialty_id && specById.get(st.specialty_id) ? specById.get(st.specialty_id).name : '—' }))
      .filter((s) => s.completed_conversations > 0)
      .sort((a, b) => b.avg_score - a.avg_score || b.completed_conversations - a.completed_conversations);
    const recentActivity = [...allConversations]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map((c) => {
        const m = moduleById.get(c.module_id);
        return {
          id: c.id, student_id: c.student_id, student_name: c.student_name,
          group_name: c.group_id && groupById.get(c.group_id) ? groupById.get(c.group_id).name : '—',
          module_title: m ? m.title : '—', module_order: m ? m.order_index : null,
          score: c.overall_score || 0, created_at: c.created_at,
        };
      });

    res.json({
      students: studentsCount,
      teachers: teachersCount,
      admins: adminsCount,
      modules: modulesCount,
      groups: allGroups.length,
      completed_conversations: completedConvsCount,
      avg_score: globalAvgScore,
      active_students_7d: activeIds(7).size,
      active_students_30d: activeIds(30).size,
      new_students_30d: allStudents.filter((st) => new Date(st.created_at) >= since(30)).length,
      sessions_7d: allConversations.filter((c) => new Date(c.created_at) >= since(7)).length,
      pass_rate: allConversations.length ? Math.round((allConversations.filter((c) => (c.overall_score || 0) >= 60).length / allConversations.length) * 100) : 0,
      competencies: {
        grammar: avgOf(allConversations.map((c) => c.grammar_score || 0)),
        vocabulary: avgOf(allConversations.map((c) => c.vocabulary_score || 0)),
        fluency: avgOf(allConversations.map((c) => c.fluency_score || 0)),
        pronunciation: avgOf(allConversations.map((c) => c.pronunciation_score || 0)),
        clinical: avgOf(allConversations.map((c) => c.clinical_score || 0)),
      },
      content: { grammar: grammarCount, vocabulary: vocabCount, phrasebook: phraseCount, tests: testCount, forum_messages: forumCount },
      alerts: {
        ungrouped_students: allStudents.filter((st) => !st.group_id).length,
        students_without_specialty: allStudents.filter((st) => !st.specialty_id).length,
        groups_without_teacher: allGroups.filter((g) => !(teachersOfGroup.get(g.id) || []).length).length,
        empty_groups: allGroups.filter((g) => !allStudents.some((st) => st.group_id === g.id)).length,
        specialties_without_modules: specialties.filter((s) => !allModules.some((m) => m.specialty_id === s.id)).length,
        inactive_students: allStudents.filter((st) => !(st.Conversations || []).length).length,
      },
      activity_timeline: timeline,
      score_distribution: buckets.map(({ label, count }) => ({ label, count })),
      module_stats: moduleStats,
      top_students: rankedStudents.slice(0, 8),
      recent_activity: recentActivity,
      specialties: specialtiesAnalytics,
      groups_ranking: groupsRanking,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/admin/users ─────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role, group_id, specialty_id } = req.query;
    const where = {};
    if (role) where.role = role;
    if (group_id) where.group_id = group_id;
    if (specialty_id) where.specialty_id = specialty_id;

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Specialty,    as: 'specialty', attributes: ['id', 'name'] },
        { model: StudentGroup, as: 'group',     attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/admin/users ────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role, specialty_id, group_id } = req.body;
    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Ism, email va parol majburiy' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Bu email allaqachon mavjud' });

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role || 'student';
    // guruh faqat talabalarga; yo'nalish o'qituvchi uchun ham bo'lishi mumkin (ma'lumot sifatida)
    const enroll = await resolveEnrollment(
      { specialty_id, group_id: userRole === 'student' ? group_id : null },
      { specialty_id: null, group_id: null },
      { actor: 'admin' }
    );
    if (!enroll.ok) return res.status(400).json({ error: enroll.error });

    const user = await User.create({
      full_name,
      email,
      password_hash,
      role: userRole,
      ...enroll.updates,
    });

    res.status(201).json({ ...user.toJSON(), password_hash: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/admin/users/:id ─────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const { full_name, email, role, specialty_id, group_id, password } = req.body;
    const nextRole = role || user.role;

    if (email && email !== user.email) {
      const dup = await User.findOne({ where: { email } });
      if (dup && dup.id !== user.id) return res.status(400).json({ error: 'Bu email allaqachon mavjud' });
    }

    // admin guruhdan guruhga to'g'ridan-to'g'ri o'tkaza oladi; yo'nalish/guruh mosligi tekshiriladi
    const enroll = await resolveEnrollment(
      { specialty_id, group_id: nextRole === 'student' ? group_id : null },
      { specialty_id: user.specialty_id, group_id: user.group_id },
      { actor: 'admin' }
    );
    if (!enroll.ok) return res.status(400).json({ error: enroll.error });

    const updates = {
      full_name: full_name || user.full_name,
      email: email || user.email,
      role: nextRole,
      ...enroll.updates,
    };
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    await user.update(updates);
    res.json({ message: 'Yangilandi', user: { ...user.toJSON(), password_hash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/admin/users/:id ──────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    await user.destroy();
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── SPECIALTIES ──────────────────────────────────────────────
const getSpecialties = async (req, res) => {
  try {
    const s = await Specialty.findAll({
      include: [
        { model: StudentGroup, as: 'groups', attributes: ['id', 'name'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createSpecialty = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Mutaxassislik nomi majburiy' });
    const s = await Specialty.create({ name });
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteSpecialty = async (req, res) => {
  try {
    await Specialty.destroy({ where: { id: req.params.id } });
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateSpecialty = async (req, res) => {
  try {
    const s = await Specialty.findByPk(req.params.id);
    if (!s) return res.status(404).json({ error: 'Topilmadi' });
    await s.update({ name: req.body.name });
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── GROUPS ───────────────────────────────────────────────────
const getGroups = async (req, res) => {
  try {
    const g = await StudentGroup.findAll({
      include: [
        { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
        { model: User, as: 'teachers', attributes: ['id', 'full_name', 'email'], through: { attributes: [] } },
        { model: User, as: 'students', attributes: ['id', 'full_name', 'email'], where: { role: 'student' }, required: false },
      ],
      order: [['name', 'ASC']],
    });
    res.json(g);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createGroup = async (req, res) => {
  try {
    const { name, specialty_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Guruh nomi majburiy' });
    const g = await StudentGroup.create({ name, specialty_id: specialty_id || null });
    res.status(201).json(g);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteGroup = async (req, res) => {
  try {
    await StudentGroup.destroy({ where: { id: req.params.id } });
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateGroup = async (req, res) => {
  try {
    const g = await StudentGroup.findByPk(req.params.id);
    if (!g) return res.status(404).json({ error: 'Topilmadi' });
    const { name, specialty_id } = req.body;
    await g.update({
      name: name || g.name,
      specialty_id: specialty_id !== undefined ? specialty_id : g.specialty_id,
    });
    res.json(g);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Teacher-Group Biriktirish / Olib tashlash ──────────────────
const assignTeacherGroup = async (req, res) => {
  try {
    const { teacher_id, group_id } = req.body;
    if (!teacher_id || !group_id) return res.status(400).json({ error: 'teacher_id va group_id majburiy' });
    const existing = await TeacherGroup.findOne({ where: { teacher_id, group_id } });
    if (existing) return res.status(400).json({ error: 'Allaqachon biriktirilgan' });
    const tg = await TeacherGroup.create({ teacher_id, group_id });
    res.status(201).json(tg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeTeacherGroup = async (req, res) => {
  try {
    const { teacher_id, group_id } = req.body;
    await TeacherGroup.destroy({ where: { teacher_id, group_id } });
    res.json({ message: 'Biriktiruv bekor qilindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const assignStudentGroup = async (req, res) => {
  try {
    const { student_id, group_id, specialty_id } = req.body;
    const student = await User.findOne({ where: { id: student_id, role: 'student' } });
    if (!student) return res.status(404).json({ error: 'Talaba topilmadi' });

    // group_id: null → guruhdan chiqarish (yo'nalish saqlanadi); son → biriktirish/o'tkazish (yo'nalish guruhniki bo'ladi)
    const enroll = await resolveEnrollment(
      { specialty_id, group_id },
      { specialty_id: student.specialty_id, group_id: student.group_id },
      { actor: 'admin' }
    );
    if (!enroll.ok) return res.status(400).json({ error: enroll.error });

    await student.update(enroll.updates);
    res.json({ message: 'Talaba biriktirildi', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── MODULES ──────────────────────────────────────────────────
const getModules = async (req, res) => {
  const mods = await Module.findAll({
    include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }],
    order: [['order_index', 'ASC']],
  });
  res.json(mods);
};

const createModule = async (req, res) => {
  try {
    const m = await Module.create(req.body);
    res.status(201).json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateModule = async (req, res) => {
  try {
    const m = await Module.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: 'Topilmadi' });
    await m.update(req.body);
    res.json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteModule = async (req, res) => {
  await Module.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
};

// ── GRAMMAR ──────────────────────────────────────────────────
const getGrammar = async (req, res) => {
  const { module_id } = req.query;
  const where = module_id ? { module_id } : {};
  const g = await Grammar.findAll({ where, order: [['step_order', 'ASC'], ['id', 'ASC']] });
  const parsed = g.map(item => {
    const obj = item.toJSON ? item.toJSON() : { ...item };
    if (typeof obj.examples === 'string') {
      try { obj.examples = JSON.parse(obj.examples); } catch (_) { obj.examples = []; }
    }
    if (typeof obj.common_mistakes === 'string') {
      try { obj.common_mistakes = JSON.parse(obj.common_mistakes); } catch (_) { obj.common_mistakes = []; }
    }
    return obj;
  });
  res.json(parsed);
};
const createGrammar = async (req, res) => {
  const g = await Grammar.create(req.body);
  res.status(201).json(g);
};
const updateGrammar = async (req, res) => {
  const g = await Grammar.findByPk(req.params.id);
  if (!g) return res.status(404).json({ error: 'Topilmadi' });
  await g.update(req.body);
  res.json(g);
};
const deleteGrammar = async (req, res) => {
  await Grammar.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
};

// ── VOCABULARY ───────────────────────────────────────────────
const getVocabulary = async (req, res) => {
  const { module_id } = req.query;
  const where = module_id ? { module_id } : {};
  const v = await Vocabulary.findAll({ where, order: [['id', 'ASC']] });
  res.json(v);
};
const createVocabulary = async (req, res) => {
  const v = await Vocabulary.create(req.body);
  res.status(201).json(v);
};
const updateVocabulary = async (req, res) => {
  const v = await Vocabulary.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'Topilmadi' });
  await v.update(req.body); res.json(v);
};
const deleteVocabulary = async (req, res) => {
  await Vocabulary.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
};

// ── PHRASEBOOK ───────────────────────────────────────────────
const getPhrasebook = async (req, res) => {
  const { module_id } = req.query;
  const where = module_id ? { module_id } : {};
  const p = await Phrasebook.findAll({ where, order: [['step_order', 'ASC']] });
  res.json(p);
};
const createPhrase = async (req, res) => {
  const p = await Phrasebook.create(req.body);
  res.status(201).json(p);
};
const updatePhrase = async (req, res) => {
  const p = await Phrasebook.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Topilmadi' });
  await p.update(req.body); res.json(p);
};
const deletePhrase = async (req, res) => {
  await Phrasebook.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
};

// ── TESTS / QUIZZES ──────────────────────────────────────────
const getTests = async (req, res) => {
  const { module_id } = req.query;
  const where = module_id ? { module_id } : {};
  const t = await Test.findAll({ where, order: [['id', 'ASC']] });
  res.json(t);
};
const createTest = async (req, res) => {
  const t = await Test.create(req.body);
  res.status(201).json(t);
};
const updateTest = async (req, res) => {
  const t = await Test.findByPk(req.params.id);
  if (!t) return res.status(404).json({ error: 'Topilmadi' });
  await t.update(req.body); res.json(t);
};
const deleteTest = async (req, res) => {
  await Test.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
};

module.exports = {
  getOverview,
  getUsers, createUser, updateUser, deleteUser,
  getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty,
  getGroups, createGroup, updateGroup, deleteGroup, assignTeacherGroup, removeTeacherGroup, assignStudentGroup,
  getModules, createModule, updateModule, deleteModule,
  getGrammar, createGrammar, updateGrammar, deleteGrammar,
  getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary,
  getPhrasebook, createPhrase, updatePhrase, deletePhrase,
  getTests, createTest, updateTest, deleteTest,
};
