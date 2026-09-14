# Virtual Patient English — Kontent Konveyeri: Word fayllar → `datas.json` → MySQL

Ushbu hujjat `datas/` papkasidagi Word (.docx) fayllardan o'quv kontenti qanday olinishi, `datas/datas.json` fayli qanday yig'ilishi va u serverda **bitta buyruq** bilan bazaga qanday yuklanishi haqida to'liq qo'llanma.

> **Qisqacha:** serverda `backend/` papkasida `node datas.js` buyrug'ini bering — barcha yo'nalishlar (Davolash ishi, Stomatologiya, Pediatriya, Tez tibbiy yordam) uchun modullar, lug'at, iboralar, grammatika, testlar va virtual bemor ssenariylari bazaga yoziladi. Har bir talaba faqat **o'z yo'nalishidagi** modullarni ko'radi.

---

## 1. Umumiy Sxema

```
datas/                                  backend/                         MySQL
├── DAVOLASH ISHI/Module_01/*.docx ──┐
├── STOMOTOLOGY/MODULE 1/*.docx     ──┤   scripts/build_datas.js          node datas.js
├── Pediatrics/MODULE 1/*.docx      ──┼──────────────────────▶ datas/datas.json ──────────▶ specialties
├── NURSERY/MODULE 1/*.docx         ──┤   (docx → JSON, 0 dependency)     (JSON → Sequelize)   modules
└── First Aid/MODULE 1/*.docx       ──┘                                                        grammars
                                                                                              vocabulary
    + <MODULE n>/module_extra.json  (qo'lda yozilgan qo'shimchalar, ixtiyoriy)                phrasebook
                                                                                              tests
```

- **`scripts/build_datas.js`** — Word fayllarni o'qiydi (tashqi kutubxonasiz: `.docx` = ZIP + XML, `scripts/lib/docx.js` uni Node'ning o'zidagi `zlib` bilan ochadi), matnni tahlil qiladi va `datas/datas.json` ni yaratadi.
- **`datas.js`** — `datas.json` ni o'qib, bazaga yozadi. Fayl bo'lmasa, avval o'zi yig'ib oladi.
- **`datas/datas.json`** — Git'da saqlanadi (≈4 MB). Serverga Word fayllarni ko'chirish **shart emas** — faqat `datas.json` yetarli.

---

## 2. Buyruqlar

`backend/` papkasida:

| Buyruq | Nima qiladi |
|---|---|
| `node datas.js` | `datas/datas.json` dagi **yoqilgan** (`enabled: true`) yo'nalishlarni bazaga yozadi. Fayl bo'lmasa, avval Word fayllardan yig'adi. |
| `node datas.js --build` | Avval Word fayllardan `datas.json` ni **qayta yig'adi**, keyin bazaga yozadi (Word fayllar yangilanganda). |
| `node datas.js --all` | `enabled: false` bo'lgan yo'nalishlarni ham (hozircha **Hamshiralik ishi**) yuklaydi. |
| `node datas.js --only=FIRST_AID,PED` | Faqat ko'rsatilgan yo'nalish(lar)ni yuklaydi. Kodlar: `GEN_MED`, `STOM`, `PED`, `NURSING`, `FIRST_AID`. |
| `node datas.js --dry-run` | Bazaga **hech narsa yozmaydi**; nima o'zgarishini (yangi/yangilanadigan modullar, kerakli ustunlar) ko'rsatadi. |
| `node datas.js --file=path/to.json` | Boshqa JSON fayldan yuklash. |
| `node scripts/build_datas.js [-v] [--only=STOM]` | Faqat `datas.json` yig'ish (bazasiz). `-v` har bir modul statistikasini chiqaradi. |

`package.json` qisqartmalari: `npm run datas`, `npm run datas:build`, `npm run datas:all`, `npm run datas:dry`.

### Serverda birinchi marta yuklash

```bash
cd /var/www/virtual-english-med-lab
git pull
cd backend
npm install --production
node datas.js --dry-run     # tekshirish (ixtiyoriy)
node datas.js               # bazaga yozish
pm2 restart vpe-backend
```

