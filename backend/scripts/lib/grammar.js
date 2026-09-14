/**
 * Grammar-file extraction.
 *
 * Every grammar document is a sequence of numbered sections
 * ("1. PRESENT PERFECT CONTINUOUS — …", "2. PAST CONTINUOUS", …). Inside a section
 * the authors mix, in no fixed order:
 *   - a "Form / Formula / Structure" line          → structure_pattern
 *   - dialogue example sentences (paragraphs or     → examples[] with uz / ru translations
 *     tables such as "Dialogue example | O‘zbekcha | Русский")
 *   - Uzbek / Russian / English explanations        → rule_explanation_{uz,ru,en}
 *   - ❌ / ✅ pairs or "Incorrect | Correct" tables  → common_mistakes[]
 *   - practice tasks, answer keys, key takeaways    → skipped / module-level notes
 *
 * The output is one grammar rule per real section, in document order, plus
 * module-level notes (overview text and any glossary lines) the builder can reuse.
 */
const T = require('./text');

const GRAMMAR_WORDS = /\b(perfect|simple|continuous|progressive|conditional|modal|passive|active|relative|reported|indirect|gerund|infinitive|article|determiner|comparative|superlative|adverb|adjective|imperative|question|tense|clause|speech|voice|participle|preposition|quantifier|countable|uncountable|future|past|present|pattern|structure|expression|verb|noun|pronoun|going to|will|used to|wish|since|for|form|formula|contrast|vs\.?|versus|time expression|signal|linking|connector|cause|effect|sequence|modifier|be going|have to|must|should|can|could|may|might|would)\b/i;
const SKIP_SECTION = /\b(task|practice|exercise|answer key|answers|quiz|speaking task|worksheet|test yourself|fill in|gap fill|homework|mashq|упражнени|answer)\b/i;
const OVERVIEW_SECTION = /\b(grammar focus|overview|introduction|kirish|key takeaway|takeaway|summary|xulosa|итог|conclusion|review of previous|previous modules|quick review|grammar review)\b/i;
const LANG_EXPL_SECTION = /(russian explanation|по-русски|ruscha tushuntirish|o'?zbekcha explanation|uzbek explanation|o'?zbekcha tushuntirish)/i;
const KEY_LANGUAGE_SECTION = /\b(key clinical language|key vocabulary|key language|useful expressions|clinical language)\b/i;

const CMP_HEADER = /^(present perfect|past simple|past continuous|present simple|present continuous|future simple|past perfect|will|be going to|going to|must|have to|each|every|say|tell|countable|uncountable|active|passive|full relative clause|full form|full sentence|reduced form|incorrect|correct|type|tense|modal|structure|pattern|formula|form|grammar|conditional|relative word|quantifier|verb|expression|signal|adverb|connector|adjective|comparative|superlative|positive|negative|question)/i;

const GENERIC_TITLE = /^(formula|form|structure|examples?|dialogue examples?|clinical examples?|compare|comparison|contrast|meaning|why|use|usage|key pattern|useful clinical pattern|important clinical pattern|patterns?)$/i;

function isSectionHeading(line) {
  const h = T.headingInfo(line);
  if (!h) return null;
  const text = h.text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();   // drop "(uz / ru)" echoes of the title
  if (!text) return null;
  if (h.kind === 'alpha' && !GRAMMAR_WORDS.test(text) && !T.isMostlyUpper(text)) return null;
  if (/[.!?]$/.test(text) && !T.isMostlyUpper(text)) return null;                // "1. A past event has a present consequence."
  if (T.wordCount(text) > 14) return null;
  const out = { ...h, text };
  if (T.isMostlyUpper(text)) return out;
  if (T.looksLikeTitle(text) && (GRAMMAR_WORDS.test(text) || SKIP_SECTION.test(text) || OVERVIEW_SECTION.test(text) || GENERIC_TITLE.test(text))) return out;
  if (GRAMMAR_WORDS.test(text) && T.wordCount(text) <= 12 && !T.looksLikeUtterance(text)) return out;
  return null;
}

