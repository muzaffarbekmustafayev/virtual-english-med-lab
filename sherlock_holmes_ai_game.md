# 🔍 Sherlock Holmes: AI + Investigation O'yini Konsepsiyasi

> **Konsept:** Oddiy detektiv o'yini emas, balki sun'iy intellekt (AI) va jamoaviy tahlilga (Investigation) asoslangan interaktiv o'yin platformasi.

---

## 🎯 1. Asosiy G‘oya va Maqsad

O'yinchilar (yoki komanda) detektiv va ekspertlar guruhiga aylanadi. Ular an'anaviy statik ssenariy o'rniga, har bir guvoh, gumondor va ekspertiza laboratoriyasi bilan real vaqtda **AI agentlari** orqali muloqot qiladilar.

### 🌟 Asosiy Farqi:
- **Statik ssenariy emas:** Gumondorlar oldindan yozilgan tayyor javoblarni emas, o'z personaji (prompt, xarakter, yashirin sirlar, alibi) asosida dinamik javob qaytaradi.
- **Tahliliy erkinlik:** O'yinchilar istalgan savolni bera oladi, dalillarni o'zaro taqqoslaydi va gipotezalarni sinab ko'radi.

---

## 👥 2. Komandaviy Rollar (Team Investigation)

Komanda a'zolari o'rtasida rollarni taqsimlash:
1. **Bosh Detektiv (Lead Detective / Sherlock):** Tergov yo'nalishini belgilaydi, yakuniy xulosalarni shakllantiradi.
2. **So'roqchi / Psixolog (Interrogator):** AI gumondorlar bilan muloqot qiladi, ularning gaplaridagi ziddiyatlarni va yolg'onlarni aniqlaydi.
3. **Kriminalist / Ekspert (Forensic Specialist):** Tibbiy, laboratoriya va ashyoviy dalillarni (autopsiya, toksikologiya, barmoq izlari) tekshiradi.
4. **Tahlilchi (Evidence Analyst / Watson):** Barcha dalillar va ko'rsatmalarni xaritaga (Mind Map / Evidence Board) birlashtiradi.

---

## ⚙️ 3. O'yin Mexanikasi va AI Tizimi

```mermaid
graph TD
    A[Voqea joyi / Case Brief] --> B[Guvohlar va Gumondorlar (AI Agentlar)]
    A --> C[Laboratoriya va Dalillar (Forensic AI / Data)]
    B --> D[So'roq va Ziddiyatlarni Qidirish]
    C --> D
    D --> E[Deductive Board / Xulosa]
    E --> F[Yakuniy Hukm va Baholash]
```

### 🧠 A. AI Agentlar Tizimi
- **Har bir personaj uchun maxsus Prompt:**
  - *Xarakteri, yashirayotgan siri, stress darajasi, alibisi.*
  - Agar to'g'ri dalil ko'rsatilsa, bosim ostida haqiqatni tan olish mexanikasi.
- **AI Forensic Lab (Tibbiy / Kriminalistika bo'limi):**
  - O'yinchilar topilgan namunalarni (qon tahlili, zahar, hujjatlar) tahlilga topshiradi va AI xulosa beradi.

### 🧩 B. "Deduction Map" (Deductive Board)
- O'yinchilar dalillar va personajlar o'rtasida bog'liqlik chizadi.
- AI yordamida gipotezalarning mantiqiy to'g'riligi va xatoliklari tekshiriladi.

---

## 🎮 4. O'yin Bosqichlari (Game Flow)

1. **Brifing (Case Introduction):**
   - Jinoyat tavsifi, voqea joyi fotosuratlari/sxemasi, boshlang'ich ma'lumotlar.
2. **Dalillarni yig'ish va So'roq (Investigation Phase):**
   - AI personajlar bilan real vaqtda chat/ovoz orqali intervyu.
   - Laboratoriya tekshiruvlari natijalarini olish.
3. **Muhokama va Gipoteza (Team Deliberation):**
   - Jamoaviy tahlil va gumondorlar alibilarini yo'qqa chiqarish.
4. **Ayblash va Yakun (Final Accusation & Score):**
   - Qotil kim, motiv nima va jinoyat qanday sodir etilganini taqdim etish.
   - AI detektiv komandaning tahliliy aniqligi va mantiqiy xulosasini baholaydi.

---

## 🚀 5. Keyingi Qadamlar va Texnik Stek

- **Platforma:** Telegram Bot (yoki Web App / Mini App)
- **Backend / AI:** Python (FastAPI), LangChain / OpenAI / Gemini API (har bir personaj uchun maxsus agentlar)
- **Ma'lumotlar bazasi:** SQLite / PostgreSQL (o'yin holati va dalillar tarixi uchun)
- **Dizayn & UI:** Sherlock uslubidagi qorong'i, atmosfera yaratuvchi vintage/modern detektiv interfeysi
