const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { User, Specialty, StudentGroup } = require('../models');
const { resolveEnrollment } = require('../services/enrollment.service');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { full_name, email, password, role = 'student', specialty_id, group_id } = req.body;

    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Ism, email va parol majburiy' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Bu email allaqachon ro\'yxatda bor' });

    const password_hash = await bcrypt.hash(password, 10);
    // ro'yxatdan o'tishda faqat talaba roli; yo'nalish/guruh ixtiyoriy, lekin bir-biriga mos bo'lishi shart
    const enroll = await resolveEnrollment({ specialty_id, group_id }, { specialty_id: null, group_id: null }, { actor: 'student' });
    if (!enroll.ok) return res.status(400).json({ error: enroll.error });
    const user = await User.create({ full_name, email, password_hash, role: 'student', ...enroll.updates });

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, full_name, email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email va parol majburiy' });

    const user = await User.findOne({
      where: { email },
      include: [
        { model: Specialty,    as: 'specialty', attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en', 'code', 'icon', 'student_role'] },
        { model: StudentGroup, as: 'group',     attributes: ['id', 'name'] },
      ],
    });
    if (!user) return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id, full_name: user.full_name, email: user.email,
        role: user.role, current_level: user.current_level,
        specialty: user.specialty, group: user.group,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Specialty,    as: 'specialty', attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en', 'code', 'icon', 'student_role'] },
        { model: StudentGroup, as: 'group',     attributes: ['id', 'name'] },
      ],
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, email, specialty_id, group_id } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Bu email allaqachon boshqa foydalanuvchida bor' });
      user.email = email;
    }

    if (full_name) user.full_name = String(full_name).trim();

    // Yo'nalish/guruh — faqat talabalar uchun; mosligini enrollment servisi tekshiradi
    let specialtyChanged = false;
    if (user.role === 'student' && (specialty_id !== undefined || group_id !== undefined)) {
      const enroll = await resolveEnrollment({ specialty_id, group_id }, { specialty_id: user.specialty_id, group_id: user.group_id }, { actor: 'student' });
      if (!enroll.ok) return res.status(400).json({ error: enroll.error });
      user.specialty_id = enroll.updates.specialty_id;
      user.group_id = enroll.updates.group_id;
      specialtyChanged = enroll.specialtyChanged;
    }

    await user.save();

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Specialty,    as: 'specialty', attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en', 'code', 'icon', 'student_role'] },
        { model: StudentGroup, as: 'group',     attributes: ['id', 'name'] },
      ],
    });

    res.json({ message: 'Profil muvaffaqiyatli yangilandi', user: updatedUser, specialty_changed: specialtyChanged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Joriy va yangi parolni kiriting' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Joriy parol noto\'g\'ri' });

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/specialties
const getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.findAll();
    res.json(specialties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/groups
const getGroups = async (req, res) => {
  try {
    const groups = await StudentGroup.findAll();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, getSpecialties, getGroups };
