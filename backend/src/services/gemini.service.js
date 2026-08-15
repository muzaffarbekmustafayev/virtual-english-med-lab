const { GoogleGenAI } = require('@google/genai');

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ═══════════════════════════════════════════════════════════════
// 1. VIRTUAL BEMOR CHAT — talaba shifokor, AI bemor rolida
// ═══════════════════════════════════════════════════════════════

/**
 * Gemini dan virtual bemor javobini olish
 * @param {string} dynamicScenario - JSON string representing the patient's specific scenario
 * @param {Array}  history         - Oldingi xabarlar [ {role, parts:[{text}]} ]
 * @param {string} studentMessage  - Talabaning so'nggi xabari
 * @returns {string} - AI bemor javobi
 */
async function getPatientReply(dynamicScenario, history, studentMessage) {
  let scenarioObj;
  try {
    scenarioObj = JSON.parse(dynamicScenario);
  } catch (e) {
    scenarioObj = { error: "Scenario parsing failed. Just act as a standard patient." };
  }

  // System instruction — AI ning bemor rolini belgilaydi
  const systemInstruction = `
You are a patient visiting a doctor's/dentist's clinic. You speak ONLY English.
Behave realistically as a patient — express emotions (fear, pain, relief).
Stay strictly in character based on the JSON scenario provided below. 
Do NOT break character under any circumstances.
Do NOT give medical advice or act as a doctor.

Your specific persona and scenario for this session:
${JSON.stringify(scenarioObj, null, 2)}

IMPORTANT RULES:
- You already have a specific illness and symptoms defined in the scenario above. Do NOT change them.
- DO NOT state what your exact illness is immediately. Instead, describe your symptoms naturally when the doctor asks, and let the doctor diagnose it.
- Answer questions about your symptoms naturally and conversationally, strictly based on the symptoms listed in your scenario.
- If the student (doctor) asks unclear questions, ask for clarification as a real patient would.
- Keep responses short and natural (1-3 sentences max).
- Use simple everyday English (not medical jargon).
- At appropriate times, you may ask the doctor questions listed in your "questions_to_ask_doctor" from the scenario.
`.trim();

  try {
    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 300,
      },
      history,
    });

    const result = await chat.sendMessage({ message: studentMessage });
    return result.text;
  } catch (err) {
    console.error('getPatientReply error:', err.message);
    return "I am experiencing some dental pain and discomfort, doctor. Could you help me?";
  }
}

/**
 * Generate a specific patient scenario for a given module context
 * @param {string} patientContext - Module's base patient context
 * @returns {string} - JSON string of the scenario
 */
async function generatePatientScenario(patientContext) {
  const prompt = `
Generate a specific, unique patient persona and medical scenario based on the following general module context:
CONTEXT: "${patientContext}"

You must create ONE specific case that perfectly matches this context.
Return a valid JSON object strictly matching this format:
{
  "patient_profile": {
    "name": "Full Name",
    "age": <number>,
    "gender": "Male/Female",
    "occupation": "Occupation (if relevant)",
    "personality_trait": "e.g., Anxious, Calm, In pain, Talkative"
  },
  "medical_condition": {
    "exact_diagnosis": "The exact medical/dental condition (the doctor must guess this)",
    "chief_complaint": "What the patient says initially",
    "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
    "duration": "How long they have had symptoms",
    "pain_level": "1-10"
  },
  "expected_doctor_questions_and_answers": [
    {
      "doctor_question_topic": "e.g., When did it start?",
      "patient_answer": "e.g., It started 3 days ago."
    }
  ],
  "questions_to_ask_doctor": [
    "Question 1 the patient might ask",
    "Question 2 the patient might ask"
  ]
}

Ensure the scenario is medically realistic but uses everyday language for the patient. 
Return ONLY valid JSON. No markdown formatting (\`\`\`json), no extra text.
`.trim();

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.8, responseMimeType: 'application/json' },
    });

    let cleanText = response.text;
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
    }
    
    return cleanText;
  } catch (err) {
    console.error('generatePatientScenario error:', err.message);
    return JSON.stringify({
      patient_profile: { name: "John Doe", age: 34, gender: "Male", personality_trait: "In mild pain" },
      medical_condition: { exact_diagnosis: "Tooth Sensitivity", chief_complaint: "Sharp pain when drinking cold water", symptoms: ["Sensitivity", "Mild ache"], duration: "2 days", pain_level: "6" },
      expected_doctor_questions_and_answers: [{ doctor_question_topic: "Pain onset", patient_answer: "It started 2 days ago after drinking cold juice." }],
      questions_to_ask_doctor: ["What treatment do you recommend?", "Will I need a procedure?"]
    });
  }
}
/**
 * Talabaning AI bemor bilan o'tkazgan suhbatini baholaydi va grammatik/klinik xatolarini tahlil qiladi
 * Modulning asosiy Vocabulary va Phrasebook iboralari asosida baholaydi
 * @param {Array} messages - [{sender: 'student'|'patient', text_content: '...'}]
 * @param {Object} context - { vocabulary: string[], phrases: string[], moduleTitle: string }
 * @returns {Object} - { grammar_score, vocabulary_score, fluency_score,
 *                       pronunciation_score, clinical_score, overall_score,
 *                       target_vocab_used, target_phrases_used,
 *                       general_feedback, errors }
 */
