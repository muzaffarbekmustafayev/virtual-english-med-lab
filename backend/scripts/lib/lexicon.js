/**
 * Vocabulary & Smart Phrasebook extraction from the "Vocabulary / Smart Phrasebook"
 * Word files. The source documents were written by several authors, so the parser
 * accepts every layout seen in datas/:
 *
 *  - 4-6 column tables  : English | Pronunciation | Uzbek | Russian [| Clinical meaning]
 *  - staged phrase table: Bosqich | Role | English | Talaffuzi | O‘zbekcha | Русский
 *  - dentistry 7-col    : Bosqich | Doctor — English | Talaffuzi | O‘zbekcha | Patient — English | O‘zbekcha | Русский
 *  - paragraph blocks   : "Doctor: …" / "Talaffuzi: …" / "O‘zbekcha: …" / "Русский: …" / "Patient: …"
 *                         "1. Phrase ⏎ 🇺🇿 … ⏎ 🇷🇺 …"
 *                         "Phrase ⏎ Uzbek: … ⏎ Russian: … ⏎ Clinical use: …"
 *
 * Every row is classified as a lexical TERM (vocabulary) or an UTTERANCE (phrase)
 * from the section heading it sits under plus a sentence heuristic.
 */
const T = require('./text');

const SECTION_KIND = [
  { re: /vocab|lug['‘’]at|terminolog|key (medical|clinical) (vocabulary|terms)|core clinical vocabulary|словар/i, kind: 'vocab' },
  { re: /phrasebook|smart phrase|phrases|iboralar|фраз/i, kind: 'phrase' },
  { re: /chunk|collocation|phrasal verb|expression|key clinical language|patient language|useful language/i, kind: 'chunk' },
  { re: /distinction|note|eslatma|grammar|speaking task|practice|exercise/i, kind: 'other' },
];

function sectionKindOf(text) {
  for (const s of SECTION_KIND) if (s.re.test(text)) return s.kind;
  return null;
}

/** Turn a heading like "2. SMART PHRASEBOOK — HISTORY TAKING" or "1. Opening — Konsultatsiyani boshlash" into a category label. */
function categoryFromHeading(text) {
  let t = T.stripNumberPrefix(text).replace(/\n.*$/s, '');
  t = t.replace(/^(smart\s+phrasebook|smart\s+phrases?|phrasebook)\s*[—:-]?\s*/i, '');
  const parts = t.split(/\s+[—:|]\s+|\s*\/\s*/).map(s => s.trim()).filter(Boolean);
  const en = parts.filter(p => T.detectLang(p) === 'en');
  let label = parts[0] || t;
  if (en.length) {
    label = en[0];
    if (en.length > 1 && T.wordCount(en[0]) === 1 && T.wordCount(en[1]) > 1) label = en[1];
  }
  label = label.replace(/\s*\(.*?\)\s*$/, '').trim();
  if (!label || /^(smart phrasebook|phrasebook|high-value clinical chunks|clinical chunks|vocabulary)$/i.test(label)) {
    return null;
  }
  if (T.isMostlyUpper(label)) label = label.toLowerCase().replace(/(^|\s|[-&(])\S/g, m => m.toUpperCase());
  return label.length > 60 ? T.truncate(label, 60) : label;
}

// ── table column roles ────────────────────────────────────────────────────────
function columnRoles(header) {
  const roles = [];
  let seenPatient = false;
  header.forEach((h, i) => {
    const c = T.clean(h).toLowerCase();
    let role = 'other';
    if (!c || /^(#|№|no\.?|n|t\/r)$/.test(c)) role = 'idx';
    else if (/patient/.test(c) && /english|—|-/.test(c)) role = 'patient_en';
    else if (/^role$/.test(c)) role = 'role';
    else if (/bosqich|stage|step|category|kategoriya|section|этап/.test(c)) role = 'category';
    else if (/pronunc|talaffuz|ipa|transcription/.test(c)) role = 'pron';
    else if (/o['‘’]?zbek|uzbek|^uz$|tarjima|ma['‘’]no(si)?$|meaning in uzbek/.test(c)) role = seenPatient ? 'patient_uz' : 'uz';
    else if (/рус|russian|ruscha|^ru$|перевод|значение/.test(c) && !/clinical meaning/.test(c)) role = seenPatient ? 'patient_ru' : 'ru';
    else if (/example|misol|пример/.test(c)) role = 'example';
    else if (/clinical (meaning|use|function)|definition|usage|vazifasi|function|how to use|meaning|use\b/.test(c)) role = 'def';
    else if (/english|term|word|vocab|phrase|chunk|collocation|expression|adverb|phrasal|sentence|doctor/.test(c)) role = 'en';
    if (role === 'patient_en') seenPatient = true;
    roles[i] = role;
  });
  if (!roles.includes('en')) {
    const i = roles.findIndex(r => r === 'other');
    if (i >= 0) roles[i] = 'en';
  }
  return roles;
}

function isLexiconTable(rows) {
  if (!rows || rows.length < 2) return false;
  const roles = columnRoles(rows[0]);
  const hasEn = roles.includes('en');
  const hasLang = roles.includes('uz') || roles.includes('ru') || roles.includes('def') || roles.includes('example');
  return hasEn && hasLang;
}

function splitDefinition(cell) {
  // "Russian / Clinical meaning" cells may hold "русский\nClinical meaning: …" or "русский — english"
  const t = T.clean(cell);
  if (!t) return { ru: '', def: '' };
  const ru = [], def = [];
  for (const rawLine of T.splitLines(t)) {
    const line = rawLine.replace(/^clinical meaning\s*[:—-]\s*/i, '');
    for (const part of line.split(/\s+[—|]\s+/)) {
      if (!part.trim()) continue;
      if (T.cyrillicRatio(part) > 0.4) ru.push(part.trim()); else def.push(part.trim());
    }
  }
  return { ru: ru.join(' '), def: def.join(' ') };
}

function makeTerm(en, uz, ru, extra = {}) {
  return {
    word: T.clean(en),
    translation_uz: T.normalizeUz(uz || ''),
    translation_ru: T.clean(ru || ''),
    pronunciation: T.clean(extra.pron || ''),
    definition_en: T.clean(extra.def || ''),
    example: T.clean(extra.example || ''),
    source: extra.source || 'table',
  };
}

function makePhrase(en, uz, ru, extra = {}) {
  return {
    phrase: T.clean(en),
    category: T.clean(extra.category || '') || 'Clinical Communication',
    translation_uz: T.normalizeUz(uz || ''),
    translation_ru: T.clean(ru || ''),
    pronunciation: T.clean(extra.pron || ''),
    clinical_use: T.clean(extra.use || ''),
    patient_response: T.clean(extra.patient || ''),
    patient_response_uz: T.normalizeUz(extra.patient_uz || ''),
    patient_response_ru: T.clean(extra.patient_ru || ''),
    source: extra.source || 'table',
  };
}

// ── table extraction ──────────────────────────────────────────────────────────
function parseLexiconTable(rows, ctx) {
  const out = { vocabulary: [], phrases: [] };
  const roles = columnRoles(rows[0]);
  const col = name => roles.indexOf(name);
  const get = (row, name) => { const i = col(name); return i >= 0 && i < row.length ? T.clean(row[i]) : ''; };
  const staged = col('category') >= 0 || col('role') >= 0 || col('patient_en') >= 0;
  let category = ctx.category || null;
  let lastPhrase = null;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const filled = row.filter(c => T.clean(c));
    if (!filled.length) continue;
    // merged single-cell row acts as a sub-heading
    if (filled.length === 1 && row.length > 2 && T.looksLikeTitle(filled[0]) && !T.looksLikeSentence(filled[0])) {
      const label = categoryFromHeading(filled[0]);
      if (label) category = label;
      continue;
    }
    if (row.join('|') === rows[0].join('|')) continue; // repeated header

    let en = get(row, 'en');
    if (!en && col('en') < 0) en = T.clean(row[0]);
    en = T.stripNumberPrefix(en);
    if (!en || en.length < 2) continue;
    if (/^(english|term|word|phrase)$/i.test(en)) continue;

    const rowCat = get(row, 'category');
    if (rowCat && !/^\d+$/.test(rowCat)) category = categoryFromHeading(rowCat) || rowCat;

    let uz = get(row, 'uz'), ru = get(row, 'ru');
    const { ru: ru2, def: def2 } = splitDefinition(get(row, 'def'));
    if (!ru && ru2) ru = ru2;
    const def = def2;
    // swap if the author put Russian in the "Uzbek" column or vice versa
    if (uz && T.cyrillicRatio(uz) > 0.5 && !(ru && T.cyrillicRatio(ru) > 0.5)) { const t = uz; uz = ru; ru = t; }
    const pron = get(row, 'pron');
    const example = get(row, 'example');
    const role = get(row, 'role').toLowerCase();
    const patientEn = get(row, 'patient_en');

    // Multi-line "English" cells: "phrase\nUzbek: …\nRussian: …"
    const enLines = T.splitLines(en);
    if (enLines.length > 1) {
      en = enLines[0];
      for (const l of enLines.slice(1)) {
        const u = T.stripLabel(l, 'uz'), rr = T.stripLabel(l, 'ru');
        if (u && !uz) uz = u; else if (rr && !ru) ru = rr;
      }
    }

    const isPatientRow = /patient|bemor|parent|relative|mother|father|пациент/.test(role);
    if (isPatientRow) {
      if (lastPhrase && !lastPhrase.patient_response) {
        lastPhrase.patient_response = en;
        lastPhrase.patient_response_uz = T.normalizeUz(uz);
        lastPhrase.patient_response_ru = ru;
      }
      continue;
    }

    const treatAsPhrase = staged
      || ctx.kind === 'phrase'
      || ((ctx.kind === 'vocab' || ctx.kind === 'chunk') ? T.looksLikeUtterance(en) : T.looksLikeSentence(en));
    if (treatAsPhrase) {
      const p = makePhrase(en, uz, ru, {
        category, pron, use: def,
        patient: patientEn, patient_uz: get(row, 'patient_uz'), patient_ru: get(row, 'patient_ru'),
      });
      out.phrases.push(p);
      lastPhrase = p;
    } else {
      out.vocabulary.push(makeTerm(en, uz, ru, { pron, def, example }));
    }
  }
  return out;
}

// ── paragraph extraction ──────────────────────────────────────────────────────
function parseLexiconParagraphs(lines, ctxStart) {
  const out = { vocabulary: [], phrases: [] };
  let kind = ctxStart.kind || null;
  let category = ctxStart.category || null;
  let cur = null;            // current phrase being filled
  let curSide = 'doctor';    // 'doctor' | 'patient' — which utterance the next uz/ru line belongs to

  const flush = () => { cur = null; curSide = 'doctor'; };

  for (const raw of lines) {
    const line = T.clean(raw);
    if (!line) continue;

    // section / stage headings
    const h = T.headingInfo(line);
    const sk = sectionKindOf(line);
    if (sk && ((h && T.looksLikeTitle(h.text)) || T.looksLikeTitle(line))) {
      kind = sk;
      if (kind === 'phrase' || kind === 'chunk') category = categoryFromHeading(line) || (kind === 'chunk' ? 'Clinical Chunks' : category);
      flush();
      continue;
    }
    if (h && T.looksLikeTitle(h.text) && T.detectLang(h.text) !== 'ru' && !/^(doctor|patient)/i.test(h.text)) {
      // "1. Opening — Opening the consultation", "A. Discussing Vaccination History"
      const label = categoryFromHeading(line);
      if (label && T.detectLang(label) !== 'uz') { category = label; if (!kind) kind = 'phrase'; flush(); continue; }
    }
    // bare translated heading lines under a category (uz / ru echo of the heading)
    if (!cur && T.wordCount(line) <= 8 && T.detectLang(line) !== 'en' && T.stripLabel(line, 'uz') === null && T.stripLabel(line, 'ru') === null) continue;

    // labelled lines
    const pron = T.stripLabel(line, 'pron');
    if (pron !== null) { if (cur) cur.pronunciation = cur.pronunciation || pron; continue; }
    const uz = T.stripLabel(line, 'uz');
    if (uz !== null) {
      if (cur) {
        if (curSide === 'patient') cur.patient_response_uz = cur.patient_response_uz || T.normalizeUz(uz);
        else cur.translation_uz = cur.translation_uz || T.normalizeUz(uz);
      }
      continue;
    }
    const ru = T.stripLabel(line, 'ru');
    if (ru !== null) {
      if (cur) {
        if (curSide === 'patient') cur.patient_response_ru = cur.patient_response_ru || ru;
        else cur.translation_ru = cur.translation_ru || ru;
      }
      continue;
    }
    const use = T.stripLabel(line, 'use');
    if (use !== null) { if (cur) cur.clinical_use = cur.clinical_use || use; continue; }
    if (T.stripLabel(line, 'alt') !== null) continue;

    const doc = T.stripLabel(line, 'doctor');
    if (doc !== null) {
      cur = makePhrase(doc, '', '', { category, source: 'paragraph' });
      out.phrases.push(cur); curSide = 'doctor'; kind = kind || 'phrase';
      continue;
    }
    const pat = T.stripLabel(line, 'patient');
    if (pat !== null) {
      if (cur && !cur.patient_response) { cur.patient_response = pat; curSide = 'patient'; }
      continue;
    }

    // "term — uz — ru" glossary lines
    const dash = line.split(/\s+—\s+/);
    if ((kind === 'vocab' || kind === 'chunk') && dash.length >= 2 && dash.length <= 4 && T.detectLang(dash[0]) === 'en'
        && !T.looksLikeSentence(dash[0]) && T.wordCount(dash[0]) <= 7 && !/^module\b/i.test(dash[0])
        && dash.slice(1).every(p => p.length <= 80 && !/[.!?]$/.test(p))) {
      const rest = dash.slice(1);
      const uzP = rest.find(p => T.detectLang(p) === 'uz') || (T.detectLang(rest[0]) !== 'ru' ? rest[0] : '');
      const ruP = rest.find(p => T.detectLang(p) === 'ru') || '';
      if (uzP || ruP) { out.vocabulary.push(makeTerm(dash[0], uzP, ruP, { source: 'paragraph' })); flush(); continue; }
    }

    // unlabeled translation lines following a phrase (flag emojis were stripped by clean())
    const lang = T.detectLang(line);
    if (cur && lang === 'uz' && curSide === 'doctor' && !cur.translation_uz) { cur.translation_uz = T.normalizeUz(line); continue; }
    if (cur && lang === 'ru' && curSide === 'doctor' && !cur.translation_ru) { cur.translation_ru = line; continue; }
    if (cur && lang === 'uz' && curSide === 'patient' && !cur.patient_response_uz) { cur.patient_response_uz = T.normalizeUz(line); continue; }
    if (cur && lang === 'ru' && curSide === 'patient' && !cur.patient_response_ru) { cur.patient_response_ru = line; continue; }

    // new English utterance (numbered or bare) inside phrase/chunk sections
    const numbered = /^\d+[.)]\s/.test(line);
    if (lang === 'en' && (kind === 'phrase' || kind === 'chunk' || numbered) && (T.looksLikeSentence(line) || numbered)) {
      const text = T.stripNumberPrefix(line);
      if (T.wordCount(text) >= 2 && !/^(smart phrasebook|vocabulary)/i.test(text)) {
        cur = makePhrase(text, '', '', { category, source: 'paragraph' });
        out.phrases.push(cur); curSide = 'doctor';
      }
      continue;
    }
  }
  return out;
}

// ── document-level driver ─────────────────────────────────────────────────────
/**
 * @param {Array} blocks - output of readDocx()
 * @returns {{vocabulary: object[], phrases: object[]}}
 */
function parseLexiconDoc(blocks) {
  const vocabulary = [], phrases = [];
  let ctx = { kind: null, category: null };
  let pendingLines = [];

  const flushParas = () => {
    if (!pendingLines.length) return;
    const r = parseLexiconParagraphs(pendingLines, ctx);
    vocabulary.push(...r.vocabulary); phrases.push(...r.phrases);
    pendingLines = [];
  };

  for (const b of blocks) {
    if (b.type === 'p') {
      const lines = T.splitLines(b.text);
      for (const line of lines) {
        const sk = sectionKindOf(line);
        const h = T.headingInfo(line);
        if (sk && ((h && T.looksLikeTitle(h.text)) || T.looksLikeTitle(line))) {
          flushParas();
          ctx = { kind: sk, category: sk === 'chunk' ? 'Clinical Chunks' : (categoryFromHeading(line) || null) };
          continue;
        }
        if (h && T.looksLikeTitle(h.text) && T.detectLang(h.text) === 'en') {
          flushParas();
          const label = categoryFromHeading(line);
          if (label) ctx = { kind: ctx.kind || 'phrase', category: label };
          continue;
        }
        pendingLines.push(line);
      }
    } else if (b.type === 'table') {
      flushParas();
      if (!isLexiconTable(b.rows)) continue;
      const r = parseLexiconTable(b.rows, ctx);
      vocabulary.push(...r.vocabulary); phrases.push(...r.phrases);
    }
  }
  flushParas();

  return {
    vocabulary: T.mergeBy(vocabulary, v => T.keyOf(v.word)),
    phrases: T.mergeBy(phrases, p => T.keyOf(p.phrase)),
  };
}

module.exports = { parseLexiconDoc, parseLexiconTable, isLexiconTable, columnRoles, categoryFromHeading, sectionKindOf };
