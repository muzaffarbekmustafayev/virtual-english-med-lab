const fs = require('fs');
const path = require('path');
const { normalizeSpecialtyCode } = require('./curriculum.service');

let cachedData = null;

function loadTestData() {
  if (cachedData) return cachedData;
  const jsonPath = path.join(__dirname, '../data/pre_post_tests.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    cachedData = JSON.parse(raw);
  } else {
    // Fallback to datas/pre_post_tests.json
    const altPath = path.resolve(__dirname, '../../../datas/pre_post_tests.json');
    if (fs.existsSync(altPath)) {
      const raw = fs.readFileSync(altPath, 'utf8');
      cachedData = JSON.parse(raw);
    }
  }
  return cachedData || {};
}

/**
 * Returns test questions for student (with correct answers stripped)
 */
function getTestForStudent(specialtyVal, testType = 'pre_test') {
  const data = loadTestData();
  const code = normalizeSpecialtyCode(specialtyVal);
  const specData = data[code] || data['GEN_MED'] || Object.values(data)[0];
  if (!specData) return null;

  const test = specData[testType];
  if (!test) return null;

  // Sanitize questions so correct_option is not revealed to client
  const sanitizedQuestions = (test.questions || []).map(q => ({
    id: q.number,
    number: q.number,
    question: q.question,
    section: q.section,
      options: q.options || {},
    options: q.options
  }));

  return {
    specialty_code: specData.specialty_code,
    specialty_name: specData.specialty_name,
    specialty_name_en: specData.specialty_name_en,
    test_type: testType,
    title: test.title,
    total_questions: sanitizedQuestions.length,
    max_score: test.max_score || 100,
    mcq_score_max: test.mcq_score_max || 80,
    situation_score_max: test.situation_score_max || 20,
    questions: sanitizedQuestions,
    situation: test.situation || null
  };
}

/**
 * Evaluates student answers against the answer key
 */
function evaluateTest(specialtyVal, testType, answers = {}) {
  const data = loadTestData();
  const code = normalizeSpecialtyCode(specialtyVal);
  const specData = data[code] || data['GEN_MED'] || Object.values(data)[0];
  if (!specData) throw new Error('Mutaxassislik ma\'lumotlari topilmadi');

  const test = specData[testType];
  if (!test) throw new Error(`${testType} ma'lumotlari topilmadi`);

  const questions = test.questions || [];
  let correctCount = 0;
  const details = [];

  // Categorize sections
  const categoryStats = {
    grammar:  { total: 0, correct: 0 },
    vocab:    { total: 0, correct: 0 },
    clinical: { total: 0, correct: 0 },
  };

  questions.forEach(q => {
    const selected = (answers[q.number] || answers[String(q.number)] || '').toUpperCase().trim();
    const correct = (q.correct_option || '').toUpperCase().trim();
    const isCorrect = selected === correct;
    if (isCorrect) correctCount++;

    // Section classification
    const sec = (q.section || '').toLowerCase();
    let cat = 'clinical';
    if (sec.includes('grammar') || sec.includes('section a')) {
      cat = 'grammar';
    } else if (sec.includes('vocab') || sec.includes('section b')) {
      cat = 'vocab';
    } else {
      cat = 'clinical';
    }

    categoryStats[cat].total++;
    if (isCorrect) categoryStats[cat].correct++;

    details.push({
      number: q.number,
      question: q.question,
      section: q.section,
      selected_option: selected,
      correct_option: correct,
      is_correct: isCorrect
    });
  });

  const totalQuestions = questions.length || 1;
  const scorePct = Math.round((correctCount / totalQuestions) * 100);

  const grammarScore = categoryStats.grammar.total > 0
    ? Math.round((categoryStats.grammar.correct / categoryStats.grammar.total) * 100)
    : scorePct;

  const vocabScore = categoryStats.vocab.total > 0
    ? Math.round((categoryStats.vocab.correct / categoryStats.vocab.total) * 100)
    : scorePct;

  const clinicalScore = categoryStats.clinical.total > 0
    ? Math.round((categoryStats.clinical.correct / categoryStats.clinical.total) * 100)
    : scorePct;

  let cefrLevel = 'A2 Foundation';
  if (scorePct >= 80) cefrLevel = 'B2 Clinical Pro';
  else if (scorePct >= 60) cefrLevel = 'B1 Medical';

  const recommendations = [];
  if (grammarScore < 60) {
    recommendations.push("Klinik grammatika va zamonlar (Present Simple/Continuous, Passive Voice) modullariga alohida e'tibor qaratish tavsiya etiladi.");
  }
  if (vocabScore < 60) {
    recommendations.push("Tibbiy leksika va kasbiy atamalarni o'rganish bo'limida ko'proq mashq qiling.");
  }
  if (clinicalScore < 60) {
    recommendations.push("Bemor bilan muloqot va anamnez yig'ish iboralari bo'yicha mashg'ulotlar tavsiya etiladi.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Boshlang'ich bilim darajangiz a'lo darajada. O'quv modullarida murakkab simulyatsion muloqotlarni o'rganishga tayyorsiz.");
  }

  return {
    test_type: testType,
    specialty_code: code,
    total_questions: totalQuestions,
    correct_count: correctCount,
    overall_score: scorePct,
    quiz_score: scorePct,
    cefr_level: cefrLevel,
    recommendations: recommendations,
    grammar_score: grammarScore,
    vocab_score: vocabScore,
    clinical_score: clinicalScore,
    category_breakdown: categoryStats,
    details: details
  };
}

