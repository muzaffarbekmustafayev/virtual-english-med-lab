import sys
sys.stdout.reconfigure(encoding='utf-8')

path = 'backend/src/services/prePostTest.service.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  return {
    test_type: testType,
    specialty_code: code,
    total_questions: totalQuestions,
    correct_count: correctCount,
    overall_score: scorePct,
    quiz_score: scorePct,
    grammar_score: grammarScore,
    vocab_score: vocabScore,
    clinical_score: clinicalScore,
    category_breakdown: categoryStats,
    details: details
  };"""

replacement = """  let cefrLevel = 'A2 Foundation';
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
  };"""

if target in content:
    content = content.replace(target, replacement, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated prePostTest.service.js successfully!')
