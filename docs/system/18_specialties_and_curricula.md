# Virtual Patient English — Yo'nalishlar (Specialties) va O'quv Dasturlari

Ushbu hujjat platformadagi **5 ta yo'nalish**, ularning kodlari, talaba roli, modullar ro'yxati va har bir modul kontentining hajmini ko'rsatadi. Barcha raqamlar `datas/datas.json` dan olingan (`node scripts/build_datas.js` natijasi, 2026-09-13).

---

## 1. Yo'nalishlar Jadvali

| # | Yo'nalish (UZ) | Kod (`specialties.code`) | EN | RU | Belgi | Talaba roli | AI roli | Modullar | Holat |
|---|---|---|---|---|:-:|---|---|:-:|---|
| 1 | **Davolash ishi** | `GEN_MED` | General Medicine | Лечебное дело | 🩺 | Doctor | Patient | 10 | ✅ Faol |
| 2 | **Stomatologiya** | `STOM` | Stomatology | Стоматология | 🦷 | Dentist | Patient | 10 | ✅ Faol |
| 3 | **Pediatriya ishi** | `PED` | Pediatrics | Педиатрия | 👶 | Doctor | Ota-ona (Parent / Mother) — bola haqida gapiradi | 10 | ✅ Faol |
| 4 | **Hamshiralik ishi** | `NURSING` | Nursing | Сестринское дело | 💉 | Nurse | Patient (ba'zan Doctor / Relative) | 18 | ⏸ Tayyor emas — `enabled: false` |
| 5 | **Tez tibbiy yordam** | `FIRST_AID` | First Aid (Emergency Medicine) | Скорая медицинская помощь | 🚑 | Doctor | Patient / Relative / Paramedic | 10 | ✅ Faol |

- Kodlar `backend/scripts/config.js` da belgilangan; baza (`specialties.code`) va `datas.json` shu kodlar orqali bog'lanadi.
- Yo'nalishlar server ishga tushganda avtomatik yaratiladi (`initDb.service.js → ensureSpecialties`), kontent esa `node datas.js` bilan yuklanadi.
- Talaba faqat **o'z `specialty_id`** siga tegishli modullarni ko'radi (`GET /api/student/modules`). Yo'nalish talabaga to'g'ridan-to'g'ri yoki guruh orqali (guruh yo'nalishi) biriktiriladi — Admin panel → Foydalanuvchilar / Guruhlar.
- Yangi yo'nalish qo'shish: `datas/<Papka>/MODULE n/*.docx` + `config.js` ga yozuv → `node datas.js --build`.

### Har bir modulning tarkibi

| Bosqich (talaba UI) | Manba (Word fayl) | Baza jadvali |
|---|---|---|
| 1. Grammatika | `* Grammar*.docx` — raqamlangan bo'limlar, formulalar, misollar, ❌/✅ xatolar | `grammars` |
| 2. Lug'at (IPA talaffuz, uz/ru tarjima, dialogdan misol) | `* Vocabulary*.docx` — `English / Pronunciation / Uzbek / Russian` jadvallari, `HIGH-VALUE CLINICAL CHUNKS` | `vocabulary` |
| 3. Klinik iboralar (kategoriya, uz/ru, bemor javobi) + **Namunaviy dialog** | `* Smart Phrasebook*.docx` + `* dialog*.docx` | `phrasebook`, `modules.reference_dialogue` |
| 4. Bo'sh joyni to'ldirish | iboralardan avtomatik (frontend) | — |
| 5. Test / Quiz | lug'at, iboralar va xatolardan avtomatik (5–10 savol, 3 tilda) | `tests` |
| 6. Virtual bemor (matn / ovoz) | dialogdan qurilgan JSON ssenariy (bemor profili, shikoyat, kutilgan savol-javoblar) | `modules.patient_context`, `modules.final_challenge_context` |
| 7. Natijalar | AI baholash (Gemini) | `conversations`, `module_results` |

---

## 2. Modullar Ro'yxati (barcha yo'nalishlar)

Ustunlar: **Dialog** — namunaviy suhbatdagi replikalar soni; **Lug'at / Iboralar / Grammatika / Test** — bazaga yoziladigan yozuvlar soni.

### 🩺 Davolash ishi — General Medicine (`GEN_MED`)

