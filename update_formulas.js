const fs = require('fs');
const path = require('path');

const formulaMap = {
  // Specialty 1: Stomatologiya
  '1-1': {
    en: 'have / has + V3 (Past Participle)',
    uz: 'have / has + V3 (O\'tgan zamon sifatdoshi)',
    ru: 'have / has + V3 (Причастие прошедшего времени)'
  },
  '1-2': {
    en: 'Subject + have / has + been + V-ing | Subject + will + V1',
    uz: 'Ega (Subject) + have / has + been + V-ing | Ega + will + V1 (Asosiy fe\'l)',
    ru: 'Подлежащее (Subject) + have / has + been + V-ing | Подлежащее + will + V1'
  },
  '1-3': {
    en: 'If + Subject + Present Simple (V1/Vs), Subject + will / can + Base Verb (V1)',
    uz: 'If + Ega + Present Simple (V1/Vs), Ega + will / can + Asosiy fe\'l (V1)',
    ru: 'If + Подлежащее + Present Simple (V1/Vs), Подлежащее + will / can + Начальная форма (V1)'
  },
  '1-4': {
    en: 'Subject + have / has + V3 / been + for / since + Duration',
    uz: 'Ega + have / has + V3 / been + for / since + Vaqt davomiyligi',
    ru: 'Подлежащее + have / has + V3 / been + for / since + Период времени'
  },
  '1-5': {
    en: 'Subject + could / can / should + Base Verb (V1)',
    uz: 'Ega + could / can / should + Asosiy fe\'l (V1)',
    ru: 'Подлежащее + could / can / should + Начальная форма глагола (V1)'
  },
  '1-6': {
    en: 'Subject + V1/V-s (Habitual) | Subject + am/is/are + V-ing (Current State)',
    uz: 'Ega + V1/V-s (Odatiy holat) | Ega + am/is/are + V-ing (Ayni paytdagi holat)',
    ru: 'Подлежащее + V1/V-s (Регулярное действие) | Подлежащее + am/is/are + V-ing (Текущее состояние)'
  },
  '1-7': {
    en: 'Subject + have / get + Object + V3 (Causative) | Subject + is / was + V3 (Passive)',
    uz: 'Ega + have / get + To\'ldiruvchi + V3 (Sababiy nisbat) | Ega + is / was + V3 (Majhul nisbat)',
    ru: 'Подлежащее + have / get + Дополнение + V3 (Каузатив) | Подлежащее + is / was + V3 (Пассив)'
  },
  '1-8': {
    en: 'Did + Subject + Base Verb? | Subject + V2 (Past Simple)',
    uz: 'Did + Ega + Asosiy fe\'l? | Ega + V2 (O\'tgan oddiy zamon)',
    ru: 'Did + Подлежащее + Начальная форма? | Подлежащее + V2 (Прошедшее простое)'
  },
  '1-9': {
    en: 'We will need to + V1 | Please + Base Verb | How does it feel when you + V1?',
    uz: 'We will need to + V1 | Please + Asosiy fe\'l | How does it feel when you + V1?',
    ru: 'We will need to + V1 | Please + Начальная форма глагола | How does it feel when you + V1?'
  },
  '1-10': {
    en: 'Could you tell me...? | Have you ever noticed...? | I recommend that you + V1',
    uz: 'Could you tell me...? (Ayta olasizmi...?) | Have you ever noticed...? | I recommend that you + V1',
    ru: 'Could you tell me...? (Не могли бы вы сказать...?) | Have you ever noticed...? | I recommend that you + V1'
  },

  // Specialty 2: Davolash ishi
  '2-1': {
    en: 'Do / Does + Subject + V1? (History) | Subject + am / is / are + V-ing (Current symptoms)',
    uz: 'Do / Does + Ega + V1? (Anamnez) | Ega + am / is / are + V-ing (Ayni paytdagi holat)',
    ru: 'Do / Does + Подлежащее + V1? (Анамнез) | Подлежащее + am / is / are + V-ing (Текущее состояние)'
  },
  '2-2': {
    en: 'Subject + was / were + V-ing + when + Subject + V2 (Past Simple)',
    uz: 'Ega + was / were + V-ing + when + Ega + V2 (O\'tgan davomli + O\'tgan oddiy)',
    ru: 'Подлежащее + was / were + V-ing + when + Подлежащее + V2 (Прошедшее длит. + Прошедшее простое)'
  },
  '2-3': {
    en: 'How long + have / has + Subject + been + V-ing? | Subject + have / has + V3',
    uz: 'How long + have / has + Ega + been + V-ing? | Ega + have / has + V3',
    ru: 'How long + have / has + Подлежащее + been + V-ing? | Подлежащее + have / has + V3'
  },
  '2-4': {
    en: 'Have you ever had + Object / V3? | Subject + have / has + not + V3',
    uz: 'Have you ever had + To\'ldiruvchi / V3? (Boshdan kechirganmisiz?) | Ega + have / has + not + V3',
    ru: 'Have you ever had + Дополнение / V3? (Было ли у вас...?) | Подлежащее + have / has + not + V3'
  },
  '2-5': {
    en: 'When did + Subject + start? | Subject + V2 + (ago / yesterday / last night)',
    uz: 'When did + Ega + start? | Ega + V2 + (oldin / kecha / o\'tgan tun)',
    ru: 'When did + Подлежащее + start? | Подлежащее + V2 + (назад / вчера / прошлой ночью)'
  },
  '2-6': {
    en: 'Subject + is / was + being + V3 | Subject + has been diagnosed with + Condition',
    uz: 'Ega + is / was + being + V3 (Kuzatuv/Muolaja ostida) | Ega + has been diagnosed with + Tashxis',
    ru: 'Подлежащее + is / was + being + V3 (Под наблюдением) | Подлежащее + has been diagnosed with + Диагноз'
  },
  '2-7': {
    en: 'Subject + had + V3 (Past Perfect) + before / by the time + Subject + V2 (Past Simple)',
    uz: 'Ega + had + V3 (Oldinroq tugallangan) + before / by the time + Ega + V2 (Ketidan sodir bo\'lgan)',
    ru: 'Подлежащее + had + V3 (Предпрошедшее) + before / by the time + Подлежащее + V2 (Прошедшее простое)'
  },
  '2-8': {
    en: 'Subject + should / must / need to + Base Verb (V1) (Clinical Recommendation)',
    uz: 'Ega + should / must / need to + Asosiy fe\'l (V1) (Klinik tavsiya va ko\'rsatma)',
    ru: 'Подлежащее + should / must / need to + Начальная форма глагола (V1) (Клинические рекомендации)'
  },
  '2-9': {
    en: 'If + Subject + Present Simple (V1/Vs), Subject + will + Base Verb (V1)',
    uz: 'If + Ega + Present Simple (V1/Vs), Ega + will + Asosiy fe\'l (V1)',
    ru: 'If + Подлежащее + Present Simple (V1/Vs), Подлежащее + will + Начальная форма (V1)'
  },
  '2-10': {
    en: 'How often do you + V1? | Have you been checking...? | You will need to + V1',
    uz: 'How often do you + V1? (Qanchalik tez-tez...?) | Have you been checking...? | You will need to + V1',
    ru: 'How often do you + V1? (Как часто вы...?) | Have you been checking...? | You will need to + V1'
  }
};

