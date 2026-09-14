# Virtual Patient English — Sun'iy Intellekt (AI) Integratsiyasi

Ushbu hujjat **Virtual Patient English** platformasida qo'llanilgan AI Engine arxitekturasi, **Google Gemini GenAI SDK** (`@google/genai`), prompt muhandisligi, baholash algoritmi, ovoz integratsiyasi va xavfsizlik choralarini batafsil tushuntiradi.

---

## 1. AI Arxitekturasi va Ishlash Prinsipi

Platforma AI texnologiyasini **to'rtta asosiy yo'nalishda** qo'llaydi:

| # | AI Funksiyasi | Gemini Model | Servis Funksiya |
|---|:-------------|:------------|:----------------|
| 1 | **Virtual Bemor Agenti** | `gemini-2.5-flash` | `getPatientReply()` / `getPatientReplyStream()` |
| 2 | **AI Baholash Tizimi** | `gemini-2.5-flash` | `generateFeedback()` |
| 3 | **Grammatika Tekshirgichi** | `gemini-2.5-flash` | `checkGrammar()` |
| 4 | **Ovozli Suhbat (Live Audio)** | `gemini-2.0-flash-exp` | `setupLiveAudioWebSocket()` |

**Manba fayllari:**
- [`gemini.service.js`](file:///c:/Users/welcome/Desktop/projects/virtual-english-med-lab/backend/src/services/gemini.service.js) — Asosiy AI servis (702 qator)
- [`liveAudio.service.js`](file:///c:/Users/welcome/Desktop/projects/virtual-english-med-lab/backend/src/services/liveAudio.service.js) — WebSocket real-time ovozli suhbat

---

## 2. Gemini GenAI SDK Konfiguratsiyasi

```javascript
const { GoogleGenAI } = require('@google/genai');
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

**Model parametrlari:**

| Funksiya | Model | Temperature | Max Tokens | Response Format |
|:---------|:------|:----------:|:----------:|:---------------|
| Virtual Bemor Chat | `gemini-2.5-flash` | 0.8 | 300 | Plain text |
| AI Feedback | `gemini-2.5-flash` | 0.2 | — | `application/json` |
| Grammar Checker | `gemini-2.5-flash` | 0.1 | — | `application/json` + Schema |
| Audio Reply | `gemini-2.5-flash` | 0.7 | 800 | `application/json` + Schema |
| Live Audio WS | `gemini-2.0-flash-exp` | — | — | Audio stream (PCM) |

---

## 3. Virtual Bemor Agenti

### 3.1 Dinamik Persona Generatsiyasi (`generatePatientScenario`)

Har safar talaba yangi suhbat boshlaganida, modulning tayanch konteksti (`patient_context`) asosida **noyob bemor persona** generatsiya qilinadi. Tezlikni oshirish uchun 5 ta oldindan tayyorlangan ssenariy (`MODULE_SCENARIOS`) mavjud:

```json
{
  "patient_profile": {
    "name": "Sarah Jenkins",
    "age": 29,
    "gender": "Female",
    "personality_trait": "Anxious about cold sensitivity"
  },
  "medical_condition": {
    "exact_diagnosis": "Dentin Hypersensitivity / Acute Pulpitis",
    "chief_complaint": "Sharp shooting pain when drinking cold liquids",
    "symptoms": ["Cold sensitivity", "Percussion pain", "Night ache"],
    "duration": "4 days",
    "pain_level": "7"
  },
  "expected_doctor_questions_and_answers": [
    {
      "doctor_question_topic": "Onset",
      "patient_answer": "It started 4 days ago after drinking iced water."
    }
  ],
  "questions_to_ask_doctor": [
    "Can the nerve be saved, Doctor?",
    "What treatment do you recommend?"
  ]
}
```

### 3.2 Bemor System Prompt (`buildPatientSystemInstruction`)

Har bir suhbat uchun dinamik prompt yaratiladi:

```text
You are a patient visiting a doctor's/dentist's clinic. You speak ONLY English.
Behave realistically as a patient — express emotions (fear, pain, relief).
Stay strictly in character based on the JSON scenario provided below.
Do NOT break character under any circumstances.
Do NOT give medical advice or act as a doctor.

Your specific persona and scenario for this session:
{... dinamik ssenariy JSON ...}

IMPORTANT RULES:
- You already have a specific illness and symptoms defined in the scenario above.
- DO NOT state what your exact illness is immediately. Describe symptoms naturally.
- Keep responses short and natural (1-3 sentences max).
- Use simple everyday English (not medical jargon).
```

### 3.3 Chat Rejimlar

| Rejim | Funksiya | Tavsif |
|:------|:---------|:-------|
| **Sinxron** | `getPatientReply()` | To'liq javobni kutib qaytaradi |
| **SSE Streaming** | `getPatientReplyStream()` | Token-by-token real-time streaming (Server-Sent Events) |
| **Audio Stream** | `getPatientAudioReplyStream()` | Base64 audio qabul qiladi → transkript + javob qaytaradi |

### 3.4 Fallback Mexanizmi (`getContextualPatientFallback`)

Gemini API javob bermasa yoki xatolik yuz bersa, **kontekstual fallback** tizimi ishga tushadi. Talabaning xabaridagi kalit so'zlarga asoslanib, oldindan tayyorlangan javoblardan birini qaytaradi:

| Kalit so'zlar | Fallback javob turi |
|:-------------|:-------------------|
| `bring`, `help`, `problem` | Bemor shikoyati (chief complaint) |
| `how long`, `since when` | Og'riq davomiyligi |
| `fever`, `swallow` | Sistemik simptomlar |
| `look`, `x-ray`, `exam` | Tekshiruv va diagnostika |
| `abscess`, `infection` | Tashxis bo'yicha savol |
| `antibiotic`, `treat` | Davolash rejasi |
| `emergency`, `worse` | Ogohlantirilgan holatlar |

---

## 4. AI Baholash Tizimi (`generateFeedback`)

Suhbat yakunlanganda barcha dialog tarixi AI modeliga yuboriladi va **strukturalangan JSON** natija qaytariladi.

### 4.1 Baholash Prompt Tuzilishi

```text
MODULE TOPIC: {moduleTitle}

=== TARGET MEDICAL VOCABULARY FOR THIS MODULE ===
{modulning lug'at so'zlari}

=== TARGET CLINICAL PHRASES FOR THIS MODULE ===
{modulning phrasebook iboralari}

=== CONVERSATION TRANSCRIPT ===
DOCTOR: {talaba xabari}
PATIENT: {AI bemor javobi}
...
```

### 4.2 Baholash Mezonlari va Ballar Formulasi

| Mezon | Masshtab | Vazn (%) | Nimani Baholaydi? |
|:------|:-------:|:--------:|:-----------------|
| **Grammar** | 1–10 | 20% (×2.0) | Zamolar, fe'l shakllari, gap qurilishi |
| **Vocabulary** | 1–10 | 25% (×2.5) | Maqsadli tibbiy atamalar qo'llanishi |
| **Fluency** | 1–10 | 15% (×1.5) | Gaplarning ravonligi va mantiqiy bog'liqligi |
| **Pronunciation** | 1–10 | 15% (×1.5) | So'zlarning to'g'ri talaffuzi va professional ohang |
| **Clinical** | 1–10 | 25% (×2.5) | SOCRATES/OPQRST formatida anamnez yig'ish, empatik yondashuv |

**Umumiy ball formulasi:**

$$\text{Overall Score (100)} = G \times 2.0 + V \times 2.5 + F \times 1.5 + P \times 1.5 + C \times 2.5$$

**O'tish balli:** 60 ball va undan yuqori.

### 4.3 Natija JSON Sxemasi

```json
{
  "grammar_score": 8,
  "vocabulary_score": 9,
  "fluency_score": 7,
  "pronunciation_score": 8,
  "clinical_score": 9,
  "overall_score": 82,
  "target_vocab_used": ["Hypersensitivity", "Percussion", "Thermal test"],
  "target_phrases_used": ["When did you first notice this?"],
  "general_feedback": "Excellent clinical inquiry! You accurately asked about...",
  "errors": [
    {
      "original": "Where is pain location?",
      "corrected": "Could you point to where exactly the pain is located?",
      "explanation": "More professional and polite clinical phrasing."
    }
  ]
}
```

### 4.4 Fallback Baholash

AI javob bera olmasa, talabaning xabarlari tahlil qilinib avtomatik baho beriladi:
- **Xabarlar soni** va **so'zlar soni** hisoblanadi
- Maqsadli lug'at so'zlari va iboralar tekshiriladi
- Savollar mavjudligi (`?` belgisi) tekshiriladi
- Natijaga qarab 5-10 oralig'ida ball belgilanadi

---

## 5. Grammatika Tekshirgichi (`checkGrammar`)

### 5.1 4 Xil Tekshirish Rejimi

| Rejim | `mode` parametri | Maqsad |
|:------|:----------------|:-------|
| **Klinik** | `clinical` | Rasmiy tibbiy uslub (SOAP yozuvlari, shifokorlar muloqoti) |
| **Bemor bilan** | `patient` | Hamdard va tushunarli shifokor-bemor muloqoti |
| **Akademik** | `academic` | Ilmiy tibbiy jurnal/tadqiqot uslubi |
| **Umumiy** | `general` | Standart ingliz tili grammatikasi |

### 5.2 Natija Sxemasi

```json
{
  "corrected_text": "Tuzatilgan matn",
  "has_errors": true,
  "error_count": 3,
  "quality_score": 72,
  "metrics": {
    "grammar": 75,
    "vocabulary": 80,
    "clarity": 85,
    "medical_accuracy": 70
  },
  "readability": "Moderate",
  "errors": [
    {
      "original": "patient have pain",
      "corrected": "patient has pain",
      "category": "Grammar",
      "explanation": "3rd person singular requires 'has'"
    }
  ],
  "medical_enhancements": [
    {
      "original": "toothache",
      "suggested": "dental pain / odontalgia",
      "reason": "Professional medical terminology preferred in clinical notes"
    }
  ],
  "clinical_tone_advice": "Use present perfect tense for ongoing symptoms."
}
```

---

## 6. WebSocket Live Audio (Real-Time Ovozli Suhbat)

### 6.1 Arxitektura

```
[Talaba Mikrofoni] ──(PCM 16kHz)──► [WebSocket Server]
                                          │
                                   [Gemini Live API]
                                   (gemini-2.0-flash-exp)
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                       [Audio Response]        [Text Transcript]
                              │                       │
                              ▼                       ▼
                    [Frontend Speaker]       [Chat UI Display]
```

### 6.2 WebSocket Message Protocol

| Yo'nalish | `type` | Ma'lumot |
|:----------|:-------|:---------|
| Client → Server | `init` | `{ conversationId, moduleId, studentId }` |
| Server → Client | `ready` | `{ conversationId }` |
| Client → Server | `audio_chunk` | `{ data: base64_pcm }` |
| Server → Client | `audio` | `{ data: base64_audio_response }` |
| Server → Client | `transcript` | `{ text: "AI bemor javobi matni" }` |
| Server → Client | `error` | `{ message: "Xatolik" }` |

### 6.3 Gemini Live Session Konfiguratsiyasi

```javascript
const session = await ai.live.connect({
  model: 'gemini-2.0-flash-exp',
  config: {
    systemInstruction: { parts: [{ text: patientPrompt }] },
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Aoede' }
        }
      }
    }
  }
});
```

---

## 7. Prompt Muhandisligida Xavfsizlik Choralari

1. **Roldan Chiqishni Bloklash:** "Do NOT break character under any circumstances" — bemor AI hech qachon shifokor yoki AI ekanini oshkor qilmaydi.
2. **Klinik Doira Cheklovi:** AI faqat tibbiyot mavzusida javob beradi, boshqa mavzularga o'tmaydi.
3. **Tashxisni Yashirish:** Bemor o'z kasalligini ochiq aytmaydi — talaba mustaqil tashxis qo'yishi kerak.
4. **JSON Schema Enforcer:** `responseMimeType: 'application/json'` va `responseSchema` orqali AI ning javob formatini qat'iy nazorat qilish.
5. **Context Retention:** Dialog tarixidagi barcha xabarlar har bir so'rovda kontekst sifatida yuboriladi.
6. **Fallback zanjiri:** Gemini API xatolik bersa, kontekstual fallback → statik javob ketma-ketligi ishlaydi.

---

## 8. Eksport Qilinadigan AI Funksiyalar

```javascript
module.exports = {
  getPatientReply,           // Sinxron bemor javobi
  getPatientReplyStream,     // SSE streaming bemor javobi
  getPatientAudioReplyStream,// Audio → transkript + javob
  generateFeedback,          // Ko'p mezonli suhbat baholashi
  checkGrammar,              // Grammatika tekshirgichi (4 rejim)
  generatePatientScenario,   // Dinamik bemor persona generatsiyasi
};
```

---

## 9. 2026-09: Yo'nalishga mos Virtual Bemor (ssenariy manbai)

Avval `generatePatientScenario` qat'iy 5 ta **stomatologik** ssenariydan birini qaytarar edi — pediatriya yoki tez tibbiy yordam talabasi ham tish abssessi bilan gaplashardi. Endi ketma-ketlik quyidagicha (`src/services/gemini.service.js`):

1. **Tayyor JSON ssenariy** — `node datas.js` har bir modulning `patient_context` / `final_challenge_context` ustuniga Word dialogidan qurilgan JSON yozadi (`role_play`, `patient_profile`, `medical_condition`, `expected_doctor_questions_and_answers`, `questions_to_ask_doctor`). U bo'lsa — **API chaqiruvisiz, darhol** ishlatiladi.
2. **Erkin matn** (admin panelda qo'lda yozilgan modul) — Gemini `responseMimeType: application/json` bilan ssenariy generatsiya qiladi.
3. Gemini ishlamasa — matnning o'zidan **umumiy ssenariy** tuziladi (dental emas).

`buildPatientSystemInstruction` endi `role_play` va `setting` ni hisobga oladi: hamshiralik yo'nalishida talaba **NURSE**, pediatriyada AI **ota-ona** (bola haqida 3-shaxsda gapiradi). Bu funksiya `liveAudio.service.js` (WebSocket ovozli suhbat) uchun ham umumiy.

**Offline fallback** (`getContextualPatientFallback`): Gemini javob bermasa, talaba savoli ssenariydagi `expected_doctor_questions_and_answers` bilan so'z mosligi bo'yicha solishtiriladi va eng yaqin `patient_answer` qaytariladi; salomlashuvga — `chief_complaint`, "how long" ga — `duration`. Shu tufayli barcha yo'nalishlarda AI kalitsiz ham mazmunli mashq qilish mumkin.

Ssenariy qanday quriladi — [`17_data_pipeline_datas_json.md`](./17_data_pipeline_datas_json.md), 5.4-bo'lim.
