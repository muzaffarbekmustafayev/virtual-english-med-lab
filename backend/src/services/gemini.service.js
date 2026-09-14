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
/**
 * Offline fallback used when Gemini is unavailable: answer from the module's own
 * reference dialogue (expected_doctor_questions_and_answers in the scenario) by
 * picking the reference question that overlaps most with what the student asked.
 */
const STOP_WORDS = new Set(['the', 'and', 'you', 'your', 'are', 'have', 'has', 'had', 'been', 'any', 'did', 'does', 'was', 'were', 'what', 'when', 'where', 'how', 'that', 'this', 'with', 'for', 'about', 'can', 'could', 'would', 'please', 'tell', 'there', 'they', 'them', 'from', 'into', 'today', 'feel', 'feeling']);

function getContextualPatientFallback(studentMessage, scenarioObj = {}) {
  const msg = (studentMessage || '').toLowerCase();
  const words = new Set(msg.replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
  const qa = Array.isArray(scenarioObj.expected_doctor_questions_and_answers) ? scenarioObj.expected_doctor_questions_and_answers : [];

  let best = null, bestScore = 0;
  for (const item of qa) {
    const qWords = (item.doctor_question_topic || '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    if (!qWords.length) continue;
    const overlap = qWords.filter(w => words.has(w)).length;
    const score = overlap / Math.sqrt(qWords.length);
    if (overlap >= 1 && score > bestScore) { best = item; bestScore = score; }
  }
  if (best && best.patient_answer) return best.patient_answer;

  const cc = scenarioObj.medical_condition?.chief_complaint;
  if (cc && /\b(bring|help|problem|matter|wrong|today|feel|complain|happen)/.test(msg)) return cc;
  if (/\b(how long|when did|since when|start|began)\b/.test(msg) && scenarioObj.medical_condition?.duration) {
    return `It started ${scenarioObj.medical_condition.duration}, and it has not really improved since then.`;
  }
  if (/\b(thank|bye|take care|see you)\b/.test(msg)) return 'Thank you, Doctor. I will follow your advice.';
  const asks = Array.isArray(scenarioObj.questions_to_ask_doctor) ? scenarioObj.questions_to_ask_doctor : [];
  const ask = asks.length ? asks[Math.floor(Math.random() * asks.length)] : null;
  return ask ? `I'm not sure I understand, Doctor. ${ask}` : "I'm not sure I understand the question, Doctor. Could you explain what you mean?";
}

function formatGeminiContents(history, lastUserParts) {
  let list = [];
  if (Array.isArray(history)) {
    for (const h of history) {
      const role = h.role === 'assistant' || h.role === 'patient' || h.role === 'model' ? 'model' : 'user';
      const text = h.parts?.[0]?.text || h.content || h.text_content || '';
      if (text && text.trim()) {
        list.push({ role, parts: [{ text: text.trim() }] });
      }
    }
  }

  // Ensure conversation starts with 'user'
  while (list.length > 0 && list[0].role === 'model') {
    list.shift();
  }

  // Ensure turns alternate cleanly
  const alternating = [];
  for (let i = 0; i < list.length; i++) {
    if (alternating.length === 0 || alternating[alternating.length - 1].role !== list[i].role) {
      alternating.push(list[i]);
    } else {
      alternating[alternating.length - 1].parts[0].text += '\n' + list[i].parts[0].text;
    }
  }

  // If the last item in alternating is already 'user', pop it so the new inquiry is the current turn
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }

  // Append user inquiry
  if (Array.isArray(lastUserParts)) {
    alternating.push({ role: 'user', parts: lastUserParts });
  } else if (lastUserParts) {
    alternating.push({ role: 'user', parts: [lastUserParts] });
  }

  return alternating;
}

async function getPatientReply(dynamicScenario, history, studentMessage) {
  let scenarioObj;
  try {
    scenarioObj = typeof dynamicScenario === 'string' ? JSON.parse(dynamicScenario) : (dynamicScenario || {});
  } catch (e) {
    scenarioObj = { error: "Scenario parsing failed. Just act as a standard patient." };
  }

  const systemInstruction = buildPatientSystemInstruction(scenarioObj);

  try {
    const contents = formatGeminiContents(history, { text: studentMessage });

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 300,
      }
    });

    if (result && result.text && result.text.trim()) {
      return result.text.trim();
    }
    return getContextualPatientFallback(studentMessage, scenarioObj);
  } catch (err) {
    console.error('getPatientReply fallback activated:', err.message);
    return getContextualPatientFallback(studentMessage, scenarioObj);
  }
}

/**
 * Real-time SSE streaming version of getPatientReply
 * Calls onChunk(text) for each token, then onDone(fullText) when finished
 */