function cleanTitle(raw) {
  let t = T.clean(raw).replace(/\n.*$/s, '');
  t = t.replace(/^\d{1,2}[.)]?\s*[—:-]?\s*/, '').replace(/\s*[—:-]\s*(formula|form|dialogue examples?|examples?|structure)\s*$/i, '').trim();
  if (T.isMostlyUpper(t)) t = T.titleCase(t).replace(/\bVs\b/g, 'vs').replace(/\bAnd\b/g, 'and').replace(/\bOf\b/g, 'of').replace(/\bIn\b/g, 'in').replace(/\bFor\b/g, 'for').replace(/\bWith\b/g, 'with').replace(/\bThe\b/g, 'the').replace(/\bTo\b/g, 'to').replace(/\bA\b/g, 'a');
  return t.replace(/^[a-z]/, c => c.toUpperCase());
}

function baseTopic(title) {
  return T.keyOf(title.split(/\s+[—:]\s+/)[0]).replace(/\b(formula|form|dialogue examples?|examples?|structure|contrast|comparison)\b/g, '').trim();
}

function isFormulaLine(line) {
  const t = T.clean(line);
  if (!t || t.length > 140 || /[?!]$/.test(t)) return false;
  if (T.stripLabel(t, 'formInline') !== null) return true;
  if (!t.includes(' + ') && !/\bV[123]\b|V-ing|past participle|base form|\bbe \+|modal \+/.test(t)) return false;
  if (T.cyrillicRatio(t) > 0.3) return false;
  const uzWords = T.detectLang(t.replace(/[+→/()]/g, ' ')) === 'uz';
  return !uzWords || /\+/.test(t);
}

function normalizeFormula(line) {
  let t = T.clean(line);
  const inl = T.stripLabel(t, 'formInline');
  if (inl !== null) {
    const label = t.slice(0, t.length - inl.length).replace(/\s*[:—-]\s*$/, '').trim();
    t = /^(positive|negative|question|wh-question)$/i.test(label) ? `${T.titleCase(label)}: ${inl}` : inl;
  }
  // "If + Present Simple → will / can + V1": the arrow is part of the formula, keep it (a "→ example sentence" tail is dropped)
  const parts = t.split(/\s*→\s*/);
  if (parts.length > 1 && (parts[1].includes(' + ') || /^(will|would|can|could|should|may|might|must)\b/i.test(parts[1])) && !/[.?!]$/.test(parts[1])) return `${parts[0].trim()} → ${parts[1].trim()}`;
  return parts[0].trim();
}

const META_TERMS = /\b((present|past|future) (perfect|simple|continuous|progressive)|conditional|passive voice|active voice|gerund|infinitive|relative clause|reported speech|modal verb|participle|quantifier|determiner|comparative|superlative|imperative)\b/i;

