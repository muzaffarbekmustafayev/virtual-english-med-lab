const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const { ModuleResult, Conversation, TestResult, User, Module, StudentGroup, Specialty } = require('./src/models');

async function populateRichData() {
  await sequelize.authenticate();

  const dentistry = await Specialty.findOne({ where: { name: 'Stomatologiya' } });
  const group = await StudentGroup.findOne({ where: { name: '401-Stomatologiya' } });
  const modules = await Module.findAll({ order: [['order_index', 'ASC']] });

  const studentPass = await bcrypt.hash('student123', 10);

  const studentsList = [
    { name: 'Jasur Toshmatov', email: 'student@vpe.uz' },
    { name: 'Madina Karimova', email: 'madina@vpe.uz' },
    { name: 'Bekzod Aliyev', email: 'bekzod@vpe.uz' },
    { name: 'Nilufar Rustamova', email: 'nilufar@vpe.uz' },
    { name: 'Sardor Rahimiy', email: 'sardor@vpe.uz' }
  ];

  for (let s of studentsList) {
    let [u] = await User.findOrCreate({
      where: { email: s.email },
      defaults: {
        full_name: s.name,
        password_hash: studentPass,
        role: 'student',
        specialty_id: dentistry.id,
        group_id: group.id,
      }
    });

    // Seed 4-6 modules for each
    const scoreProfiles = [
      { chat: 92, quiz: 95, comb: 93, g: 90, v: 95, f: 92, p: 90, c: 95, attempts: 2 },
      { chat: 88, quiz: 90, comb: 89, g: 85, v: 90, f: 88, p: 85, c: 92, attempts: 1 },
      { chat: 95, quiz: 100, comb: 97, g: 95, v: 95, f: 94, p: 92, c: 98, attempts: 2 },
      { chat: 85, quiz: 80, comb: 83, g: 82, v: 85, f: 84, p: 80, c: 88, attempts: 1 },
      { chat: 90, quiz: 90, comb: 90, g: 88, v: 92, f: 90, p: 88, c: 94, attempts: 3 },
      { chat: 82, quiz: 85, comb: 83, g: 80, v: 84, f: 82, p: 80, c: 85, attempts: 1 },
    ];

    for (let i = 0; i < scoreProfiles.length; i++) {
      const sp = scoreProfiles[i];
      const m = modules[i];
      if (!m) continue;

      // add slight variation
      const jitter = (Math.random() * 6 - 3) | 0;
      const chat = Math.min(100, Math.max(70, sp.chat + jitter));
      const quiz = Math.min(100, Math.max(70, sp.quiz + jitter));
      const comb = Math.round((chat + quiz) / 2);

      await ModuleResult.upsert({
        student_id: u.id,
        module_id: m.id,
        best_chat_score: chat,
        best_quiz_score: quiz,
        combined_score: comb,
        best_grammar: Math.min(100, sp.g + jitter),
        best_vocab: Math.min(100, sp.v + jitter),
        best_fluency: Math.min(100, sp.f + jitter),
        best_pronunciation: Math.min(100, sp.p + jitter),
        best_clinical: Math.min(100, sp.c + jitter),
        attempts_count: sp.attempts,
        is_completed: true,
        last_attempt_at: new Date(),
      });

      await Conversation.create({
        student_id: u.id,
        module_id: m.id,
        attempt_type: 'final_challenge',
        status: 'completed',
        grammar_score: Math.min(100, sp.g + jitter),
        vocabulary_score: Math.min(100, sp.v + jitter),
        fluency_score: Math.min(100, sp.f + jitter),
        pronunciation_score: Math.min(100, sp.p + jitter),
        clinical_score: Math.min(100, sp.c + jitter),
        overall_score: chat,
        general_feedback: 'Strong clinical communication and comprehensive anamnesis.',
      });

      await TestResult.create({
        student_id: u.id,
        module_id: m.id,
        score: quiz,
        total_questions: 10,
        correct_answers: Math.round((quiz / 100) * 10),
      });
    }
  }

  console.log('✅ Rich results data seeded successfully!');
  process.exit(0);
}

populateRichData().catch(console.error);