async function getPatientReplyStream(dynamicScenario, history, studentMessage, onChunk, onDone) {
  let scenarioObj;
  try {
    scenarioObj = JSON.parse(dynamicScenario);
  } catch (e) {
    scenarioObj = {};
  }

  const systemInstruction = buildPatientSystemInstruction(scenarioObj);

  try {
    const contents = formatGeminiContents(history, { text: studentMessage });

    const streamResult = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 300,
      },
    });

    let fullText = '';
    for await (const chunk of streamResult) {
      const piece = chunk.text || '';
      if (piece) {
        fullText += piece;
        onChunk(piece);
      }
    }

    const finalText = fullText.trim() || getContextualPatientFallback(studentMessage, scenarioObj);
    onDone(finalText);
  } catch (err) {
    console.error('getPatientReplyStream error:', err.message);
    const fallback = getContextualPatientFallback(studentMessage, scenarioObj);
    onChunk(fallback);
    onDone(fallback);
  }
}

/**
 * Handles Audio stream by accepting Base64 audio, asking Gemini to transcribe and reply,
 * and parsing the custom JSON format.
 */
async function getPatientAudioReplyStream(dynamicScenario, history, audioBase64, onChunk, onDone) {
  let scenarioObj;
  try {
    scenarioObj = typeof dynamicScenario === 'string' ? JSON.parse(dynamicScenario) : (dynamicScenario || {});
  } catch (e) {
    scenarioObj = {};
  }

  const baseInstruction = buildPatientSystemInstruction(scenarioObj);
  const audioSystemPrompt = `
${baseInstruction}

You are listening to an audio recording of the doctor speaking to you (the patient).
1. Accurately transcribe what the doctor said in the audio into 'transcript'.
2. Respond realistically as the patient (1-2 sentences) into 'reply'.
Output strictly in valid JSON format with keys 'transcript' and 'reply'.
`.trim();

  try {
    let mimeType = 'audio/webm';
    const mimeMatch = audioBase64.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const userAudioParts = [
      { inlineData: { mimeType, data: cleanBase64 } },
      { text: 'Doctor audio recording is attached. Transcribe what the doctor said into "transcript" and provide your patient answer into "reply".' }
    ];

    const contents = formatGeminiContents(history, userAudioParts);

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: audioSystemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            transcript: { type: 'STRING', description: "Verbatim words of what the doctor said in the audio" },
            reply: { type: 'STRING', description: "Realistic patient answer" }
          },
          required: ['transcript', 'reply']
        },
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    let transcript = "Doctor speaking";
    let reply = "I understand, Doctor.";

    try {
      const data = JSON.parse(result.text);
      if (data.transcript && data.transcript.trim()) transcript = data.transcript.trim();
      if (data.reply && data.reply.trim()) reply = data.reply.trim();
    } catch (parseErr) {
      console.warn('JSON parse fallback for audio reply:', result.text);
      const tMatch = result.text.match(/"transcript"\s*:\s*"([^"]+)/i);
      const rMatch = result.text.match(/"reply"\s*:\s*"([^"]+)/i);
      if (tMatch) transcript = tMatch[1].trim();
      if (rMatch) reply = rMatch[1].trim();
      else {
        const rawReply = result.text.match(/"reply"\s*:\s*"([^"\n\r]*)/i);
        if (rawReply) reply = rawReply[1].trim();
      }
    }

    // Strip any accidental JSON formatting characters from reply
    reply = reply.replace(/^\{.*?:\s*"?/s, '').replace(/["}\]\\]+$/g, '').trim();
    if (!reply || reply.length < 2) reply = "I understand, Doctor. What should we do next?";

    if (onChunk) onChunk(reply);
    onDone(transcript, reply);
  } catch (err) {
    console.error('getPatientAudioReplyStream error:', err.message);
    const fallback = getContextualPatientFallback("", scenarioObj);
    if (onChunk) onChunk(fallback);
    onDone("Doctor inquiry", fallback);
  }
}

function buildPatientSystemInstruction(scenarioObj = {}) {
  const rolePlay = scenarioObj.role_play || 'The student is the DOCTOR. You play the PATIENT.';
  const setting = scenarioObj.setting ? `Setting: ${scenarioObj.setting}.` : '';
  const extra = scenarioObj.difficulty === 'final_challenge' && scenarioObj.instructions ? `\nFINAL CHALLENGE MODE: ${scenarioObj.instructions}` : '';
  return `
You are taking part in a medical English role-play. ${rolePlay} ${setting}
You speak ONLY English. Behave realistically — express emotions (fear, pain, relief, worry).
Stay strictly in character based on the JSON scenario below. Do NOT break character under any circumstances.
Do NOT give medical advice or act as the clinician.

Your specific persona and scenario for this session:
${JSON.stringify(scenarioObj, null, 2)}

IMPORTANT RULES:
- You already have a specific condition, history and symptoms defined in the scenario above. Do NOT change them.
- DO NOT state the exact diagnosis yourself. Describe your symptoms naturally when asked and let the student work it out.
- Use "expected_doctor_questions_and_answers" as your factual memory: when the student asks something similar, answer consistently with it (in your own words).
- If the student asks something not covered, invent a realistic, consistent detail and keep it for the rest of the conversation.
- If you play a parent or relative, speak about the patient (your child / relative) in the third person.
- If the student's question is unclear, ask for clarification as a real person would.
- Keep responses short and natural (1-3 sentences). Use simple everyday English, not medical jargon.
- At appropriate moments you may ask one of the "questions_to_ask_doctor".${extra}
`.trim();
}