function isEnglishExample(line) {
  const t = T.stripQuotes(T.clean(line));
  if (!t || T.cyrillicRatio(t) > 0.1) return false;
  if (T.isMostlyUpper(t) || /:$/.test(t) || /^→/.test(t)) return false;
  if (META_TERMS.test(t) && !/^"/.test(T.clean(line))) return false;
  if (t.includes('—')) { const tail = t.split('—').pop(); if (T.detectLang(tail) !== 'en') return false; }
  if (T.detectLang(t) !== 'en') return false;
  if (isFormulaLine(t) && !/[.?!]$/.test(t)) return false;
  if (/^(form|formula|structure|compare|examples?|clinical examples?|dialogue examples?|useful clinical pattern|key pattern|important|focus|meaning|why|note|signal words?|when do we use it|used for|use:|active:|passive:|full:|reduced:)/i.test(t)) return false;
  if (/^(present|past|future) (simple|perfect|continuous)/i.test(t) && T.wordCount(t) <= 4) return false;
  const wc = T.wordCount(t);
  if (wc < 3 || wc > 40) return false;
  if (/[.?!…]["')]*$/.test(t)) return true;
  return wc >= 4 && /^[A-Z"']/.test(t) && !GRAMMAR_WORDS.test(t.replace(/\b(for|since|will|can|could|may|might|must|should|would|have to|going to)\b/gi, ''));
}

function isExplanation(line, lang) {
  const t = T.clean(line);
  if (T.wordCount(t) < 5) return false;
  const l = T.detectLang(t);
  if (lang === 'ru') return l === 'ru';
  if (lang === 'uz') return l === 'uz';
  if (l !== 'en' || isEnglishExample(t) || isFormulaLine(t)) return false;
  return /\b(use|used|uses|using|describe|describes|express|expresses|refers|means|focus|when|tense|structure|form|helps|shows|talk about|indicate|indicates|emphasi|important|common|typical|pattern|rule|clause|question|sentence|verb)\b/i.test(t) && T.wordCount(t) >= 7;
}

function makeRule(title) {
  return {
    title, title_uz: '', title_ru: '',
    structure_pattern: '',
    rule_explanation_uz: [], rule_explanation_ru: [], rule_explanation_en: [],
    examples: [], common_mistakes: [], signal_words: '',
    _base: baseTopic(title),
  };
}

function isRealExample(s) {
  if (!s || T.wordCount(s) < 2 || s.length < 6) return false;
  if (/→|:$/.test(s) || T.isMostlyUpper(s)) return false;
  if (T.cyrillicRatio(s) > 0.1 || T.detectLang(s) !== 'en') return false;
  if (/^\d+[.)]\s/.test(s)) return false;
  if (META_TERMS.test(s) && !/^["']/.test(s)) return false;
  if (/\b(bu|va|uchun|ya'ni|emas|bo'ladi)\b/i.test(s)) return false;
  return true;
}

function addExample(rule, sentence, uz = '', ru = '', note = '') {
  const s = T.stripQuotes(sentence);
  if (!isRealExample(s)) return;
  // a 1–2 word Uzbek/Russian cell next to a full sentence is a meaning label ("maslahat"), not a translation
  if (uz && T.wordCount(uz) <= 2 && T.wordCount(s) >= 4) { note = note || uz; uz = ''; }
  if (ru && T.wordCount(ru) <= 2 && T.wordCount(s) >= 4) { note = note || ru; ru = ''; }
  if (uz && T.detectLang(uz) === 'en' && T.cyrillicRatio(uz) === 0 && !/[oOgG]'/.test(uz)) { note = note || uz; uz = ''; }
  if (rule.examples.some(e => T.keyOf(e.sentence) === T.keyOf(s))) {
    const e = rule.examples.find(e => T.keyOf(e.sentence) === T.keyOf(s));
    if (uz && !e.translation_uz) e.translation_uz = T.normalizeUz(T.stripQuotes(uz));
    if (ru && !e.translation_ru) e.translation_ru = T.stripQuotes(ru);
    if (note && !e.note) e.note = note;
    return;
  }
  rule.examples.push({ sentence: s, translation_uz: T.normalizeUz(T.stripQuotes(uz)), translation_ru: T.stripQuotes(ru), note: T.clean(note) });
}

function addMistake(rule, incorrect, correct, explanation = '') {
  const i = T.clean(incorrect).replace(/^[❌✗✘×x]\s*/i, '').trim();
  const c = T.clean(correct).replace(/^[✅✓✔]\s*/, '').trim();
  if (!i || !c || i === c) return;
  if (rule.common_mistakes.some(m => T.keyOf(m.incorrect) === T.keyOf(i))) return;
  rule.common_mistakes.push({ incorrect: i, correct: c, explanation: T.clean(explanation) });
}

// ── tables inside a grammar section ──────────────────────────────────────────
function tableRoles(header) {
  return header.map(h => {
    const c = T.clean(h).toLowerCase();
    if (!c) return 'other';
    if (/^(#|№|no\.?)$/.test(c)) return 'idx';
    if (/incorrect|wrong|noto'g'ri|неправильно|❌/.test(c)) return 'incorrect';
    if (/^correct|to'g'ri|правильно|✅/.test(c)) return 'correct';
    if (/o'?zbek|uzbek|^uz$|tarjima|meaning in uzbek|uzbek explanation/.test(c)) return 'uz';
    if (/рус|russian|ruscha|^ru$/.test(c)) return 'ru';
    if (/example|misol|пример|english|dialogue|dialog|sentence|gap|clinical idea|clinical use/.test(c)) return 'en';
    if (/formula|structure|pattern|form$|rule|signal|tense|grammar|type|modal|conditional|quantifier|relative word|verb|connector|adverb|expression|word|full relative|full form|full sentence|reduced form|active|passive|positive|negative|question|countable|uncountable|adjective|comparative|superlative|time expression/.test(c)) return 'formula';
    if (/meaning|why|use|analysis|function|note|izoh|farqi|difference|ma'nosi|vazifasi|ishlatilishi|использование|значение|clinical difference|analysis/.test(c)) return 'note';
    return 'other';
  });
}

function absorbTable(rule, rows) {
  if (!rows || rows.length < 2) return;
  const header = rows[0];
  const roles = tableRoles(header);
  const idx = r => roles.indexOf(r);
  const get = (row, r) => { const i = idx(r); return i >= 0 && i < row.length ? T.clean(row[i]) : ''; };

  // Incorrect | Correct [| Why / uz / ru]
  if (idx('incorrect') >= 0 && idx('correct') >= 0) {
    for (const row of rows.slice(1)) {
      const why = [get(row, 'note'), get(row, 'uz'), get(row, 'ru'), get(row, 'en')].filter(Boolean).join(' — ');
      addMistake(rule, get(row, 'incorrect'), get(row, 'correct'), why);
    }
    return;
  }

  // Header cells that are themselves comparisons: "Present Perfect | Present Perfect Continuous | Clinical difference"
  const cmpCols = header.map((h, i) => (CMP_HEADER.test(T.clean(h)) && roles[i] !== 'note' && roles[i] !== 'uz' && roles[i] !== 'ru') ? i : -1).filter(i => i >= 0);
  const enCol = idx('en');

  if (enCol >= 0) {
    const formulaCol = idx('formula');
    for (const row of rows.slice(1)) {
      const en = get(row, 'en');
      if (!en) continue;
      const enLines = T.splitLines(en);
      let note = get(row, 'note');
      if (formulaCol >= 0) {
        const f = get(row, 'formula');
        note = [f, note].filter(Boolean).join(' — ');
        if (f && (f.includes(' + ') || /\bV[123]\b|V-ing/.test(f)) && !rule.structure_pattern.includes(f)) rule.structure_pattern = rule.structure_pattern ? `${rule.structure_pattern} | ${f}` : f;
      }
      const uz = get(row, 'uz'), ru = get(row, 'ru');
      if (T.cyrillicRatio(en) > 0.4) continue;
      if ((en.includes(' + ') || /\bV[123]\b|V-ing/.test(en)) && !/[.?!]$/.test(en)) {
        if (!rule.structure_pattern.includes(en)) rule.structure_pattern = rule.structure_pattern ? `${rule.structure_pattern} | ${en}` : en;
        if (uz && T.wordCount(uz) >= 3) rule.rule_explanation_uz.push(`${en} — ${uz}`);
        if (ru && T.wordCount(ru) >= 3) rule.rule_explanation_ru.push(`${en} — ${ru}`);
        continue;
      }
      if (enLines.length > 1 && enLines.every(l => T.detectLang(l) === 'en')) enLines.forEach(l => addExample(rule, l, '', '', note));
      else addExample(rule, en, uz, ru, note);
    }
    return;
  }

  if (cmpCols.length >= 2) {
    // comparison table: each cell of a comparison column is an example, the column header is the note
    const noteCol = idx('note');
    for (const row of rows.slice(1)) {
      const noteVal = noteCol >= 0 ? T.clean(row[noteCol]) : '';
      for (const c of cmpCols) {
        const cell = T.clean(row[c] || '');
        if (!cell) continue;
        const label = T.clean(header[c]);
        if (T.detectLang(cell) === 'en' && (T.looksLikeSentence(cell) || T.wordCount(cell) >= 3)) {
          addExample(rule, cell, '', '', [label, noteVal].filter(Boolean).join(' — '));
        } else if (T.detectLang(cell) === 'uz' || T.detectLang(cell) === 'ru') {
          const target = T.detectLang(cell) === 'uz' ? rule.rule_explanation_uz : rule.rule_explanation_ru;
          target.push(`${label}: ${cell}`);
        } else if (cell.includes(' + ') || /\bV[123]\b|V-ing/.test(cell)) {
          rule.structure_pattern = rule.structure_pattern ? `${rule.structure_pattern} | ${label}: ${cell}` : `${label}: ${cell}`;
        }
      }
    }
    return;
  }

  // Formula | uz | ru  (e.g. "Passive structure | O‘zbekcha | Русский", "Relative word | Ishlatilishi")
  if (idx('formula') >= 0) {
    for (const row of rows.slice(1)) {
      const f = get(row, 'formula'); if (!f) continue;
      const uz = get(row, 'uz'), ru = get(row, 'ru'), note = get(row, 'note');
      if (T.detectLang(f) === 'en' && (T.looksLikeSentence(f) || T.wordCount(f) >= 4)) addExample(rule, f, uz, ru, note);
      else rule._glossary.push({ en: f, uz: uz || (T.detectLang(note) === 'uz' ? note : ''), ru });
    }
  }
}

// ── main ────────────────────────────────────────────────────────────────────
/**
 * @param {Array} blocks - readDocx() output
 * @returns {{rules: object[], overview: {uz:string,ru:string,en:string}, glossary: object[], grammar_focus: string|null, title: string|null}}
 */
function parseGrammarDoc(blocks) {
  // 1. flatten into a line stream, keeping tables as objects
  const stream = [];
  for (const b of blocks) {
    if (b.type === 'p') T.splitLines(b.text).forEach(l => stream.push({ kind: 'line', text: l }));
    else stream.push({ kind: 'table', rows: b.rows });
  }

  // 2. header (before first numbered section)
  let grammar_focus = null, title = null;
  const preamble = [];

  // 3. split into sections
  const sections = [];
  let cur = null, lastNum = 0;
  for (const item of stream) {
    if (item.kind === 'line') {
      let h = isSectionHeading(item.text);
      if (h && h.kind === 'num' && cur && h.num <= 3 && h.num < lastNum && !T.isMostlyUpper(h.text)) h = null; // "1. Permission — …" sub-list inside a section
      if (h) { if (h.kind === 'num') lastNum = h.num; cur = { heading: h.text, items: [] }; sections.push(cur); continue; }
      const gf = item.text.match(/grammar\s*(?:&\s*communication\s*)?focus\s*[:—-]\s*(.+)/i) || item.text.match(/^main grammar\s*[:—-]\s*(.+)/i);
      if (gf && !grammar_focus) grammar_focus = gf[1].trim();
      if (!cur) { preamble.push(item.text); continue; }
    } else if (!cur) { preamble.push(item); continue; }
    cur.items.push(item);
  }
  // doc title guess from preamble
  for (const p of preamble) {
    if (typeof p !== 'string') continue;
    const t = p.replace(/^module\s*\d*\s*[—:-]?\s*/i, '').trim();
    if (t && /grammar/i.test(t) && T.detectLang(t) === 'en' && !title && T.wordCount(t) <= 12) title = t.replace(/^(grammar\s*(file|focus|guide|review)?\s*[—:-]?\s*)/i, '').trim() || null;
  }

  // 4. classify sections
  const rules = [];
  const overview = { uz: [], ru: [], en: [] };
  const glossary = [];
  const lang = { uz: [], ru: [] };

  const collectText = (sec) => sec.items.filter(i => i.kind === 'line').map(i => i.text);

  for (const sec of sections) {
    const head = sec.heading;
    if (SKIP_SECTION.test(head) && !GRAMMAR_WORDS.test(head.replace(/task|practice/gi, ''))) continue;
    if (SKIP_SECTION.test(head)) continue;
    if (LANG_EXPL_SECTION.test(head)) {
      const target = /russian|по-русски|ruscha/i.test(head) ? 'ru' : 'uz';
      for (const l of collectText(sec)) {
        if (l.includes('→')) { const [en, tr] = l.split(/\s*→\s*/); if (en && tr) glossary.push({ example: T.stripQuotes(en), [target]: tr }); continue; }
        if (T.detectLang(l) === target || (target === 'uz' && T.detectLang(l) !== 'ru')) lang[target].push(l);
      }
      continue;
    }
    if (KEY_LANGUAGE_SECTION.test(head)) {
      for (const l of collectText(sec)) {
        const parts = l.split(/\s+—\s+/);
        if (parts.length >= 2 && T.detectLang(parts[0]) === 'en') glossary.push({ en: parts[0], uz: parts.find((p, i) => i > 0 && T.detectLang(p) === 'uz') || '', ru: parts.find(p => T.detectLang(p) === 'ru') || '' });
      }
      continue;
    }
    if (OVERVIEW_SECTION.test(head) && !GRAMMAR_WORDS.test(head.replace(/grammar focus|grammar review/gi, ''))) {
      for (const l of collectText(sec)) {
        const d = T.detectLang(l);
        if (T.wordCount(l) >= 4 && (d === 'uz' || d === 'ru' || d === 'en')) overview[d].push(l);
      }
      continue;
    }

    // a real grammar rule section
    const ruleTitle = cleanTitle(head);
    const prev = rules[rules.length - 1];
    const generic = GENERIC_TITLE.test(ruleTitle) || !baseTopic(ruleTitle);
    const rule = prev && (generic || (prev._base && prev._base === baseTopic(ruleTitle))) ? prev : makeRule(ruleTitle);
    if (rule !== prev) { rule._glossary = []; rules.push(rule); }

    let awaitingForm = false, lastExample = null, pendingIncorrect = null;
    for (const item of sec.items) {
      if (item.kind === 'table') { absorbTable(rule, item.rows); lastExample = null; continue; }
      const line = item.text;

      // "Form" / "Structure" label followed by the formula on the next line
      if (T.stripLabel(line, 'form') !== null && T.LABELS.form.test(line)) { awaitingForm = true; continue; }
      if (awaitingForm) {
        awaitingForm = false;
        if (line.length <= 140 && !isEnglishExample(line)) { const f = normalizeFormula(line); if (f && !rule.structure_pattern.includes(f)) rule.structure_pattern = rule.structure_pattern ? `${rule.structure_pattern} | ${f}` : f; continue; }
      }

      // ❌ / ✅ pairs
      const bad = line.match(/^[❌✗✘]\s*(.+?)(?:\s+[✅✓✔]\s*(.+))?$/);
      if (bad) { if (bad[2]) addMistake(rule, bad[1], bad[2]); else pendingIncorrect = bad[1]; continue; }
      const good = line.match(/^[✅✓✔]\s*(.+)$/);
      if (good) { if (pendingIncorrect) { addMistake(rule, pendingIncorrect, good[1]); pendingIncorrect = null; } continue; }
      const incLine = line.match(/^(?:incorrect|wrong|noto'g'ri)\s*[:—-]\s*(.+)$/i);
      if (incLine) { pendingIncorrect = incLine[1]; continue; }
      const corLine = line.match(/^(?:correct|to'g'ri)\s*[:—-]\s*(.+)$/i);
      if (corLine) { if (pendingIncorrect) { addMistake(rule, pendingIncorrect, corLine[1]); pendingIncorrect = null; } continue; }

      // signal words
      const sig = line.match(/^signal words?\s*[:—-]\s*(.+)$/i);
      if (sig) { rule.signal_words = sig[1].trim(); continue; }

      // "English → uz/ru" translation lines
      if (line.includes('→')) {
        const [left, right] = line.split(/\s*→\s*/);
        const leftIsFormula = left && (left.includes(' + ') || T.stripLabel(left, 'formInline') !== null);
        const leftIsLabel = left && right && !leftIsFormula && !isEnglishExample(left) && T.wordCount(left) <= 8 && isEnglishExample(right);
        if (leftIsLabel) { addExample(rule, right, '', '', left.replace(/:$/, '')); lastExample = rule.examples[rule.examples.length - 1] || null; continue; }
        if (left && right && !leftIsFormula && !isEnglishExample(left) && !isEnglishExample(right)) {
          const d = T.detectLang(line.replace(/→/g, ' '));
          if (T.wordCount(line) >= 4) (d === 'ru' ? rule.rule_explanation_ru : d === 'uz' ? rule.rule_explanation_uz : rule.rule_explanation_en).push(line.replace(/\s*→\s*/g, ' → '));
          continue;
        }
        if (left && right && !leftIsFormula && isEnglishExample(left)) {
          const d = T.detectLang(right);
          addExample(rule, left, d === 'uz' ? right : '', d === 'ru' ? right : '', d === 'en' ? right : '');
          lastExample = rule.examples.find(e => T.keyOf(e.sentence) === T.keyOf(T.stripQuotes(left))) || null;
          continue;
        }
        if (left && (leftIsFormula || isFormulaLine(left))) { const f = normalizeFormula(left); if (f && !rule.structure_pattern.includes(f)) rule.structure_pattern = rule.structure_pattern ? `${rule.structure_pattern} | ${f}` : f; if (right && isEnglishExample(right)) addExample(rule, right, '', '', f); continue; }
      }

      if (/:$/.test(line) && T.wordCount(line) <= 6) continue;            // "Bu dialogda:", "In our example:"
      if (/^→/.test(line)) {                                             // "→ baholay olardik."
        const tail = line.replace(/^→\s*/, '');
        const dl = T.detectLang(tail);
        if (lastExample && dl === 'uz' && !lastExample.translation_uz) lastExample.translation_uz = T.normalizeUz(tail);
        else if (lastExample && dl === 'ru' && !lastExample.translation_ru) lastExample.translation_ru = tail;
        else if (lastExample && dl === 'en' && !lastExample.note) lastExample.note = tail;
        continue;
      }
      // labelled example ("Misol: "…"") and translations of the previous example
      const ex = T.stripLabel(line, 'example');
      if (ex !== null) { addExample(rule, ex); lastExample = rule.examples[rule.examples.length - 1]; continue; }
      const uzL = T.stripLabel(line, 'uz');
      if (uzL !== null) { if (lastExample && !lastExample.translation_uz && T.wordCount(uzL) <= T.wordCount(lastExample.sentence) * 3 + 4) lastExample.translation_uz = T.normalizeUz(uzL); else if (T.wordCount(uzL) >= 4) rule.rule_explanation_uz.push(uzL); continue; }
      const ruL = T.stripLabel(line, 'ru');
      if (ruL !== null) { if (lastExample && !lastExample.translation_ru && T.wordCount(ruL) <= T.wordCount(lastExample.sentence) * 3 + 4) lastExample.translation_ru = ruL; else if (T.wordCount(ruL) >= 4) rule.rule_explanation_ru.push(ruL); continue; }
      const useL = T.stripLabel(line, 'use');
      if (useL !== null) { if (lastExample && !lastExample.note) lastExample.note = useL; else if (T.detectLang(useL) === 'uz') rule.rule_explanation_uz.push(useL); else if (T.detectLang(useL) === 'ru') rule.rule_explanation_ru.push(useL); else rule.rule_explanation_en.push(useL); continue; }

      // formula lines
      if (isFormulaLine(line) && !isEnglishExample(line)) { const f = normalizeFormula(line); if (f && !rule.structure_pattern.includes(f)) rule.structure_pattern = rule.structure_pattern ? `${rule.structure_pattern} | ${f}` : f; continue; }

      // plain example sentences and explanations
      const d = T.detectLang(line);
      if (d === 'en' && isEnglishExample(line)) { addExample(rule, line); lastExample = rule.examples[rule.examples.length - 1]; continue; }
      if (d === 'uz') {
        const wc = T.wordCount(line);
        if (lastExample && !lastExample.translation_uz && wc >= 3 && wc <= T.wordCount(lastExample.sentence) * 2.5 + 3 && !/\b(ya'ni|ishlatiladi|bildiradi|ifodalaydi|qo'llaniladi)\b/i.test(line)) lastExample.translation_uz = T.normalizeUz(line);
        else if (lastExample && wc <= 2 && !lastExample.note) lastExample.note = line;
        else if (wc >= 4) rule.rule_explanation_uz.push(line);
        continue;
      }
      if (d === 'ru') { if (lastExample && !lastExample.translation_ru && T.wordCount(line) <= T.wordCount(lastExample.sentence) * 2.5 + 3 && !/используется|описывает|обозначает|выражает/i.test(line)) lastExample.translation_ru = line; else if (T.wordCount(line) >= 4) rule.rule_explanation_ru.push(line); continue; }
      if (d === 'en' && isExplanation(line, 'en')) { rule.rule_explanation_en.push(line); lastExample = null; continue; }
    }
  }

  // 5. finalise
  const finalRules = rules
    .map((r, i) => {
      const glos = r._glossary || [];
      delete r._glossary; delete r._base;
      glossary.push(...glos.map(g => ({ ...g, rule: r.title })));
      const join = (arr, max) => T.truncate(T.uniqBy(arr, x => T.keyOf(x)).join(' '), max);
      return {
        title: r.title,
        structure_pattern: T.truncate(r.structure_pattern, 250),
        signal_words: r.signal_words,
        rule_explanation_uz: join(r.rule_explanation_uz, 900),
        rule_explanation_ru: join(r.rule_explanation_ru, 900),
        rule_explanation_en: join(r.rule_explanation_en, 900),
        examples: r.examples.slice(0, 12),
        common_mistakes: r.common_mistakes.slice(0, 8),
        step_order: i + 1,
      };
    })
    .filter(r => r.examples.length || r.structure_pattern || r.rule_explanation_uz || r.rule_explanation_ru || r.rule_explanation_en);

  return {
    title, grammar_focus,
    rules: finalRules,
    overview: { uz: T.truncate(lang.uz.concat(overview.uz).join(' '), 1200), ru: T.truncate(lang.ru.concat(overview.ru).join(' '), 1200), en: T.truncate(overview.en.join(' '), 1200) },
    glossary,
  };
}

module.exports = { parseGrammarDoc, isSectionHeading };
