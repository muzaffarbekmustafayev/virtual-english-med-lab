const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { Specialty, Module, Grammar, Vocabulary, Phrasebook, Test } = require('../models');

async function seedFromDatas() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected to DB successfully!');

    await sequelize.sync({ alter: true });
    console.log('Tables synced with schema.');

    const jsonPath = path.resolve(__dirname, '../../../datas/all_medical_curriculum.json');
    if (!fs.existsSync(jsonPath)) {
        throw new Error(`Curriculum JSON not found at: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const modulesData = JSON.parse(rawData);
    console.log(`Loaded ${modulesData.length} modules from all_medical_curriculum.json`);

    // 1. Seed Specialties
    const specialties = [
      {
        id: 1,
        name: 'Stomatologiya',
        name_uz: 'Stomatologiya',
        name_ru: 'Стоматология',
        name_en: 'Dentistry'
      },
      {
        id: 2,
        name: 'Davolash ishi',
        name_uz: 'Davolash ishi',
        name_ru: 'Лечебное дело',
        name_en: 'General Medicine'
      }
    ];

    for (const spec of specialties) {
      await Specialty.upsert(spec);
    }
    console.log('✅ Specialties (Stomatologiya & Davolash ishi) ready.');

    // 2. Seed Modules, Grammar, Vocabulary, Phrasebook, Tests
    for (const m of modulesData) {
      // Find or create module
      let [dbMod] = await Module.findOrCreate({
        where: {
          specialty_id: m.specialty_id,
          order_index: m.order_index
        },
        defaults: {
          specialty_id: m.specialty_id,
          order_index: m.order_index,
          title: m.title,
          title_uz: m.title_uz,
          title_ru: m.title_ru,
          title_en: m.title_en,
          description: m.description,
          description_uz: m.description,
          description_ru: m.description,
          description_en: m.description,
          patient_context: m.scenario_prompt || `Patient presenting with ${m.title_en}`,
          final_challenge_context: JSON.stringify(m.patient_profile || {})
        }
      });

      // Update module fields
      await dbMod.update({
        title: m.title,
        title_uz: m.title_uz,
        title_ru: m.title_ru,
        title_en: m.title_en,
        description: m.description,
        description_uz: m.description,
        description_ru: m.description,
        description_en: m.description,
        patient_context: m.scenario_prompt || `Patient presenting with ${m.title_en}`,
        final_challenge_context: JSON.stringify(m.patient_profile || {})
      });

      const moduleId = dbMod.id;

      // Clear existing records for clean overwrite from datas
      await Grammar.destroy({ where: { module_id: moduleId } });
      await Vocabulary.destroy({ where: { module_id: moduleId } });
      await Phrasebook.destroy({ where: { module_id: moduleId } });
      await Test.destroy({ where: { module_id: moduleId } });

      // Seed Grammar
      if (m.grammar && m.grammar.length > 0) {
        for (let gi = 0; gi < m.grammar.length; gi++) {
          const g = m.grammar[gi];
          await Grammar.create({
            module_id: moduleId,
            title: g.title,
            title_uz: g.title_uz || g.title,
            title_ru: g.title_ru || g.title,
            title_en: g.title_en || g.title,
            rule_explanation: g.rule_explanation,
            rule_explanation_uz: g.rule_explanation_uz || g.rule_explanation,
            rule_explanation_ru: g.rule_explanation_ru || g.rule_explanation,
            rule_explanation_en: g.rule_explanation_en || g.rule_explanation,
            structure_pattern: g.structure_pattern || g.structure_pattern_en || "",
            structure_pattern_uz: g.structure_pattern_uz || g.structure_pattern || "",
            structure_pattern_ru: g.structure_pattern_ru || g.structure_pattern || "",
            structure_pattern_en: g.structure_pattern_en || g.structure_pattern || "",
            examples: g.examples || [],
            common_mistakes: g.common_mistakes || [],
            step_order: gi + 1
          });
        }
      }

      // Seed Vocabulary
      if (m.vocabulary && m.vocabulary.length > 0) {
        for (let vi = 0; vi < m.vocabulary.length; vi++) {
          const v = m.vocabulary[vi];
          await Vocabulary.create({
            module_id: moduleId,
            word: v.word,
            translation: v.translation || v.word,
            translation_uz: v.translation_uz || v.translation || v.word,
            translation_ru: v.translation_ru || "",
            translation_en: v.translation_en || v.word,
            definition: v.definition || `Medical term: ${v.word}`,
            definition_uz: v.definition_uz || v.definition || `${v.word} atamasi`,
            definition_ru: v.definition_ru || "",
            definition_en: v.definition_en || v.definition || `Medical term: ${v.word}`,
            example: v.example || `The clinician noted ${v.word.toLowerCase()}.`,
            step_order: vi + 1
          });
        }
      }

      // Seed Phrasebook
      if (m.phrasebook && m.phrasebook.length > 0) {
        for (let pi = 0; pi < m.phrasebook.length; pi++) {
          const p = m.phrasebook[pi];
          await Phrasebook.create({
            module_id: moduleId,
            phrase: p.phrase,
            category: p.category || "Clinical Consultation",
            hint: p.hint || p.hint_uz || "Klinik muloqot iborasi",
            hint_uz: p.hint_uz || p.hint || "Klinik muloqot iborasi",
            hint_ru: p.hint_ru || "Клиническая фраза консультации",
            hint_en: p.hint_en || "Clinical consultation inquiry",
            step_order: pi + 1
          });
        }
      }

      // Seed Tests
      if (m.tests && m.tests.length > 0) {
        for (const t of m.tests) {
          await Test.create({
            module_id: moduleId,
            question: t.question,
            option_a: t.option_a,
            option_b: t.option_b,
            option_c: t.option_c,
            option_d: t.option_d,
            correct_option: t.correct_option,
            explanation: t.explanation || "To'g'ri klinik va grammatik javob."
          });
        }
      }

      console.log(`  ✓ Modul ${m.order_index} (${m.specialty_name}): ${m.title} [Vocab: ${m.vocabulary.length}, Phrases: ${m.phrasebook.length}, Grammar: ${m.grammar.length}, Tests: ${m.tests.length}]`);
    }

    console.log('\n🎉 Barcha 20 ta modul ma\'lumotlari bazaga 100% muvaffaqiyatli saqlandi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedFromDatas();