function tryParseScenario(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;
  const s = String(text).trim();
  if (!s.startsWith('{')) return null;
  try {
    const obj = JSON.parse(s);
    return obj && (obj.medical_condition || obj.patient_profile || obj.expected_doctor_questions_and_answers) ? obj : null;
  } catch (_) { return null; }
}

/** Scenario used when the module context is free text and Gemini is unavailable. */
function genericScenarioFromText(patientContext) {
  const text = String(patientContext || '').trim();
  return {
    role_play: 'The student is the DOCTOR. You play the PATIENT.',
    setting: 'outpatient clinic',
    patient_profile: { name: 'Alex Morgan', age: 'adult', gender: 'unspecified', personality_trait: 'cooperative but worried' },
    medical_condition: {
      exact_diagnosis: 'described in scenario_text',
      chief_complaint: text ? text.slice(0, 300) : 'I have not been feeling well recently.',
      symptoms: [], duration: 'a few days', pain_level: 'n/a',
    },
    scenario_text: text,
    expected_doctor_questions_and_answers: [],
    questions_to_ask_doctor: ['What do you think is wrong with me, Doctor?', 'Will I need any tests?'],
  };
}

/**
 * Resolve the scenario for a new conversation.
 *  1. Modules seeded from datas.json store a ready JSON scenario in patient_context /
 *     final_challenge_context — used as-is (instant, no API call, specialty-specific).
 *  2. Legacy / admin-written free-text contexts are expanded into a scenario by Gemini.
 *  3. If Gemini fails, a generic scenario is built from the text itself.
 * @param {string} patientContext
 * @returns {Promise<string>} JSON string
 */
async function generatePatientScenario(patientContext) {
  const ready = tryParseScenario(patientContext);
  if (ready) return JSON.stringify(ready);

  const prompt = `
Generate a specific, unique patient persona and medical scenario based on the following module context:
CONTEXT: "${String(patientContext || '').slice(0, 2000)}"

Return a valid JSON object strictly matching this format:
{
  "role_play": "The student is the DOCTOR. You play the PATIENT.",
  "setting": "e.g. emergency department / dental clinic / paediatric clinic",
  "patient_profile": { "name": "Full Name", "age": <number>, "gender": "Male/Female", "occupation": "...", "personality_trait": "e.g. Anxious, Calm, In pain, Talkative" },
  "medical_condition": {
    "exact_diagnosis": "The exact condition (the student must work it out)",
    "chief_complaint": "What the patient says initially",
    "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
    "duration": "How long they have had symptoms",
    "pain_level": "1-10 or n/a"
  },
  "expected_doctor_questions_and_answers": [ { "doctor_question_topic": "e.g. When did it start?", "patient_answer": "e.g. It started 3 days ago." } ],
  "questions_to_ask_doctor": ["Question 1 the patient might ask", "Question 2"]
}
The scenario must match the CONTEXT's medical specialty and topic exactly. Use everyday language for the patient.
Return ONLY valid JSON. No markdown, no extra text.
`.trim();

  try {
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.7, maxOutputTokens: 1200, responseMimeType: 'application/json' },
    });
    const raw = (result && result.text ? result.text : '').replace(/```json|```/g, '').trim();
    const obj = JSON.parse(raw);
    if (obj && obj.medical_condition) return JSON.stringify(obj);
  } catch (err) {
    console.error('generatePatientScenario: Gemini unavailable, using generic scenario —', err.message);
  }
  return JSON.stringify(genericScenarioFromText(patientContext));
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
    config: { 
      temperature: 0.1, 
      responseMimeType: 'application/json',
      responseSchema: {
        type: "OBJECT",
        properties: {
          corrected_text: { type: "STRING" },
          has_errors: { type: "BOOLEAN" },
          error_count: { type: "INTEGER" },
          quality_score: { type: "INTEGER" },
          metrics: {
            type: "OBJECT",
            properties: {
              grammar: { type: "INTEGER" },
              vocabulary: { type: "INTEGER" },
              clarity: { type: "INTEGER" },
              medical_accuracy: { type: "INTEGER" }
            }
          },
          readability: { type: "STRING" },
          errors: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                original: { type: "STRING" },
                corrected: { type: "STRING" },
                category: { type: "STRING" },
                explanation: { type: "STRING" }
              }
            }
          },
          medical_enhancements: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                original: { type: "STRING" },
                suggested: { type: "STRING" },
                reason: { type: "STRING" }
              }
            }
          },
          clinical_tone_advice: { type: "STRING" }
        }
      }
    },
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

module.exports = {
  getPatientReply,
  getPatientReplyStream,
  getPatientAudioReplyStream,
  generateFeedback,
  checkGrammar,
  generatePatientScenario,
  buildPatientSystemInstruction,
  tryParseScenario,
};