| # | Modul (EN) | Modul (UZ) | Grammatika fokusi | Dialog | Lug'at | Iboralar | Grammatika | Test |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | Clinical Consultation & Initial Assessment | Klinik konsultatsiya va dastlabki baholash | Present Simple + Present Continuous | 28 | 25 | 24 | 6 | 10 |
| 2 | Acute Chest Pain & Acute Coronary Syndrome | O'tkir ko'krak og'rig'i va o'tkir koronar sindrom | Past Simple + Past Continuous | 32 | 25 | 23 | 7 | 10 |
| 3 | Acute Asthma Exacerbation | Bronxial astmaning o'tkir xuruji | Present Perfect + Present Perfect Continuous | 32 | 30 | 23 | 8 | 10 |
| 4 | Type 2 Diabetes & Hyperglycemia | 2-tur qandli diabet va giperglikemiya | Present Perfect vs Past Simple | 29 | 29 | 18 | 8 | 10 |
| 5 | Acute Stroke & Time-Critical Assessment | O'tkir insult va vaqt-kritik baholash | Past Simple + Time Expressions | 31 | 30 | 18 | 5 | 10 |
| 6 | Severe Infection & Sepsis Assessment | Og'ir infeksiya va sepsisni baholash | Passive Voice + Present Perfect Continuous | 27 | 48 | 19 | 5 | 10 |
| 7 | Acute Abdominal Pain & Differential Diagnosis | O'tkir qorin og'rig'i va differensial tashxis | Past Perfect + Past Simple | 32 | 47 | 23 | 6 | 10 |
| 8 | Urinary Tract Infection, Pyelonephritis & Kidney Function | Siydik yo'llari infeksiyasi, piyelonefrit va buyrak faoliyati | Modal Verbs | 27 | 49 | 19 | 9 | 8 |
| 9 | Anemia, Menorrhagia & Abnormal Bleeding | Anemiya, menorragiya va patologik qon ketish | First & Second Conditional | 27 | 40 | 18 | 6 | 10 |
| 10 | Full Clinical Consultation & Differential Diagnosis | To'liq klinik konsultatsiya va differensial tashxis | Mixed Grammar / Revision | 35 | 43 | 24 | 13 | 10 |

### 🦷 Stomatologiya — Stomatology (`STOM`)

| # | Modul (EN) | Modul (UZ) | Grammatika fokusi | Dialog | Lug'at | Iboralar | Grammatika | Test |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | Dental Pain & Sensitivity | Tish og'rig'i va sezuvchanligi | Present Simple + Present Perfect + Past Simple + Past Continuous | 21 | 29 | 17 | 5 | 8 |
| 2 | Tooth Extraction | Tishni olib tashlash (ekstraksiya) | Present Perfect Continuous + Future Simple | 27 | 46 | 14 | 5 | 8 |
| 3 | Toothache & Pulpitis | Tish og'rig'i va pulpit | Present Continuous + Past Continuous + Past Perfect Continuous + First Conditional | 13 | 28 | 9 | 5 | 8 |
| 4 | Dental Abscess | Tish abssessi | Present Perfect + Present Perfect Continuous + Passive Voice + Modal Verbs | 12 | 24 | 17 | 10 | 8 |
| 5 | Dental Caries | Tish kariesi | Modal Verbs + First Conditional + Passive Voice (review) | 27 | 20 | 10 | 4 | 8 |
| 6 | Gum Problems | Milk kasalliklari | Present Continuous + be going to + Modal Verbs + Passive Voice + Gerund / Infinitive | 31 | 20 | 16 | 12 | 8 |
| 7 | Impacted Wisdom Tooth | Retensiyalangan (chiqa olmagan) aql tishi | Present Perfect Continuous + could + Passive Voice + would rather | 23 | 31 | 12 | 7 | 8 |
| 8 | Dental Emergency & Severe Infection | Shoshilinch stomatologik holat va og'ir infeksiya | Past Perfect + Past Perfect Continuous | 25 | 25 | 10 | 1 | 8 |
| 9 | Dental Restoration & Prosthetics | Tishlarni tiklash va protezlash | Comparatives & Superlatives | 10 | 26 | 5 | 1 | 5 |
| 10 | Full Dental Consultation | To'liq stomatologik konsultatsiya | Indirect & Polite Questions (revision) | 11 | 20 | 5 | 1 | 8 |

### 👶 Pediatriya ishi — Pediatrics (`PED`)

