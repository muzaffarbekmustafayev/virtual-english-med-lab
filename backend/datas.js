#!/usr/bin/env node
/**
 * datas.js — datas/datas.json → MySQL
 *
 *   node datas.js                 # seed every enabled specialty from datas/datas.json
 *   node datas.js --build         # first rebuild datas/datas.json from the Word files, then seed
 *   node datas.js --all           # include specialties marked enabled:false (e.g. NURSING)
 *   node datas.js --only=STOM,PED # limit to the given specialty codes
 *   node datas.js --dry-run       # parse + validate + print what would change, no writes
 *   node datas.js --file=path.json
 *
 * What it does (idempotent — safe to run again after updating the Word files):
 *   1. adds any missing columns the current models need (no destructive ALTERs)
 *   2. upserts the 5 specialties (matched by `code`, falling back to legacy names)
 *   3. upserts every module (matched by specialty + order_index) and REPLACES its
 *      grammar / vocabulary / phrasebook / tests with the content from datas.json
 *   4. leaves users, groups, conversations and results untouched
 *
 * Environment: reads backend/.env (DB_HOST, DB_USER, DB_PASS, DB_NAME …).
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');
const { Specialty, Module, Grammar, Vocabulary, Phrasebook, Test } = require('./src/models');
const config = require('./scripts/config');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const a = { build: false, all: false, only: null, dryRun: false, file: null };
  for (const x of argv) {
    if (x === '--build') a.build = true;
    else if (x === '--all') a.all = true;
    else if (x === '--dry-run') a.dryRun = true;
    else if (x.startsWith('--only=')) a.only = x.slice(7).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    else if (x.startsWith('--file=')) a.file = x.slice(7);
    else if (x === '-h' || x === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
  }
  return a;
}

const { ensureColumns: ensureColumnsShared } = require('./src/services/schema.service');
const ensureColumns = (checkOnly = false) => ensureColumnsShared({ checkOnly, log: console.log });

const LEGACY_NAMES = {
  STOM:      ['stomatologiya', 'stomatology', 'dentistry', 'стоматология'],
  GEN_MED:   ['davolash ishi', 'general medicine', 'лечебное дело', 'davolash'],
  PED:       ['pediatriya ishi', 'pediatriya', 'pediatrics', 'педиатрия'],
  NURSING:   ['hamshiralik ishi', 'nursing', 'nursery', 'сестринское дело', 'hamshiralik'],
  FIRST_AID: ['tez tibbiy yordam', 'first aid', 'emergency medicine', 'скорая медицинская помощь', 'first aid (emergency medicine)'],
};

async function upsertSpecialty(s, dryRun) {
  let row = null;
  try { row = await Specialty.findOne({ where: { code: s.code } }); } catch (_) { /* column not added yet (dry run on an old schema) */ }
  if (!row) {
    const all = await Specialty.findAll({ attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en'] });
    const names = LEGACY_NAMES[s.code] || [];
    row = all.find(r => !r.code && [r.name, r.name_uz, r.name_en, r.name_ru].filter(Boolean).some(n => names.includes(String(n).trim().toLowerCase()))) || null;
  }
  const values = { code: s.code, name: s.name, name_uz: s.name_uz, name_ru: s.name_ru, name_en: s.name_en, icon: s.icon, student_role: s.student_role };
  if (dryRun) return { row, created: !row };
  if (row) { await row.update(values); return { row, created: false }; }
  row = await Specialty.create(values);
  return { row, created: true };
}

function grammarRows(moduleId, grammar) {
  return grammar.map((g, i) => ({
    module_id: moduleId,
    title: g.title, title_uz: g.title_uz || g.title, title_ru: g.title_ru || g.title, title_en: g.title_en || g.title,
    rule_explanation:    g.rule_explanation_uz || g.rule_explanation_en || g.rule_explanation_ru || '',
    rule_explanation_uz: g.rule_explanation_uz || '',
    rule_explanation_ru: g.rule_explanation_ru || '',
    rule_explanation_en: g.rule_explanation_en || (g.structure_pattern ? `Structure: ${g.structure_pattern}${g.signal_words ? `. Signal words: ${g.signal_words}` : ''}` : ''),
    structure_pattern:    g.structure_pattern || '',
    structure_pattern_uz: g.structure_pattern_uz || g.structure_pattern || '',
    structure_pattern_ru: g.structure_pattern_ru || g.structure_pattern || '',
    structure_pattern_en: g.structure_pattern_en || g.structure_pattern || '',
    examples: (g.examples || []).map(e => ({
      sentence: e.sentence,
      translation: e.translation_uz || '', translation_uz: e.translation_uz || '', translation_ru: e.translation_ru || '', translation_en: e.translation_en || '',
      note: e.note || '', note_uz: e.note_uz || '', note_ru: e.note_ru || '', note_en: e.note_en || '',
    })),
    common_mistakes: (g.common_mistakes || []).map(m => ({
      incorrect: m.incorrect, correct: m.correct,
      explanation: m.explanation || '', explanation_uz: m.explanation_uz || m.explanation || '', explanation_ru: m.explanation_ru || '', explanation_en: m.explanation_en || '',
    })),
    step_order: g.step_order || i + 1,
  }));
}

function vocabularyRows(moduleId, vocabulary) {
  return vocabulary.map(v => ({
    module_id: moduleId,
    word: v.word,
    pronunciation: v.pronunciation || null,
    translation:    v.translation_uz || v.translation_ru || '',
    translation_uz: v.translation_uz || '',
    translation_ru: v.translation_ru || '',
    translation_en: v.definition_en || '',
    definition:     v.definition_en || null,
    definition_uz:  null,
    definition_ru:  null,
    definition_en:  v.definition_en || null,
    example: v.example || null,
  }));
}

function phrasebookRows(moduleId, phrasebook) {
  return phrasebook.map((p, i) => ({
    module_id: moduleId,
    category: (p.category || 'Clinical Communication').slice(0, 100),
    phrase: p.phrase.slice(0, 255),
    pronunciation: p.pronunciation || null,
    hint_uz: p.translation_uz || null,
    hint_ru: p.translation_ru || null,
    hint_en: p.clinical_use || null,
    translation_uz: (p.translation_uz || '').slice(0, 255) || null,
    translation_ru: (p.translation_ru || '').slice(0, 255) || null,
    translation_en: null,
    patient_response: p.patient_response || null,
    patient_response_uz: p.patient_response_uz || null,
    patient_response_ru: p.patient_response_ru || null,
    step_order: p.step_order || i + 1,
  }));
}

function testRows(moduleId, tests) {
  return tests.map(t => ({ module_id: moduleId, ...t }));
}

async function seedModule(specialtyRow, m, dryRun) {
  const where = { specialty_id: specialtyRow.id, order_index: m.order_index };
  const values = {
    ...where,
    title: m.title, title_uz: m.title_uz, title_ru: m.title_ru, title_en: m.title_en,
    description: m.description_uz || m.description, description_uz: m.description_uz, description_ru: m.description_ru, description_en: m.description_en,
    patient_context: JSON.stringify(m.scenario.practice),
    final_challenge_context: JSON.stringify(m.scenario.final_challenge),
    grammar_focus: m.grammar_focus || null,
    reference_dialogue: m.dialogue || [],
  };
  let row = await Module.findOne({ where, attributes: ['id'] });
  const created = !row;
  if (dryRun) return { created, counts: { grammar: m.grammar.length, vocabulary: m.vocabulary.length, phrasebook: m.phrasebook.length, tests: m.tests.length } };

  await sequelize.transaction(async (t) => {
    if (row) await Module.update(values, { where: { id: row.id }, transaction: t });
    else row = await Module.create(values, { transaction: t });
    const id = row.id;
    await Promise.all([
      Grammar.destroy({ where: { module_id: id }, transaction: t }),
      Vocabulary.destroy({ where: { module_id: id }, transaction: t }),
      Phrasebook.destroy({ where: { module_id: id }, transaction: t }),
      Test.destroy({ where: { module_id: id }, transaction: t }),
    ]);
    if (m.grammar.length)    await Grammar.bulkCreate(grammarRows(id, m.grammar), { transaction: t });
    if (m.vocabulary.length) await Vocabulary.bulkCreate(vocabularyRows(id, m.vocabulary), { transaction: t });
    if (m.phrasebook.length) await Phrasebook.bulkCreate(phrasebookRows(id, m.phrasebook), { transaction: t });
    if (m.tests.length)      await Test.bulkCreate(testRows(id, m.tests), { transaction: t });
  });
  return { created, counts: { grammar: m.grammar.length, vocabulary: m.vocabulary.length, phrasebook: m.phrasebook.length, tests: m.tests.length } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = path.resolve(ROOT, args.file || config.OUTPUT_FILE);

  if (args.build || !fs.existsSync(file)) {
    console.log(args.build ? '🔨 --build: datas/ ichidagi Word fayllardan datas.json qayta yig\'ilmoqda…' : `ℹ  ${path.relative(ROOT, file)} topilmadi — Word fayllardan yig'ilmoqda…`);
    const { build, printSummary } = require('./scripts/build_datas');
    const data = build({});
    fs.writeFileSync(file, JSON.stringify(data, null, 1), 'utf8');
    printSummary(data);
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const selected = data.specialties.filter(s => (args.all || s.enabled) && (!args.only || args.only.includes(s.code)));
  if (!selected.length) { console.error('❌ Hech qanday yo\'nalish tanlanmadi (enabled=false bo\'lsa --all yoki --only=CODE ishlating).'); process.exit(1); }

  console.log(`\n📦 Manba: ${path.relative(ROOT, file)} (yaratilgan: ${data.generated_at})`);
  console.log(`🎯 Yo'nalishlar: ${selected.map(s => `${s.code} (${s.modules.length} modul)`).join(', ')}${args.dryRun ? '  [DRY RUN]' : ''}`);

  await sequelize.authenticate();
  console.log('✅ MySQL ulanish muvaffaqiyatli');
  if (!args.dryRun) {
    await sequelize.sync();                 // creates missing tables only
    console.log('🧱 Ustunlar tekshirilmoqda…');
    const added = await ensureColumns();
    console.log(added ? `   ${added} ta yangi ustun qo'shildi` : '   barcha ustunlar mavjud');
  } else {
    const missing = await ensureColumns(true);
    console.log(missing ? `🧱 [DRY RUN] ${missing} ta ustun qo'shilishi kerak bo'ladi` : '🧱 barcha ustunlar mavjud');
  }

  const totals = { specialties_created: 0, modules_created: 0, modules_updated: 0, grammar: 0, vocabulary: 0, phrasebook: 0, tests: 0 };
  for (const s of selected) {
    const { row, created } = await upsertSpecialty(s, args.dryRun);
    if (created) totals.specialties_created++;
    console.log(`\n${s.icon || '•'} ${s.name} / ${s.name_en}  [${s.code}] → specialty_id=${row ? row.id : '(new)'}${created ? ' (yangi)' : ''}`);
    for (const m of s.modules) {
      if (!row) { console.log(`   ${String(m.order_index).padStart(2)}. ${m.title}  (dry run — specialty not yet in DB)`); continue; }
      const r = await seedModule(row, m, args.dryRun);
      if (r.created) totals.modules_created++; else totals.modules_updated++;
      totals.grammar += r.counts.grammar; totals.vocabulary += r.counts.vocabulary; totals.phrasebook += r.counts.phrasebook; totals.tests += r.counts.tests;
      console.log(`   ${String(m.order_index).padStart(2)}. ${m.title.padEnd(58)} G=${String(r.counts.grammar).padStart(2)} V=${String(r.counts.vocabulary).padStart(3)} P=${String(r.counts.phrasebook).padStart(3)} T=${String(r.counts.tests).padStart(2)} ${r.created ? '➕ yangi' : '♻ yangilandi'}`);
    }
  }

  console.log(`\n🎉 Tayyor${args.dryRun ? ' (dry run — hech narsa yozilmadi)' : ''}:`);
  console.log(`   yo'nalishlar: +${totals.specialties_created} yangi | modullar: +${totals.modules_created} yangi, ${totals.modules_updated} yangilandi`);
  console.log(`   grammatika: ${totals.grammar} | lug'at: ${totals.vocabulary} | iboralar: ${totals.phrasebook} | testlar: ${totals.tests}`);
  if (data.warnings && data.warnings.length) {
    console.log(`\n⚠  Manba fayllar bo'yicha ogohlantirishlar (${data.warnings.length}):`);
    data.warnings.forEach(w => console.log('   - ' + w));
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('\n❌ Xatolik:', err.message); if (err.original) console.error('   ', err.original.message || err.original); process.exit(1); });
