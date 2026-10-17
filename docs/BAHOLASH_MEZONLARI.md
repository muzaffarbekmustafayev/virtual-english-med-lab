# Clinical English Hub — Baholash Mezonlari va Attestatsiya Reglamenti (Assessment Rubric & Criteria)

Ushbu hujjat **Clinical English Hub** (Virtual Medical English Lab v2.0) platformasida talabalar (Davolash ishi, Pediatriya, Stomatologiya, Oliy hamshiralik) bilimini baholash tizimi, o'tish ballari, modullar ketma-ketligi hamda Oraliq va Yakuniy imtihonlarning hisoblash mezonlarini belgilaydi.

---

## 1. O'quv Dasturi va Imtihonlar Tizimi (Curriculum Architecture)

| Yo'nalish | Modullar soni | Oraliq Imtihonlar (Midterms) | Yakuniy Imtihon (Final Exam) |
|---|:---:|---|---|
| **Davolash ishi (General Medicine)** | 10 modul | 1–5-moduldan so'ng (Oraliq imtihon) | 6–10-moduldan so'ng (Yakuniy imtihon) |
| **Pediatriya (Pediatrics)** | 10 modul | 1–5-moduldan so'ng (Oraliq imtihon) | 6–10-moduldan so'ng (Yakuniy imtihon) |
| **Stomatologiya (Dentistry)** | 10 modul | 1–5-moduldan so'ng (Oraliq imtihon) | 6–10-moduldan so'ng (Yakuniy imtihon) |
| **Oliy hamshiralik (Higher Nursing)** | 18 modul | • 1–6-moduldan so'ng (**Oraliq I**)<br>• 7–12-moduldan so'ng (**Oraliq II**) | 13–18-moduldan so'ng (**Yakuniy imtihon**) |

---

## 2. Modullarni Bosqichma-bosqich O'tish Mezoni (60% Qoidasi)

1. **Boshlang'ich holat:**
   - Har bir yo'nalishning 1-moduli har doim ochiq bo'ladi.
2. **Keyingi modulga o'tish sharti:**
   - Joriy modul bo'yicha yakuniy umumiy natija **kamida 60%** (`PASS_THRESHOLD = 60`) bo'lishi shart.
   - Agar natija 60% dan past bo'lsa, keyingi modul ochilmaydi ("Qulflangan" holatida qoladi).
