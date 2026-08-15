const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { Module, Grammar } = require('../models');

const grammarData = {
  1: {
    title: 'Present Simple in Pain & Sensitivity Assessment',
    title_uz: "Og'riq va Sezuvchanlikni Aniqlashda Present Simple",
    title_ru: 'Present Simple при Оценке Боли и Чувствительности',
    title_en: 'Present Simple in Pain & Sensitivity Assessment',
    rule_explanation: 'Use Present Simple to inquire about recurring symptoms, pain triggers (cold/hot stimuli), and typical duration. Questions are formed with Do / Does + Base Verb.',
    rule_explanation_uz: "Bemorning odatiy va takrorlanuvchi og'riq simptomlari, qo'zg'atuvchi omillari (issiq/sovuq ta'siri) hamda og'riq qancha davom etishini so'rashda Present Simple zamonidan foydalaniladi. So'roq gaplarda 'Do / Does + Ega + Asosiy fe'l' formulasi qo'llaniladi.",
    rule_explanation_ru: 'Для расспроса о регулярных или повторяющихся симптомах, провоцирующих факторах (холод/тепло) и продолжительности боли используется Present Simple (Do / Does + подлежащее + глагол).',
    rule_explanation_en: 'Present Simple is used to inquire about recurring symptoms, pain triggers (cold/hot stimuli), and typical duration. Questions are formed with Do / Does + Subject + Base Verb.',
    structure_pattern: 'Does + [Stimulus] + trigger/cause + [Symptom]? | How long + does + the pain + last?',
    examples: [
      {
        sentence: 'Does cold water trigger the pain in your lower molar?',
        translation_uz: "Sovuq suv pastki oziq tishingizda og'riq qo'zg'atadimi?",
        translation_ru: 'Провоцирует ли холодная вода боль в нижнем коренном зубе?',
        translation_en: 'Does cold water trigger the pain in your lower molar?',
        note: 'Inquiring about a specific thermal stimulus'
      },
      {
        sentence: 'How long does the sharp sensation persist after the cold drink?',
        translation_uz: "Sovuq ichimlikdan so'ng o'tkir og'riq qancha vaqt saqlanib qoladi?",
        translation_ru: 'Как долго сохраняется острая чувствительность после холодного напитка?',
        translation_en: 'How long does the sharp sensation persist after the cold drink?',
        note: 'Evaluating symptom duration'
      },
      {
        sentence: 'The sensitivity usually lasts for about thirty seconds.',
        translation_uz: "Sezuvchanlik odatda o'ttiz soniyacha davom etadi.",
        translation_ru: 'Чувствительность обычно длится около тридцати секунд.',
        translation_en: 'The sensitivity usually lasts for about thirty seconds.',
        note: 'Patient typical symptom description'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'Is cold water trigger your pain?',
        correct: 'Does cold water trigger your pain?',
        explanation_uz: "Asosiy fe'l (trigger) mavjud bo'lganda 'is' emas, balki 'does' yordamchi fe'li ishlatiladi.",
        explanation_ru: "При наличии смыслового глагола (trigger) используется вспомогательный глагол 'does', а не 'is'.",
        explanation_en: "Use the auxiliary verb 'does' with action verbs, not 'is'."
      },
      {
        incorrect: 'How long pain last?',
        correct: 'How long does the pain last?',
        explanation_uz: "Maxsus so'roq gaplarda 'does' ko'makchi fe'li tushirib qoldirilmaydi.",
        explanation_ru: "В специальных вопросах обязательно употребление вспомогательного глагола 'does'.",
        explanation_en: "Do not omit the auxiliary verb 'does' in wh-questions."
      }
    ]
  },
  2: {
    title: 'Modal Verbs for Patient Instructions & Reassurance (Must, Should, Can)',
    title_uz: "Operatsiyadan Keyingi Ko'rsatmalar uchun Modal Fe'llar (Must, Should, Can)",
    title_ru: 'Модальные Глаголы для Инструкций Пациенту (Must, Should, Can)',
    title_en: 'Modal Verbs for Patient Instructions & Reassurance (Must, Should, Can)',
    rule_explanation: 'Modal verbs are essential for giving post-operative clinical instructions: "must/must not" for strict medical rules, "should" for clinical recommendations, and "can/may" for permissions.',
    rule_explanation_uz: "Jarrohlikdan keyingi qat'iy ko'rsatmalar berishda 'must/must not' (qilish shart/taqiqlanadi), tavsiyalar uchun 'should' (tavsiya etiladi), ruxsat berish uchun 'can/may' qo'llaniladi. Modal fe'llardan so'ng 'to' zarrachasisiz fe'lning boshlang'ich shakli keladi.",
    rule_explanation_ru: "Для строгих предписаний и запретов используется 'must/must not', для клинических рекомендаций — 'should', для разрешений — 'can/may'. После модальных глаголов частица 'to' не ставится.",
    rule_explanation_en: 'Modal verbs are essential for giving post-operative instructions: "must/must not" for strict rules, "should" for recommendations, and "can/may" for permissions. Always follow with a bare infinitive.',
    structure_pattern: 'You + must / should / can + [Base Verb] | You + must not + [Base Verb]',
    examples: [
      {
        sentence: 'You must bite firmly on this gauze pad for thirty minutes to control bleeding.',
        translation_uz: "Qonni to'xtatish uchun dokali tamponni 30 daqiqa qattiq tishlab turishingiz shart.",
        translation_ru: 'Вы должны плотно прикусить этот марлевый тампон на 30 минут для остановки кровотечения.',
        translation_en: 'You must bite firmly on this gauze pad for thirty minutes to control bleeding.',
        note: 'Strict post-extraction requirement'
      },
      {
        sentence: 'You should avoid drinking through a straw or rinsing vigorously for 24 hours.',
        translation_uz: "24 soat davomida naychadan ichmaslik va og'izni qattiq chayqamaslik tavsiya etiladi.",
        translation_ru: 'Вам следует избегать питья через соломинку и интенсивного полоскания в течение 24 часов.',
        translation_en: 'You should avoid drinking through a straw or rinsing vigorously for 24 hours.',
        note: 'Preventing dry socket complication'
      },
      {
        sentence: 'You can take over-the-counter analgesics if you experience discomfort.',
        translation_uz: "Noqulaylik his qilsangiz, retseptsiz beriladigan og'riq qoldiruvchi dorilarni ichishingiz mumkin.",
        translation_ru: 'Вы можете принять обезболивающие препараты при возникновении дискомфорта.',
        translation_en: 'You can take over-the-counter analgesics if you experience discomfort.',
        note: 'Patient permission and pain management'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'You must to bite on the gauze.',
        correct: 'You must bite on the gauze.',
        explanation_uz: "Modal fe'llardan (must, should, can) keyin 'to' ishlatilmaydi.",
        explanation_ru: "После модальных глаголов (must, should, can) частица 'to' не употребляется.",
        explanation_en: "Never use 'to' after modal auxiliary verbs."
      },
      {
        incorrect: "You don't have to spit blood.",
        correct: 'You must not spit forcefully.',
        explanation_uz: "Qat'iy tibbiy taqiqlar uchun 'don't have to' emas, 'must not' qo'llaniladi.",
        explanation_ru: "Для категорического медицинского запрета используется 'must not', а не 'don't have to'.",
        explanation_en: "Use 'must not' for strict medical prohibitions."
      }
    ]
  },
  3: {
    title: 'Present Perfect vs Past Simple in Pain History (Onset & Duration)',
    title_uz: "Anamnez Yig'ishda Present Perfect va Past Simple (Boshlanishi va Davomiyligi)",
    title_ru: 'Present Perfect и Past Simple при Сборе Анамнеза (Начало и Длительность)',
    title_en: 'Present Perfect vs Past Simple in Pain History (Onset & Duration)',
    rule_explanation: 'Use Past Simple to ask about the exact onset moment in the past ("When did the pain start?"). Use Present Perfect to ask about continuous duration up to now ("How long have you had this pain?").',
    rule_explanation_uz: "Og'riq qachon boshlanganini (o'tgan zamondagi aniq vaqt) so'rashda Past Simple, og'riq o'tmishda boshlanib hozirgacha qancha vaqtdan beri davom etayotganini so'rashda Present Perfect qo'llaniladi.",
    rule_explanation_ru: 'Past Simple используется для вопроса о конкретном моменте начала боли, а Present Perfect — для симптомов, продолжающихся с прошлого момента по настоящее время.',
    rule_explanation_en: 'Use Past Simple for specific past onset moments and Present Perfect for ongoing symptoms connecting past to present.',
    structure_pattern: 'When + did + the pain + start? | How long + have + you + had + [symptom]?',
    examples: [
      {
        sentence: 'When exactly did this severe throbbing pain start?',
        translation_uz: "Ushbu kuchli duk-duk uruvchi og'riq aynan qachon boshlandi?",
        translation_ru: 'Когда именно началась эта сильная пульсирующая боль?',
        translation_en: 'When exactly did this severe throbbing pain start?',
        note: 'Past Simple onset question'
      },
      {
        sentence: 'How long have you had difficulty sleeping because of this toothache?',
        translation_uz: "Ushbu tish og'rig'i sababli qancha vaqtdan beri uxlay olmayapsiz?",
        translation_ru: 'Как долго у вас проблемы со сном из-за этой зубной боли?',
        translation_en: 'How long have you had difficulty sleeping because of this toothache?',
        note: 'Present Perfect duration inquiry'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'Since when you have this pain?',
        correct: 'How long have you had this pain?',
        explanation_uz: "Ingliz tilida davomiylikni so'rashda 'How long have you had...?' standarti ishlatiladi.",
        explanation_ru: "Для вопроса о длительности используется стандарт 'How long have you had...?'",
        explanation_en: "Use 'How long have you had...?' for medical duration questions."
      }
    ]
  },
  4: {
    title: 'First Conditional in Complication Warnings & Treatment Prognosis',
    title_uz: "Asoratlardan Ogohlantirishda 1-Tur Shart Gaplari (First Conditional)",
    title_ru: 'Первый Тип Условных Предложений (First Conditional) для Предупреждения Осложнений',
    title_en: 'First Conditional in Complication Warnings & Treatment Prognosis',
    rule_explanation: 'First Conditional (If + Present Simple, will + Base Verb) is used to explain medical consequences and realistic outcomes if a condition remains untreated.',
    rule_explanation_uz: "Agar infeksiya yoki abstsess davolanmasa nima sodir bo'lishini tushuntirishda 'If + Present Simple, will + fe'l' tuzilmasidan foydalaniladi. E'tibor bering, 'if' qismida 'will' ishlatilmaydi.",
    rule_explanation_ru: 'Конструкция First Conditional (If + Present Simple, will + глагол) используется для объяснения пациенту последствий нелеченного абсцесса.',
    rule_explanation_en: 'First Conditional explains realistic clinical outcomes: "If + Present Simple, will + Base Verb". Never put "will" inside the if-clause.',
    structure_pattern: 'If + [Condition in Present Simple], + [Subject] + will + [Consequence]',
    examples: [
      {
        sentence: 'If the abscess is left untreated, the infection will spread to the deeper facial spaces.',
        translation_uz: "Agar abstsess davolanmasa, infeksiya yuzning chuqur to'qimalariga tarqaladi.",
        translation_ru: 'Если абсцесс не лечить, инфекция распространится на глубокие пространства лица.',
        translation_en: 'If the abscess is left untreated, the infection will spread to the deeper facial spaces.',
        note: 'Explaining risk of non-intervention'
      },
      {
        sentence: 'If you develop difficulty breathing or swallowing, you will need emergency hospital admission.',
        translation_uz: "Agar nafas olish yoki yutinish qiyinlashsa, zudlik bilan shifoxonaga yotqizilishingiz kerak bo'ladi.",
        translation_ru: 'Если возникнут трудности с дыханием или глотанием, потребуется срочная госпитализация.',
        translation_en: 'If you develop difficulty breathing or swallowing, you will need emergency hospital admission.',
        note: 'Red-flag symptom warning'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'If the swelling will increase, call the emergency clinic.',
        correct: 'If the swelling increases, call the emergency clinic.',
        explanation_uz: "'If' bog'lovchisidan keyin 'will' kelmaydi, Present Simple ishlatiladi.",
        explanation_ru: "В придаточном предложении с 'if' будущее время 'will' не используется.",
        explanation_en: "Do not use 'will' inside the if-clause."
      }
    ]
  },
  5: {
    title: 'Passive Voice in Explaining Clinical Restorative Procedures',
    title_uz: "Restavratsiya Jarayonini Tushuntirishda Majhul Nisbat (Passive Voice)",
    title_ru: 'Пассивный Залог (Passive Voice) при Описании Этапов Пломбирования',
    title_en: 'Passive Voice in Explaining Clinical Restorative Procedures',
    rule_explanation: 'Passive Voice (am/is/are/will be + Past Participle V3) focuses on what happens to the tooth rather than who does it, creating clear, professional clinical explanations.',
    rule_explanation_uz: "Plomba qo'yish, kariyesni tozalash va tishni tiklash bosqichlarini professional tushuntirishda 'is/are/will be + V3 (o'tgan zamon sifatdoshi)' shakli qo'llaniladi.",
    rule_explanation_ru: 'Пассивный залог позволяет профессионально и спокойно описать пациенту процесс препарирования и пломбирования зуба.',
    rule_explanation_en: 'Passive Voice structures (is/are/will be + V3) present clinical procedures neutrally and professionally to the patient.',
    structure_pattern: 'The [Anatomical structure] + is/will be + [Past Participle V3]',
    examples: [
      {
        sentence: 'The decayed portion of the enamel is carefully removed before placing the composite restoration.',
        translation_uz: "Kompozit plomba qo'yishdan oldin emalning karies zararlangan qismi ehtiyotkorlik bilan olib tashlanadi.",
        translation_ru: 'Пораженная кариесом часть эмали аккуратно удаляется перед установкой пломбы.',
        translation_en: 'The decayed portion of the enamel is carefully removed before placing the composite restoration.',
        note: 'Procedure step in passive voice'
      },
      {
        sentence: 'The composite resin material is cured with a specialized light in layers.',
        translation_uz: "Kompozit plomba materiali maxsus chiroq yordamida qatlam-qatlam qotiriladi.",
        translation_ru: 'Композитный материал полимеризуется специальной лампой послойно.',
        translation_en: 'The composite resin material is cured with a specialized light in layers.',
        note: 'Explaining the curing step'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'The cavity is fill with composite.',
        correct: 'The cavity is filled with composite.',
        explanation_uz: "Passive Voice da asosiy fe'lning 3-shakli (Past Participle, -ed) ishlatilishi shart.",
        explanation_ru: "В пассивном залоге обязательна третья форма глагола (Past Participle).",
        explanation_en: "Always use the past participle (-ed form for regular verbs) in passive voice."
      }
    ]
  },
  6: {
    title: 'Present Continuous vs Present Simple in Periodontal Conditions',
    title_uz: "Periodontitda Davomiy Jarayonlar: Present Continuous vs Present Simple",
    title_ru: 'Present Continuous и Present Simple при Оценке Заболеваний Десен',
    title_en: 'Present Continuous vs Present Simple in Periodontal Conditions',
    rule_explanation: 'Use Present Simple for recurring events like bleeding while brushing, and Present Continuous (am/is/are + V-ing) for ongoing progressive processes like receding gums or bone loss.',
    rule_explanation_uz: "Tish yuvganda milkning odatiy qonashi uchun Present Simple, ayni davrda chuqurlashib borayotgan patologik jarayonlar (milklarning chekinishi, suyak yemirilishi) uchun Present Continuous qo'llaniladi.",
    rule_explanation_ru: 'Present Simple описывает регулярную кровоточивость, а Present Continuous — текущие прогрессирующие процессы (рецессия десны).',
    rule_explanation_en: 'Use Present Simple for routine bleeding during hygiene, and Present Continuous for progressive physiological deterioration.',
    structure_pattern: 'Do your gums bleed + [when brushing]? | The gums are receding + [gradually].',
    examples: [
      {
        sentence: 'Do your gums bleed every time you brush or floss?',
        translation_uz: "Tishlaringizni yuvganda yoki ip bilan tozalaganda har safar milk qonaydimi?",
        translation_ru: 'Кровоточат ли ваши десны каждый раз при чистке щеткой или нитью?',
        translation_en: 'Do your gums bleed every time you brush or floss?',
        note: 'Routine symptom inquiry'
      },
      {
        sentence: 'Your gums are currently receding around the lower anterior teeth.',
        translation_uz: "Hozirda pastki old tishlaringiz atrofida milklar chekinib bormoqda.",
        translation_ru: 'В настоящее время наблюдается прогрессирующая рецессия десны вокруг нижних передних зубов.',
        translation_en: 'Your gums are currently receding around the lower anterior teeth.',
        note: 'Progressive active process'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'Are your gums bleed every morning?',
        correct: 'Do your gums bleed every morning?',
        explanation_uz: "Odatiy harakatlar uchun 'Are ... bleed' emas, 'Do ... bleed' ishlatiladi.",
        explanation_ru: "Для регулярных действий используется вспомогательный глагол 'Do', а не форма 'Are'.",
        explanation_en: "Use 'Do' for habitual actions, not 'Are'."
      }
    ]
  },
  7: {
    title: 'Expressing Clinical Necessity & Recommendations (Need to, Have to, May consider)',
    title_uz: "Zarurat va Tavsiyalarni Ifodalash (Need to, Have to, May consider)",
    title_ru: 'Выражение Клинической Необходимости и Рекомендаций (Need to, Have to)',
    title_en: 'Expressing Clinical Necessity & Recommendations (Need to, Have to, May consider)',
    rule_explanation: 'Use "need to / have to" to communicate objective clinical indications for extraction, and "may consider / recommend" when offering elective treatment options.',
    rule_explanation_uz: "Retensiyalangan (yashirin) aqlli tishni oldirishning tibbiy zaruratini bildirishda 'need to / have to', bir nechta variantlarni tavsiya qilishda 'we recommend / you may consider' iboralari qo'llaniladi.",
    rule_explanation_ru: "Конструкции 'need to / have to' выражают прямые показания к удалению, а 'recommend / may consider' — выбор тактики лечения.",
    rule_explanation_en: 'Use "need to/have to" for strict medical indications and "recommend/consider" for elective procedures.',
    structure_pattern: 'We + need to / have to + [Extract/Treat] + because + [Clinical Reason]',
    examples: [
      {
        sentence: 'We need to extract the lower wisdom tooth because it is horizontally impacted against the second molar.',
        translation_uz: "Pastki aqlli tishni oldirishimiz zarur, chunki u ikkinchi oziq tishga qarab gorizontal o'sib chiqqan.",
        translation_ru: 'Нам необходимо удалить нижний зуб мудрости, так как он горизонтально упирается во второй моляр.',
        translation_en: 'We need to extract the lower wisdom tooth because it is horizontally impacted against the second molar.',
        note: 'Explaining surgical necessity'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'You must to remove the tooth today.',
        correct: 'You need to have the tooth removed.',
        explanation_uz: "'Must' dan keyin 'to' ishlatilmaydi; do'stona klinik muloqotda 'need to' ko'proq ma'qul.",
        explanation_ru: "'Must' не сочетается с 'to'; для мягкого врачебного объяснения предпочтительно 'need to'.",
        explanation_en: "Use 'need to' or 'must (without to)'."
      }
    ]
  },
  8: {
    title: 'Direct Imperatives for Emergency First Aid & Dental Trauma Instructions',
    title_uz: "Shoshilinch Birinchi Yordam Ko'rsatishda Buyruq Mayli (Direct Imperatives)",
    title_ru: 'Повелительное Наклонение (Imperatives) для Экстренной Помощи при Травме',
    title_en: 'Direct Imperatives for Emergency First Aid & Dental Trauma Instructions',
    rule_explanation: 'In dental emergencies (avulsed tooth, broken crown), use direct imperative verbs (Base Verb / Do not + Base Verb) to provide immediate, clear instructions to patients and parents.',
    rule_explanation_uz: "Shoshilinch tish travmalarida (tish tushib ketganda yoki singanda) bemor yoki ota-onaga tezkor yo'l-yo'riq berishda Buyruq mayli (fe'lning o'zi yoki Do not + fe'l) qo'llaniladi.",
    rule_explanation_ru: 'При травме зуба четкие инструкции даются в повелительном наклонении (глагол без подлежащего или Do not + глагол).',
    rule_explanation_en: 'Emergency instructions must be concise and immediate using the base imperative form.',
    structure_pattern: '[Base Verb] + [Object]! | Do not + [Base Verb] + [Object]!',
    examples: [
      {
        sentence: 'Do not touch or scrape the root surface of the knocked-out tooth.',
        translation_uz: "Tushib ketgan tishning ildiz yuzasiga tegmang va uni qirmang.",
        translation_ru: 'Не прикасайтесь и не соскабливайте поверхность корня выбитого зуба.',
        translation_en: 'Do not touch or scrape the root surface of the knocked-out tooth.',
        note: 'Critical periodontal ligament preservation rule'
      },
      {
        sentence: 'Place the tooth in cold milk or saline solution and bring it to our clinic immediately.',
        translation_uz: "Tishni sovuq sutga yoki sho'r eritmaga soling va zudlik bilan klinikamizga olib keling.",
        translation_ru: 'Поместите зуб в холодное молоко или физраствор и немедленно доставьте в клинику.',
        translation_en: 'Place the tooth in cold milk or saline solution and bring it to our clinic immediately.',
        note: 'Transport medium instruction'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'You should not touching the tooth root.',
        correct: 'Do not touch the tooth root.',
        explanation_uz: "Shoshilinch holatda aniq va keskin buyruq: 'Do not + fe'l asosiy shakli'.",
        explanation_ru: "В экстренной ситуации используется прямой запрет: 'Do not touch'.",
        explanation_en: "Use clear imperative 'Do not touch'."
      }
    ]
  },
  9: {
    title: 'Comparative and Superlative Adjectives in Prosthetic Treatment Planning',
    title_uz: "Protezlash Variantlarini Solishtirishda Qiyosiy va Orttirma Darajalar",
    title_ru: 'Сравнительная и Превосходная Степень Прилагательных при Протезировании',
    title_en: 'Comparative and Superlative Adjectives in Prosthetic Treatment Planning',
    rule_explanation: 'Use comparatives (more durable than, better than, less invasive than) and superlatives (the most aesthetic, the strongest) to help patients understand differences between implants, bridges, and dentures.',
    rule_explanation_uz: "Implant, ko'prik va olinadigan protezlar orasidagi farq, chidamlilik va afzalliklarni solishtirishda 'more + sifat + than' (qiyosiy) hamda 'the most + sifat' (orttirma) darajalari qo'llaniladi.",
    rule_explanation_ru: 'Сравнительные формы (more durable than, better than) и превосходная степень (the most natural) помогают пациенту выбрать вид протезирования.',
    rule_explanation_en: 'Comparative and superlative forms objectively contrast dental implant longevity vs bridges vs dentures.',
    structure_pattern: '[Option A] + is + more [Adjective] than + [Option B] | [Option] + is the most [Adjective]',
    examples: [
      {
        sentence: 'Dental implants are significantly more durable and stable than removable partial dentures.',
        translation_uz: "Dental implantlar olinadigan qisman protezlarga qaraganda ancha chidamli va mustahkamdir.",
        translation_ru: 'Дентальные имплантаты значительно более долговечны и стабильны, чем съемные протезы.',
        translation_en: 'Dental implants are significantly more durable and stable than removable partial dentures.',
        note: 'Comparative durability'
      },
      {
        sentence: 'All-ceramic crowns offer the most natural cosmetic appearance in the anterior aesthetic zone.',
        translation_uz: "To'liq keramik qoplamalar oldingi estetik sohada eng tabiiy chiroyli ko'rinishni ta'minlaydi.",
        translation_ru: 'Цельнокерамические коронки обеспечивают наиболее естественный эстетический результат.',
        translation_en: 'All-ceramic crowns offer the most natural cosmetic appearance in the anterior aesthetic zone.',
        note: 'Superlative aesthetic description'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'Implants are more better than dentures.',
        correct: 'Implants are better / much better than dentures.',
        explanation_uz: "'Better' so'zi oldidan 'more' qo'yilmaydi; kuchaytirish uchun 'much better' ishlatiladi.",
        explanation_ru: "Сравнительная степень 'better' не требует 'more'. Для усиления используют 'much better'.",
        explanation_en: "Never combine 'more' with irregular comparatives like 'better'."
      }
    ]
  },
  10: {
    title: 'Indirect & Polite Question Formulations in Comprehensive Consultations',
    title_uz: "To'liq Konsultatsiyada Bilvosita va Xushmuomala Savol Shakllari",
    title_ru: 'Косвенные и Вежливые Вопросы при Полной Консультации',
    title_en: 'Indirect & Polite Question Formulations in Comprehensive Consultations',
    rule_explanation: 'In comprehensive medical consultations, indirect questions ("Could you tell me if...", "Would you mind sharing...") soften sensitive inquiries regarding medical conditions, anxieties, and medication history.',
    rule_explanation_uz: "Katta konsultatsiyada umumiy kasalliklar, allergiyalar va bemorning xavotirlari haqida so'rashda to'g'ridan-to'g'ri keskin savol o'rniga 'Could you tell me if...', 'Would you mind sharing...' kabi xushmuomala kirish iboralari qo'llaniladi.",
    rule_explanation_ru: 'Вежливые вводные фразы ("Could you tell me...", "Would you mind...") помогают деликатно собрать подробный медицинский и аллергологический анамнез.',
    rule_explanation_en: 'Indirect polite questions create trust and comfort when assessing medical history and dental anxiety.',
    structure_pattern: 'Could you please tell me + if / what / when + [Subject + Verb]? | Would you mind describing + [Symptom]?',
    examples: [
      {
        sentence: 'Could you please tell me if you have any history of high blood pressure or diabetes?',
        translation_uz: "Sizda qon bosimi ko'tarilishi yoki qandli diabet bo'lganmi, aytib bera olasizmi?",
        translation_ru: 'Не могли бы вы сказать, есть ли у вас в анамнезе гипертония или диабет?',
        translation_en: 'Could you please tell me if you have any history of high blood pressure or diabetes?',
        note: 'Polite systemic health screening'
      },
      {
        sentence: 'Would you mind sharing what specific dental procedures make you feel most anxious?',
        translation_uz: "Aynan qaysi stomatologik muolajalar sizda ko'proq xavotir uyg'otishini aytib bera olasizmi?",
        translation_ru: 'Не могли бы вы поделиться, какие именно процедуры вызывают у вас наибольшее беспокойство?',
        translation_en: 'Would you mind sharing what specific dental procedures make you feel most anxious?',
        note: 'Assessing dental anxiety gently'
      }
    ],
    common_mistakes: [
      {
        incorrect: 'Could you tell me what is your allergy?',
        correct: 'Could you tell me what your allergy is?',
        explanation_uz: "Bilvosita savollarda so'z tartibi to'g'ri darak gap kabi bo'ladi (Ega + Fe'l).",
        explanation_ru: "В косвенных вопросах сохраняется прямой порядок слов: подлежащее, затем глагол.",
        explanation_en: "Indirect questions require normal statement word order (Subject before Verb)."
      }
    ]
  }
};

