# Virtual Patient English — Sun'iy Intellekt (AI) Integratsiyasi

Ushbu hujjat **Virtual Patient English** platformasida qo'llanilgan Sun'iy Intellekt (AI Engine) arxitekturasi, Google Gemini GenAI SDK (`@google/genai`), prompt muhandisligi (Prompt Engineering), baholash algoritmi va ovoz texnologiyalarini batafsil tushuntiradi.

---

## 1. AI Arxitekturasi va Ishlash Prinsipi

Platforma AI texnologiyasini ikkita asosiy yo'nalishda qo'llaydi:
1. **Virtual Bemor Agenti (Conversational Patient Agent):** Talaba shifokor rolida savol berganda, AI o'zini real klinik simptomlarga ega bemor kabi tutadi va dinamik javob beradi.
2. **AI Baholash Tizimi (Evaluation & Assessment Engine):** Suhbat yakunida dialog transkriptini tahlil qilib, 5 mezon bo'yicha baho (Scorecard) va grammatik xatolar tahlilini beradi.
3. **Mustaqil Grammatika Checker:** Talabaning istalgan matnini tezkor grammatik va imloviy tahlil qiladi.

---

## 2. Gemini GenAI SDK Integratsiyasi

Loyiha backendida **`@google/genai`** kutubxonasi va **`gemini-2.5-flash`** modeli qo'llanilgan.

- **Servis fayli:** `backend/src/services/gemini.service.js`
- **Model parametrlari:**
  - `gemini-2.5-flash` (Tezkor va yuqori aniqlikdagi suhbat va JSON tahlili uchun)
  - `responseMimeType: 'application/json'` (Qat'iy strukturalangan JSON javoblar uchun)

---

## 3. Virtual Bemor Prompt Muhandisligi

### 3.1 Dinamik Persona Generatsiyasi (`generatePatientScenario`)
Har safar talaba yangi suhbat boshlaganida, modulning tayanch konteksti asosida **takrorlanmas bemor shaxsi (persona)** generatsiya qilinadi:

```javascript
// Input context: "Dental Pain & Sensitivity"
// Gemini output JSON:
{
  "patient_profile": {
    "name": "John Miller",
    "age": 34,
    "gender": "Male",
    "occupation": "Software Engineer",
    "personality_trait": "Anxious about dental procedures"
  },
  "medical_condition": {
    "exact_diagnosis": "Dentin Hypersensitivity",
    "chief_complaint": "Sharp pain when drinking cold drinks",
    "symptoms": ["Cold sensitivity", "Brief sharp pain", "No swelling"],
    "duration": "4 days",
    "pain_level": "6/10"
  },
  "questions_to_ask_doctor": [
    "Will I need a root canal for this?",
    "Can special toothpaste fix this?"
  ]
}
```

### 3.2 Chat Tizim Buyrug'i (System Instruction)

Virtual bemor quyidagi qat'iy tizim yo'riqnomasi asosida muloqot qiladi:

```text
You are a patient visiting a doctor's/dentist's clinic. You speak ONLY English.
Behave realistically as a patient — express emotions (fear, pain, relief).
Stay strictly in character based on the JSON scenario provided.
Do NOT break character under any circumstances.
Do NOT give medical advice or act as a doctor.

IMPORTANT RULES:
- You already have a specific illness and symptoms defined in the scenario. Do NOT change them.
- DO NOT state what your exact illness is immediately. Instead, describe your symptoms naturally when asked.
- Answer questions naturally and conversationally (1-3 sentences max).
- Use simple everyday English (not medical jargon).
```

---

## 4. AI Feedback va Baholash Tizimi

Suhbat yakunida `generateFeedback(messages)` funksiyasi barcha dialog transkriptini Gemini'ga yuboradi.

### 4.1 Scoring Mezonlari va Og'irliklari

| Mezon | Shkala | Tavsif | Og'irlik |
|-------|--------|--------|----------|
| `grammar_score` | 1 - 10 | Zamondoshlik, fe'l moslashuvi va struktura | 20% |
| `vocabulary_score` | 1 - 10 | Tibbiy terminlar va professional iboralar | 20% |
| `fluency_score` | 1 - 10 | Savollarning mantiqiy ketma-ketligi va ravonligi | 15% |
| `pronunciation_score` | 1 - 10 | Matn ravonligi va talaffuz uyg'unligi | 15% |
| `clinical_score` | 1 - 10 | Anamnez yig'ish (onset, location, severity, triggers) | 30% |
| **`overall_score`** | **0 - 100** | **Umumiy salmoqli o'rtacha ball** | **100%** |

### 4.2 JSON Structured Feedback Response
```json
{
  "grammar_score": 8,
  "vocabulary_score": 9,
  "fluency_score": 7,
  "pronunciation_score": 8,
  "clinical_score": 9,
  "overall_score": 83,
  "general_feedback": "Great bedside manner! You effectively diagnosed the sensitivity triggers.",
  "errors": [
    {
      "original": "How long it is hurting?",
      "corrected": "How long has it been hurting?",
      "explanation": "Use present perfect continuous for an action starting in the past and continuing."
    }
  ]
}
```

---

## 5. Ovoz va Nutq Texnologiyalari (STT / TTS)

1. **Speech-to-Text (STT):**
   - Web Speech API (brauzer ichida tezkor ovozni matnga o'giriish)
   - OpenAI Whisper API (Backend orqali audio fayllarni aniq transkripsiyalash)
2. **Text-to-Speech (TTS):**
   - Web Speech API SpeechSynthesis orqali bemor javoblarini ovozli o'qish.

---

## 6. Xatolikka Chidamlilik (Fallback Mechanisms)

- Agar Gemini API so'rovida tarmoq uzilishi yoki JSON parse xatosi yuz bersa, tizim xatoga uchramaydi.
- Standart zaxira obyekt (Fallback Response Object) qaytariladi va foydalanuvchi suhbati xavfsiz saqlanadi.
