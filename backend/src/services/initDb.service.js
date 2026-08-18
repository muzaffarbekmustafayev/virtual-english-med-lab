const bcrypt = require('bcryptjs');
const { User, Specialty, StudentGroup } = require('../models');

/**
 * Ensures system baseline accounts and essential data exist on every boot (Production / Host ready).
 * Guarantees admin@gmail.com / admin123 always exists and has admin privileges.
 */
async function ensureDefaultSeedData() {
  try {
    // 1. Ensure Super Admin (admin@gmail.com / admin123)
    const adminEmail = 'admin@gmail.com';
    const adminPass = 'admin123';
    const adminHash = await bcrypt.hash(adminPass, 10);

    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await User.create({
        full_name: 'Super Admin',
        email: adminEmail,
        password_hash: adminHash,
        role: 'admin',
      });
      console.log('👑 [HOST READY] Yangi admin yaratildi: admin@gmail.com / admin123');
    } else {
      // Ensure password and role are always accurate
      if (admin.role !== 'admin') {
        await admin.update({ role: 'admin', password_hash: adminHash });
        console.log('👑 [HOST READY] admin@gmail.com roli admin qilib yangilandi.');
      }
    }

    // 2. Ensure baseline Specialty (Stomatologiya)
    let specialty = await Specialty.findOne();
    if (!specialty) {
      specialty = await Specialty.create({
        name: 'Stomatologiya',
        code: 'STOM',
        description: 'Tish kasalliklari, profilaktikasi va davolash',
        icon: '🦷',
      });
      console.log('🏥 [HOST READY] Boshlang\'ich mutaxassislik yaratildi: Stomatologiya');
    }

    // 3. Ensure baseline Student Group
    let group = await StudentGroup.findOne();
    if (!group && specialty) {
      group = await StudentGroup.create({
        name: '101-Stomatologiya',
        specialty_id: specialty.id,
        academic_year: '2025-2026',
      });
      console.log('👥 [HOST READY] Boshlang\'ich guruh yaratildi: 101-Stomatologiya');
    }

    // 4. Ensure Teacher Account (teacher@vpe.uz / teacher123)
    const teacherEmail = 'teacher@vpe.uz';
    let teacher = await User.findOne({ where: { email: teacherEmail } });
    if (!teacher) {
      const teacherHash = await bcrypt.hash('teacher123', 10);
      await User.create({
        full_name: 'Dr. John Watson',
        email: teacherEmail,
        password_hash: teacherHash,
        role: 'teacher',
        specialty_id: specialty?.id || null,
      });
      console.log('👨‍🏫 [HOST READY] O\'qituvchi akkaunti yaratildi: teacher@vpe.uz / teacher123');
    }

    // 5. Ensure Student Account (student@vpe.uz / student123)
    const studentEmail = 'student@vpe.uz';
    let student = await User.findOne({ where: { email: studentEmail } });
    if (!student) {
      const studentHash = await bcrypt.hash('student123', 10);
      await User.create({
        full_name: 'Ali Valiyev',
        email: studentEmail,
        password_hash: studentHash,
        role: 'student',
        specialty_id: specialty?.id || null,
        group_id: group?.id || null,
        current_level: 1,
      });
      console.log('👨‍🎓 [HOST READY] Talaba akkaunti yaratildi: student@vpe.uz / student123');
    }

  } catch (err) {
    console.error('⚠️ [HOST INIT] ensureDefaultSeedData xatolik:', err.message);
  }
}

module.exports = { ensureDefaultSeedData };