3. **Oraliq imtihon to'sig'i (Tizim o'qi):**
   - 10 modulli yo'nalishlarda: 1–5-modullarni 60%+ bilan yakunlagan talaba **Oraliq imtihonni topshirmasdan 6-modulga o'ta olmaydi**.
   - Oliy hamshiralik yo'nalishida:
     - 1–6-modullar yakunlangach → **Oraliq I** topshirilishi shart (aks holda 7-modul ochilmaydi).
     - 7–12-modullar yakunlangach → **Oraliq II** topshirilishi shart (aks holda 13-modul ochilmaydi).
     - 13–18-modullar yakunlangach → **Yakuniy imtihon (Final Exam)** topshiriladi.

---

## 3. Har Bir Modul Ichidagi Baholash Bosqichlari (7-Step Learning Engine)

Har bir modul 7 ta interaktiv bosqichdan iborat:

1. **Step 1: Clinical Grammar (Klinik grammatika)** — Qoidalar, audio talaffuz va klinik misollar bilan tanishish.
2. **Step 2: Medical Vocabulary (Tibbiy lug'at)** — Flashcard va audio orqali terminlarni o'zlashtirish.
3. **Step 3: Phrasebook & Dialogue (Klinik frazalar)** — Shifokor-bemor muloqotidagi namunaviy frazalarni o'rganish.
4. **Step 4: Gap-Fill (Bo'sh joyni qo'lda to'ldirish mashqi):**
   - **Formati:** Variantlar berilmaydi. Talaba tushirib qoldirilgan tibbiy so'zni klaviaturadan qo'lda to'liq yozadi.
   - **Xususiyati:** Input maydoni so'z uzunligiga moslab avtomatik o'lchanadi (masalan, 6 harfli so'z uchun 6 nuqta / 8 belgi kenglik).
   - **O'tish sharti:** Mashqlarning kamida 60% qismi to'g'ri kiritilishi lozim.
5. **Step 5: Multiple Choice Clinical Test (Klinik test):**
   - 5–10 ta klinik vaziyatli test savollari.
   - O'tish chegarasi: **kamida 60%**.
6. **Step 6: Virtual Patient OSCE Simulation (AI Virtual bemor bilan jonli muloqot):**
   - Google Gemini AI orqali real bemor rolidagi ovozli/matnli muloqot (Anamnez yig'ish, simptomlarni aniqlash, tekshiruv va davo rejasini tushuntirish).
7. **Step 7: Evaluation & Analytics (Natija va tahlil):**
   - Modulning yakuniy kompozit bali:
     $$\text{Modul Bali} = (\text{Test bali} \times 0.3) + (\text{Virtual bemor suhbati} \times 0.7)$$
   - Talabaga 5 ta kompetensiya bo'yicha batafsil fikr-mulohaza (feedback) taqdim etiladi.

---

## 4. Oraliq va Yakuniy Imtihonlarni Baholash Mezoni (Exams Evaluation)

Oraliq va Yakuniy imtihonlar 2 ta asosiy bosqichdan tashkil topadi:

### 1-qism: Integratsiyalashgan Klinik Test (30% vazn)
- O'tilgan barcha modullar bo'yicha tasodifiy tanlab olingan 10 ta situatsion savol.
- Grammatika, tibbiy terminologiya va klinik diagnostik qarorlarni qamrab oladi.

### 2-qism: OSCE Real-Time Virtual Patient Case (70% vazn)
- Har bir mutaxassislik uchun tasdiqlangan og'ir klinik keys (masalan: O'tkir koronar sindrom, Apenditsit, Periapikal abssess, Pnevmoniya, O'pka arteriyasi tromboemboliyasi).
- Talaba kamida 4–5 marta to'liq shifokorlik replikasini (savol, ko'rik, tavsiya) kiritishi kerak.
- Muloqot quyidagi 5 ta xalqaro klinik CEFR mezoni bo'yicha AI ekspert tizimi tomonidan baholanadi:

| Mezon (Competency) | Vazni | Tavsifi va Baholash Ko'rsatkichi |
|---|:---:|---|
| **Clinical Competence (Klinik to'g'rilik)** | 25% | To'g'ri anamnez yig'ish, qizil bayroqcha simptomlarni aniqlash, bemorga tushunarli shifokorlik tavsiyasi berish. |
| **Medical Vocabulary (Tibbiy leksika)** | 20% | Tibbiy terminlar, anatomiya, dori guruhlari va klinik iboralarni o'rinli qo'llash. |
| **Grammar Accuracy (Grammatik aniqlik)** | 20% | Zamondosh grammatika: Present Perfect, Past Simple, passiv nisbat, modal fe'llar (`should`, `must`) xatosizligi. |
| **Fluency & Communication (Ravonlik va Empatiya)** | 20% | Bemorning qo'rquv va xavotirini inobatga olish (empathy), muloyimlik, SBAR muloqot qoidalari. |
| **Pronunciation / Input (Nutq / Talaffuz)** | 15% | Ovozli yoki yozma kiritishdagi fonetik va orfografik to'g'rilik. |

### Yakuniy Imtihon Bali Formulasi:
$$\text{Imtihon Bali} = (\text{Klinik Test} \times 0.30) + (\text{OSCE Virtual Bemor} \times 0.70)$$

* **Imtihondan o'tish bali:** **$\ge 70\%$** (yoki OSCE muloqoti bo'yicha $\ge 70\%$).
* Imtihon muvaffaqiyatli topshirilgach, talabaga **Clinical English Hub Rasmiy Attestatsiya Sertifikati** shakllanadi va keyingi bosqich modullari ochiladi.

---

## 5. CEFR Tibbiy Til Darajalari Gradatsiyasi

- **0% – 59%:** *A1/A2 Novice* — Kursni takroran o'rganish talab etiladi.
- **60% – 74%:** *B1 Medical Generalist* — Baza klinik tushunish va standart muloqot darajasi.
- **75% – 89%:** *B2 Clinical Communicator* — Erkin va ishonchli klinik muloqot, mustaqil anamnez olish qobiliyati.
- **90% – 100%:** *C1 Advanced Medical Professional* — Mukammal tibbiy ingliz tili, xalqaro OSCE va konferensiyalarga tayyorlik darajasi.