async function syncAndSeedGrammar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Baza bilan aloqa o\'rnatildi');

    // Create / alter grammars table
    await Grammar.sync({ alter: true });
    console.log('✅ Grammars jadvali sinxronlandi');

    const modules = await Module.findAll({ order: [['order_index', 'ASC']] });
    if (!modules || modules.length === 0) {
      console.log('⚠️ Hozircha modullar topilmadi. Avval asosiy seedni ishga tushiring.');
      process.exit(0);
    }

    for (const m of modules) {
      const gItem = grammarData[m.order_index] || grammarData[1];
      
      const existing = await Grammar.findOne({ where: { module_id: m.id } });
      if (existing) {
        await existing.update({
          title: gItem.title,
          title_uz: gItem.title_uz,
          title_ru: gItem.title_ru,
          title_en: gItem.title_en,
          rule_explanation: gItem.rule_explanation,
          rule_explanation_uz: gItem.rule_explanation_uz,
          rule_explanation_ru: gItem.rule_explanation_ru,
          rule_explanation_en: gItem.rule_explanation_en,
          structure_pattern: gItem.structure_pattern,
          examples: gItem.examples,
          common_mistakes: gItem.common_mistakes,
          step_order: 1
        });
      } else {
        await Grammar.create({
          module_id: m.id,
          title: gItem.title,
          title_uz: gItem.title_uz,
          title_ru: gItem.title_ru,
          title_en: gItem.title_en,
          rule_explanation: gItem.rule_explanation,
          rule_explanation_uz: gItem.rule_explanation_uz,
          rule_explanation_ru: gItem.rule_explanation_ru,
          rule_explanation_en: gItem.rule_explanation_en,
          structure_pattern: gItem.structure_pattern,
          examples: gItem.examples,
          common_mistakes: gItem.common_mistakes,
          step_order: 1
        });
      }
    }

    console.log('✅ Barcha 10 ta modul uchun klinik Grammatika ma\'lumotlari muvaffaqiyatli saqlandi!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Grammar sync xato:', err);
    process.exit(1);
  }
}

syncAndSeedGrammar();
