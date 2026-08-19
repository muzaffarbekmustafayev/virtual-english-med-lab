require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const {
  Specialty, StudentGroup, User, TeacherGroup,
  Module, Grammar, Vocabulary, Phrasebook, Test,
} = require('../models');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log('✅ Jadvallar qayta yaratildi');

  // ── 1. Mutaxassisliklar ──────────────────────────────────
  const [dentistry, therapy] = await Specialty.bulkCreate([
    { id: 1, name: 'Stomatologiya' },
    { id: 2, name: 'Davolash ishi' },
  ], { returning: true });
  console.log('✅ Mutaxassisliklar yaratildi');

  // ── 2. Akademik guruhlar ─────────────────────────────────
  const [group401, group402] = await StudentGroup.bulkCreate([
    { name: '401-Stomatologiya', specialty_id: dentistry.id },
    { name: '402-Stomatologiya', specialty_id: dentistry.id },
  ], { returning: true });
  console.log('✅ Guruhlar yaratildi');

  // ── 3. Foydalanuvchilar ──────────────────────────────────
  const adminHash   = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  const admin = await User.create({
    full_name: 'Super Admin', email: 'admin@gmail.com',
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

  // ── 4. 10 ta Stomatologik O'quv Moduli ────────────────────
  const modulesData = [
    {
      specialty_id: dentistry.id,
      title: 'Dental Pain & Sensitivity',
      description: 'Tish og\'rig\'i va sezuvchanlik — birinchi klinik konsultatsiya',
      order_index: 1,
      patient_context: `You are James Wilson, a 35-year-old office manager. You have been experiencing sharp tooth pain for the past 3 days, especially when drinking cold water or eating ice cream. The pain is in your lower left molar area. It lasts about 30-60 seconds after the cold stimulus is removed. You are a bit anxious about dental procedures. You have not visited a dentist in 2 years. Speak naturally as a worried patient. Express your pain and concerns honestly.`,
      final_challenge_context: `You are Sarah Miller, a 28-year-old teacher. You have had tooth sensitivity for 2 weeks, triggered by both hot and cold foods. The sensitivity is on your upper right side. You also notice occasional spontaneous pain at night. You are very busy and worried this might require a root canal. You ask many questions. Be more complex — mention previous dental history (you had a filling on that tooth 1 year ago).`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Tooth Extraction & Surgery',
      description: 'Tish oldirish jarayonini tushuntirish va bemor xavotirlarini boshqarish',
      order_index: 2,
      patient_context: `You are Robert Brown, a 45-year-old construction worker. Your dentist has told you that your lower right wisdom tooth must be extracted. You are very scared of tooth extractions and needles. You want to know: Will it hurt? How long does it take? What should you do after? You are reluctant and keep asking if there is any other option.`,
      final_challenge_context: `You are Elena Garcia, a 52-year-old woman. You need to have 3 teeth extracted due to severe gum disease. You take blood thinners (warfarin) for a heart condition and are worried about bleeding. You also ask about dentures and implants as replacement options. Be detailed with your health history.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Toothache & Pulpitis',
      description: 'Kuchli tish og\'rig\'ini baholash va dastlabki tashxis',
      order_index: 3,
      patient_context: `You are David Kim, a 31-year-old student. You have severe toothache that started yesterday evening. The pain is constant, throbbing, and rates 8/10 in severity. It is on your upper left side. The pain worsens when you lie down and improves slightly when you sit up. You took ibuprofen but it only helped a little. You cannot sleep and are quite desperate.`,
      final_challenge_context: `You are Maria Santos, a 40-year-old nurse. You have had toothache for 5 days. The pain started mild but is now severe. You notice your face is slightly swollen on the left side. You also have a low-grade fever (37.8°C). You are worried it might be an abscess. You want to know if you need antibiotics.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Abscess & Infection',
      description: 'Tish abstsessini aniqlash — infeksiya belgilari va davolash',
      order_index: 4,
      patient_context: `You are Tom Johnson, a 38-year-old chef. You have severe pain on the right side of your face for 4 days. Your cheek is swollen and the area is very tender to touch. You have a fever (38.5°C) and feel generally unwell. You had a broken tooth in that area for months but ignored it. You are worried and want to know if it is serious.`,
      final_challenge_context: `You are Anna Petrov, a 55-year-old retired teacher. You have a large swelling under your chin and jaw area, making it difficult to open your mouth fully. You have had pus drainage from one tooth. You have diabetes (type 2) which makes healing slower. You are very concerned and want to understand all treatment options including hospitalization if needed.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Caries & Restorative Care',
      description: 'Karies tashxisi, davolash variantlari va profilaktika',
      order_index: 5,
      patient_context: `You are Lucy Chen, a 24-year-old graphic designer. You have noticed a dark spot on your back tooth and slight sensitivity to sweets. The X-ray shows a cavity in your upper molar. This is your first cavity and you are a bit shocked. You want to understand what caused it, how the filling procedure works, and how to prevent future cavities.`,
      final_challenge_context: `You are Michael Torres, a 16-year-old student (his mother is with him). He has multiple cavities — 4 teeth affected. He drinks a lot of soda and rarely flosses. The mother is upset and asks about fluoride treatments and sealants. The teen is embarrassed and defensive. Balance communicating with both the teenager and the concerned parent.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Gum Problems & Periodontitis',
      description: 'Milk kasalliklari — periodontit va gingivit simptomlari',
      order_index: 6,
      patient_context: `You are Patricia Moore, a 47-year-old librarian. Your gums bleed every time you brush your teeth. This has been happening for about 2 months. Your gums look red and puffy. You also notice your breath smells bad despite brushing twice a day. You are worried it might be serious and want to know if it can be cured.`,
      final_challenge_context: `You are George Williams, a 60-year-old retired police officer. You have been a smoker for 30 years. Your gums are receding significantly and you can see more of your teeth roots. You have lost 2 teeth already. You want to know about deep cleaning (scaling and root planing) and if implants are possible.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Impacted Wisdom Tooth',
      description: 'Aqlli tish muammolari — operatsiya va davolash',
      order_index: 7,
      patient_context: `You are Emma Davis, a 21-year-old university student. You have had pain and swelling at the back of your mouth on the right side for a week. The X-ray shows your wisdom tooth is impacted (growing sideways). You have exams next week and are stressed. You want to know if the tooth must be removed immediately or can it wait.`,
      final_challenge_context: `You are Christopher Lee, a 25-year-old who had wisdom tooth surgery 3 days ago. You are concerned because you still have significant pain, swelling, and you notice an unpleasant taste. You think you might have "dry socket." You want to know what happened and what the dentist can do now.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Emergency & Trauma',
      description: 'Tish travmasi va shoshilinch yordam ko\'rsatish',
      order_index: 8,
      patient_context: `You are Kevin White, a 19-year-old athlete. You knocked out your front tooth during a basketball game 30 minutes ago. You brought the tooth in a glass of milk. You are panicking and in pain. Your lip is cut and bleeding a bit too. You want to know if the tooth can be saved.`,
      final_challenge_context: `You are Rachel Green, a 35-year-old mother. Her 8-year-old child fell from a bicycle. The child has a chipped front tooth (primary tooth) and the lip is swollen. The child is crying and scared. You need to manage both the anxious child and the worried mother simultaneously.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Dental Restoration & Prosthetics',
      description: 'Tish protezlash — implant, qopqoq va ko\'prik variantlari',
      order_index: 9,
      patient_context: `You are Barbara Taylor, a 58-year-old executive. You are missing 2 teeth on your lower right side (lost them 2 years ago). You have been wearing a removable partial denture but hate it. You want to know about dental implants — the cost (in general terms), the procedure, how long it takes, and success rates. You have well-controlled diabetes.`,
      final_challenge_context: `You are Frank Robinson, a 65-year-old who needs a full upper denture. He has only 3 remaining upper teeth that need extraction. He has never had dentures before and is very worried. He asks about implant-supported dentures vs. conventional dentures. He has osteoporosis and takes bisphosphonates. Discuss the implications for treatment planning.`,
    },
    {
      specialty_id: dentistry.id,
      title: 'Full Dental Consultation',
      description: 'To\'liq klinik konsultatsiya — murakkab bemor ssenariyi',
      order_index: 10,
      patient_context: `You are Margaret Thompson, a 50-year-old with multiple dental problems: 1. Sharp pain in upper left molar (cold sensitivity, possible pulpitis), 2. Bleeding gums (periodontal disease), 3. A cracked lower right premolar, 4. Missing upper right molar (wants replacement options). You also have hypertension (on amlodipine) and are allergic to penicillin. Present your problems one by one as the doctor asks. Be a detailed, realistic patient.`,
      final_challenge_context: `You are Jonathan Harris, a 42-year-old with severe dental anxiety (dental phobia). He has not visited a dentist in 10 years due to fear. He has multiple untreated problems including pain, broken teeth, and bad breath. He is also HIV-positive (well-controlled, on antiretroviral therapy). He is worried about being judged. The doctor must address his anxiety, take a complete medical history, and propose a comprehensive treatment plan. This is the most challenging consultation in the course.`,
    },
  ];

  const modules = await Module.bulkCreate(modulesData, { returning: true });
  console.log('✅ 10 ta modul yaratildi');

  // ── 5. HAR BIR MODUL UCHUN 3 TILLI VOCABULARY VA PHRASEBOOK ──
  const moduleVocabs = {
    1: [
      { word: 'sensitivity', translation: 'sezuvchanlik', translation_uz: 'sezuvchanlik', translation_ru: 'чувствительность', translation_en: 'sensitivity to hot/cold stimuli', definition_uz: 'Sovuq, issiq yoki shirinlikka tishning noxush reaksiyasi', definition_ru: 'Неприятная реакция зуба на холодные, горячие или сладкие раздражители', definition_en: 'Uncomfortable dental reaction to thermal or osmotic stimuli', example: 'I have tooth sensitivity to cold drinks.' },
      { word: 'trigger', translation: 'qo\'zg\'atuvchi', translation_uz: 'qo\'zg\'atuvchi omil', translation_ru: 'провоцирующий фактор', translation_en: 'trigger factor', definition_uz: 'Og\'riqni keltirib chiqaruvchi sabab yoki omil', definition_ru: 'Фактор, вызывающий или усиливающий болевые ощущения', definition_en: 'Something that causes or starts dental pain', example: 'Cold water is the main trigger for my tooth pain.' },
      { word: 'sharp pain', translation: 'o\'tkir og\'riq', translation_uz: 'o\'tkir, keskin og\'riq', translation_ru: 'острая боль', translation_en: 'sharp stabbing pain', definition_uz: 'To\'satdan keladigan, sanchuvchi xarakterdagi kuchli og\'riq', definition_ru: 'Внезапная интенсивная колющая боль', definition_en: 'Sudden intense pain that feels like a stabbing sensation', example: 'I feel a sharp pain when biting down.' },
      { word: 'molar', translation: 'oziq tish', translation_uz: 'oziq tish (molyar)', translation_ru: 'коренной зуб (моляр)', translation_en: 'molar tooth', definition_uz: 'Og\'iz bo\'shlig\'ining orqa qismidagi katta chaynovchi tish', definition_ru: 'Крупный задний зуб, предназначенный для пережевывания пищи', definition_en: 'Large flat tooth at the back of the mouth used for grinding food', example: 'The pain is located in my lower left molar.' },
      { word: 'throbbing', translation: 'pulslanuvchi', translation_uz: 'pulslanuvchi, duk-duk uruvchi og\'riq', translation_ru: 'пульсирующая боль', translation_en: 'throbbing pulsating ache', definition_uz: 'Yurak urishi kabi ritmik takrorlanuvchi og\'riq turi', definition_ru: 'Ритмично пульсирующая боль в области зуба', definition_en: 'A type of pain that pulses or beats rhythmically', example: 'I have a constant throbbing pain keeping me awake at night.' },
      { word: 'radiating', translation: 'tarqaluvchi', translation_uz: 'tarqaluvchi (irradiatsiya)', translation_ru: 'иррадиирующая боль', translation_en: 'radiating pain', definition_uz: 'Bir sohadan qo\'shni sohalarga (quloq, jag\') tarqaladigan og\'riq', definition_ru: 'Боль, распространяющаяся в ухо, висок или шею', definition_en: 'Pain that spreads from one area to another anatomical structure', example: 'Is the pain radiating to your ear or jaw?' },
      { word: 'dentin', translation: 'dentin', translation_uz: 'dentin qatlami', translation_ru: 'дентин', translation_en: 'dentin layer', definition_uz: 'Emal ostidagi asosiy tish to\'qimasi', definition_ru: 'Основная ткань зуба под эмалью, чувствительная при обнажении', definition_en: 'The layer of tooth beneath enamel, highly sensitive when exposed', example: 'Exposed dentin causes severe hypersensitivity.' },
      { word: 'enamel', translation: 'emal', translation_uz: 'tish emali', translation_ru: 'зубная эмаль', translation_en: 'tooth enamel', definition_uz: 'Tish tojini qoplab turuvchi eng qattiq himoya qatlami', definition_ru: 'Твердая внешняя защитная оболочка коронки зуба', definition_en: 'The hard protective outer layer of the anatomical crown', example: 'Acidic drinks can erode protective tooth enamel.' },
      { word: 'onset', translation: 'boshlanish vaqti', translation_uz: 'simptom boshlanishi', translation_ru: 'время начала симптомов', translation_en: 'onset of symptoms', definition_uz: 'Simptom yoki kasallik birinchi bor paydo bo\'lgan vaqt', definition_ru: 'Момент первого появления симптомов', definition_en: 'The beginning or start time of symptoms', example: 'What was the exact onset of your dental pain?' },
      { word: 'duration', translation: 'davomiyligi', translation_uz: 'og\'riq davomiyligi', translation_ru: 'длительность боли', translation_en: 'duration of pain', definition_uz: 'Og\'riq xuruji qancha vaqt davom etishi', definition_ru: 'Продолжительность болевого приступа', definition_en: 'The length of time symptoms persist', example: 'What is the duration of the pain after drinking cold liquids?' },
    ],
    2: [
      { word: 'extraction', translation: 'tish oldirish', translation_uz: 'tish oldirish (ekstraktsiya)', translation_ru: 'удаление зуба', translation_en: 'tooth extraction', definition_uz: 'Tishni katakchadan jarrohlik yo\'li bilan olish', definition_ru: 'Хирургическое удаление зуба из альвеолы', definition_en: 'Surgical removal of a tooth from its dental alveolus', example: 'The lower wisdom tooth requires surgical extraction.' },
      { word: 'local anesthesia', translation: 'mahalliy anesteziya', translation_uz: 'mahalliy og\'riqsizlantirish', translation_ru: 'местная анестезия', translation_en: 'local anesthesia', definition_uz: 'Muolaja sohasidagi nerv o\'tkazuvchanligini vaqtincha to\'xtatish', definition_ru: 'Временное обезболивание операционного поля', definition_en: 'Medication causing reversible loss of sensation in a localized area', example: 'We will administer local anesthesia so you will feel no pain.' },
      { word: 'dry socket', translation: 'alveolit', translation_uz: 'quruq katakcha (alveolit)', translation_ru: 'сухая лунка (альвеолит)', translation_en: 'dry socket (alveolar osteitis)', definition_uz: 'Tish olingan katakchada qon laxtasining yo\'qolishi natijasida yallig\'lanish', definition_ru: 'Воспаление альвеолы из-за выпадения кровяного сгустка', definition_en: 'Painful inflammation of the alveolar bone after clot dislodgement', example: 'Avoid drinking through a straw to prevent a dry socket.' },
      { word: 'sutures', translation: 'choklar', translation_uz: 'jarrohlik choklari', translation_ru: 'хирургические швы', translation_en: 'surgical stitches / sutures', definition_uz: 'Yarani biriktirish uchun qo\'yiladigan tibbiy iplar', definition_ru: 'Медицинские нити для закрытия раны после операции', definition_en: 'Sterile surgical threads used to close an incision', example: 'The sutures will dissolve on their own in about a week.' },
      { word: 'gauze', translation: 'tampon', translation_uz: 'dokali tampon', translation_ru: 'марлевый тампон', translation_en: 'sterile gauze pad', definition_uz: 'Qonni to\'xtatish uchun katakchaga qo\'yiladigan steril doka', definition_ru: 'Стерильная марля для остановки кровотечения', definition_en: 'Sterile cotton fabric applied to control post-extraction bleeding', example: 'Please bite firmly on this gauze pad for 30 minutes.' },
      { word: 'numbness', translation: 'uvishish', translation_uz: 'uvishish, sezgi yo\'qolishi', translation_ru: 'онемение', translation_en: 'numbness / loss of sensation', definition_uz: 'Anesteziya ta\'sirida sezuvchanlikning vaqtincha yo\'qolishi', definition_ru: 'Временная потеря чувствительности после анестезии', definition_en: 'Temporary lack of feeling caused by anesthetic medication', example: 'The numbness in your lip will wear off in 2 to 3 hours.' },
      { word: 'forceps', translation: 'qisqich', translation_uz: 'tish sug\'urish qisqichi', translation_ru: 'экстракционные щипцы', translation_en: 'dental extraction forceps', definition_uz: 'Tishni ushlab tortib olish uchun maxsus jarrohlik asbobi', definition_ru: 'Инструмент для захвата и извлечения зуба', definition_en: 'Dental instrument used to grasp and extract teeth', example: 'The surgeon used specialized forceps to luxate the tooth.' },
      { word: 'blood clot', translation: 'qon laxtasi', translation_uz: 'qon laxtasi (tromb)', translation_ru: 'кровяной сгусток', translation_en: 'protective blood clot', definition_uz: 'Katakchani himoya qiluvchi va bitishni ta\'minlovchi tabiiy qon to\'qimasi', definition_ru: 'Сгусток крови в лунке, необходимый для заживления', definition_en: 'Gel-like mass of blood forming in the socket essential for healing', example: 'Do not rinse vigorously to preserve the blood clot.' },
    ],
    3: [
      { word: 'pulpitis', translation: 'pulpit', translation_uz: 'pulpit (tish nervi yallig\'lanishi)', translation_ru: 'пульпит', translation_en: 'pulpitis', definition_uz: 'Tish ichidagi nerv va tomirlar tutashgan pulpa to\'qimasining yallig\'lanishi', definition_ru: 'Воспаление сосудисто-нервного пучка (пульпы) зуба', definition_en: 'Inflammation of dental pulp tissue inside the pulp chamber', example: 'The severe spontaneous throbbing pain indicates irreversible pulpitis.' },
      { word: 'root canal', translation: 'ildiz kanali', translation_uz: 'ildiz kanali muolajasi', translation_ru: 'лечение корневых каналов', translation_en: 'root canal treatment (endodontics)', definition_uz: 'Zararlangan pulpani olib tashlab, ildiz kanalini tozalash va plombalash', definition_ru: 'Эндодонтическое очищение и пломбирование каналов зуба', definition_en: 'Endodontic procedure to clean and seal infected root canals', example: 'A root canal procedure is needed to save the infected molar.' },
      { word: 'necrosis', translation: 'nekroz', translation_uz: 'pulpa nekrozi (o\'lishi)', translation_ru: 'некроз пульпы', translation_en: 'pulpal necrosis', definition_uz: 'Infeksiya yoki travma natijasida tish nervi to\'qimalarining nobud bo\'lishi', definition_ru: 'Гибель клеток пульпы зуба в результате инфекции', definition_en: 'Death of dental pulp tissue following prolonged inflammation', example: 'The tooth tested non-vital due to complete pulpal necrosis.' },
      { word: 'periapical', translation: 'periapikal', translation_uz: 'ildiz uchi atrofidagi (periapikal)', translation_ru: 'периапикальный', translation_en: 'periapical region', definition_uz: 'Tish ildizining eng uchki sohasi va uning atrofidagi suyak to\'qimasi', definition_ru: 'Область вокруг верхушки корня зуба', definition_en: 'Relating to tissues surrounding the apex of the tooth root', example: 'The X-ray shows periapical radiolucency around the root apex.' },
      { word: 'analgesics', translation: 'og\'riq qoldiruvchi', translation_uz: 'og\'riqsizlantiruvchi dorilar', translation_ru: 'обезболивающие препараты', translation_en: 'analgesics / painkillers', definition_uz: 'Og\'riq hissini kamaytiruvchi yoki yo\'qotuvchi dori vositalari', definition_ru: 'Лекарственные средства для снятия болевого синдрома', definition_en: 'Medications used to relieve acute pain symptoms', example: 'You can take over-the-counter analgesics like ibuprofen.' },
    ],
  };

  const genericVocabs = [
    { word: 'diagnosis', translation: 'tashxis', translation_uz: 'tashxis', translation_ru: 'диагноз', translation_en: 'clinical diagnosis', definition_uz: 'Klinik tekshiruvlar asosida kasallik turini aniqlash', definition_ru: 'Определение характера заболевания', definition_en: 'Identification of the nature and cause of an illness', example: 'The clinical diagnosis was confirmed by radiograph.' },
    { word: 'prognosis', translation: 'prognoz', translation_uz: 'davolash prognozi', translation_ru: 'прогноз лечения', translation_en: 'clinical prognosis', definition_uz: 'Kasallikning kelajakdagi kechishi va natijasi haqida ilmiy taxmin', definition_ru: 'Вероятный исход и прогноз заболевания', definition_en: 'Likely outcome or development of a disease course', example: 'With proper restoration, the prognosis of this tooth is excellent.' },
    { word: 'contraindication', translation: 'qarshi ko\'rsatma', translation_uz: 'davolashga qarshi ko\'rsatma', translation_ru: 'противопоказание', translation_en: 'contraindication', definition_uz: 'Muolaja yoki dorini qo\'llashni man etuvchi holat', definition_ru: 'Условие, делающее процедуру нежелательной', definition_en: 'A specific condition that makes a procedure inadvisable', example: 'Penicillin allergy is a direct contraindication for amoxicillin.' },
    { word: 'prophylaxis', translation: 'profilaktika', translation_uz: 'kasallik profilaktikasi', translation_ru: 'профилактика', translation_en: 'dental prophylaxis / prevention', definition_uz: 'Kasalliklar paydo bo\'lishining oldini olish choralari majmui', definition_ru: 'Комплекс мер по предотвращению заболеваний', definition_en: 'Preventive dental care procedures', example: 'Regular professional prophylaxis prevents periodontal disease.' },
    { word: 'radiograph', translation: 'rentgen', translation_uz: 'rentgenogramma', translation_ru: 'рентгеновский снимок', translation_en: 'dental radiograph (X-ray)', definition_uz: 'Tish va suyak holatini ko\'rsatuvchi rentgen surati', definition_ru: 'Рентгеновское изображение зубочелюстной системы', definition_en: 'An X-ray image used to evaluate bone and dental structures', example: 'Let us take a periapical radiograph to assess the bone level.' },
    { word: 'inflammation', translation: 'yallig\'lanish', translation_uz: 'yallig\'lanish jarayoni', translation_ru: 'воспалительный процесс', translation_en: 'inflammatory response', definition_uz: 'Shikastlanish yoki infeksiyaga organizmning himoya reaksiyasi', definition_ru: 'Защитная реакция тканей на повреждение или инфекцию', definition_en: 'Localized physical condition involving redness, swelling, and pain', example: 'Anti-inflammatory medications will reduce tissue swelling.' },
    { word: 'hygiene', translation: 'gigiyena', translation_uz: 'og\'iz bo\'shlig\'i gigiyenasi', translation_ru: 'гигиена полости рта', translation_en: 'oral hygiene', definition_uz: 'Og\'iz tozaligini saqlash bo\'yicha amaliy qoidalar', definition_ru: 'Поддержание чистоты зубов и десен', definition_en: 'Practices conducive to maintaining oral health and cleanliness', example: 'Good oral hygiene prevents calculus formation and cavities.' },
  ];

  for (let m of modules) {
    const list = moduleVocabs[m.order_index] || genericVocabs;
    const toInsert = list.map(v => ({
      module_id: m.id,
      word: v.word,
      translation: v.translation_uz || v.translation,
      translation_uz: v.translation_uz,
      translation_ru: v.translation_ru,
      translation_en: v.translation_en,
      definition: v.definition_en || v.definition,
      definition_uz: v.definition_uz,
      definition_ru: v.definition_ru,
      definition_en: v.definition_en,
      example: v.example
    }));
    await Vocabulary.bulkCreate(toInsert);

    // Phrasebook
    const phrases = [
      { module_id: m.id, category: 'Opening Consultation', phrase: 'Good morning, what brings you to the dental clinic today?', hint_uz: 'Salomlashish va tashrif sababini so\'rash', hint_ru: 'Приветствие и выяснение причины визита', hint_en: 'Polite greeting and inquiry about chief complaint', step_order: 1 },
      { module_id: m.id, category: 'Symptom Assessment', phrase: 'Could you point to the exact tooth or area that is bothering you?', hint_uz: 'Og\'riq yoki muammo joyini ko\'rsatishni so\'rash', hint_ru: 'Просьба указать точную локализацию боли', hint_en: 'Asking patient to localize discomfort', step_order: 2 },
      { module_id: m.id, category: 'Pain Evaluation', phrase: 'On a scale from 1 to 10, how would you rate your current pain severity?', hint_uz: 'Og\'riq darajasini 1 dan 10 gacha baholatish', hint_ru: 'Оценка интенсивности боли по 10-балльной шкале', hint_en: 'Quantifying pain intensity on a numerical scale', step_order: 3 },
      { module_id: m.id, category: 'Clinical Triggers', phrase: 'Does the pain get worse with hot or cold temperatures, or when chewing?', hint_uz: 'Og\'riqni qo\'zg\'atuvchi omillarni aniqlash', hint_ru: 'Выявление температурных и жевательных провоцирующих факторов', hint_en: 'Inquiring about thermal and mechanical pain triggers', step_order: 4 },
      { module_id: m.id, category: 'Medical History', phrase: 'Are you currently taking any prescription medications or do you have drug allergies?', hint_uz: 'Dorilar va allergiya bor-yo\'qligini tekshirish', hint_ru: 'Сбор анамнеза по принимаемым препаратам и аллергиям', hint_en: 'Screening for current pharmacotherapy and allergic history', step_order: 5 },
      { module_id: m.id, category: 'Treatment Plan', phrase: 'Based on our clinical findings, I recommend we take an X-ray to determine the treatment plan.', hint_uz: 'Dastlabki xulosa va keyingi tekshiruv taklifi', hint_ru: 'Предложение рентген-диагностики для составления плана лечения', hint_en: 'Explaining next diagnostic step and treatment plan', step_order: 6 },
    ];
    await Phrasebook.bulkCreate(phrases);

    // Tests (10 questions per module)
    const tests = [
      { module_id: m.id, question: 'What is the first step in assessing a patient with dental pain?', option_a: 'Extract the tooth immediately', option_b: 'Take a comprehensive history of the chief complaint', option_c: 'Prescribe antibiotics without examination', option_d: 'Perform teeth whitening', correct_option: 'B' },
      { module_id: m.id, question: 'Which question evaluates pain duration most accurately?', option_a: 'Where does it hurt?', option_b: 'How long does the sensation last after the stimulus is removed?', option_c: 'Do you brush twice a day?', option_d: 'What is your occupation?', correct_option: 'B' },
      { module_id: m.id, question: 'What does "radiating pain" mean in a clinical context?', option_a: 'Pain caused by radiation therapy', option_b: 'Mild tingling on the tongue', option_c: 'Pain spreading from the primary site to adjacent regions like ear or jaw', option_d: 'Pain that only occurs in sunlight', correct_option: 'C' },
      { module_id: m.id, question: 'Why is it critical to ask about drug allergies before prescribing analgesics or antibiotics?', option_a: 'To check patient memory', option_b: 'To prevent life-threatening anaphylactic or adverse reactions', option_c: 'To calculate the consultation fee', option_d: 'To see if they like certain flavors', correct_option: 'B' },
      { module_id: m.id, question: 'What diagnostic tool provides visual insight into subgingival and periapical structures?', option_a: 'Dental radiograph (X-ray)', option_b: 'Stethoscope', option_c: 'Thermometer', option_d: 'Blood pressure cuff', correct_option: 'A' },
    ];
    await Test.bulkCreate(tests);
  }

  console.log('✅ Barcha 10 ta modul uchun 3 tilli Vocabulary, Phrasebook va Testlar yaratildi');
  console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
  console.log('='.repeat(50));
  console.log('Login ma\'lumotlari:');
  console.log('  Admin:   admin@gmail.com / admin123');
  console.log('  Teacher: teacher@vpe.uz / teacher123');
  console.log('  Student: student@vpe.uz / student123');
  console.log('='.repeat(50));

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed xato:', err);
  process.exit(1);
});
