const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  User, Specialty, StudentGroup, TeacherGroup,
  Module, Vocabulary, Phrasebook, Test,
  Conversation, TestResult,
} = require('../models');

// ── GET /api/admin/overview ──────────────────────────────────
const getOverview = async (req, res) => {
  try {
    const [students, teachers, admins, modules, conversations] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'teacher' } }),
      User.count({ where: { role: 'admin' } }),
      Module.count(),
      Conversation.count({ where: { status: 'completed' } }),
    ]);

    const avgScore = await Conversation.findAll({ where: { status: 'completed' } }).then((cs) =>
      cs.length ? Math.round(cs.reduce((s, c) => s + c.overall_score, 0) / cs.length) : 0
    );

    res.json({ students, teachers, admins, modules, completed_conversations: conversations, avg_score: avgScore });
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
    const user = await User.create({ full_name, email, password_hash, role: role || 'student', specialty_id, group_id });

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
    const updates = { full_name, email, role, specialty_id, group_id };
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
  const s = await Specialty.findAll(); res.json(s);
};
const createSpecialty = async (req, res) => {
  const { name } = req.body;
  const s = await Specialty.create({ name });
  res.status(201).json(s);
};
const deleteSpecialty = async (req, res) => {
  await Specialty.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
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
  const g = await StudentGroup.findAll(); res.json(g);
};
const createGroup = async (req, res) => {
  const { name } = req.body;
  const g = await StudentGroup.create({ name });
  res.status(201).json(g);
};
const deleteGroup = async (req, res) => {
  await StudentGroup.destroy({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
};
const updateGroup = async (req, res) => {
  try {
    const g = await StudentGroup.findByPk(req.params.id);
    if (!g) return res.status(404).json({ error: 'Topilmadi' });
    await g.update({ name: req.body.name });
    res.json(g);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Assign teacher to group ───────────────────────────────────
const assignTeacherGroup = async (req, res) => {
  try {
    const { teacher_id, group_id } = req.body;
    const existing = await TeacherGroup.findOne({ where: { teacher_id, group_id } });
    if (existing) return res.status(400).json({ error: 'Allaqachon biriktirilgan' });
    const tg = await TeacherGroup.create({ teacher_id, group_id });
    res.status(201).json(tg);
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
  getGroups, createGroup, updateGroup, deleteGroup, assignTeacherGroup,
  getModules, createModule, updateModule, deleteModule,
  getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary,
  getPhrasebook, createPhrase, updatePhrase, deletePhrase,
  getTests, createTest, updateTest, deleteTest,
};