### Word fayllar o'zgarganda (kontent yangilash)

```bash
# lokal kompyuterda:
cd backend && node scripts/build_datas.js -v      # datas/datas.json yangilanadi
git add datas/datas.json datas/ && git commit -m "content: ..." && git push

# serverda:
git pull && cd backend && node datas.js
```

---

## 3. `datas.js` Nima Qiladi (qadam-baqadam)

1. `.env` dagi `DB_*` sozlamalar bilan MySQL'ga ulanadi; `sequelize.sync()` — **faqat mavjud bo'lmagan jadvallarni** yaratadi.
2. **Qo'shimcha ustunlar** (`src/services/schema.service.js`): mavjud jadvallarga yetishmayotgan ustunlarni `ADD COLUMN` bilan qo'shadi (hech narsa o'chirilmaydi, `ALTER ... DROP` ishlatilmaydi). Xuddi shu tekshiruv server ishga tushganda ham bajariladi.
3. **Yo'nalishlar (`specialties`)** — `code` bo'yicha topiladi. Eski bazalarda `code` bo'lmasa, nom bo'yicha moslashtiriladi (`Stomatologiya` → `STOM`, `Davolash ishi` → `GEN_MED` ...) — shuning uchun mavjud talabalar/guruhlarning `specialty_id` si **o'zgarmaydi**.
4. **Modullar** — `(specialty_id, order_index)` juftligi bo'yicha topiladi: bor bo'lsa yangilanadi, yo'q bo'lsa yaratiladi. Modul `id` si saqlanib qoladi, shuning uchun talabalarning natijalari (`conversations`, `module_results`, `test_results`) buzilmaydi.
5. Har bir modulning **`grammars`, `vocabulary`, `phrasebook`, `tests`** yozuvlari o'chirilib, `datas.json` dagilar bilan **to'liq almashtiriladi** (bitta tranzaksiyada).
6. `users`, `student_groups`, `teacher_groups`, `conversations`, `messages`, `*_results`, `forum_messages` jadvallariga **tegilmaydi**.
7. Yakunda hisobot va manba fayllar bo'yicha ogohlantirishlar chiqadi.

Buyruq **idempotent**: qayta-qayta bajarish xavfsiz.

---

## 4. `datas/` Papka Tuzilmasi va Nomlash Qoidalari

```
datas/
├── datas.json                         ← generatsiya qilinadi (Git'da saqlanadi)
├── DAVOLASH ISHI/                     ← GEN_MED   (Module_01 … Module_10)
├── STOMOTOLOGY/                       ← STOM      (MODULE 1 … MODULE 10)
├── Pediatrics/                        ← PED       (MODULE 1 … MODULE 10)
├── NURSERY/                           ← NURSING   (MODULE 1 … MODULE 18, enabled:false)
└── First Aid/                         ← FIRST_AID (MODULE 1 … MODULE 10)
```

Yo'nalish papkasi ↔ kod moslashuvi `backend/scripts/config.js` da (`folder` maydoni). Modul papkasi nomida **raqam** bo'lishi shart (`MODULE 3`, `Module_03`, `MODUL 3` — hammasi 3-modul).

Har bir modul papkasida **3 turdagi** Word fayl bo'ladi. Turi avval **fayl nomidan**, bo'lmasa **mazmunidan** aniqlanadi:

| Tur | Fayl nomida | Mazmun belgisi | Nima olinadi |
|---|---|---|---|
| **Dialog** | `dialog`, `dialogue`, yoki `MODULE 5.docx` kabi | `Doctor:` / `Patient:` / `Nurse:` / `Parent:` qatorlari (≥ 6 ta) | `reference_dialogue` (namunaviy suhbat), virtual bemor ssenariysi, lug'at misollari |
| **Grammatika** | `gramm`, `grammatika` | 1-satrlarda "GRAMMAR" | `grammars` — raqamlangan bo'limlar (`1. PRESENT PERFECT …`) → qoidalar |
| **Lug'at + Iboralar** | `vocab`, `phrase`, `smart` | "VOCABULARY" / "SMART PHRASEBOOK" sarlavhalari | `vocabulary` va `phrasebook` |

E'tiborga olinmaydi: `~$` bilan boshlanuvchi vaqtinchalik fayllar, `.doc` (eski format — Word orqali `.docx` ga saqlang), `.docxxx`, 0 baytli bo'sh fayllar (ogohlantirish chiqadi).

---

## 5. Parser Word Fayllardan Nimalarni Tushunadi

### 5.1 Lug'at va iboralar (`scripts/lib/lexicon.js`)

Jadval ustunlari **sarlavhasidan** aniqlanadi (tartib muhim emas):

| Ustun roli | Sarlavhada uchraydigan so'zlar |
|---|---|
| inglizcha atama / ibora | `English`, `Term / Phrase`, `Smart Phrase`, `Clinical chunk`, `Collocation`, `Doctor — English` |
| talaffuz (IPA) | `Pronunciation`, `Talaffuzi`, `IPA` |
| o'zbekcha | `O‘zbekcha`, `Uzbek`, `Tarjima` |
| ruscha | `Русский`, `Russian` |
| izoh / klinik ma'no | `Clinical meaning / usage`, `Clinical Use / Vazifasi`, `Meaning`, `Function` |
| misol | `Example`, `Misol` |
| bosqich (kategoriya) | `Bosqich`, `Stage`, `Step`, `Category` |
| rol | `Role` (Doctor / Patient qatorlari) |
| bemor javobi | `Patient — English` (+ undan keyingi `O‘zbekcha` / `Русский`) |

Qo'llab-quvvatlanadigan formatlar:

- `English | Pronunciation | Uzbek | Russian` — 4 ustunli klassik jadval (barcha yo'nalishlar);
- `Bosqich | Role | English | Talaffuzi | O‘zbekcha | Русский` — bosqichli iboralar (Tez tibbiy yordam);
- `Bosqich | Doctor — English | Talaffuzi | O‘zbekcha | Patient — English | O‘zbekcha | Русский` — stomatologiya 7 ustunli jadvali (bemor javobi ham saqlanadi);
- Paragraf ko'rinishi: `Doctor: …` / `Talaffuzi: …` / `O‘zbekcha: …` / `Русский: …` / `Patient: …`;
- Paragraf ko'rinishi: `1. Phrase ⏎ 🇺🇿 … ⏎ 🇷🇺 …` (bayroqli);
- Paragraf ko'rinishi: `Phrase ⏎ Uzbek: … ⏎ Russian: … ⏎ Clinical use: …` (Davolash ishi).

**Atama yoki ibora?** Bo'lim sarlavhasi (`VOCABULARY` → atama, `SMART PHRASEBOOK` → ibora) va gapning ko'rinishi (tinish belgisi bilan tugaydigan / 7+ so'zli / `Have you…`, `I'm going to…` kabi boshlanuvchi → ibora) bo'yicha hal qilinadi. `HIGH-VALUE CLINICAL CHUNKS` bo'limidagi qisqa birikmalar lug'atga, to'liq gaplar iboralarga tushadi.

Ibora **kategoriyasi** eng yaqin sarlavhadan olinadi: `2. SMART PHRASEBOOK — HISTORY TAKING` → `History Taking`; `1. Opening the consultation — Konsultatsiyani boshlash` → `Opening the consultation`; `A. Discussing Vaccination History` → `Discussing Vaccination History`.

Bir xil atama/ibora bir necha jadvalda uchrasa — birlashtiriladi (birinchisida bo'lmagan ruscha/talaffuz keyingisidan to'ldiriladi).

### 5.2 Grammatika (`scripts/lib/grammar.js`)

Hujjat **raqamlangan bo'limlarga** (`1. PRESENT PERFECT CONTINUOUS — …`, `2. PAST CONTINUOUS`, …) ajratiladi; har bir bo'lim = bitta qoida kartasi (`grammars` yozuvi). Bo'lim ichida:

| Word fayldagi ko'rinish | `grammars` maydoni |
|---|---|
| `Form` / `Formula` / `Structure` satri va undan keyingi `have/has + been + V-ing` | `structure_pattern` |
| `Positive: …`, `Negative: …`, `Question: …` satrlari | `structure_pattern` (`|` bilan birlashtirilgan) |
| `Dialogue example | O‘zbekcha | Русский` jadvallari, `"Misol: …"` satrlari, ingliz tilidagi namuna gaplar | `examples[] {sentence, translation_uz, translation_ru, note}` |
| `Modal | Dialogue example | …`, `Pattern | Example | …` jadvallari | `examples[]` (`note` = modal / pattern) |
| `Present Perfect | Present Perfect Continuous | Farqi` taqqoslash jadvallari | `examples[]` (`note` = ustun sarlavhasi + farq) |
| `O‘zbekcha tushuntirish: …`, o'zbekcha paragraflar | `rule_explanation_uz` |
| `Объяснение по-русски: …`, ruscha paragraflar | `rule_explanation_ru` |
| inglizcha tushuntirish paragraflari | `rule_explanation_en` (bo'lmasa — `Structure: …` avtomatik) |
| `❌ … / ✅ …` juftliklari, `Incorrect | Correct | Why?` jadvallari | `common_mistakes[] {incorrect, correct, explanation}` |
| `Signal words: since, for …` | `signal_words` |
| `RUSSIAN EXPLANATION`, `O‘ZBEKCHA EXPLANATION`, `GRAMMAR FOCUS`, `KEY TAKEAWAY` bo'limlari | modul darajasidagi **"Grammar focus"** kirish kartasi (`step_order = 1`) |
| `KEY CLINICAL LANGUAGE` (`term — uz — ru`) | qo'shimcha lug'at |
| `SPEAKING TASK`, `PRACTICE`, `ANSWER KEY` bo'limlari | **o'tkazib yuboriladi** |

`2. PRESENT PERFECT CONTINUOUS — FORMULA` va `3. PRESENT PERFECT CONTINUOUS — DIALOGUE EXAMPLES` kabi bir mavzuga oid ketma-ket bo'limlar **bitta** qoidaga birlashtiriladi.

### 5.3 Dialog (`scripts/lib/dialogue.js`)

`Doctor:` / `Patient:` / `Nurse:` / `Parent:` / `Mother:` / `Relative:` / `Paramedic:` … bilan boshlangan satrlar (bir paragrafda bir nechtasi bo'lishi ham mumkin), `Speaker | Dialogue` jadvallari. Har bir replika `{role, label, text}` ko'rinishida saqlanadi; `role` = `doctor` | `nurse` | `patient`.

### 5.4 Avtomatik hosil qilinadigan qismlar (`scripts/lib/generate.js`)

Faqat modulning **o'z fayllaridagi** matndan, deterministik (qayta yig'ilganda bir xil natija):

- **Lug'at misollari** — atama uchrgan eng qisqa gap dialogdan/iboralardan olinadi (`example`).
- **Virtual bemor ssenariysi** (`modules.patient_context` — JSON):
  - `role_play` — talaba roli (`DOCTOR` / `DENTIST` / `NURSE`) va AI roli (`PATIENT` / `MOTHER` / `RELATIVE` …; pediatriyada AI — **bolaning ota-onasi**);
  - `patient_profile` — ism (dialogdan `Mr. Davis` yoki ro'yxatdan), yosh, jins (rolga qarab: `Mother` → ayol), xarakter;
  - `medical_condition` — `exact_diagnosis` (modul mavzusi, talabaga ko'rsatilmaydi), `chief_complaint` (bemorning birinchi replikasi), `duration`, `symptoms` (bemor aytgan atamalar);
  - `expected_doctor_questions_and_answers` — dialogdagi savol–javob juftliklari (AI ning "xotirasi", 16 tagacha);
  - `questions_to_ask_doctor` — bemor bergan savollar.
  - `final_challenge_context` — shu ssenariy + qiyinlashtiruvchi ko'rsatma (qisqa javoblar, yashirin asorat).
- **Testlar** (`tests`, modul uchun 5–10 ta): atama → ma'no (3), ma'no → atama (2), iboradagi bo'sh joy (3, grammatik so'zlar: `have/has/did/since…`), to'g'ri gapni tanlash (`common_mistakes` dan, 2 tagacha). Savol va variantlar 3 tilda.

---

## 6. `module_extra.json` — Qo'lda Qo'shimcha Kontent

Word fayl yetishmasa yoki parser biror narsani tushunmasa, modul papkasiga `module_extra.json` qo'ying — u docx'dan olinganlarga **qo'shiladi**:

```json
{
  "grammar": [
    {
      "title": "Direct Imperatives for Emergency Instructions",
      "title_uz": "…", "title_ru": "…",
      "structure_pattern": "Do not + V1 | Keep + object + adjective",
      "rule_explanation_uz": "…", "rule_explanation_ru": "…", "rule_explanation_en": "…",
      "examples": [{ "sentence": "Do not touch the root surface.", "translation_uz": "…", "translation_ru": "…", "note": "" }],
      "common_mistakes": [{ "incorrect": "Don't to touch it.", "correct": "Don't touch it.", "explanation": "…" }]
    }
  ],
  "vocabulary": [{ "word": "avulsed tooth", "translation_uz": "…", "translation_ru": "…", "pronunciation": "", "definition_en": "", "example": "" }],
  "phrasebook": [{ "category": "Opening", "phrase": "…", "translation_uz": "…", "translation_ru": "…", "patient_response": "" }],
  "tests": [{ "question": "…", "question_uz": "…", "question_ru": "…", "question_en": "…",
              "option_a": "…", "option_b": "…", "option_c": "…", "option_d": "…", "correct_option": "B",
              "explanation": "…", "explanation_uz": "…", "explanation_ru": "…", "explanation_en": "…" }]
}
```

Hozir shu mexanizm **Stomatologiya 8, 9, 10-modullari** uchun ishlatilgan (ularda grammatika Word fayli yo'q; avvalgi qo'lda yozilgan 3 tilli grammatika `module_extra.json` ga ko'chirilgan).

---

## 7. `datas.json` Tuzilmasi

```jsonc
{
  "version": 2,
  "generated_at": "2026-09-13T13:32:54.901Z",
  "specialties": [
    {
      "code": "FIRST_AID", "order": 5,
      "name": "Tez tibbiy yordam", "name_uz": "…", "name_ru": "…", "name_en": "First Aid (Emergency Medicine)",
      "icon": "🚑", "student_role": "doctor", "enabled": true,
      "modules": [
        {
          "specialty_code": "FIRST_AID", "order_index": 1,
          "title": "Diabetic Emergencies (DKA)", "title_uz": "…", "title_ru": "…", "title_en": "…",
          "description_uz": "…", "description_ru": "…", "description_en": "…",
          "grammar_focus": "Present Perfect Continuous + …", "level": "B2",
          "dialogue":   [{ "role": "doctor", "label": "Doctor", "text": "What brings you in today?" }, …],
          "vocabulary": [{ "word", "pronunciation", "translation_uz", "translation_ru", "definition_en", "example" }, …],
          "phrasebook": [{ "category", "phrase", "pronunciation", "translation_uz", "translation_ru", "clinical_use",
                           "patient_response", "patient_response_uz", "patient_response_ru", "step_order" }, …],
          "grammar":    [{ "title", "structure_pattern", "rule_explanation_uz|ru|en", "examples": [...], "common_mistakes": [...], "step_order" }, …],
          "tests":      [{ "question…", "option_a…d (+_uz/_ru/_en)", "correct_option", "explanation…" }, …],
          "scenario":   { "practice": { …virtual bemor JSON… }, "final_challenge": { … } },
          "sources":    [{ "file": "First Aid\\MODULE 1\\MODULE 1.docx", "kind": "dialogue" }, …],
          "stats":      { "dialogue_turns": 29, "vocabulary": 26, "phrases": 13, "grammar_rules": 9, "tests": 8, … }
        }
      ]
    }
  ],
  "warnings": ["Pediatrics\\MODULE 2\\… : empty file (0 bytes) — skipped", …]
}
```

`datas.json` → jadval ustunlari moslashuvi `backend/datas.js` dagi `grammarRows / vocabularyRows / phrasebookRows / testRows` funksiyalarida.

---

## 8. Joriy Holat va Ma'lum Kamchiliklar (2026-09-13)

| Yo'nalish | Modullar | Dialog replikalari | Lug'at | Iboralar | Grammatika | Test | Holat |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| Davolash ishi (`GEN_MED`) | 10 | 300 | 366 | 209 | 73 | 98 | ✅ |
| Stomatologiya (`STOM`) | 10 | 200 | 269 | 115 | 51 | 77 | ✅ (8–10-modul grammatikasi `module_extra.json` dan) |
| Pediatriya (`PED`) | 10 | 268 | 335 | 233 | 96 | 64 | ⚠ 2- va 10-modul lug'at/ibora fayli **bo'sh** |
| Tez tibbiy yordam (`FIRST_AID`) | 10 | 308 | 407 | 363 | 96 | 84 | ✅ |
| Hamshiralik ishi (`NURSING`) | 18 | 674 | 799 | 913 | 266 | 151 | ⏸ `enabled:false` — 3-modul lug'ati va 12-modul grammatikasi **bo'sh** |

**Bo'sh (0 bayt) Word fayllar** — qayta saqlab qo'yish kerak, keyin `node scripts/build_datas.js`:

- `datas/Pediatrics/MODULE 2/MODULE 2 vocabulary, smart phrase book.docx`
- `datas/Pediatrics/MODULE 10/MODULE 10 vocabulary, smart phrase book.docx`
- `datas/NURSERY/MODULE 3/MODULE 3 Nursery vocabulary smart phrase book.docx`
- `datas/NURSERY/MODULE 12/MODULE 12 Grammatika.docx`

Boshqa eslatmalar:

- Stomatologiya 7 ustunli jadvallarida shifokor iborasining **ruscha** tarjimasi yo'q (`Русский` ustuni bemor javobiga tegishli) — ruscha rejimda o'zbekcha izoh ko'rsatiladi.
- Davolash ishi grammatika fayllarida namuna gaplar tarjimasiz (`Why: …` / `Meaning: …` izohlari o'zbekcha) — bu manba fayl xususiyati.
- Hamshiralik yo'nalishida dialog **Hamshira ↔ Bemor** (ba'zan Hamshira ↔ Shifokor) — ssenariyda talaba roli `NURSE` sifatida beriladi.
- Eski konveyer fayllari (`backend/*.py`, `backend/src/seeders/seed_from_datas.js`, `datas/all_medical_curriculum.json`, `datas/*_curriculum.json`, `datas/*/module_data.json`) endi ishlatilmaydi va o'chirib yuborilishi mumkin.

---

## 9. Muammolarni Bartaraf Etish

| Belgi | Sabab / Yechim |
|---|---|
| `ECONNREFUSED` / `Access denied` | `backend/.env` dagi `DB_HOST/DB_USER/DB_PASS/DB_NAME` noto'g'ri yoki MySQL ishlamayapti. |
| `Unknown database` | Avval `node create-db.js` bajaring. |
| `Column 'option_d' cannot be null` | `module_extra.json` dagi testda 4 ta variant yo'q. |
| Modul ko'rinmayapti | Talabaning `specialty_id` si mos yo'nalishga biriktirilganmi? (Admin → Foydalanuvchilar / Guruhlar). Yo'nalish `enabled:false` bo'lsa `--all`. |
| `empty file (0 bytes) — skipped` | Word fayl bo'sh — asl faylni qayta saqlang. |
| `could not determine document type — skipped` | Fayl nomiga `dialog` / `grammar` / `vocabulary` so'zini qo'shing. |
| Parser jadvalni tushunmadi | Jadval sarlavhasida `English`, `Uzbek/O‘zbekcha`, `Russian/Русский` so'zlari bo'lsin (5.1-bo'lim). |
| Grammatika bo'limlari birlashib ketdi / bo'linib ketdi | Bo'lim sarlavhalari `1.`, `2.` … raqamli va qisqa bo'lsin; mashqlar `PRACTICE` / `TASK` sarlavhasi ostida bo'lsin. |
