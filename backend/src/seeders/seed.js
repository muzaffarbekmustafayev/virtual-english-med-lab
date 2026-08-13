require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const {
  Specialty, StudentGroup, User, TeacherGroup,
  Module, Vocabulary, Phrasebook, Test,
} = require('../models');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // Barcha jadvallarni tozalab qayta yaratadi
  console.log('✅ Jadvallar qayta yaratildi');

  // ── 1. Mutaxassisliklar ──────────────────────────────────
  const [dentistry] = await Specialty.bulkCreate([
    { name: 'Stomatologiya' },
    { name: 'Pediatriya' },
    { name: 'Davolash ishi' },
  ], { returning: true });
  console.log('✅ Mutaxassisliklar yaratildi');

  // ── 2. Akademik guruhlar ─────────────────────────────────
  const [group401] = await StudentGroup.bulkCreate([
    { name: '401-Stomatologiya' },
    { name: '402-Stomatologiya' },
  ], { returning: true });
  console.log('✅ Guruhlar yaratildi');

  // ── 3. Foydalanuvchilar ──────────────────────────────────
  const adminHash   = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  const admin = await User.create({
    full_name: 'Super Admin', email: 'admin@vpe.uz',
    password_hash: adminHash, role: 'admin',
  });
  const teacher = await User.create({
    full_name: 'Dilnoza Yusupova', email: 'teacher@vpe.uz',
    password_hash: teacherHash, role: 'teacher',
  });
  const student = await User.create({
    full_name: 'Jasur Toshmatov', email: 'student@vpe.uz',
    password_hash: studentHash, role: 'student',
    specialty_id: dentistry.id, group_id: group401.id,
  });

  await TeacherGroup.create({ teacher_id: teacher.id, group_id: group401.id });
  console.log('✅ Foydalanuvchilar yaratildi');
  console.log('   Admin:   admin@vpe.uz    / admin123');
  console.log('   Teacher: teacher@vpe.uz  / teacher123');
  console.log('   Student: student@vpe.uz  / student123');

  // ── 4. O'quv modullari (10 ta) ───────────────────────────
  const modulesData = [
    {
      specialty_id: dentistry.id,
      title: 'Dental Pain & Sensitivity',
      description: 'Tish og\'rig\'i va sezuvchanlik — birinchi klinik konsultatsiya',
      order_index: 1,
      patient_context: `You are James Wilson, a 35-year-old office manager. 
You have been experiencing sharp tooth pain for the past 3 days, especially when drinking cold water or eating ice cream. 
The pain is in your lower left molar area. It lasts about 30-60 seconds after the cold stimulus is removed. 
You are a bit anxious about dental procedures. You have not visited a dentist in 2 years. 
Speak naturally as a worried patient. Express your pain and concerns honestly.`,
      final_challenge_context: `You are Sarah Miller, a 28-year-old teacher.
You have had tooth sensitivity for 2 weeks, triggered by both hot and cold foods. 
The sensitivity is on your upper right side. You also notice occasional spontaneous pain at night.
You are very busy and worried this might require a root canal. You ask many questions.
Be more complex — mention previous dental history (you had a filling on that tooth 1 year ago).`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Tooth Extraction',
      description: 'Tish oldirish jarayonini tushuntirish va bemor xavotirlarini boshqarish',
      order_index: 2,
      patient_context: `You are Robert Brown, a 45-year-old construction worker.
Your dentist has told you that your lower right wisdom tooth must be extracted. 
You are very scared of tooth extractions and needles. You want to know: Will it hurt? How long does it take? What should you do after?
You are reluctant and keep asking if there is any other option.`,
      final_challenge_context: `You are Elena Garcia, a 52-year-old woman.
You need to have 3 teeth extracted due to severe gum disease. 
You take blood thinners (warfarin) for a heart condition and are worried about bleeding.
You also ask about dentures and implants as replacement options. Be detailed with your health history.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Toothache',
      description: 'Kuchli tish og\'rig\'ini baholash va dastlabki tashxis',
      order_index: 3,
      patient_context: `You are David Kim, a 31-year-old student.
You have severe toothache that started yesterday evening. The pain is constant, throbbing, and rates 8/10 in severity.
It is on your upper left side. The pain worsens when you lie down and improves slightly when you sit up.
You took ibuprofen but it only helped a little. You cannot sleep and are quite desperate.`,
      final_challenge_context: `You are Maria Santos, a 40-year-old nurse.
You have had toothache for 5 days. The pain started mild but is now severe. You notice your face is slightly swollen on the left side.
You also have a low-grade fever (37.8°C). You are worried it might be an abscess. You want to know if you need antibiotics.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Abscess',
      description: 'Tish abstsessini aniqlash — infeksiya belgilari va davolash',
      order_index: 4,
      patient_context: `You are Tom Johnson, a 38-year-old chef.
You have severe pain on the right side of your face for 4 days. Your cheek is swollen and the area is very tender to touch.
You have a fever (38.5°C) and feel generally unwell. You had a broken tooth in that area for months but ignored it.
You are worried and want to know if it is serious.`,
      final_challenge_context: `You are Anna Petrov, a 55-year-old retired teacher.
You have a large swelling under your chin and jaw area, making it difficult to open your mouth fully.
You have had pus drainage from one tooth. You have diabetes (type 2) which makes healing slower.
You are very concerned and want to understand all treatment options including hospitalization if needed.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Caries',
      description: 'Karies tashxisi, davolash variantlari va profilaktika',
      order_index: 5,
      patient_context: `You are Lucy Chen, a 24-year-old graphic designer.
You have noticed a dark spot on your back tooth and slight sensitivity to sweets.
The X-ray shows a cavity in your upper molar. This is your first cavity and you are a bit shocked.
You want to understand what caused it, how the filling procedure works, and how to prevent future cavities.`,
      final_challenge_context: `You are Michael Torres, a 16-year-old student (his mother is with him).
He has multiple cavities — 4 teeth affected. He drinks a lot of soda and rarely flosses.
The mother is upset and asks about fluoride treatments and sealants. The teen is embarrassed and defensive.
Balance communicating with both the teenager and the concerned parent.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Gum Problems',
      description: 'Milk kasalliklari — periodontit va gingivit simptomlari',
      order_index: 6,
      patient_context: `You are Patricia Moore, a 47-year-old librarian.
Your gums bleed every time you brush your teeth. This has been happening for about 2 months.
Your gums look red and puffy. You also notice your breath smells bad despite brushing twice a day.
You are worried it might be serious and want to know if it can be cured.`,
      final_challenge_context: `You are George Williams, a 60-year-old retired police officer.
You have been a smoker for 30 years. Your gums are receding significantly and you can see more of your teeth roots.
You have lost 2 teeth already. You want to know about deep cleaning (scaling and root planing) and if implants are possible.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Impacted Wisdom Tooth',
      description: 'Aqlli tish muammolari — operatsiya va davolash',
      order_index: 7,
      patient_context: `You are Emma Davis, a 21-year-old university student.
You have had pain and swelling at the back of your mouth on the right side for a week.
The X-ray shows your wisdom tooth is impacted (growing sideways). You have exams next week and are stressed.
You want to know if the tooth must be removed immediately or can it wait.`,
      final_challenge_context: `You are Christopher Lee, a 25-year-old who had wisdom tooth surgery 3 days ago.
You are concerned because you still have significant pain, swelling, and you notice an unpleasant taste.
You think you might have "dry socket." You want to know what happened and what the dentist can do now.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Emergency',
      description: 'Tish travmasi va shoshilinch yordam ko\'rsatish',
      order_index: 8,
      patient_context: `You are Kevin White, a 19-year-old athlete.
You knocked out your front tooth during a basketball game 30 minutes ago. You brought the tooth in a glass of milk.
You are panicking and in pain. Your lip is cut and bleeding a bit too.
You want to know if the tooth can be saved.`,
      final_challenge_context: `You are Rachel Green, a 35-year-old mother.
Her 8-year-old child fell from a bicycle. The child has a chipped front tooth (primary tooth) and the lip is swollen.
The child is crying and scared. You need to manage both the anxious child and the worried mother simultaneously.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Restoration & Prosthetics',
      description: 'Tish protezlash — implant, qopqoq va ko\'prik variantlari',
      order_index: 9,
      patient_context: `You are Barbara Taylor, a 58-year-old executive.
You are missing 2 teeth on your lower right side (lost them 2 years ago). You have been wearing a removable partial denture but hate it.
You want to know about dental implants — the cost (in general terms), the procedure, how long it takes, and success rates.
You have well-controlled diabetes.`,
      final_challenge_context: `You are Frank Robinson, a 65-year-old who needs a full upper denture.
He has only 3 remaining upper teeth that need extraction. He has never had dentures before and is very worried.
He asks about implant-supported dentures vs. conventional dentures. He has osteoporosis and takes bisphosphonates.
Discuss the implications for treatment planning.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Full Dental Consultation',
      description: 'To\'liq klinik konsultatsiya — murakkab bemor ssenariyi',
      order_index: 10,
      patient_context: `You are Margaret Thompson, a 50-year-old with multiple dental problems:
1. Sharp pain in upper left molar (cold sensitivity, possible pulpitis)
2. Bleeding gums (periodontal disease)
3. A cracked lower right premolar
4. Missing upper right molar (wants replacement options)
You also have hypertension (on amlodipine) and are allergic to penicillin.
Present your problems one by one as the doctor asks. Be a detailed, realistic patient.`,
      final_challenge_context: `You are Jonathan Harris, a 42-year-old with severe dental anxiety (dental phobia).
He has not visited a dentist in 10 years due to fear. He has multiple untreated problems including pain, broken teeth, and bad breath.
He is also HIV-positive (well-controlled, on antiretroviral therapy). He is worried about being judged.
The doctor must address his anxiety, take a complete medical history, and propose a comprehensive treatment plan. 
This is the most challenging consultation in the course.`,
    },
  ];

  const modules = await Module.bulkCreate(modulesData, { returning: true });
  console.log('✅ 10 ta modul yaratildi');

  // ── 5. Birinchi modul uchun Vocabulary ───────────────────
  const module1 = modules[0];
  await Vocabulary.bulkCreate([
    { module_id: module1.id, word: 'sensitivity', translation: 'sezuvchanlik', definition: 'Uncomfortable reaction to stimuli such as cold, heat, or sweets', example: 'I have tooth sensitivity to cold drinks.' },
    { module_id: module1.id, word: 'trigger',     translation: 'qo\'zg\'atuvchi', definition: 'Something that causes or starts a reaction or pain', example: 'Cold water is the trigger for my tooth pain.' },
    { module_id: module1.id, word: 'sharp pain',  translation: 'keskin og\'riq', definition: 'Sudden intense pain that feels like a stabbing sensation', example: 'I feel a sharp pain when I drink cold water.' },
    { module_id: module1.id, word: 'molar',       translation: 'oziq tish', definition: 'The large flat teeth at the back of the mouth used for grinding food', example: 'The pain is in my lower left molar.' },
    { module_id: module1.id, word: 'onset',       translation: 'boshlanish vaqti', definition: 'The beginning or start of something (usually a symptom)', example: 'When was the onset of your pain?' },
    { module_id: module1.id, word: 'duration',    translation: 'davomiyligi', definition: 'The length of time something lasts', example: 'What is the duration of the pain?' },
    { module_id: module1.id, word: 'radiating',   translation: 'tarqaluvchi', definition: 'Pain that spreads from one area to another', example: 'Is the pain radiating to your ear or jaw?' },
    { module_id: module1.id, word: 'dentin',      translation: 'dentin', definition: 'The layer of tooth beneath the enamel, sensitive when exposed', example: 'Exposed dentin causes tooth sensitivity.' },
    { module_id: module1.id, word: 'enamel',      translation: 'emal', definition: 'The hard outer layer that protects the tooth', example: 'Acid erosion can damage tooth enamel.' },
    { module_id: module1.id, word: 'throbbing',   translation: 'pulslanuvchi', definition: 'A type of pain that pulses or beats rhythmically', example: 'I have a throbbing pain in my tooth.' },
  ]);
  console.log('✅ Modul 1 uchun vocabulary yaratildi');

  // ── 6. Birinchi modul uchun Phrasebook ───────────────────
  await Phrasebook.bulkCreate([
    { module_id: module1.id, category: 'Opening the consultation', phrase: 'Hello, I\'m Dr. [Name]. What brings you in today?', hint_uz: 'Konsultatsiyani boshlash — bemor kelish sababini so\'rash', step_order: 1 },
    { module_id: module1.id, category: 'Opening the consultation', phrase: 'Please describe your pain or problem in your own words.', hint_uz: 'Bemorga o\'z so\'zlari bilan tushuntirishga imkon berish', step_order: 2 },
    { module_id: module1.id, category: 'Asking about pain', phrase: 'Where exactly is the pain? Can you point to it?', hint_uz: 'Og\'riq joylashuvini aniqlash', step_order: 3 },
    { module_id: module1.id, category: 'Asking about pain', phrase: 'On a scale of 1 to 10, how severe is the pain?', hint_uz: 'Og\'riq kuchini 1-10 shkala orqali aniqlash', step_order: 4 },
    { module_id: module1.id, category: 'Asking about onset', phrase: 'When did the pain first start?', hint_uz: 'Og\'riq qachon boshlangani', step_order: 5 },
    { module_id: module1.id, category: 'Asking about onset', phrase: 'Is the pain constant or does it come and go?', hint_uz: 'Og\'riq doimiymi yoki vaqti-vaqti bilan keladimi', step_order: 6 },
    { module_id: module1.id, category: 'Asking about triggers', phrase: 'Is the pain triggered by anything, such as cold, hot, sweet, or biting?', hint_uz: 'Og\'riq qo\'zg\'atuvchilarini aniqlash', step_order: 7 },
    { module_id: module1.id, category: 'Asking about triggers', phrase: 'Does the pain go away after the trigger is removed, or does it linger?', hint_uz: 'Og\'riq sabab yo\'qolgandan keyin ketadimi?', step_order: 8 },
    { module_id: module1.id, category: 'Medical history', phrase: 'Have you had any previous dental work on this tooth?', hint_uz: 'Bu tishda ilgari qandaydir muolaja bo\'lganmi?', step_order: 9 },
    { module_id: module1.id, category: 'Medical history', phrase: 'Are you taking any medications at the moment?', hint_uz: 'Hozirda qandaydir dorilar ichyapsizmi?', step_order: 10 },
    { module_id: module1.id, category: 'Closing', phrase: 'Based on your symptoms, it seems like you may have tooth sensitivity. I\'d like to take an X-ray to get a better look.', hint_uz: 'Dastlabki tashxis va keyingi qadam', step_order: 11 },
  ]);
  console.log('✅ Modul 1 uchun phrasebook yaratildi');

  // ── 7. Birinchi modul uchun Test savollari ───────────────
  await Test.bulkCreate([
    { module_id: module1.id, question: 'What does "hypersensitivity" mean in dentistry?', option_a: 'A tooth that is too large', option_b: 'Discomfort or pain in response to stimuli like cold or heat', option_c: 'A tooth that needs extraction', option_d: 'Bleeding gums', correct_option: 'B' },
    { module_id: module1.id, question: 'Which question is BEST to assess the duration of tooth pain?', option_a: 'Where is your pain?', option_b: 'How long does the pain last after the trigger?', option_c: 'Do you smoke?', option_d: 'What is your blood pressure?', correct_option: 'B' },
    { module_id: module1.id, question: 'The patient says the pain is "8 out of 10." What does this indicate?', option_a: 'Mild discomfort', option_b: 'No significant pain', option_c: 'Severe pain', option_d: 'The patient is exaggerating', correct_option: 'C' },
    { module_id: module1.id, question: 'What is "dentin"?', option_a: 'The outer protective layer of the tooth', option_b: 'The pulp inside the tooth', option_c: 'The layer beneath the enamel that is sensitive when exposed', option_d: 'The root of the tooth', correct_option: 'C' },
    { module_id: module1.id, question: 'Which clinical question helps identify the LOCATION of pain?', option_a: 'When did the pain start?', option_b: 'Can you point to where it hurts?', option_c: 'Are you allergic to any medications?', option_d: 'How often do you brush your teeth?', correct_option: 'B' },
  ]);
  console.log('✅ Modul 1 uchun test savollari yaratildi');

  console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
  console.log('='.repeat(50));
  console.log('Login ma\'lumotlari:');
  console.log('  Admin:   admin@vpe.uz   / admin123');
  console.log('  Teacher: teacher@vpe.uz / teacher123');
  console.log('  Student: student@vpe.uz / student123');
  console.log('='.repeat(50));

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed xato:', err);
  process.exit(1);
});
