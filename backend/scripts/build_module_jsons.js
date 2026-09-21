const fs = require('fs');
const path = require('path');
const config = require('./config');
const { readDocx } = require('./lib/docx');
const T = require('./lib/text');
const { parseDialogueDoc } = require('./lib/dialogue');
const { parseLexiconDoc } = require('./lib/lexicon');
const { parseGrammarDoc } = require('./lib/grammar');
const { buildScenario, buildQuizzes, attachExamples } = require('./lib/generate');
const { enrichRule, fillExampleTranslations } = require('./lib/enrich');
const { normalizeGrammar } = require('./lib/normalize_grammar');


const ROOT = path.resolve(__dirname, '..', '..');
const DATAS = path.join(ROOT, config.DATAS_DIR);

function moduleNumber(dirName) {
  const m = dirName.match(/(\d{1,2})/);
  return m ? parseInt(m[1], 10) : null;
}

function classifyByName(file) {
  const b = path.basename(file).toLowerCase();
  if (/gramm/.test(b)) return 'grammar';
  if (/vocab|phrase|smart|lug/.test(b)) return 'lexicon';
  if (/dialog|dialogue|conversation|suhbat/.test(b)) return 'dialogue';
  return null;
}

function classifyByContent(blocks) {
  const text = blocks.filter(b => b.type === 'p').map(b => b.text).join('\n');
  const firstLines = T.splitLines(text).slice(0, 6).join(' ').toLowerCase();
  const turns = parseDialogueDoc(blocks).turns.length;
  if (turns >= 6) return 'dialogue';
  if (/grammar|grammatika|грамматика/.test(firstLines)) return 'grammar';
  if (/vocab|phrasebook|smart phrase/.test(firstLines)) return 'lexicon';
  const lex = parseLexiconDoc(blocks);
  if (lex.vocabulary.length + lex.phrases.length >= 8) return 'lexicon';
  if (parseGrammarDoc(blocks).rules.length) return 'grammar';
  return null;
}

function listDocx(dir) {
  return fs.readdirSync(dir)
    .filter(f => /\.docx$/i.test(f) && !f.startsWith('~$'))
    .map(f => path.join(dir, f))
    .sort();
}

