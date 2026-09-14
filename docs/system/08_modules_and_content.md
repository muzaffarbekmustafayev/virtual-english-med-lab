# Virtual Patient English — O'quv Modullari va Kontent Sxemasi

Ushbu hujjat platformadagi o'quv modullari qanday tashkil etilgani, har bir modul qanday ma'lumotlardan iboratligi va bu ma'lumotlar qayerdan kelishini tushuntiradi. Modullarning to'liq ro'yxati — [`18_specialties_and_curricula.md`](./18_specialties_and_curricula.md), Word fayllardan bazagacha bo'lgan jarayon — [`17_data_pipeline_datas_json.md`](./17_data_pipeline_datas_json.md).

---

## 1. Yo'nalishlar va Modullar Soni

Platforma **5 ta yo'nalish** bo'yicha **58 ta modul**ni o'z ichiga oladi (40 tasi faol):

| # | Yo'nalish | `specialties.code` | Modullar | Talaba roli | Holat |
|---|---|---|:-:|---|---|
| 1 | Davolash ishi (General Medicine) | `GEN_MED` | 10 | Doctor | ✅ |
| 2 | Stomatologiya (Stomatology) | `STOM` | 10 | Dentist | ✅ |
| 3 | Pediatriya ishi (Pediatrics) | `PED` | 10 | Doctor ↔ ota-ona | ✅ |
| 4 | Hamshiralik ishi (Nursing) | `NURSING` | 18 | Nurse | ⏸ `enabled:false` |
| 5 | Tez tibbiy yordam (First Aid / Emergency Medicine) | `FIRST_AID` | 10 | Doctor | ✅ |

`specialty_id` qiymatlari bazaga qarab farq qilishi mumkin (eski bazalarda 1 = Stomatologiya, 2 = Davolash ishi); dastur **kod** bo'yicha ishlaydi.

---

## 2. Bitta Modulning Tarkibi

Har bir modul papkasida 3 ta Word fayl bo'ladi — **dialog**, **grammatika**, **lug'at + iboralar**. Ulardan quyidagilar hosil qilinadi:

| Bo'lim | Baza | Manba | Talabaga qanday ko'rinadi |
|---|---|---|---|
| Modul kartasi | `modules` (`title_uz/ru/en`, `description_*`, `grammar_focus`, `order_index`) | `config.js` + dialog sarlavhasi | Modullar ro'yxati, progress |
| Grammatika | `grammars` (`title`, `structure_pattern`, `rule_explanation_uz/ru/en`, `examples[]`, `common_mistakes[]`, `step_order`) | grammatika fayli, raqamlangan bo'limlar | 1-bosqich: qoida kartalari (§1, §2 …) |
| Lug'at | `vocabulary` (`word`, `pronunciation`, `translation_uz/ru`, `definition_en`, `example`) | lug'at jadvallari + dialogdan misol | 2-bosqich: atama kartalari (IPA, tarjima, misol, TTS) |
| Iboralar | `phrasebook` (`category`, `phrase`, `pronunciation`, `hint_uz/ru/en`, `patient_response(_uz/_ru)`, `step_order`) | Smart Phrasebook jadvallari / paragraflari | 3-bosqich: kategoriyalangan iboralar + bemor javobi; chatdagi "tavsiya etilgan savollar" |
| Namunaviy dialog | `modules.reference_dialogue` (JSON: `[{role,label,text}]`) | dialog fayli | 3-bosqichda ochiladigan panel |
| Bo'sh joy mashqi | — (frontend, iboralardan) | — | 4-bosqich |
| Test | `tests` (savol + 4 variant + izoh, 3 tilda) | avtomatik: lug'at → ma'no, ma'no → atama, ibora bo'sh joyi, to'g'ri gap | 5-bosqich (60% o'tish balli) |
| Virtual bemor | `modules.patient_context` / `final_challenge_context` (JSON ssenariy) | dialogdan | 6-bosqich: matnli/ovozli suhbat; `case_brief` orqali bemor haqida qisqacha |

---

## 3. Virtual Bemor Ssenariysi (`patient_context`)

```json
{
  "module": "Diabetic Emergencies (DKA)",
  "specialty": "First Aid (Emergency Medicine)",
  "setting": "emergency department / resuscitation bay",
  "role_play": "The student is the DOCTOR. You play the PATIENT.",
  "counterpart_label": "Patient",
  "patient_profile": { "name": "Emily Watson", "age": "51", "gender": "Female", "personality_trait": "distressed, worried, answers briefly because of discomfort" },
  "medical_condition": {
    "exact_diagnosis": "Diabetic Emergencies (DKA)",
    "chief_complaint": "I've been feeling extremely unwell since yesterday. I'm very thirsty, I've been urinating constantly, and I've vomited several times.",
    "symptoms": ["extremely unwell"], "duration": "since yesterday", "pain_level": "n/a",
    "doctor_explanations_from_reference_dialogue": ["Your symptoms and test results are highly suggestive of diabetic ketoacidosis, or DKA."]
  },
  "expected_doctor_questions_and_answers": [
    { "doctor_question_topic": "Have you been taking your insulin regularly?", "patient_answer": "No. I've missed several doses over the last two days." }
  ],
  "questions_to_ask_doctor": ["What does that mean?", "Is it dangerous?"]
}
```

- Talabaga faqat xavfsiz qismi (`case_brief`: ism, yosh, jins, shikoyat, davomiylik, simptomlar) ko'rsatiladi; `exact_diagnosis` va kutilgan javoblar **yashirin**.
- Pediatriyada AI — bolaning **ota-onasi** (`role_play` da ko'rsatilgan), hamshiralikda talaba — **hamshira**.
- `final_challenge_context` — shu ssenariy + "qisqa javob ber, yashirin asorat qo'sh" ko'rsatmasi.
- Gemini bo'lmaganda ham suhbat ishlaydi: javob `expected_doctor_questions_and_answers` dan tanlanadi (`getContextualPatientFallback`).

---

## 4. Kontentni Yangilash

1. Word faylni `datas/<Yo'nalish>/MODULE n/` ga qo'ying (nomida `dialog` / `grammar` / `vocabulary` so'zi bo'lsin).
2. Lokal: `cd backend && node scripts/build_datas.js -v` → `datas/datas.json` yangilanadi, ogohlantirishlarni ko'ring.
3. Kerak bo'lsa `MODULE n/module_extra.json` bilan qo'lda to'ldiring.
4. Serverda: `git pull && cd backend && node datas.js`.
5. Admin paneldagi Kontent menejeri orqali ham alohida yozuvlarni tahrirlash mumkin — lekin `node datas.js` shu modulning grammatika/lug'at/ibora/test yozuvlarini **qayta yozadi** (qo'lda kiritilganlar yo'qoladi; doimiy o'zgarishlarni `module_extra.json` ga yozing).