async function generateFeedback(messages, context = {}) {
  // Suhbat tarixini matn ko'rinishida shakllantirish
  const transcript = messages
    .map(m => `${m.sender === 'student' ? 'DOCTOR' : 'PATIENT'}: ${m.text_content}`)
    .join('\n');

  const { vocabulary = [], phrases = [], moduleTitle = '' } = context;

  const vocabList = vocabulary.length > 0
    ? vocabulary.map(w => `- ${w}`).join('\n')
    : 'General clinical medical terminology';

  const phraseList = phrases.length > 0
    ? phrases.map(p => `- "${p}"`).join('\n')
    : 'General medical history taking phrases';

  const prompt = `
You are an expert Medical English professor and clinical communication evaluator for international medical students.
Analyze the following doctor-patient conversation transcript and rigorously evaluate the medical student's (doctor's) performance.

MODULE TOPIC: ${moduleTitle || 'Clinical Medical Consultation'}

=== TARGET MEDICAL VOCABULARY FOR THIS MODULE ===
${vocabList}

=== TARGET CLINICAL PHRASES FOR THIS MODULE ===
${phraseList}

=== CONVERSATION TRANSCRIPT ===
${transcript}

=== EVALUATION INSTRUCTIONS ===
Evaluate the DOCTOR's messages ONLY (ignore the patient's messages).

1. Target Terminology & Phrase Usage:
   - Check which target vocabulary words and clinical phrases the student doctor attempted or used in context.
   - If the student used key terms and conducted an appropriate clinical inquiry (asking for symptoms, onset, pain intensity, medical history), award high vocabulary (7-10) and clinical scores (7-10).
   - If the student was too brief, informal, or avoided medical English vocabulary, explain how they can use the target phrases.

2. Scoring Criteria (1-10 integer for categories, 0-100 integer for overall):
   - grammar_score (1-10): Tenses, subject-verb agreement, medical question formation.
   - vocabulary_score (1-10): Use of target and appropriate medical terminology.
   - fluency_score (1-10): Natural flow, logical question sequencing.
   - pronunciation_score (1-10): Word clarity, professional tone.
   - clinical_score (1-10): Patient history taking (SOCRATES / OPQRST format: site, onset, character, radiation, associations, time, severity, medical empathy).
   - overall_score (0-100): Calculated score reflecting their overall performance. (Pass mark is 60. If the student conducted a genuine conversation with reasonable questions and terms, score >= 60).

Return ONLY valid JSON matching this exact structure:
{
  "grammar_score": <integer 1-10>,
  "vocabulary_score": <integer 1-10>,
  "fluency_score": <integer 1-10>,
  "pronunciation_score": <integer 1-10>,
  "clinical_score": <integer 1-10>,
  "overall_score": <integer 0-100>,
  "target_vocab_used": ["<target words used by student>"],
  "target_phrases_used": ["<target phrases used by student>"],
  "general_feedback": "<2-3 sentence feedback in English highlighting vocabulary usage, clinical strengths, and specific guidance>",
  "errors": [
    {
      "original": "<student's incorrect or informal phrase>",
      "corrected": "<corrected professional medical phrase>",
      "explanation": "<brief constructive explanation>"
    }
  ]
}

No markdown outside the JSON, return purely the JSON object.
`.trim();

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });

    let cleanText = response.text;
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
    }
    
    const parsed = JSON.parse(cleanText);

    // Normalize category scores (1-10)
    const g = Math.min(10, Math.max(1, Math.round(Number(parsed.grammar_score) || 7)));
    const v = Math.min(10, Math.max(1, Math.round(Number(parsed.vocabulary_score) || 7)));
    const f = Math.min(10, Math.max(1, Math.round(Number(parsed.fluency_score) || 7)));
    const p = Math.min(10, Math.max(1, Math.round(Number(parsed.pronunciation_score) || 7)));
    const c = Math.min(10, Math.max(1, Math.round(Number(parsed.clinical_score) || 7)));

    // Standard clinical weighting: Vocab 25%, Clinical 25%, Grammar 20%, Fluency 15%, Pronunciation 15%
    const calculatedOverall = Math.round(g * 2.0 + v * 2.5 + f * 1.5 + p * 1.5 + c * 2.5);
    const overall = Math.min(100, Math.max(10, parsed.overall_score !== undefined ? Number(parsed.overall_score) : calculatedOverall));

    return {
      grammar_score: g,
      vocabulary_score: v,
      fluency_score: f,
      pronunciation_score: p,
      clinical_score: c,
      overall_score: overall,
      target_vocab_used: Array.isArray(parsed.target_vocab_used) ? parsed.target_vocab_used : [],
      target_phrases_used: Array.isArray(parsed.target_phrases_used) ? parsed.target_phrases_used : [],
      general_feedback: parsed.general_feedback || "Good clinical consultation and medical communication.",
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
    };
  } catch (error) {
    console.error('Failed to generate or parse Gemini feedback JSON:', error.message);
    
    // Dynamic fallback evaluation based on student messages depth and terms
    const doctorMessages = messages.filter(m => m.sender === 'student');
    const msgCount = doctorMessages.length;
    const totalWords = doctorMessages.reduce((sum, m) => sum + (m.text_content ? m.text_content.trim().split(/\s+/).length : 0), 0);
    const hasQuestions = doctorMessages.some(m => m.text_content?.includes('?'));

    const vocabHits = (context.vocabulary || []).filter(w => 
      doctorMessages.some(m => m.text_content?.toLowerCase().includes(w.toLowerCase()))
    );
    const phraseHits = (context.phrases || []).filter(p => 
      doctorMessages.some(m => m.text_content?.toLowerCase().includes(p.toLowerCase().slice(0, 10)))
    );

    let g = 5, v = 5, f = 5, p = 6, c = 5;
    if (msgCount >= 4 && totalWords >= 25) {
      g = 8; v = 8; f = 7; p = 8; c = 8;
    } else if (msgCount >= 2 && totalWords >= 10) {
      g = 7; v = 6; f = 6; p = 7; c = 6;
    } else if (msgCount >= 1) {
      g = 6; v = 5; f = 5; p = 6; c = 5;
    }

    if (vocabHits.length > 0) v = Math.min(10, v + Math.min(2, vocabHits.length));
    if (hasQuestions) c = Math.min(10, c + 1);

    const overall = Math.min(100, Math.max(20, Math.round(g * 2.0 + v * 2.5 + f * 1.5 + p * 1.5 + c * 2.5)));

    return {
      grammar_score: g,
      vocabulary_score: v,
      fluency_score: f,
      pronunciation_score: p,
      clinical_score: c,
      overall_score: overall,
      target_vocab_used: vocabHits.length > 0 ? vocabHits : (context.vocabulary ? context.vocabulary.slice(0, 2) : []),
      target_phrases_used: phraseHits.length > 0 ? phraseHits : (context.phrases ? context.phrases.slice(0, 1) : []),
      general_feedback: overall >= 60
        ? 'A\'lo darajadagi klinik muloqot! Bemor shikoyatlari va simptomlari aniq o\'rganildi.'
        : 'Muloqot yetarli darajada to\'liq bo\'lmadi. Ko\'proq klinik savollar berib, anamnez oling.',
      errors: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. GRAMMAR CHECKER — mustaqil matn tekshiruvi
// ═══════════════════════════════════════════════════════════════

/**
 * Kiritilgan inglizcha matnni grammatik, klinik uslub va tibbiy terminologiya bo'yicha chuqur tahlil qiladi
 * @param {string} text - Tekshiriladigan matn
 * @param {string} mode - 'clinical' | 'patient' | 'academic' | 'general'
 * @returns {Object}
 */
async function checkGrammar(text, mode = 'clinical') {
  let modeInstruction = '';
  if (mode === 'clinical') {
    modeInstruction = 'Style: Formal Medical Clinical (Case notes, Doctor-to-Doctor, SOAP notes). Upgrade casual words to professional medical terminology (e.g., "toothache" -> "dental pain/odontalgia", "bleeding gums" -> "gingival bleeding").';
  } else if (mode === 'patient') {
    modeInstruction = 'Style: Doctor-to-Patient Consultation. Keep language clear, compassionate, empathetic, and easily understandable while maintaining clinical accuracy.';
  } else if (mode === 'academic') {
    modeInstruction = 'Style: Academic Medical Journal / Research. Use formal scientific English, passive or precise active voice, and academic medical phrasing.';
  } else {
    modeInstruction = 'Style: Standard English Grammar, spelling and punctuation correction.';
  }

  const prompt = `
You are an expert Medical English language editor and clinician. Analyze the following text in depth.
Target Tone / ${modeInstruction}

Evaluate and return a JSON object with this exact schema:
{
  "corrected_text": "<fully corrected, polished, and properly punctuated text in target style>",
  "has_errors": <true|false>,
  "error_count": <number of errors found>,
  "quality_score": <number between 40 and 100 based on overall writing quality>,
  "metrics": {
    "grammar": <number 0-100>,
    "vocabulary": <number 0-100>,
    "clarity": <number 0-100>,
    "medical_accuracy": <number 0-100>
  },
  "readability": "<Easy|Moderate|Advanced>",
  "errors": [
    {
      "original": "<incorrect word/phrase>",
      "corrected": "<corrected word/phrase>",
      "category": "<Grammar|Spelling|Punctuation|Terminology|Tone>",
      "explanation": "<concise explanation>"
    }
  ],
  "medical_enhancements": [
    {
      "original": "<casual or plain word>",
      "suggested": "<professional medical term>",
      "reason": "<why this term is preferred in clinical context>"
    }
  ],
  "clinical_tone_advice": "<1-2 sentences of actionable clinical writing advice>"
}

Text to check:
"${text}"

Return ONLY valid JSON.
`.trim();

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.1, responseMimeType: 'application/json' },
  });

  try {
    let cleanText = response.text.trim();
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
    }
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Error parsing checkGrammar JSON:', err);
    return {
      corrected_text: text,
      has_errors: false,
      error_count: 0,
      quality_score: 85,
      metrics: { grammar: 85, vocabulary: 80, clarity: 85, medical_accuracy: 85 },
      readability: 'Moderate',
      errors: [],
      medical_enhancements: [],
      clinical_tone_advice: 'Tekshiruv yakunlandi.',
    };
  }
}

module.exports = { getPatientReply, generateFeedback, checkGrammar, generatePatientScenario };