| # | Modul (EN) | Modul (UZ) | Grammatika fokusi | Dialog | Lug'at | Iboralar | Grammatika | Test |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | Newborn Care & Common Problems in Newborns | Yangi tug'ilgan chaqaloqlar parvarishi va ularda uchraydigan keng tarqalgan muammolar | Present Perfect + Present Perfect Continuous + Past Simple vs Present Perfect + used to + Modal Verbs | 39 | 38 | 30 | 8 | 8 |
| 2 | Fever, Cough & Breathing Problems in Children | Bolalarda isitma, yo'tal va nafas olish muammolari | Present Perfect vs Past Simple + Participles as Adjectives + Relative Clauses | 17 | 0 | 0 | 3 | 0 |
| 3 | Vomiting, Diarrhea & Dehydration in Children | Bolalarda qusish, ich ketishi va suvsizlanish | Present Perfect + Present Perfect Continuous + Modal Verbs + First / Zero Conditional + Passive Voice | 15 | 34 | 25 | 12 | 8 |
| 4 | Childhood Infections & Skin Rashes | Bolalik davridagi infeksiyalar va teri toshmalari | Articles & Determiners — a/an, the, this/that, these/those, each/every | 25 | 34 | 27 | 7 | 8 |
| 5 | Vaccination & Disease Prevention | Emlash va kasalliklarning oldini olish | Modal Verbs for Advice, Obligation & Permission — should, ought to, must, have to, can, may | 25 | 33 | 26 | 10 | 8 |
| 6 | Child Growth, Development & Nutrition | Bolaning o'sishi, rivojlanishi va ovqatlanishi | Comparatives & Superlatives — smaller, taller, more nutritious, the most important | 25 | 52 | 32 | 12 | 8 |
| 7 | Neurological & Developmental Problems in Children | Bolalardagi nevrologik va rivojlanish muammolari | Relative Clauses — who, which, that, whose, where | 27 | 51 | 34 | 8 | 8 |
| 8 | Allergies, Asthma & Wheezing in Children | Bolalarda allergiya, astma va xirillash | Adverbs & Adverbial Clauses — rapidly, gradually, carefully; because, although, while | 27 | 43 | 29 | 15 | 8 |
| 9 | Common Pediatric Emergencies | Bolalardagi keng tarqalgan shoshilinch holatlar | Reported Speech — The mother said that…, The doctor explained that… | 37 | 50 | 30 | 10 | 8 |
| 10 | Abdominal Pain, Constipation & Digestive Problems | Qorin og'rig'i, qabziyat va ovqat hazm qilish muammolari | Infinitives — to assess, to determine, to monitor, in order to… | 31 | 0 | 0 | 11 | 0 |

### 💉 Hamshiralik ishi — Nursing (`NURSING`) — *hozircha o'chirilgan (`enabled: false`)*

| # | Modul (EN) | Modul (UZ) | Grammatika fokusi | Dialog | Lug'at | Iboralar | Grammatika | Test |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | Patient Admission & Nursing Assessment | Bemorni qabul qilish va hamshiralik baholashi | Question Forms & Clinical Questions | 41 | 31 | 11 | 24 | 10 |
| 2 | Vital Signs & Patient Monitoring | Hayotiy ko'rsatkichlar va bemorni kuzatish | Adverbs of Frequency & Time Expressions | 37 | 68 | 41 | 9 | 10 |
| 3 | Medication Administration & Safety | Dori vositalarini yuborish va xavfsizlik | Modal Verbs for Rules & Safety | 37 | 0 | 0 | 29 | 2 |
| 4 | Wound Care & Infection Prevention | Yara parvarishi va infeksiyaning oldini olish | Articles & Determiners | 33 | 53 | 60 | 14 | 8 |
| 5 | Pain Assessment & Management | Og'riqni baholash va boshqarish | Comparatives & Superlatives | 33 | 37 | 53 | 16 | 8 |
| 6 | Respiratory Problems & Oxygen Therapy | Nafas olish muammolari va kislorod terapiyasi | Cause & Effect: because, due to, therefore, as a result | 37 | 41 | 52 | 11 | 8 |
| 7 | Emergency Nursing & First Response | Shoshilinch hamshiralik va birinchi yordam | Imperatives & Infinitives for Instructions | 29 | 49 | 61 | 15 | 8 |
| 8 | Patient Hygiene, Mobility & Pressure Injury Prevention | Bemor gigiyenasi, harakatchanligi va yotoq yaralarining oldini olish | Gerund vs Infinitive | 43 | 45 | 48 | 24 | 9 |
| 9 | Communication with Patients & Relatives | Bemor va uning yaqinlari bilan muloqot | Reported Speech | 37 | 57 | 50 | 20 | 10 |
| 10 | Discharge Planning & Patient Education | Bemorni chiqarishga tayyorlash va o'qitish | Future Forms & Plans | 31 | 49 | 56 | 18 | 10 |
| 11 | Acute Allergic Reactions & Anaphylaxis | O'tkir allergik reaksiyalar va anafilaksiya | Articles & Determiners | 23 | 37 | 45 | 16 | 10 |
| 12 | Chest Pain & Suspected Acute Coronary Syndrome | Ko'krak og'rig'i va o'tkir koronar sindromga shubha | Question Forms & Indirect Questions | 49 | 52 | 45 | 0 | 8 |
| 13 | Stroke Recognition & Initial Management | Insultni aniqlash va dastlabki yordam | Passive Voice | 40 | 50 | 64 | 13 | 8 |
| 14 | Acute Kidney Injury & Fluid Balance | O'tkir buyrak shikastlanishi va suyuqlik muvozanati | Gerund & Infinitive | 36 | 45 | 53 | 13 | 8 |
| 15 | Electrolyte Imbalances & ECG Changes | Elektrolitlar muvozanati buzilishi va EKG o'zgarishlari | Countable & Uncountable Nouns + Quantifiers | 38 | 38 | 43 | 16 | 10 |
| 16 | Acute Gastrointestinal Bleeding & Initial Assessment | O'tkir oshqozon-ichak qon ketishi va dastlabki baholash | Relative Clauses | 37 | 40 | 36 | 11 | 8 |
| 17 | Acute Heart Failure & Fluid Overload | O'tkir yurak yetishmovchiligi va suyuqlik ortiqchaligi | Main English Tenses + Modifiers | 35 | 62 | 68 | 8 | 8 |
| 18 | Chronic Disease Management & Lifestyle Advice | Surunkali kasalliklarni boshqarish va turmush tarzi bo'yicha maslahatlar | Relative Clauses | 58 | 45 | 127 | 9 | 8 |

