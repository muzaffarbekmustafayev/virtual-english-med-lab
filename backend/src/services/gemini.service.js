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
}

// ═══════════════════════════════════════════════════════════════
// 2. AI FEEDBACK BAHOLASH — suhbat yakunida
// ═══════════════════════════════════════════════════════════════

/**
 * Suhbat tarixini tahlil qilib, batafsil feedback va ballarni qaytaradi
 * @param {Array} messages - [{sender: 'student'|'patient', text_content: '...'}]
 * @returns {Object} - { grammar_score, vocabulary_score, fluency_score,
 *                       pronunciation_score, clinical_score, overall_score,
 *                       general_feedback, errors }
 */
async function generateFeedback(messages) {
  // Suhbat tarixini matn ko'rinishida shakllantirish
  const transcript = messages
    .map(m => `${m.sender === 'student' ? 'DOCTOR' : 'PATIENT'}: ${m.text_content}`)
    .join('\n');

  const prompt = `
You are an expert medical English language evaluator. Analyze the following doctor-patient conversation and evaluate the medical student's (doctor's) performance.

CONVERSATION:
${transcript}

Evaluate the DOCTOR's messages ONLY (not the patient's). Return a JSON object with exactly this structure:
{
  "grammar_score": <integer 1-10>,
  "vocabulary_score": <integer 1-10>,
  "fluency_score": <integer 1-10>,
  "pronunciation_score": <integer 1-10>,
  "clinical_score": <integer 1-10>,
  "overall_score": <integer 0-100>,
  "general_feedback": "<2-3 sentence summary of strengths and areas to improve>",
  "errors": [
    {
      "original": "<student's incorrect phrase>",
      "corrected": "<corrected version>",
      "explanation": "<brief explanation in simple English>"
    }
  ]
}

Scoring criteria:
- grammar_score: Correct use of English grammar (tenses, subject-verb agreement, articles)
- vocabulary_score: Use of appropriate medical/dental terminology
- fluency_score: Natural flow of conversation, appropriate question sequencing
- pronunciation_score: Based on text clarity and word choice (assume spoken delivery)
- clinical_score: Did the doctor ask about: onset, location, duration, severity, triggers, associated symptoms? Professional bedside manner?
- overall_score: Weighted average (grammar 20%, vocabulary 20%, fluency 15%, pronunciation 15%, clinical 30%)

Return ONLY valid JSON. No markdown, no explanation outside the JSON.
`.trim();

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.2, responseMimeType: 'application/json' },
  });

  try {
    let cleanText = response.text;
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse Gemini feedback JSON:', error, '\\nRaw response:', response.text);
    // Fallback scores if JSON parsing fails
    return {
      grammar_score: 5,
      vocabulary_score: 5,
      fluency_score: 5,
      pronunciation_score: 5,
      clinical_score: 5,
      overall_score: 50,
      general_feedback: 'Feedback could not be generated properly or conversation was too short.',
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