function updateCurriculum(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const mod of content) {
    const key = `${mod.specialty_id}-${mod.order_index}`;
    const f = formulaMap[key];
    if (f && mod.grammar && mod.grammar.length > 0) {
      for (const g of mod.grammar) {
        g.structure_pattern = f.en;
        g.structure_pattern_en = f.en;
        g.structure_pattern_uz = f.uz;
        g.structure_pattern_ru = f.ru;
      }
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Updated curriculum file: ${filePath}`);
}

const currs = [
  path.resolve(__dirname, 'datas/all_medical_curriculum.json'),
  path.resolve(__dirname, 'datas/stomatology_curriculum.json'),
  path.resolve(__dirname, 'datas/davolash_ishi_curriculum.json')
];

currs.forEach(updateCurriculum);

// Update individual module_data.json files
for (let i = 1; i <= 10; i++) {
  const stomPath = path.resolve(__dirname, `datas/STOMOTOLOGY/MODULE ${i}/module_data.json`);
  if (fs.existsSync(stomPath)) {
    const mod = JSON.parse(fs.readFileSync(stomPath, 'utf8'));
    const f = formulaMap[`1-${i}`];
    if (f && mod.grammar && mod.grammar.length > 0) {
      for (const g of mod.grammar) {
        g.structure_pattern = f.en;
        g.structure_pattern_en = f.en;
        g.structure_pattern_uz = f.uz;
        g.structure_pattern_ru = f.ru;
      }
      fs.writeFileSync(stomPath, JSON.stringify(mod, null, 2), 'utf8');
      console.log(`Updated ${stomPath}`);
    }
  }

  const davModStr = i < 10 ? `0${i}` : `${i}`;
  const davPath = path.resolve(__dirname, `datas/DAVOLASH ISHI/Module_${davModStr}/module_data.json`);
  if (fs.existsSync(davPath)) {
    const mod = JSON.parse(fs.readFileSync(davPath, 'utf8'));
    const f = formulaMap[`2-${i}`];
    if (f && mod.grammar && mod.grammar.length > 0) {
      for (const g of mod.grammar) {
        g.structure_pattern = f.en;
        g.structure_pattern_en = f.en;
        g.structure_pattern_uz = f.uz;
        g.structure_pattern_ru = f.ru;
      }
      fs.writeFileSync(davPath, JSON.stringify(mod, null, 2), 'utf8');
      console.log(`Updated ${davPath}`);
    }
  }
}

console.log('All dataset files updated with 3-language formulas!');
