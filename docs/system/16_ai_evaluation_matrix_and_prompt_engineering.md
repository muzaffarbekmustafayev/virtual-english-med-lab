# Virtual Patient English — AI Baholash Mezonlari va Prompt Muhandisligi

Ushbu hujjat **Virtual Patient English** platformasidagi Sun'iy Intellekt (Gemini AI / OpenAI GPT-4o) tizimli promptlari, baholash mezonlari hamda strukturalangan JSON javob sxemalarini batafsil belgilaydi.

---

## 1. AI Virtual Patient Agenti Tizimli Prompt Shabloni

AI-bemor rolini ijro etuvchi model uchun yuboriladigan tizimli prompt (System Prompt):

```text
You are playing the role of a virtual patient in a medical simulation for dental students learning clinical English.

PATIENT PROFILE:
- Name: {patient_name}
- Age: {patient_age}
- Occupation: {patient_occupation}
- Main Complaint: {chief_complaint}
- Medical Context: {patient_context}

INSTRUCTIONS FOR THE AI:
1. Act naturally as a real patient experiencing these symptoms. Express realistic emotions (anxiety, concern, pain).
2. Respond strictly in English. Match your vocabulary to a non-medical layperson. Do NOT use complex dental jargon unless explaining past medical visits.
3. Answer the student's questions directly. If the student asks vague questions, give partial information and wait for more specific follow-up questions.
4. Keep responses concise (2-4 sentences max per turn) to simulate natural spoken consultation.
5. Never break character. Never reveal that you are an AI.
```

---

## 2. AI Feedback Engine (Structured Output Schema)

Suhbat tugallanganda barcha dialog tarixi AI Feedback modeliga yuboriladi va modeldan quyidagi JSON strukturasidagi javob talab etiladi:

```json
{
  "grammar_score": 8.5,
  "vocabulary_score": 9.0,
  "fluency_score": 8.0,
  "clinical_score": 9.5,
  "overall_score": 87,
  "summary": "Talaba bemor og'rig'ining joyi, davomiyligi va triggerlarini aniq diagnostik savollar orqali muvaffaqiyatli aniqladi.",
  "strengths": [
    "Simptomlarning boshlanish vaqtini (onset) to'g'ri so'radi",
    "Empatik muloqot va bemorni tinchlantirish iboralaridan foydalandi"
  ],
  "weaknesses": [
    "Ba'zi oziq tish atamalarida imlo xatosi kuzatildi",
    "Bemor tibbiy tarixini (medical history) so'rash unutildi"
  ],
  "corrections": [
    {
      "original": "Where is pain location?",
      "corrected": "Could you point to where exactly the pain is located?",
      "explanation": "Professionalroq va xushmuomala klinik shakl."
    },
    {
      "original": "How long it hurt?",
      "corrected": "How long has this pain been bothering you?",
      "explanation": "Present Perfect zamoni grammatik jihatdan to'g'ri."
    }
  ]
}
```

---

## 3. 4 Ta Asosiy Baholash Mezonlar Rubrikasi

| Mezon | Masshtab | Tahlil Manbai | Nimani Baholaydi? |
| :--- | :---: | :--- | :--- |
| **Grammar (Grammatika)** | 1 – 10 | Zamolar, fe'l shakllari, gap qurilishi | Zamonga moslik, so'z tartibi, predloglar to'g'riligi. |
| **Vocabulary (Lug'at)** | 1 – 10 | Tibbiy atamalar bazasi bilan solishtirish | Klinik va stomatologik termimlarning o'rinli qo'llanishi. |
| **Fluency (Ravonlik)** | 1 – 10 | Gap uzunligi va bog'lovchilar | Muloqotning tabiiyligi va izchilligi. |
| **Clinical (Klinik Etika)** | 1 – 10 | Diagnostik protokollar | Anamnez yig'ish ketma-ketligi, og'riq shkalasini so'rash, empatik yondashuv. |

---

## 4. Prompt Muhandisligida Xavfsizlik va Hallyusinatsiya Himoyasi

1. **System Instruction Enforcer:** Model klinik doiradan tashqaridagi (tibbiyotga aloqador bo'lmagan) mavzularga og'ib ketmasligi uchun qat'iy chegaralar qo'yiladi.
2. **Context Retention Window:** Dialog tarixining oxirgi 15 ta xabari doimiy kontekst sifatida saqlanib yuboriladi.