/**
 * Calculates PhD pedagogical learning gain (Hake's gain g, relative gain, delta)
 */
function calculateLearningGain(preResult, postResult) {
  if (!preResult && !postResult) return null;

  const preScore = preResult ? (preResult.overall_score ?? preResult.quiz_score ?? 0) : 0;
  const postScore = postResult ? (postResult.overall_score ?? postResult.quiz_score ?? 0) : 0;

  const absoluteGain = postScore - preScore;
  const percentageGain = preScore > 0
    ? Math.round(((postScore - preScore) / preScore) * 100)
    : postScore;

  // Hake's normalized gain: g = (post - pre) / (100 - pre)
  let normalizedGain = 0;
  const maxPossibleGain = 100 - preScore;
  if (maxPossibleGain > 0) {
    normalizedGain = Math.round(((postScore - preScore) / maxPossibleGain) * 100) / 100;
  }

  let gainCategory = 'No Gain';
  let gainCategoryUz = "O'sish kuzatilmadi";
  if (normalizedGain >= 0.7 || absoluteGain >= 35) {
    gainCategory = 'High Gain';
    gainCategoryUz = "Yuqori o'sish sur'ati (PhD darajasi)";
  } else if (normalizedGain >= 0.3 || absoluteGain >= 15) {
    gainCategory = 'Medium Gain';
    gainCategoryUz = "O'rtacha barqaror o'sish";
  } else if (normalizedGain > 0 || absoluteGain > 0) {
    gainCategory = 'Low Gain';
    gainCategoryUz = "Boshlang'ich o'sish";
  }

  const preGrammar  = preResult?.grammar_score || 0;
  const postGrammar = postResult?.grammar_score || 0;
  const preVocab    = preResult?.vocab_score || 0;
  const postVocab   = postResult?.vocab_score || 0;
  const preClinical = preResult?.clinical_score || 0;
  const postClinical= postResult?.clinical_score || 0;

  return {
    has_both: Boolean(preResult && postResult),
    pre_score: preScore,
    post_score: postScore,
    absolute_gain: absoluteGain,
    percentage_gain: percentageGain,
    normalized_gain: normalizedGain,
    gain_category: gainCategory,
    gain_category_uz: gainCategoryUz,
    competencies: {
      grammar: {
        pre: preGrammar,
        post: postGrammar,
        delta: postGrammar - preGrammar
      },
      vocab: {
        pre: preVocab,
        post: postVocab,
        delta: postVocab - preVocab
      },
      clinical: {
        pre: preClinical,
        post: postClinical,
        delta: postClinical - preClinical
      }
    },
    pedagogical_summary: {
      uz: `Talabaning dastlabki bilim darajasi (Pre-test) ${preScore}% bo'lgan bo'lsa, modullar yakunida (Post-test) ${postScore}% ga yetdi. Umumiy o'sish: ${absoluteGain >= 0 ? '+' : ''}${absoluteGain} ball (${percentageGain >= 0 ? '+' : ''}${percentageGain}%). O'sish sur'ati: ${gainCategoryUz}.`,
      en: `The student achieved a pre-test baseline of ${preScore}% and improved to ${postScore}% in the post-test. Overall learning gain: ${absoluteGain >= 0 ? '+' : ''}${absoluteGain} points (${percentageGain >= 0 ? '+' : ''}${percentageGain}%). Normalized gain category: ${gainCategory}.`,
      ru: `Начальный уровень (Pre-test) составил ${preScore}%, а итоговый (Post-test) достиг ${postScore}%. Общий прирост: ${absoluteGain >= 0 ? '+' : ''}${absoluteGain} баллов (${percentageGain >= 0 ? '+' : ''}${percentageGain}%). Категория прироста: ${gainCategoryUz}.`
    }
  };
}

module.exports = {
  getTestForStudent,
  evaluateTest,
  calculateLearningGain,
  loadTestData
};