function buildModule(spec, num, dir, warnings, verbose, overrides = null) {
  const files = listDocx(dir);
  const parts = { dialogue: [], grammar: [], lexicon: [] };
  const sources = [];

  for (const file of files) {
    const rel = path.relative(DATAS, file);
    if (fs.statSync(file).size === 0) { warnings.push(`${rel}: empty file (0 bytes) — skipped`); continue; }
    let blocks;
    try { blocks = readDocx(file); } catch (e) { warnings.push(`${rel}: ${e.message}`); continue; }
    let kind = classifyByName(file);
    if (!kind) kind = classifyByContent(blocks);
    if (!kind) { warnings.push(`${rel}: could not determine document type — skipped`); continue; }
    sources.push({ file: rel, kind });
    if (kind === 'dialogue') parts.dialogue.push(parseDialogueDoc(blocks));
    else if (kind === 'grammar') parts.grammar.push(parseGrammarDoc(blocks));
    else parts.lexicon.push(parseLexiconDoc(blocks));
  }

  const dialogue = parts.dialogue.sort((a, b) => b.turns.length - a.turns.length)[0] || { turns: [], title: null, grammar_focus: null, header: [] };
  let vocabulary = T.mergeBy(parts.lexicon.flatMap(l => l.vocabulary), v => T.keyOf(v.word));
  let phrases = T.mergeBy(parts.lexicon.flatMap(l => l.phrases), p => T.keyOf(p.phrase));
  const grammarDocs = parts.grammar;

  const known = new Set(vocabulary.map(v => T.keyOf(v.word)));
  for (const g of grammarDocs) {
    for (const item of g.glossary || []) {
      if (!item.en || known.has(T.keyOf(item.en)) || T.wordCount(item.en) > 5 || T.looksLikeSentence(item.en) || /\s\+\s|^\s*grammar\s+focus/i.test(item.en)) continue;
      known.add(T.keyOf(item.en));
      vocabulary.push({ word: item.en, translation_uz: T.normalizeUz(item.uz || ''), translation_ru: item.ru || '', pronunciation: '', definition_en: '', example: '', source: 'grammar-glossary' });
    }
  }

  let rules = [];
  const GRAMMAR_TERM = /perfect|simple|continuous|conditional|modal|passive|relative|reported|gerund|infinitive|article|determiner|comparative|superlative|adverb|imperative|question|tense|clause|participle|quantifier|future|going to/i;
  const gf = spec.grammar_focus?.[num]
    || grammarDocs.map(g => g.grammar_focus).find(x => x && GRAMMAR_TERM.test(x))
    || (dialogue.grammar_focus && GRAMMAR_TERM.test(dialogue.grammar_focus) ? dialogue.grammar_focus : null)
    || grammarDocs.map(g => g.title).find(x => x && GRAMMAR_TERM.test(x))
    || null;
  const overview = grammarDocs.map(g => g.overview).find(o => o && (o.uz || o.ru || o.en));
  if (overview && (overview.uz || overview.ru)) {
    rules.push({
      title: gf ? `Grammar focus: ${gf}` : 'Grammar focus',
      title_en: gf ? `Grammar focus: ${gf}` : 'Grammar focus',
      title_uz: gf ? `Modul grammatikasi: ${gf}` : 'Modul grammatikasi',
      _keep_titles: true,
      title_ru: gf ? `Грамматика модуля: ${gf}` : 'Грамматика модуля',
      structure_pattern: '',
      rule_explanation_uz: overview.uz, rule_explanation_ru: overview.ru, rule_explanation_en: overview.en,
      examples: [], common_mistakes: [], step_order: 0,
    });
  }
  for (const g of grammarDocs) for (const r of g.rules) rules.push({ ...r, title_uz: r.title, title_ru: r.title });

  const extraFile = path.join(dir, 'module_extra.json');
  let extraTests = [];
  if (fs.existsSync(extraFile)) {
    try {
      const extra = JSON.parse(fs.readFileSync(extraFile, 'utf8'));
      for (const r of extra.grammar || []) rules.push({ examples: [], common_mistakes: [], structure_pattern: '', rule_explanation_uz: '', rule_explanation_ru: '', rule_explanation_en: '', ...r, title_uz: r.title_uz || r.title, title_ru: r.title_ru || r.title });
      for (const v of extra.vocabulary || []) if (v.word && !known.has(T.keyOf(v.word))) { known.add(T.keyOf(v.word)); vocabulary.push({ pronunciation: '', translation_ru: '', definition_en: '', example: '', ...v, source: 'module_extra.json' }); }
      for (const p of extra.phrasebook || []) if (p.phrase) phrases.push({ category: 'Clinical Communication', translation_uz: '', translation_ru: '', pronunciation: '', clinical_use: '', patient_response: '', patient_response_uz: '', patient_response_ru: '', ...p, source: 'module_extra.json' });
      extraTests = extra.tests || [];
      sources.push({ file: path.relative(DATAS, extraFile), kind: 'extra' });
    } catch (e) { warnings.push(`${path.relative(DATAS, extraFile)}: ${e.message}`); }
  }
  phrases = T.mergeBy(phrases, p => T.keyOf(p.phrase));
  phrases = phrases.filter(p => !/^[→➜►]/.test(p.phrase || ''));
  for (const p of phrases) if (/^[→➜►]/.test(p.translation_uz || '')) p.translation_uz = '';

  const translated = fillExampleTranslations(rules, phrases, dialogue.turns);
  rules.forEach(r => enrichRule(r));
  if (overrides?.grammar) {
    for (const r of rules) {
      const ov = overrides.grammar[`${num}|${r.title}`] || overrides.grammar[`${num}|${r.title_en}`];
      if (ov) Object.assign(r, ov);
    }
  }
  if (overrides?.example_notes) {
    for (const r of rules) for (const ex of r.examples || []) {
      const key = Object.keys(overrides.example_notes).find(k => {
        const [n, title, prefix] = k.split('|');
        return +n === num && (title === r.title || title === r.title_en) && (ex.sentence || '').startsWith(prefix);
      });
      if (key) Object.assign(ex, overrides.example_notes[key]);
    }
  }

  for (const r of rules) for (const ex of r.examples || []) {
    const PLACEHOLDER = /^\s*(o['ʻ’]zbekcha tushuntirish|tushuntirish|izoh|объяснение на русском|перевод|explanation in english)\s*\.?\s*$/i;
    for (const f of ['note', 'translation_uz', 'translation_ru', 'translation_en']) if (ex[f] && PLACEHOLDER.test(ex[f])) ex[f] = '';
  }
  if (overrides?.example_translations) {
    for (const r of rules) for (const ex of r.examples || []) {
      const tr = overrides.example_translations[(ex.sentence || '').trim()];
      if (!tr) continue;
      if (!ex.translation_uz && tr.translation_uz) ex.translation_uz = tr.translation_uz;
      if (!ex.translation_ru && tr.translation_ru) ex.translation_ru = tr.translation_ru;
    }
  }

  const conf = spec.modules[num];
  const title_en = conf ? conf[0] : (dialogue.title ? T.titleCase(dialogue.title) : `Module ${num}`);
  const title_uz = conf ? conf[1] : title_en;
  const title_ru = conf ? conf[2] : title_en;
  if (!conf) warnings.push(`${spec.code} module ${num}: no title in config — using "${title_en}"`);

  rules = normalizeGrammar(rules, { spec, title: title_en, gf, dialogue: dialogue.turns, phrases });
  if (overrides?.example_translations) {
    for (const r of rules) for (const ex of r.examples || []) {
      const tr = overrides.example_translations[(ex.sentence || '').trim()] || overrides.example_translations[(ex.sentence || '').trim().replace(/[.?!]$/, '')];
      if (!tr) continue;
      if (!ex.translation_uz && tr.translation_uz) ex.translation_uz = tr.translation_uz;
      if (!ex.translation_ru && tr.translation_ru) ex.translation_ru = tr.translation_ru;
    }
  }
  if (overrides?.mistake_explanations) {
    for (const r of rules) for (const m of r.common_mistakes || []) {
      const ov = overrides.mistake_explanations[(m.incorrect || '').trim()];
      if (!ov) continue;
      for (const k of ['explanation_en', 'explanation_uz', 'explanation_ru']) if (!m[k] && ov[k]) m[k] = ov[k];
      m.explanation = m.explanation_en || m.explanation;
    }
  }

  if (overrides?.phrase_translations) {
    for (const p of phrases) {
      const tr = overrides.phrase_translations[(p.phrase || '').trim()];
      if (!tr) continue;
      if (!p.translation_uz && tr.translation_uz) p.translation_uz = tr.translation_uz;
      if ((!p.translation_ru || !/[Ѐ-ӿ]/.test(p.translation_ru)) && tr.translation_ru) p.translation_ru = tr.translation_ru;
    }
  }
  vocabulary = attachExamples(vocabulary, dialogue.turns, phrases);
  if (overrides?.vocabulary) {
    for (const v of vocabulary) {
      const ov = overrides.vocabulary[`${num}|${v.word}`];
      if (ov) Object.assign(v, ov);
    }
  }

  const scenario = buildScenario({ spec, moduleIndex: num, title: title_en, dialogue, vocabulary, phrases });
  const tests = [...buildQuizzes({ spec, moduleIndex: num, vocabulary, phrases, grammar: rules }), ...extraTests];

  const description_en = `Clinical communication module: ${title_en}.${gf ? ` Grammar focus: ${gf}.` : ''} Includes a reference ${spec.student_role === 'nurse' ? 'nurse–patient' : 'doctor–patient'} dialogue, ${vocabulary.length} vocabulary items, ${phrases.length} smart phrases, ${rules.length} grammar points and a virtual patient simulation.`;
  const description_uz = spec.descriptions_uz?.[num]
    || `${title_uz} mavzusida klinik muloqot moduli.${gf ? ` Grammatika: ${gf}.` : ''} Namunaviy dialog, ${vocabulary.length} ta atama, ${phrases.length} ta smart ibora, ${rules.length} ta grammatik qoida va virtual bemor bilan simulyatsiya.`;
  const description_ru = `Модуль клинического общения: ${title_ru}.${gf ? ` Грамматика: ${gf}.` : ''} Эталонный диалог, ${vocabulary.length} терминов, ${phrases.length} smart-фраз, ${rules.length} грамматических тем и симуляция с виртуальным пациентом.`;

  const mod = {
    specialty_code: spec.code,
    order_index: num,
    title: title_en, title_uz, title_ru, title_en,
    description: description_uz, description_uz, description_ru, description_en,
    grammar_focus: gf,
    level: 'B2',
    dialogue: dialogue.turns.map(t => ({ role: t.role, label: t.label, text: t.text })),
    vocabulary: vocabulary.map(v => ({
      word: v.word, pronunciation: v.pronunciation || '',
      translation_uz: v.translation_uz || '', translation_ru: v.translation_ru || '',
      definition_en: v.definition_en || '', example: v.example || '',
    })),
    phrasebook: phrases.map((p, i) => ({
      category: p.category, phrase: p.phrase, pronunciation: p.pronunciation || '',
      translation_uz: p.translation_uz || '', translation_ru: p.translation_ru || '',
      clinical_use: p.clinical_use || '',
      patient_response: p.patient_response || '', patient_response_uz: p.patient_response_uz || '', patient_response_ru: p.patient_response_ru || '',
      step_order: i + 1,
    })),
    grammar: rules,
    tests,
    scenario,
    sources,
    stats: {
      dialogue_turns: dialogue.turns.length, vocabulary: vocabulary.length, phrases: phrases.length,
      grammar_rules: rules.length, grammar_examples: rules.reduce((a, r) => a + r.examples.length, 0), grammar_examples_translated_from_phrasebook: translated, tests: tests.length,
      vocab_with_ru: vocabulary.filter(v => v.translation_ru).length, phrases_with_ru: phrases.filter(p => p.translation_ru).length,
    },
  };

  if (!dialogue.turns.length) warnings.push(`${spec.code} module ${num}: no dialogue file found — scenario built from title only`);
  if (!vocabulary.length) warnings.push(`${spec.code} module ${num}: no vocabulary found`);
  if (!phrases.length) warnings.push(`${spec.code} module ${num}: no phrasebook found`);
  if (!rules.length) warnings.push(`${spec.code} module ${num}: no grammar found`);
  if (verbose) console.log(`   ${spec.code} #${String(num).padStart(2)} ${title_en.padEnd(60)} dlg=${String(mod.stats.dialogue_turns).padStart(2)} V=${String(mod.stats.vocabulary).padStart(3)} P=${String(mod.stats.phrases).padStart(3)} G=${String(mod.stats.grammar_rules).padStart(2)} T=${mod.stats.tests}`);
  return mod;
}

function build() {
    const warnings = [];
    for (const spec of config.specialties) {
        const dir = path.join(DATAS, spec.folder);
        if (!fs.existsSync(dir)) {
            warnings.push(`${spec.code}: folder \"${spec.folder}\" not found under ${config.DATAS_DIR}/`);
            continue;
        }
        const moduleDirs = fs.readdirSync(dir)
            .filter(f => fs.statSync(path.join(dir, f)).isDirectory() && /module/i.test(f) && moduleNumber(f))
            .map(f => ({ num: moduleNumber(f), dir: path.join(dir, f) }))
            .sort((a, b) => a.num - b.num);

        let overrides = null;
        const ovFile = path.join(dir, 'i18n_overrides.json');
        if (fs.existsSync(ovFile)) {
            try { overrides = JSON.parse(fs.readFileSync(ovFile, 'utf8')); }
            catch (e) { warnings.push(`${path.relative(DATAS, ovFile)}: ${e.message}`); }
        }

        for (const m of moduleDirs) {
            const moduleData = buildModule(spec, m.num, m.dir, warnings, true, overrides);
            const {
                dialogue,
                vocabulary,
                phrasebook,
                grammar,
                tests,
                scenario,
                sources,
                stats,
                ...metadata
            } = moduleData;

            const jsonDir = path.join(m.dir, 'json');
            if (!fs.existsSync(jsonDir)) {
                fs.mkdirSync(jsonDir, { recursive: true });
            }

            const writeJson = (fileName, data) => {
                if (!data || (Array.isArray(data) && data.length === 0)) return;
                const filePath = path.join(jsonDir, fileName);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 1), 'utf8');
                console.log(`✅ Wrote ${path.relative(ROOT, filePath)}`);
            };

            writeJson('metadata.json', metadata);
            writeJson('dialogue.json', dialogue);
            writeJson('vocabulary.json', vocabulary);
            writeJson('phrasebook.json', phrasebook);
            writeJson('grammar.json', grammar);
            writeJson('tests.json', tests);
            writeJson('scenario.json', scenario);
            writeJson('sources.json', sources);
            writeJson('stats.json', stats);
        }
    }

    if (warnings.length) {
        console.log(`\n⚠  ${warnings.length} warning(s):`);
        warnings.forEach(w => console.log('   - ' + w));
    }
}

build();
