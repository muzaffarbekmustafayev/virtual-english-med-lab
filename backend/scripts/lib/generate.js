/**
 * Derived content: virtual-patient scenarios, vocabulary usage examples and
 * quiz questions. Everything here is built ONLY from text found in the module's
 * own Word files, deterministically (seeded PRNG), so rebuilding datas.json
 * yields identical output.
 */
const T = require('./text');

// ── deterministic PRNG ───────────────────────────────────────────────────────
function seedFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(arr, n, rnd) { return shuffle(arr, rnd).slice(0, n); }

// ── vocabulary usage examples ────────────────────────────────────────────────
function findUsageExample(term, corpus) {
  const t = T.clean(term).toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (!t || t.length < 3) return '';
  const stems = [t, t.replace(/s$/, ''), t.replace(/ing$/, ''), t.replace(/ed$/, '')].filter((x, i, a) => x.length >= 3 && a.indexOf(x) === i);
  let best = '';
  for (const sentence of corpus) {
    const low = sentence.toLowerCase();
    if (!stems.some(s => new RegExp(`(^|[^a-z])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(low))) continue;
    if (sentence.length > 220 || sentence.length < 12) continue;
    if (!best || sentence.length < best.length) best = sentence;
  }
  return best;
}

function attachExamples(vocabulary, dialogueTurns, phrases) {
  const corpus = [
    ...dialogueTurns.flatMap(t => t.text.split(/(?<=[.?!])\s+/)),
    ...phrases.map(p => p.phrase),
    ...phrases.map(p => p.patient_response).filter(Boolean),
  ].map(T.clean).filter(Boolean);
  for (const v of vocabulary) {
    if (v.example) continue;
    v.example = findUsageExample(v.word, corpus);
  }
  return vocabulary;
}

// ── virtual patient scenario ─────────────────────────────────────────────────
const GENERIC_WORDS = new Set(['notice', 'noticed', 'feel', 'feeling', 'take', 'keep', 'come in', 'find out', 'calm down', 'come back', 'assess', 'monitor', 'manage', 'examine', 'explain', 'advise', 'become', 'develop', 'improve', 'worsen', 'require', 'suggest', 'recommend', 'consider', 'determine', 'confirm', 'prescribe', 'refer', 'admit', 'discharge', 'arrange', 'check', 'record', 'measure']);

const NAMES = {
  male:   ['James Carter', 'Daniel Brooks', 'Michael Reed', 'Thomas Hale', 'Robert Lane', 'Oliver Grant', 'William Foster', 'Henry Cole', 'Samuel Ward', 'Jack Turner'],
  female: ['Sarah Mitchell', 'Emily Watson', 'Laura Bennett', 'Anna Collins', 'Grace Hughes', 'Sophie Turner', 'Olivia Brooks', 'Emma Hale', 'Charlotte Reed', 'Lucy Ward'],
};

function detectGender(text) {
  const t = ' ' + text.toLowerCase() + ' ';
  const fem = (t.match(/\b(she|her|hers|mrs\.?|ms\.?|miss|daughter|girl|wife|mother|mum|mom|woman|lady|pregnant|periods?|menstrual)\b/g) || []).length;
  const mal = (t.match(/\b(he|him|his|mr\.?|son|boy|husband|father|dad|man|gentleman)\b/g) || []).length;
  if (fem === 0 && mal === 0) return null;
  return fem > mal ? 'female' : 'male';
}

function detectAge(text) {
  const m = text.match(/\b(\d{1,2})[- ](?:years?|yrs?)[- ]old\b/i) || text.match(/\baged (\d{1,2})\b/i) || text.match(/\b(\d{1,2})[- ]months?[- ]old\b/i);
  if (m) return /months?/i.test(m[0]) ? `${m[1]} months` : `${m[1]} years`;
  const w = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:months?|years?)\s+old\b/i) || text.match(/\balmost\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+years?\s+old\b/i);
  return w ? w[0].replace(/\balmost\s+/i, '~').replace(/\s+old$/i, '') : null;
}

function detectName(text) {
  const m = text.match(/\b(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z][a-z]+)/);
  if (m) return m[0].replace(/\.$/, '');
  const n = text.match(/\bmy name is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i);
  return n ? n[1] : null;
}

function detectDuration(text) {
  const m = text.match(/\b(?:for|since|over the (?:last|past)|in the last)\s+(?:about\s+|around\s+|nearly\s+|almost\s+|the\s+last\s+|the\s+past\s+)?[a-z0-9:'\-]+(?:\s+[a-z0-9]+)?\s*(?:days?|hours?|weeks?|months?|years?|nights?|minutes?|yesterday|this morning|last night|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i)
    || text.match(/\b(?:since|for)\s+(?:yesterday|last night|this morning|midnight|breakfast|dinner|lunch)\b/i)
    || text.match(/\b\w+\s+(?:days?|hours?|weeks?|months?|years?|minutes?)\s+ago\b/i);
  return m ? m[0] : null;
}

/**
 * @param {object} p  { spec, moduleIndex, title, dialogue, vocabulary, phrases }
 */
function buildScenario({ spec, moduleIndex, title, dialogue, vocabulary, phrases }) {
  const rnd = seedFrom(`${spec.code}-${moduleIndex}-scenario`);
  const turns = dialogue.turns || [];
  const studentRole = spec.student_role || 'doctor';
  const isStudentTurn = t => studentRole === 'nurse' ? t.role === 'nurse' : t.role === 'doctor';
  const counterpartTurns = turns.filter(t => !isStudentTurn(t));
  const studentTurns = turns.filter(isStudentTurn);

  // who does the AI play?
  const labelCount = {};
  counterpartTurns.forEach(t => { labelCount[t.label] = (labelCount[t.label] || 0) + 1; });
  const counterpartLabel = Object.entries(labelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Patient';
  const counterpartText = counterpartTurns.map(t => t.text).join(' ');
  const allText = turns.map(t => t.text).join(' ');
  const isParent = /parent|mother|father|mum|mom|dad/i.test(counterpartLabel) || spec.code === 'PED';

  // the AI's gender: from the speaker label first (Mother / Father …), then from self-references, then seeded
  const labelGender = /mother|mum|mom|wife|daughter|girl|woman/i.test(counterpartLabel) ? 'female'
    : /father|dad|husband|son|boy|man/i.test(counterpartLabel) ? 'male' : null;
  const gender = labelGender || (isParent ? null : detectGender(counterpartText)) || (rnd() < 0.5 ? 'male' : 'female');
  const age = detectAge(allText) || (isParent ? null : `${28 + Math.floor(rnd() * 40)}`);
  const name = detectName(allText) || NAMES[gender][moduleIndex % NAMES[gender].length];

  const chief = counterpartTurns[0] ? T.truncate(counterpartTurns[0].text, 260) : `Presenting with ${title.toLowerCase()}.`;
  const duration = detectDuration(counterpartText) || detectDuration(allText) || 'recent onset';

  // symptoms = vocabulary items actually voiced by the patient side
  const low = counterpartText.toLowerCase();
  const symptoms = T.uniqBy(vocabulary
    .filter(v => T.wordCount(v.word) <= 4 && v.word.length >= 4 && !/^[a-z]+ly$/i.test(v.word) && !GENERIC_WORDS.has(v.word.toLowerCase()) && low.includes(v.word.toLowerCase().replace(/\s*\(.*?\)\s*/g, '')))
    .map(v => v.word), x => x.toLowerCase()).slice(0, 8);

  const qa = [];
  for (let i = 0; i < turns.length - 1; i++) {
    if (isStudentTurn(turns[i]) && !isStudentTurn(turns[i + 1])) {
      qa.push({ doctor_question_topic: T.truncate(turns[i].text, 180), patient_answer: T.truncate(turns[i + 1].text, 320) });
    }
  }
  const questionsToAsk = counterpartTurns.map(t => t.text.split(/(?<=[.?!])\s+/).filter(s => /\?$/.test(s))).flat().map(T.clean).filter(q => q.length > 8).slice(0, 5);
  const explanations = studentTurns.filter(t => /\b(suggest|consistent with|likely|highly suggestive|diagnos|indicates?|appears? to be)\b/i.test(t.text)).map(t => T.truncate(t.text, 220)).slice(0, 3);

  const personality = spec.code === 'FIRST_AID' ? 'distressed, worried, answers briefly because of discomfort'
    : spec.code === 'PED' ? 'worried parent, wants clear explanations'
    : spec.code === 'STOM' ? 'nervous about dental treatment, sensitive to pain'
    : spec.code === 'NURSING' ? 'cooperative, sometimes confused about instructions'
    : 'cooperative but anxious about the diagnosis';

  const role_play = studentRole === 'nurse'
    ? `The student is a NURSE. You play the ${counterpartLabel.toUpperCase()}.`
    : `The student is the ${spec.student_role === 'dentist' ? 'DENTIST' : 'DOCTOR'}. You play the ${counterpartLabel.toUpperCase()}${isParent ? ' of the sick child (speak about your child in the third person)' : ''}.`;

  const base = {
    module: title,
    specialty: spec.name_en,
    setting: spec.setting,
    role_play,
    counterpart_label: counterpartLabel,
    patient_profile: {
      name,
      age: age || (isParent ? 'adult parent' : 'adult'),
      gender: gender === 'male' ? 'Male' : 'Female',
      personality_trait: personality,
    },
    medical_condition: {
      exact_diagnosis: title,
      chief_complaint: chief,
      symptoms,
      duration,
      pain_level: /pain|ache|og'riq|burn|trauma|abscess|tooth/i.test(title + ' ' + chief) ? String(5 + Math.floor(rnd() * 5)) : 'n/a',
      doctor_explanations_from_reference_dialogue: explanations,
    },
    expected_doctor_questions_and_answers: qa.slice(0, 16),
    questions_to_ask_doctor: questionsToAsk,
  };

  const final_challenge = {
    ...base,
    difficulty: 'final_challenge',
    instructions: 'Give shorter, less complete answers; only reveal details when the student asks a precise question. Add one realistic complicating factor (an allergy, a chronic condition or a missed medication) that the student must discover.',
  };
  return { practice: base, final_challenge };
}

// ── quizzes ──────────────────────────────────────────────────────────────────
const GRAMMAR_DISTRACTORS = {
  have: ['has', 'had', 'having'], has: ['have', 'had', 'is'], had: ['have', 'has', 'having'],
  been: ['being', 'be', 'was'], was: ['were', 'is', 'been'], were: ['was', 'are', 'been'],
  did: ['do', 'does', 'done'], do: ['does', 'did', 'done'], does: ['do', 'did', 'done'],
  will: ['would', 'shall', 'is'], would: ['will', 'should', 'could'], should: ['shall', 'must', 'would'],
  can: ['could', 'may', 'must'], could: ['can', 'would', 'should'], may: ['might', 'must', 'can'], might: ['may', 'must', 'would'], must: ['should', 'may', 'can'],
  since: ['for', 'during', 'from'], for: ['since', 'during', 'from'], ago: ['before', 'since', 'after'],
  going: ['go', 'went', 'gone'], is: ['are', 'was', 'be'], are: ['is', 'were', 'be'],
  if: ['when', 'unless', 'whether'], when: ['if', 'while', 'as'], while: ['when', 'during', 'as'],
  taking: ['take', 'took', 'taken'], taken: ['take', 'took', 'taking'], feeling: ['feel', 'felt', 'feels'],
  any: ['some', 'much', 'many'], much: ['many', 'any', 'few'], many: ['much', 'any', 'little'],
  worse: ['worst', 'bad', 'badly'], better: ['best', 'good', 'well'], more: ['most', 'much', 'many'],
  to: ['for', 'at', 'of'], before: ['after', 'ago', 'until'], after: ['before', 'ago', 'since'],
};
const GRAMMAR_KEYS = Object.keys(GRAMMAR_DISTRACTORS);

function letter(i) { return 'ABCD'[i]; }

function mcq({ rnd, q, options, correctIdx, explanation }) {
  // options: [{en, uz, ru}], correctIdx refers to options[]
  if (options.length !== 4 || options.some(o => !o.en)) return null;
  const order = shuffle(options.map((_, i) => i), rnd);
  const row = { question: q.en, question_uz: q.uz, question_ru: q.ru, question_en: q.en };
  order.forEach((optIdx, pos) => {
    const o = options[optIdx];
    const L = letter(pos).toLowerCase();
    row[`option_${L}`] = o.en; row[`option_${L}_uz`] = o.uz || o.en; row[`option_${L}_ru`] = o.ru || o.uz || o.en; row[`option_${L}_en`] = o.en;
  });
  row.correct_option = letter(order.indexOf(correctIdx));
  row.explanation = explanation.uz; row.explanation_uz = explanation.uz; row.explanation_ru = explanation.ru || explanation.uz; row.explanation_en = explanation.en;
  return row;
}

function buildQuizzes({ spec, moduleIndex, vocabulary, phrases, grammar }) {
  const rnd = seedFrom(`${spec.code}-${moduleIndex}-quiz`);
  const out = [];
  const vocab = vocabulary.filter(v => v.translation_uz && v.word.length >= 3 && !v.word.includes('…'));

  // English prompt for a term that never leaks Uzbek/Russian: definition → gap sentence → null
  const gapSentence = (v) => {
    if (!v.example) return null;
    const re = new RegExp('(^|[^A-Za-z])(' + v.word.replace(/[.*+?^${}()|[]\]/g, '\$&').replace(/s$/, 's?') + ')(?![A-Za-z])', 'i');
    if (!re.test(v.example)) return null;
    return v.example.replace(re, '$1______');
  };
  const enPrompt = (v) => {
    if (v.definition_en) return `Which term means: "${v.definition_en}"?`;
    const g = gapSentence(v);
    return g ? `Which term completes the sentence: "${g}"?` : null;
  };

  // A. term → meaning (3): uz/ru show translations; en shows the definition / gap sentence with English options
  if (vocab.length >= 4) {
    const targets = pick(vocab.filter(v => enPrompt(v)), 3, rnd);
    for (const target of targets) {
      const others = pick(vocab.filter(v => v !== target && T.keyOf(v.translation_uz) !== T.keyOf(target.translation_uz) && T.keyOf(v.word) !== T.keyOf(target.word)), 3, rnd);
      if (others.length < 3) continue;
      const opts = [target, ...others].map(v => ({ en: v.word, uz: v.translation_uz, ru: v.translation_ru || v.translation_uz }));
      out.push(mcq({
        rnd,
        q: { en: enPrompt(target), uz: `"${target.word}" atamasining ma'nosi qaysi?`, ru: `Что означает термин «${target.word}»?` },
        options: opts, correctIdx: 0,
        explanation: {
          en: `"${target.word}"${target.definition_en ? ` — ${target.definition_en}` : ''}${target.example ? `. Example: "${target.example}"` : ''}.`.replace(/..$/, '.'),
          uz: `"${target.word}" — ${target.translation_uz}.`,
          ru: `«${target.word}» — ${target.translation_ru || target.translation_uz}.`,
        },
      }));
    }
  }

  // B. meaning → term (2): options are English terms in every language
  if (vocab.length >= 4) {
    const used = new Set(out.map(q => q.question_uz));
    for (const target of pick(vocab.filter(v => T.wordCount(v.word) <= 4 && enPrompt(v)), 2, rnd)) {
      const others = pick(vocab.filter(v => v !== target && T.keyOf(v.word) !== T.keyOf(target.word)), 3, rnd);
      if (others.length < 3) continue;
      const opts = [target, ...others].map(v => ({ en: v.word, uz: v.word, ru: v.word }));
      const ruMeaning = target.translation_ru || target.translation_uz;
      const g = gapSentence(target);
      out.push(mcq({
        rnd,
        q: {
          en: g ? `Complete the sentence with the correct term: "${g}"` : enPrompt(target),
          uz: `"${target.translation_uz}" ma'nosini bildiruvchi inglizcha atamani tanlang.`,
          ru: `Какой английский термин означает «${ruMeaning}»?`,
        },
        options: opts, correctIdx: 0,
        explanation: { en: `Correct term: "${target.word}"${target.example ? ` — "${target.example}"` : ''}.`, uz: `"${target.translation_uz}" — ${target.word}.`, ru: `«${ruMeaning}» — ${target.word}.` },
      }));
    }
  }

  // C. gap-fill from the phrasebook (3)
  const candidates = phrases.filter(p => T.wordCount(p.phrase) >= 5 && T.wordCount(p.phrase) <= 16 && p.translation_uz);
  const used = new Set();
  for (const p of shuffle(candidates, rnd)) {
    if (out.filter(x => x && x._type === 'gap').length >= 3) break;
    const words = p.phrase.split(/\s+/);
    let idx = words.findIndex(w => GRAMMAR_KEYS.includes(w.toLowerCase().replace(/[^a-z']/g, '')) && !used.has(w.toLowerCase().replace(/[^a-z']/g, '')));
    let distractors;
    if (idx >= 0) {
      const key = words[idx].toLowerCase().replace(/[^a-z']/g, '');
      used.add(key);
      distractors = GRAMMAR_DISTRACTORS[key];
    } else {
      // content word from the module vocabulary
      const singleTerms = vocab.filter(v => T.wordCount(v.word) === 1 && v.word.length >= 4).map(v => v.word.toLowerCase());
      idx = words.findIndex(w => singleTerms.includes(w.toLowerCase().replace(/[^a-z'-]/g, '')));
      if (idx < 0) continue;
      const key = words[idx].toLowerCase().replace(/[^a-z'-]/g, '');
      distractors = pick(singleTerms.filter(t => t !== key), 3, rnd);
      if (distractors.length < 3) continue;
    }
    const answer = words[idx].replace(/[^A-Za-z'-]/g, '');
    const gapped = words.map((w, i) => i === idx ? w.replace(/[A-Za-z'-]+/, '______') : w).join(' ');
    const opts = [answer, ...distractors].map(o => ({ en: o, uz: o, ru: o }));
    const row = mcq({
      rnd,
      q: { en: `Complete the phrase: "${gapped}"`, uz: `Iborani to'ldiring: "${gapped}"`, ru: `Дополните фразу: «${gapped}»` },
      options: opts, correctIdx: 0,
      explanation: { en: `Correct phrase: "${p.phrase}"`, uz: `To'g'ri ibora: "${p.phrase}" — ${p.translation_uz}`, ru: `Правильная фраза: «${p.phrase}»${p.translation_ru ? ` — ${p.translation_ru}` : ''}` },
    });
    if (!row) continue;
    row._type = 'gap';
    out.push(row);
  }

  // D. correct vs incorrect sentence (up to 2)
  const mistakes = grammar.flatMap(g => g.common_mistakes || []).filter(m => m.incorrect && m.correct);
  if (mistakes.length >= 3) {
    for (const m of pick(mistakes, 2, rnd)) {
      const wrong = T.uniqBy(pick(mistakes.filter(x => x !== m && T.keyOf(x.incorrect) !== T.keyOf(m.correct)), 3, rnd).map(x => x.incorrect), x => T.keyOf(x));
      if (wrong.length < 3) continue;
      const opts = [m.correct, ...wrong].map(o => ({ en: o, uz: o, ru: o }));
      out.push(mcq({
        rnd,
        q: { en: 'Which sentence is grammatically correct?', uz: "Qaysi gap grammatik jihatdan to'g'ri?", ru: 'Какое предложение грамматически правильное?' },
        options: opts, correctIdx: 0,
        explanation: { en: `Correct: "${m.correct}". ${m.explanation || ''}`.trim(), uz: `To'g'ri: "${m.correct}". ${m.explanation || ''}`.trim(), ru: `Правильно: «${m.correct}». ${m.explanation || ''}`.trim() },
      }));
    }
  }

  return out.filter(Boolean).map(({ _type, ...row }) => row);
}

module.exports = { buildScenario, buildQuizzes, attachExamples, seedFrom };
