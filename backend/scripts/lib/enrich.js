/**
 * Post-processing for parsed grammar rules:
 *   - split mixed-language headings into title_en / title_uz / title_ru
 *   - fill missing explanations / formulas from the grammar knowledge base
 *   - copy example translations from the module's phrasebook & dialogue
 *   - fold signal words into the explanations
 */
const T = require('./text');
const { KB, detectTopics } = require('./grammar_kb');

// ── headings ──────────────────────────────────────────────────────────────────
const PHRASES = [
  [/dialogdan olinadigan asosiy patternlar/i, 'Key patterns from the dialogue'],
  [/tez eslab qolish uchun/i, 'Quick reminder'],
  [/ko'rishda tushunish/i, 'Quick reference'],
  [/review: avvalgi modullardagi zamonlar/i, 'Review: tenses from previous modules'],
  [/avvalgi modullardagi zamonlar/i, 'Tenses from previous modules'],
  [/modal fe'llardan keyingi fe'l/i, 'The verb after a modal'],
  [/tibbiy reported speech uchun eng muhim fe'llar/i, 'Key reporting verbs for medical Reported Speech'],
  [/reported speech bilan klinik ma'lumotni ketma-ket yetkazish/i, 'Relaying clinical information with Reported Speech'],
  [/tibbiy muloqotdagi tayyor qoliplar/i, 'ready-made patterns for clinical communication'],
  [/maqsadni ifodalash/i, 'expressing purpose'],
  [/eng muhim klinik strukturalar/i, 'key clinical structures'],
  [/asosiy infinitive namunalar/i, 'key infinitive examples'],
  [/non-defining clauseda vergullar/i, 'Commas in non-defining clauses'],
  [/defining relative clauseda vergul ishlatilmaydi/i, 'No commas in defining relative clauses'],
  [/relative pronounni tushirib qoldirish/i, 'Omitting the relative pronoun'],
  [/zamonning orqaga siljishi/i, 'tense backshift'],
  [/modal verbs nima\??/i, 'What are modal verbs?'],
  [/asosiy qoida/i, 'Basic rule'],
  [/bemorga ko'rsatma berish/i, 'giving instructions to the patient'],
  [/hamshiralik amaliyotida/i, 'in nursing practice'],
  [/muloyim so'rov/i, 'polite request'],
  [/shart emas/i, 'not necessary'],
  [/mumkin emas/i, 'not allowed'],
  [/tashqi qoida yoki talab/i, 'external rule or requirement'],
  [/qat'iy majburiyat/i, 'strong obligation'],
  [/qat'iy taqiq/i, 'strict prohibition'],
  [/tavsiya va tibbiy maslahat/i, 'recommendation and medical advice'],
  [/tavsiya etilmaydi/i, 'not recommended'],
  [/ruxsat va imkoniyat/i, 'permission and ability'],
  [/ruxsat va ehtimol/i, 'permission and possibility'],
  [/asosiy farqlar/i, 'key differences'],
  [/muhim farq/i, 'key difference'],
  [/^\s*(.+?) bilan savollar\s*$/i, ' Questions with $1 '],
  [/^\s*(.+?) bilan inkor\s*$/i, ' Negatives with $1 '],
  [/va passive form/i, 'and the passive form'],
];
const WORDS = {
  farqi: 'vs', farqlar: 'differences', farq: 'difference', bilan: 'with', uchun: 'for', va: 'and', dan: 'from',
  nima: 'what', asosiy: 'key', qoida: 'rule', qoidalar: 'rules', savollar: 'questions', savol: 'question', inkor: 'negation',
  ehtimol: 'possibility', ehtimoliyat: 'possibility', ehtimollik: 'possibility', ruxsat: 'permission', imkoniyat: 'ability',
  majburiyat: 'obligation', taqiq: 'prohibition', tavsiya: 'advice', maslahat: 'advice', tibbiy: 'medical', klinik: 'clinical',
  zamon: 'tense', zamonlar: 'tenses', gap: 'sentence', gaplar: 'sentences', "so'roq": 'question', buyruq: 'imperative',
  "o'tgan": 'past', hozirgi: 'present', kelasi: 'future', davomli: 'continuous', tugallangan: 'perfect', oddiy: 'simple',
  holat: 'state', harakat: 'action', voqea: 'event', namuna: 'example', namunalar: 'examples', qolip: 'pattern', qoliplar: 'patterns',
  struktura: 'structure', strukturalar: 'structures', "fe'l": 'verb', "fe'llar": 'verbs', ot: 'noun', otlar: 'nouns', sifat: 'adjective',
  ravish: 'adverb', ravishlar: 'adverbs', shart: 'conditional', tur: 'type', birinchi: 'first', ikkinchi: 'second', uchinchi: 'third',
  eng: 'most', muhim: 'important', "ma'no": 'meaning', "ma'nosi": 'meaning', ishlatilishi: 'usage', yasalishi: 'formation',
  bemor: 'patient', bemorga: 'to the patient', hamshira: 'nurse', modul: 'module', xatolar: 'mistakes', xato: 'mistake',
  tekshirish: 'checking', holatni: 'the condition', "qila olish": 'ability',
  ravishlar: 'adverbs', ravish: 'adverb', 'asta-sekin': 'gradually', sinchiklab: 'carefully', ehtiyotkorlik: 'care', tezlik: 'speed', darajani: 'degree',
  bildiruvchi: 'expressing', ergash: 'subordinate', vaqtda: 'at the same time', paytida: 'while', sabab: 'cause', natija: 'result',
  keyingi: 'after', oldingi: 'before', hozirgacha: 'up to now', davom: 'continuing', etayotgan: 'ongoing', takroriy: 'repeated', odatiy: 'habitual',
  "ko'rsatma": 'instruction', tavsiyalar: 'recommendations', maqsad: 'purpose', maqsadni: 'purpose', ifodalash: 'expressing', klinik: 'clinical',
};

function uzToEn(text) {
  let t = ' ' + T.clean(text) + ' ';
  for (const [re, en] of PHRASES) t = t.replace(re, en);
  // postposition patterns: "X va Y farqi" → "X vs Y", "X bilan" → "with X", "X uchun" → "for X", "X dan Y" → "Y from X"
  t = t.replace(/(\S+) va (\S+) farqi/i, '$1 vs $2');
  t = t.replace(/^\s*(\w+) (".+?"|'.+?') bilan\s*$/i, ' $1 with $2 ');
  t = t.replace(/^\s*(.+?) bilan\s*$/i, ' with $1 ');
  t = t.replace(/^\s*(.+?) uchun\s*$/i, ' for $1 ');
  t = t.replace(/^\s*(.+?) dan (.+?)\s*$/i, ' $2 from $1 ');
  t = t.replace(/[A-Za-z'’]+/g, w => {
    const k = w.toLowerCase().replace(/’/g, "'");
    return WORDS[k] !== undefined ? WORDS[k] : w;
  });
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

const UZ_HEADING_WORDS = new Set(("va uchun bilan nima farqi farqlar qoida qoidalar zamon zamonlar gap gaplar fe'l fe'llar savol savollar inkor ehtimol ruxsat imkoniyat majburiyat taqiq tavsiya maslahat tibbiy klinik holat harakat voqea namuna namunalar qolip qoliplar struktura strukturalar shart tur birinchi ikkinchi uchinchi eng muhim ma'no ma'nosi ishlatilishi yasalishi bemor bemorga hamshira xato xatolar tekshirish tushunish eslab qolish avvalgi modullardagi asosiy tayyor ketma-ket yetkazish ifodalash orqaga siljishi vergul vergullar tushirib qoldirish emas mumkin qat'iy tashqi talab dan").split(' '));
function hasUzEvidence(p) {
  const low = p.toLowerCase();
  if (Object.keys(WORDS).some(w => new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(low))) return true;
  if (/[og]'/.test(low)) return true;
  const words = low.split(/[^a-z']+/).filter(Boolean);
  if (words.some(w => UZ_HEADING_WORDS.has(w))) return true;
  return words.some(w => /q(?!u)|^x[aeiou]/.test(w) || /(moq|yapti|yapman|ladi|ydi|lash|lanish|tirish|ncha|larni|larga|imiz|ingiz|lari)$/.test(w));
}
function isEnglishPart(p) {
  return T.cyrillicRatio(p) < 0.2 && !hasUzEvidence(p);
}

/** "PRESENT SIMPLE — odatiy holat / повелительное наклонение" → { en, uz, ru } */
function splitTitle(raw) {
  const clean = T.clean(raw).replace(/\s*[🔄🆕📌✅❌]+\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/\s+[—–|]\s+|\s+\/\s+/).map(p => p.trim()).filter(Boolean);
  const en = [], uz = [], ru = [];
  for (const p of parts) {
    if (T.cyrillicRatio(p) > 0.4) ru.push(p);
    else if (isEnglishPart(p)) en.push(p);
    else uz.push(p);
  }
  const ACRONYM = /^(DKA|AKI|ECG|EKG|UTI|GI|IV|BP|CPR|ABC|ABCDE|SBAR|FAST|OPQRST|SOCRATES|ORT|ED|ER|ICU|HIV|COPD|TB|CT|MRI|WHO)$/;
  const nice = s => (T.isMostlyUpper(s) ? T.titleCase(s) : s.replace(/\b[A-Z]{4,}\b/g, w => ACRONYM.test(w) ? w : T.titleCase(w))).replace(/\bVs\b/g, 'vs').replace(/\bAnd\b/g, 'and').replace(/\bOf\b/g, 'of').replace(/\bThe\b/g, 'the').replace(/\bIn\b/g, 'in').replace(/\bWith\b/g, 'with').replace(/\bFor\b/g, 'for').replace(/\bTo\b/g, 'to').replace(/\bA\b/g, 'a').replace(/^./, c => c.toUpperCase());

  let title_en;
  if (en.length) title_en = nice(en.join(' — '));
  else if (uz.length) {
    const tr = uzToEn(uz.join(' — '));
    const stillUz = hasUzEvidence(tr);
    if (!stillUz) title_en = nice(tr);
    else {
      const topics = detectTopics(clean, 2);
      title_en = topics.length ? topics.map(k => KB[k].name).join(' & ') : nice(clean);
    }
  } else title_en = nice(clean);

  const core = en.length ? nice(en[0]) : title_en;
  const title_uz = uz.length ? `${core} — ${uz.join(' / ')}` : (en.length ? nice(en.join(' — ')) : clean);
  const title_ru = ru.length ? `${core} — ${ru.join(' / ')}` : title_en;
  return { title_en, title_uz, title_ru };
}

// ── knowledge-base fallbacks ─────────────────────────────────────────────────
const SIGNAL_LABEL = { en: 'Signal words', uz: "Signal so'zlar", ru: 'Сигнальные слова' };

function enrichRule(rule) {
  const preset = rule._keep_titles || (rule.title_uz && rule.title_ru && rule.title_uz !== rule.title && rule.title_ru !== rule.title);
  if (!preset) {
    const { title_en, title_uz, title_ru } = splitTitle(rule.title);
    rule.title = title_en; rule.title_en = title_en; rule.title_uz = title_uz; rule.title_ru = title_ru;
  } else { rule.title_en = rule.title_en || rule.title; }
  delete rule._keep_titles;

  const topics = detectTopics(`${rule.title} ${rule.structure_pattern || ''}`, 2);
  const kb = topics.map(k => KB[k]);
  const join = (lang) => kb.map(k => k[lang]).filter(Boolean).join(' ');

  if (!rule.rule_explanation_en && kb.length) rule.rule_explanation_en = join('en');
  if (!rule.rule_explanation_uz && kb.length) rule.rule_explanation_uz = join('uz');
  if (!rule.rule_explanation_ru && kb.length) rule.rule_explanation_ru = join('ru');
  if (rule.structure_pattern) {
    rule.structure_pattern = rule.structure_pattern
      .split(/\s*\|\s*/)
      .map(f => f.replace(/^(formula\s*\/\s*формула|formula|формула|pattern|struktura|structure|form)\s*[:—-]\s*/i, '').replace(/[🔑📌✅❌🔄🆕]/g, '').trim())
      .filter((f, i, a) => f && a.indexOf(f) === i)
      .join(' | ');
  }
  if (!rule.structure_pattern && kb.length) rule.structure_pattern = kb.map(k => k.formula).filter(Boolean).join(' | ');
  if (!rule.signal_words && kb.length) rule.signal_words = kb.map(k => k.signal).filter(Boolean)[0] || '';

  // explanations that are still missing in one language: fall back to the other languages' text
  if (!rule.rule_explanation_en) rule.rule_explanation_en = rule.structure_pattern ? `Structure: ${rule.structure_pattern}.` : '';
  if (!rule.rule_explanation_ru) rule.rule_explanation_ru = rule.rule_explanation_uz || rule.rule_explanation_en;
  if (!rule.rule_explanation_uz) rule.rule_explanation_uz = rule.rule_explanation_en;

  // English-facing fields must be English: drop Uzbek/Russian formula variants and signal words,
  // and replace a non-English "English" explanation with the knowledge-base text
  const isEn = (x) => x && !/[Ѐ-ӿ]/.test(x) && T.detectLang(x.replace(/[+→/()|]/g, ' ')) !== 'uz' && !/[oOgG]'/.test(x);
  if (rule.structure_pattern) {
    const kept = rule.structure_pattern.split(/s*|s*/).filter(f => f && !/[Ѐ-ӿ]/.test(f) && !/[oOgG]'|(dan|keyin|bilan|uchun|kerak|keladi|ko'pincha)/.test(f));
    rule.structure_pattern = kept.join(' | ') || (kb.length ? kb.map(k => k.formula).filter(Boolean).join(' | ') : '');
  }
  if (rule.signal_words && !isEn(rule.signal_words)) rule.signal_words = kb.map(k => k.signal).filter(Boolean)[0] || '';
  if (rule.rule_explanation_en && !isEn(rule.rule_explanation_en)) rule.rule_explanation_en = kb.length ? join('en') : (rule.structure_pattern ? `Structure: ${rule.structure_pattern}.` : '');
  if (rule.rule_explanation_en) rule.rule_explanation_en = rule.rule_explanation_en.split(/(?<=[.!?])s+/).filter(sn => isEn(sn)).join(' ');
  if (rule.rule_explanation_ru && !/[Ѐ-ӿ]/.test(rule.rule_explanation_ru) && kb.length) rule.rule_explanation_ru = join('ru');

  if (rule.signal_words) {
    for (const lang of ['en', 'uz', 'ru']) {
      const key = `rule_explanation_${lang}`;
      if (rule[key] && !rule[key].includes(rule.signal_words)) rule[key] = `${rule[key]} ${SIGNAL_LABEL[lang]}: ${rule.signal_words}.`;
    }
  }
  rule.topics = topics;
  return rule;
}

// ── example translations from the module's own phrasebook / dialogue ────────
function fillExampleTranslations(rules, phrases = [], dialogueTurns = []) {
  const index = new Map();
  const add = (en, uz, ru) => {
    const k = T.keyOf(T.stripQuotes(en));
    if (!k) return;
    const cur = index.get(k) || { uz: '', ru: '' };
    if (uz && !cur.uz) cur.uz = uz;
    if (ru && !cur.ru) cur.ru = ru;
    index.set(k, cur);
  };
  for (const p of phrases) {
    add(p.phrase, p.translation_uz, p.translation_ru);
    if (p.patient_response) add(p.patient_response, p.patient_response_uz, p.patient_response_ru);
    // sentences inside multi-sentence phrases
    const sents = p.phrase.split(/(?<=[.?!])\s+/);
    if (sents.length > 1) sents.forEach(s => add(s, '', ''));
  }
  // examples already translated elsewhere in the same module
  for (const r of rules) for (const e of r.examples) if (e.translation_uz || e.translation_ru) add(e.sentence, e.translation_uz, e.translation_ru);

  const norm = s => T.keyOf(T.stripQuotes(s)).replace(/\b(i've|i have)\b/g, 'i have').replace(/[’']/g, '');
  const keys = [...index.keys()];
  let filled = 0;
  for (const r of rules) for (const e of r.examples) {
    if (e.translation_uz && e.translation_ru) continue;
    const k = T.keyOf(e.sentence);
    let hit = index.get(k);
    if (!hit) {
      const nk = norm(e.sentence);
      const found = keys.find(x => x.length > 12 && (norm(x) === nk || (nk.length > 25 && (x.includes(nk) || nk.includes(x)) && Math.abs(x.length - nk.length) < 12)));
      if (found) hit = index.get(found);
    }
    if (!hit) continue;
    if (!e.translation_uz && hit.uz) { e.translation_uz = hit.uz; filled++; }
    if (!e.translation_ru && hit.ru) { e.translation_ru = hit.ru; filled++; }
  }
  return filled;
}

module.exports = { splitTitle, enrichRule, fillExampleTranslations, uzToEn };