### 🚑 Tez tibbiy yordam — First Aid (Emergency Medicine) (`FIRST_AID`)

| # | Modul (EN) | Modul (UZ) | Grammatika fokusi | Dialog | Lug'at | Iboralar | Grammatika | Test |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | Diabetic Emergencies (DKA) | Diabetik shoshilinch holatlar (diabetik ketoatsidoz) | Present Perfect Continuous + Present Perfect + Past Continuous + Conditionals + Modal Verbs | 29 | 26 | 13 | 9 | 8 |
| 2 | Acute Seizures & Status Epilepticus | O'tkir tutqanoq xurujlari va epileptik status | Past Perfect + Past Perfect Continuous | 42 | 39 | 18 | 3 | 8 |
| 3 | Acute Urinary Retention & AKI | O'tkir siydik tutilishi va o'tkir buyrak shikastlanishi | Present Perfect vs Present Perfect Continuous | 31 | 33 | 33 | 7 | 8 |
| 4 | Thermal Injuries & Burns | Termik shikastlanishlar va kuyishlar | Passive Voice — Different Tenses | 29 | 48 | 37 | 9 | 8 |
| 5 | Anaphylactic Shock | Anafilaktik shok | Reported Speech + Reporting Verbs | 27 | 46 | 39 | 16 | 8 |
| 6 | Acute Abdomen | O'tkir qorin | Gerunds & Infinitives | 35 | 37 | 49 | 10 | 10 |
| 7 | Sepsis & Septic Shock | Sepsis va septik shok | Participles / Reduced Relative Clauses | 29 | 51 | 31 | 5 | 10 |
| 8 | Severe Trauma & Hemorrhagic Shock | Og'ir travma va gemorragik shok | Imperatives + Present Perfect + Present Continuous + Modal may + First Conditional | 17 | 49 | 32 | 9 | 8 |
| 9 | Syncope & Unexplained Collapse | Sinkope (hushdan ketish) va sababi noma'lum kollaps | Relative Clauses — Defining & Non-defining | 37 | 41 | 49 | 13 | 8 |
| 10 | Acute Intoxication & Overdose | O'tkir zaharlanish va dori dozasini oshirib yuborish | Mixed Conditionals | 32 | 37 | 62 | 15 | 8 |

---

## 3. Umumiy Statistika (faol yo'nalishlar)

| Ko'rsatkich | Qiymat |
|---|:-:|
| Faol yo'nalishlar | 4 (GEN_MED, STOM, PED, FIRST_AID) |
| Modullar | 40 (+18 Hamshiralik, o'chirilgan) |
| Namunaviy dialog replikalari | 1 076 |
| Lug'at birliklari | 1 377 |
| Smart iboralar | 920 |
| Grammatika qoidalari | 316 |
| Test savollari | 323 |
| Virtual bemor ssenariylari | 40 × 2 (mashq + final challenge) |

## 4. Ma'lum Kamchiliklar

| Yo'nalish | Modul | Muammo | Yechim |
|---|---|---|---|
| Pediatriya | 2, 10 | `vocabulary, smart phrase book.docx` fayllari **bo'sh (0 bayt)** → lug'at, iboralar va testlar yo'q | Faylni qayta saqlash → `node datas.js --build` |
| Hamshiralik | 3 | lug'at fayli bo'sh | shu |
| Hamshiralik | 12 | grammatika fayli bo'sh | shu |
| Stomatologiya | 8, 9, 10 | Word grammatika fayli yo'q | `module_extra.json` orqali 1 tadan qoida berilgan (17-hujjat, 6-bo'lim) |
| Stomatologiya | 1–10 | 7 ustunli jadvalda shifokor iborasi uchun ruscha tarjima yo'q | ruscha rejimda o'zbekcha izoh ko'rsatiladi |

Manba fayllar va parser qoidalari: [`17_data_pipeline_datas_json.md`](./17_data_pipeline_datas_json.md).
