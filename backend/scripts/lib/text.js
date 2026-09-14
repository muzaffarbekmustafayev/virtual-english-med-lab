/**
 * Text helpers shared by the .docx parsers: normalisation, language detection,
 * heading / sentence heuristics and label extraction.
 */

const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]/gu;   // any regional-indicator flag emoji
const FLAG_LABELS = [
  [/\u{1F1FA}\u{1F1FF}\s*/gu, 'Uzbek: '],                              // 🇺🇿
  [/\u{1F1F7}\u{1F1FA}\s*/gu, 'Russian: '],                            // 🇷🇺
  [/(?:\u{1F1EC}\u{1F1E7}|\u{1F1FA}\u{1F1F8})\s*/gu, 'English: '],     // 🇬🇧 🇺🇸
];

function clean(text) {
  if (!text) return '';
  let t = String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[​-‍﻿]/g, '');
  for (const [re, label] of FLAG_LABELS) t = t.replace(re, label);
  return t
    .replace(FLAG_RE, '')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[–—]/g, '—')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

/** Uzbek Latin: normalise the o‘ / oʻ / o' apostrophe variants to a plain apostrophe. */
function normalizeUz(text) {
  return clean(text).replace(/([oOgG])['‘’`ʻ]/g, "$1'");
}

function cyrillicRatio(s) {
  const letters = (s.match(/\p{L}/gu) || []).length;
  if (!letters) return 0;
  const cyr = (s.match(/[Ѐ-ӿ]/g) || []).length;
  return cyr / letters;
}

const UZ_WORDS = new Set((
  "va uchun bilan kerak emas yoki agar ham bu shu har lekin ammo deb haqida orqali nima qanday qachon qayer "
  + "bemor shifokor ota ona bola tish og'riq dori kasal holat savol javob misol odatda masalan ushbu ya'ni ayniqsa "
  + "mumkin bo'lsa bo'ladi bo'lgan qilish qiladi qilib olib berish beradi ko'p oz juda yaxshi yomon endi hozir "
  + "kecha bugun ertaga vaqt kun hafta oy yil siz sizni sizga men meni menga uni unga biz bizni ular "
  + "ishlatiladi bildiradi ifodalaydi davom zamon gap so'z fe'l ega tarjima tushuntirish qoida"
).split(' '));
const UZ_SUFFIX = /(lar|lari|ning|dan|gan|kan|qan|moq|ish|lik|siz|chi|yapti|yapman|yapsiz|ladi|adi|ydi|ida|iga|dagi|ingiz|imiz|miz|masa|lash|lanish|lantirish|tirish|inch|ncha)$/;
const EN_STOP = new Set((
  "the a an and or of to in on for with is are was were be been have has had do does did i you he she it we they "
  + "my your his her its our their this that these those what when where why how which who can could will would "
  + "should may might must not no yes please if as at by from into about any some more"
).split(' '));

/** 'ru' | 'uz' | 'en' | 'other' — cheap script / keyword based guess. */
function detectLang(s) {
  const t = clean(s);
  if (!t) return 'other';
  if (cyrillicRatio(t) > 0.4) return 'ru';
  const words = t.toLowerCase().split(/[^a-z']+/).filter(w => w.length > 1);
  if (!words.length) return 'other';
  let en = 0, uzStrong = 0, uzMorph = 0;
  for (const w of words) {
    if (EN_STOP.has(w)) { en++; continue; }
    if (UZ_WORDS.has(w) || /q(?!u)/.test(w) || /[og]'/.test(w) || /^x[aeiou]/.test(w)) { uzStrong++; continue; }
    if ((UZ_SUFFIX.test(w) || (w.length > 6 && /(ni|ga|ni|imni|ingizni|larni|larga)$/.test(w))) && !/^(the|this|that|is|his|has|was|does|did|and|end|kind|find|bad|visa|usa|finish|english|polish|punish|wish|fish|dish|rash|flush|crash|brush|push|rush|wash|cash)$/.test(w)) uzMorph++;
  }
  const n = words.length;
  if (uzStrong >= 2 || (uzStrong >= 1 && n <= 3)) return 'uz';
  if (en >= Math.max(1, n * 0.25) && uzStrong === 0) return 'en';
  if (uzStrong + uzMorph >= Math.max(2, Math.ceil(n * 0.3))) return 'uz';
  if (uzStrong >= 1 && uzMorph >= 1) return 'uz';
  return 'en';
}

function wordCount(s) {
  return clean(s).split(/\s+/).filter(Boolean).length;
}

const SENTENCE_START = /^(i|i'm|i've|i'd|i'll|we|we're|we'll|we've|you|you're|you'll|you've|he|she|it|it's|they|my|your|his|her|please|let's|let|don't|do|does|did|can|could|would|will|shall|should|may|might|must|have|has|had|is|are|was|were|what|when|where|why|how|which|who|tell|take|keep|call|try|avoid|make|give|put|stay|bring|there|that's|this)\b/i;

/** Does this English text read like a full sentence / utterance rather than a lexical term? */
function looksLikeSentence(s) {
  const t = clean(s);
  if (!t) return false;
  const wc = wordCount(t);
  if (/[.?!…]["')]*$/.test(t) && wc >= 2) return true;
  if (wc >= 7) return true;
  if (SENTENCE_START.test(t) && wc >= 3) return true;
  return false;
}

/** Stricter variant used inside vocabulary sections: only unmistakable utterances count. */
function looksLikeUtterance(s) {
  const t = clean(s);
  const wc = wordCount(t);
  if (/[.?!]["')]*$/.test(t) && wc >= 2) return true;
  if (wc >= 8) return true;
  return /^[A-Z]/.test(t) && SENTENCE_START.test(t) && wc >= 4;
}

function isMostlyUpper(s) {
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length > 0.75;
}

/** Title-like line: short, no terminal punctuation, Title Case / UPPER CASE / contains an em dash. */
function looksLikeTitle(s) {
  const t = clean(s).replace(/\n.*$/s, '');
  if (!t || wordCount(t) > 10) return false;
  if (/[.?!;,]$/.test(t)) return false;
  if (t.includes('—') || isMostlyUpper(t)) return true;
  const words = t.split(/\s+/).filter(w => /[A-Za-z]/.test(w));
  if (!words.length) return false;
  const caps = words.filter(w => /^[A-Z]/.test(w)).length;
  return caps / words.length >= 0.5 && !/^(I|I'm|I've|I'd|I'll|We|You|He|She|It|They|My|Your|His|Her)\b/.test(t);
}

/** Numbered / lettered heading such as "1. PRESENT PERFECT", "A. Discussing …", "2.1 Symptom assessment". */
function headingInfo(line) {
  const t = clean(line).replace(/\n.*$/s, '');
  if (!t || t.length > 120) return null;
  if (/[.?!:;,]$/.test(t) && !/^\d+[.)]\s*[A-Z]/.test(t)) return null;
  let m = t.match(/^(\d{1,2})(?:[.)]|\.\d)\s*[—:-]?\s*(.+)$/);
  if (m) {
    const body = m[2].trim();
    if (/[?]$/.test(body)) return null;
    return { kind: 'num', num: +m[1], text: body };
  }
  m = t.match(/^([A-Z])[.)]\s+(.+)$/);
  if (m && wordCount(m[2]) <= 9) return { kind: 'alpha', num: m[1].charCodeAt(0) - 64, text: m[2].trim() };
  m = t.match(/^(PART|BO'LIM|ЧАСТЬ)\s+([A-Z0-9]+)\s*[—:-]\s*(.+)$/i);
  if (m) return { kind: 'part', num: 0, text: m[3].trim() };
  return null;
}

/** "Label: value" / "Label — value" prefix extraction with label aliases. */
const LABELS = {
  uz:   /^(o'?zbekcha(?:\s+tushuntirish)?|o'?zbek(?:\s+tili(?:da)?)?|uzbek(?:\s+explanation)?|uz|tarjima(?:si)?|ma'nosi)\s*[:—-]\s*/i,
  ru:   /^(русский|по-русски|объяснение по-русски|ruscha|russian(?:\s+explanation)?|ru|перевод|значение)\s*[:—-]\s*/i,
  pron: /^(talaffuz(?:i)?|pronunciation|ipa|transcription)\s*[:—-]\s*/i,
  use:  /^(clinical use|clinical function|function|vazifasi|usage|use|how to use|why|meaning|note|izoh|explanation|clinical meaning|ma'no|analysis)\s*[:—-]\s*/i,
  alt:  /^(useful pattern(?:\s*\/\s*alternative)?|alternative|pattern)\s*[:—-]\s*/i,
  en:   /^(english|inglizcha|en|phrase|sentence)\s*[:—-]\s*/i,
  form: /^(form|formula|structure|struktura|формула|pattern|key pattern|useful clinical pattern|important clinical pattern)\s*[:—-]?\s*$/i,
  formInline: /^(form|formula|structure|struktura|формула|positive|negative|question|wh-question|key pattern|useful clinical pattern|important clinical pattern|signal words?)\s*[:—-]\s*/i,
  doctor:  /^(doctor|dr\.?|shifokor|врач|physician|dentist|nurse|hamshira|медсестра)\s*[:—-]\s*/i,
  patient: /^(patient|pt\.?|bemor|пациент|parent|mother|father|relative|paramedic|caregiver|son|daughter|wife|husband|student)\s*[:—-]\s*/i,
  example: /^(misol|example|пример|dialogue example|dialog example|clinical example)\s*[:—-]\s*/i,
};

function stripLabel(line, key) {
  const m = clean(line).match(LABELS[key]);
  return m ? clean(line).slice(m[0].length).trim() : null;
}

function splitLines(text) {
  return clean(text).split('\n').map(s => s.trim()).filter(Boolean);
}

function stripNumberPrefix(s) {
  return clean(s).replace(/^\(?\d{1,2}[.)]\s*/, '').replace(/^[A-Z][.)]\s+/, '').trim();
}

function stripQuotes(s) {
  return clean(s).replace(/^["'«»]+|["'«»]+$/g, '').trim();
}

function keyOf(s) {
  return clean(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function uniqBy(arr, fn) {
  const seen = new Set();
  return arr.filter(x => { const k = fn(x); if (!k || seen.has(k)) return false; seen.add(k); return true; });
}

/** Like uniqBy, but later duplicates fill in fields the first occurrence left empty. */
function mergeBy(arr, fn) {
  const map = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (!k) continue;
    const prev = map.get(k);
    if (!prev) { map.set(k, x); continue; }
    for (const [f, v] of Object.entries(x)) if (v && !prev[f]) prev[f] = v;
  }
  return [...map.values()];
}

function truncate(s, n) {
  const t = clean(s);
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

function titleCase(s) {
  return clean(s).toLowerCase().replace(/(^|[\s\-&(/])([a-z])/g, (m, a, b) => a + b.toUpperCase());
}

module.exports = {
  clean, normalizeUz, detectLang, cyrillicRatio, wordCount, looksLikeSentence, looksLikeUtterance, looksLikeTitle,
  headingInfo, isMostlyUpper, LABELS, stripLabel, splitLines, stripNumberPrefix,
  stripQuotes, keyOf, uniqBy, mergeBy, truncate, titleCase,
};
