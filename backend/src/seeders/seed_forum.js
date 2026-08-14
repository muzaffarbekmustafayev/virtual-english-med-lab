const { sequelize } = require('../config/database');
const { User, ForumMessage } = require('../models');

async function syncAndSeedForum() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced with alter: true');

    const teacher = await User.findOne({ where: { role: 'teacher' } });
    const student = await User.findOne({ where: { role: 'student' } });

    if (!teacher || !student) {
      console.log('Users not found');
      process.exit(0);
    }

    const m1 = await ForumMessage.create({
      sender_id: teacher.id,
      message_text: "Welcome to Virtual Patient English Forum! 🩺 Feel free to ask questions about clinical terminology, phrasebook usage, and patient communication.",
      channel: "general",
      is_pinned: true,
    });

    const m2 = await ForumMessage.create({
      sender_id: student.id,
      message_text: "Hello teacher! When conducting the dental pain consultation, how should I politely ask the patient about pain triggers?",
      channel: "general",
      reply_to_id: m1.id,
    });

    await ForumMessage.create({
      sender_id: teacher.id,
      message_text: "Great question! You can say: 'Does the pain get triggered or worsened when you drink cold ice water or hot tea?' 💡",
      channel: "general",
      reply_to_id: m2.id,
    });

    console.log('Forum sample messages created successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncAndSeedForum();
