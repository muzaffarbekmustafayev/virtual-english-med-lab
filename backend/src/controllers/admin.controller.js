const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  User, Specialty, StudentGroup, TeacherGroup,
  Module, Grammar, Vocabulary, Phrasebook, Test,
  Conversation, TestResult,
} = require('../models');

// ── GET /api/admin/overview ──────────────────────────────────
const getOverview = async (req, res) => {
  try {
    const [studentsCount, teachersCount, adminsCount, modulesCount, completedConvsCount] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'teacher' } }),
      User.count({ where: { role: 'admin' } }),
      Module.count(),
      Conversation.count({ where: { status: 'completed' } }),
    ]);

    const allConversations = await Conversation.findAll({ where: { status: 'completed' } });
    const globalAvgScore = allConversations.length
      ? Math.round(allConversations.reduce((s, c) => s + (c.overall_score || 0), 0) / allConversations.length)
      : 0;

    // Fetch all specialties, modules, groups, and students
    const [specialties, allModules, allGroups, allStudents] = await Promise.all([
      Specialty.findAll({ order: [['name', 'ASC']] }),
      Module.findAll({ attributes: ['id', 'title', 'order_index', 'specialty_id'] }),
      StudentGroup.findAll({ attributes: ['id', 'name', 'specialty_id'], order: [['name', 'ASC']] }),
      User.findAll({
        where: { role: 'student' },
        attributes: ['id', 'full_name', 'email', 'specialty_id', 'group_id', 'created_at'],
        include: [
          {
            model: Conversation,
            where: { status: 'completed' },
            attributes: ['id', 'overall_score', 'module_id', 'created_at'],
            required: false,
          },
          {
            model: TestResult,
            attributes: ['id', 'score', 'module_id', 'created_at'],
            required: false,
          },
        ],
        order: [['full_name', 'ASC']],
      }),
    ]);

    // Map analytics per specialty
    const specialtiesAnalytics = specialties.map((spec) => {
      const specId = spec.id;
      const specModules = allModules.filter((m) => m.specialty_id === specId);
      const specGroups = allGroups.filter((g) => g.specialty_id === specId);

      // Students belonging to this specialty (either directly or via their group)
      const specGroupIds = new Set(specGroups.map((g) => g.id));
      const specStudents = allStudents.filter(
        (st) => st.specialty_id === specId || (st.group_id && specGroupIds.has(st.group_id))
      );

      let specConvScores = [];
      let specCompletedConvs = 0;

      // Group-level analytics
      const enrichedGroups = specGroups.map((group) => {
        const groupStudents = specStudents.filter((st) => st.group_id === group.id);
        let groupConvScores = [];
        let groupCompletedConvs = 0;

        const enrichedStudents = groupStudents.map((st) => {
          const convs = st.Conversations || [];
          const tests = st.TestResults || [];
          const convScores = convs.map((c) => c.overall_score || 0);
          const studentAvg = convScores.length
            ? Math.round(convScores.reduce((a, b) => a + b, 0) / convScores.length)
            : 0;

          groupConvScores.push(...convScores);
          groupCompletedConvs += convs.length;

          return {
            id: st.id,
            full_name: st.full_name,
            email: st.email,
            created_at: st.created_at,
            group_name: group.name,
            completed_conversations: convs.length,
            tests_taken: tests.length,
            avg_score: studentAvg,
          };
        });

        const groupAvgScore = groupConvScores.length
          ? Math.round(groupConvScores.reduce((a, b) => a + b, 0) / groupConvScores.length)
          : 0;

        specConvScores.push(...groupConvScores);
        specCompletedConvs += groupCompletedConvs;

        return {
          id: group.id,
          name: group.name,
          student_count: groupStudents.length,
          completed_conversations: groupCompletedConvs,
          avg_score: groupAvgScore,
          students: enrichedStudents,
        };
      });

      // Ungrouped students
      const ungroupedStudents = specStudents.filter(
        (st) => !st.group_id || !specGroupIds.has(st.group_id)
      );
      if (ungroupedStudents.length > 0) {
        const enrichedUngrouped = ungroupedStudents.map((st) => {
          const convs = st.Conversations || [];
          const tests = st.TestResults || [];
          const convScores = convs.map((c) => c.overall_score || 0);
          const studentAvg = convScores.length
            ? Math.round(convScores.reduce((a, b) => a + b, 0) / convScores.length)
            : 0;

          specConvScores.push(...convScores);
          specCompletedConvs += convs.length;

          return {
            id: st.id,
            full_name: st.full_name,
            email: st.email,
            created_at: st.created_at,
            group_name: 'Guruhsiz',
            completed_conversations: convs.length,
            tests_taken: tests.length,
            avg_score: studentAvg,
          };
        });

        enrichedGroups.push({
          id: 0,
          name: 'Guruh biriktirilmagan',
          student_count: ungroupedStudents.length,
          completed_conversations: enrichedUngrouped.reduce((a, b) => a + b.completed_conversations, 0),
          avg_score: enrichedUngrouped.length
            ? Math.round(enrichedUngrouped.reduce((a, b) => a + b.avg_score, 0) / enrichedUngrouped.length)
            : 0,
          students: enrichedUngrouped,
        });
      }

      const specAvgScore = specConvScores.length
        ? Math.round(specConvScores.reduce((a, b) => a + b, 0) / specConvScores.length)
        : 0;

      return {
        id: spec.id,
        name: spec.name,
        total_students: specStudents.length,
        total_modules: specModules.length,
        total_conversations: specCompletedConvs,
        avg_score: specAvgScore,
        groups: enrichedGroups,
      };
    });

    // Global Academic Groups Leaderboard Ranking
    const groupsRanking = allGroups.map((group) => {
      const spec = specialties.find((s) => s.id === group.specialty_id);
      const groupStudents = allStudents.filter((st) => st.group_id === group.id);

      let groupScores = [];
      let completedConvs = 0;
      let totalTests = 0;

      groupStudents.forEach((st) => {
        const convs = st.Conversations || [];
        const tests = st.TestResults || [];
        const scores = convs.map((c) => c.overall_score || 0);
        groupScores.push(...scores);
        completedConvs += convs.length;
        totalTests += tests.length;
      });

      const avgScore = groupScores.length
        ? Math.round(groupScores.reduce((a, b) => a + b, 0) / groupScores.length)
        : 0;

      return {
        id: group.id,
        name: group.name,
        specialty_name: spec ? spec.name : 'Biriktirilmagan',
        specialty_id: group.specialty_id,
        student_count: groupStudents.length,
        completed_conversations: completedConvs,
        tests_taken: totalTests,
        avg_score: avgScore,
      };
    }).sort((a, b) => b.avg_score - a.avg_score || b.completed_conversations - a.completed_conversations || b.student_count - a.student_count);

    res.json({
      students: studentsCount,
      teachers: teachersCount,
      admins: adminsCount,
      modules: modulesCount,
      completed_conversations: completedConvsCount,
      avg_score: globalAvgScore,
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
    const clean_specialty_id = specialty_id ? parseInt(specialty_id) : null;
    const clean_group_id     = group_id ? parseInt(group_id) : null;

    const user = await User.create({
      full_name,
      email,
      password_hash,
      role: role || 'student',
      specialty_id: clean_specialty_id,
      group_id: clean_group_id
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
    const clean_group_id = group_id ? parseInt(group_id) : null;
    
    if (user.role === 'student' && clean_group_id !== null && user.group_id !== null && user.group_id !== clean_group_id) {
      return res.status(400).json({ error: "Talaba allaqachon boshqa guruhga biriktirilgan. Boshqa guruhga o'tkazish uchun avval hozirgi guruhidan o'chiring." });
    }

    const updates = {
      full_name,
      email,
      role,
      specialty_id: specialty_id ? parseInt(specialty_id) : null,
      group_id: clean_group_id
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
    
    if (group_id !== null && group_id !== undefined && student.group_id && student.group_id !== group_id) {
      return res.status(400).json({ error: "Talaba allaqachon boshqa guruhga biriktirilgan. Boshqa guruhga o'tkazish uchun avval hozirgi guruhidan o'chiring." });
    }

    const updates = {};
    if (group_id !== undefined) updates.group_id = group_id;
    if (specialty_id !== undefined) updates.specialty_id = specialty_id;
    await student.update(updates);
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
