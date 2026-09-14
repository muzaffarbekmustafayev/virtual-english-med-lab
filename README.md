# 🩺 Virtual Patient English — Klinik Ingliz Tili Muloqot Platformasi

<p align="center">
  <img src="screenshots/01_login.png" alt="Virtual Patient English" width="750" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Sequelize-ORM-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize" />
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI_Engine-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📌 Loyiha Haqida (Project Overview)

**Virtual Patient English** — tibbiyot oliy ta'lim muassasalarining **5 ta yo'nalishi** (Davolash ishi, Stomatologiya, Pediatriya ishi, Hamshiralik ishi, Tez tibbiy yordam) talabalari uchun yaratilgan, sun'iy intellekt (Google Gemini AI) asosidagi **interaktiv klinik ingliz tili muloqot simulyatori**. Har bir talaba faqat o'z yo'nalishidagi modullar va shu yo'nalishga mos virtual bemor bilan ishlaydi.

Platforma talabalarga haqiqiy xorijiy bemorlar bilan xavfsiz, virtual muhitda muloqot qilish, kasallik tarixini to'plash (anamnez), klinik etika me'yorlariga rioya etish va kasbiy leksikani amaliyotda qo'llash imkonini beradi. Har bir simulyatsiya yakunida AI talabaning grammatikasi, tibbiy terminologiyasi, ravonligi, talaffuzi va klinik etikasini 100 ballik shkala bo'yicha ko'p omilli baholaydi.

---

## 🚀 Asosiy Imkoniyatlar (Key Features)

### 👨‍🎓 1. Talaba Portali (Student Portal)
- **Yo'nalishga mos modullar**: 4 ta faol yo'nalish × 10 modul (+18 ta hamshiralik moduli tayyorlanmoqda) — har biri Word fayllardagi haqiqiy klinik dialog, grammatika, lug'at va iboralardan qurilgan.
- **6 Bosqichli 90 Daqiqalik O'quv Sikli**:
  1. 📖 **Vocabulary**: Audio talaffuz va o'zbekcha tarjimali maxsus tibbiy atamalar.
  2. 💬 **Smart Phrasebook**: Anamnez olish, tekshirish va tavsiya berish uchun shpargalka iboralar.
  3. 🤖 **Virtual Patient Chat**: AI virtual bemor bilan matnli va ovozli real-vaqt muloqoti.
  4. 📊 **AI Evaluation & Feedback**: Grammatika, atamalar, etika va xatolar bo'yicha ko'p faktorli batafsil tahlil.
  5. 🔄 **Practice Retry**: Qilingan xatolarni inobatga olgan holda simulyatsiyani qayta topshirish.
  6. 🎯 **Final Challenge / Test**: Modul bo'yicha yakuniy bilimni baholash testi.
- **Ovozli Chat (Voice STT / TTS)**: Web Speech API va Web Audio yordamida real ovozli suhbat.
- **Klinik Grammatika Tekshiruvchisi (Grammar Checker)**: Matnlarni tibbiy uslub va grammatik to'g'rilik bo'yicha tahlil qilish.
- **Klinik Forum (Peer Discussion)**: Talabalar va ustozlar o'rtasida keyslar muhokamasi.
- **Shaxsiy Profil & Radar Tahlili**: Barcha modullar bo'yicha o'zlashtirish statistikasi va ballar tarixi.

### 👩‍🏫 2. O'qituvchi Portali (Teacher Portal)
- **Guruhlar Statistikasi**: O'qituvchiga biriktirilgan guruhlar va talabalar ro'yxati.
- **Natijalar Monitoringi**: Talabalarning har bir modul bo'yicha olgan ballari va urinishlar soni.
- **Excel Hisoboti**: Natijalarni bir marta bosish orqali Excel formatida yuklab olish.
- **Kamchiliklar Tahlili**: Guruh miqyosida ko'p uchrayotgan grammatik va klinik xatolar bo'yicha xulosa.

### 👨‍💼 3. Administrator Portali (Admin Portal)
- **Tizim Umumiy Ko'rsatkichlari**: Faol foydalanuvchilar, modullar va urinishlar soni tahlili.
- **Foydalanuvchilar Boshqaruvi (Users CRUD)**: Student, Teacher va Admin rollarini yaratish, tahrirlash va guruhlarga taqsimlash.
- **Guruhlar & Yo'nalishlar (Groups & Specialties)**: Kafedralar, yo'nalishlar va guruhlarni boshqarish hamda o'qituvchi-talabalarni biriktirish.
- **Interaktiv Kontent Menejeri (Content Manager)**: Modullar, terminlar, iboralar, test savollari va virtual bemor promptlarini to'g'ridan-to'g'ri interfeys orqali boshqarish.

---

## 🏥 Yo'nalishlar va O'quv Modullari

| # | Yo'nalish | Kod | Modullar | Namunaviy mavzular | Holat |
|---|:---|:---|:-:|:---|:---|
| 1 | 🩺 **Davolash ishi** (General Medicine) | `GEN_MED` | 10 | Clinical Consultation, Acute Chest Pain & ACS, Asthma Exacerbation, Type 2 Diabetes, Acute Stroke, Sepsis, Acute Abdomen, UTI & Pyelonephritis, Anemia, Full Consultation | ✅ |
| 2 | 🦷 **Stomatologiya** (Stomatology) | `STOM` | 10 | Dental Pain & Sensitivity, Tooth Extraction, Toothache & Pulpitis, Dental Abscess, Caries, Gum Problems, Impacted Wisdom Tooth, Dental Emergency, Restoration & Prosthetics, Full Dental Consultation | ✅ |
| 3 | 👶 **Pediatriya ishi** (Pediatrics) | `PED` | 10 | Newborn Care, Fever & Cough, Vomiting & Dehydration, Childhood Infections & Rashes, Vaccination, Growth & Nutrition, Neurological Problems, Allergies & Asthma, Pediatric Emergencies, Abdominal Pain & Constipation | ✅ |
| 4 | 💉 **Hamshiralik ishi** (Nursing) | `NURSING` | 18 | Patient Admission, Vital Signs, Medication Safety, Wound Care, Pain, Oxygen Therapy, Emergency Nursing, Discharge Planning, Stroke, AKI, GI Bleeding, Heart Failure … | ⏸ tayyor emas |
| 5 | 🚑 **Tez tibbiy yordam** (First Aid / Emergency Medicine) | `FIRST_AID` | 10 | DKA, Seizures & Status Epilepticus, Urinary Retention & AKI, Burns, Anaphylaxis, Acute Abdomen, Sepsis, Trauma & Hemorrhagic Shock, Syncope, Intoxication & Overdose | ✅ |

Har bir modul 7 bosqichdan iborat: **Grammatika → Lug'at (IPA) → Smart Phrasebook (+ namunaviy dialog) → Bo'sh joy mashqi → Test → Virtual bemor → Natijalar**. To'liq ro'yxat: [`docs/system/18_specialties_and_curricula.md`](./docs/system/18_specialties_and_curricula.md).

### 📥 Kontent qayerdan keladi?

`datas/` papkasidagi Word fayllar (`<Yo'nalish>/MODULE n/` — dialog, grammatika, lug'at) → `backend/scripts/build_datas.js` → `datas/datas.json` → **`node datas.js`** → MySQL. Serverda faqat bitta buyruq kerak:

```bash
cd backend && node datas.js
```

Batafsil: [`docs/system/17_data_pipeline_datas_json.md`](./docs/system/17_data_pipeline_datas_json.md).

---

## 🔄 6 Bosqichli Klinik O'quv Sikli

```mermaid
graph TD
    A[1. 📖 Vocabulary Study] --> B[2. 💬 Smart Phrasebook]
    B --> C[3. 🤖 AI Virtual Patient Chat]
    C --> D[4. 📊 Multi-Factor AI Evaluation]
    D -->|Kamchiliklar ustida ishlash| E[5. 🔄 Practice Retry]
    E --> C
    D -->|Muvaffaqiyatli topshirilgach| F[6. 🎯 Final Challenge / Test]
    F --> G[🏆 Modul Sertifikati va Yakuniy Ball]
```

---

## 🧠 AI Baholash Matritsasi (Evaluation Matrix)

AI har bir suhbatni quyidagi 5 parametr bo'yicha chuqur tahlil qilib, **JSON schema** asosida tuzilgan natija beradi:

$$\text{Umumiy Ball (100)} = \text{Grammar (25)} + \text{Vocabulary (25)} + \text{Fluency (20)} + \text{Ethics (15)} + \text{Clinical Relevance (15)}$$

```json
{
  "totalScore": 88,
  "metrics": {
    "grammar": 22,
    "vocabulary": 23,
    "fluency": 18,
    "ethics": 13,
    "clinicalRelevance": 12
  },
  "strengths": [
    "Used accurate diagnostic terminology (e.g. 'percussion test', 'radiating pain').",
    "Empathetic tone while addressing severe discomfort."
  ],
  "weaknesses": [
    "Used past continuous instead of present perfect when inquiring about pain duration.",
    "Missed asking about drug allergies before suggesting pain relief."
  ],
  "corrections": [
    {
      "original": "How long time you having this pain?",
      "suggested": "How long have you been experiencing this pain?",
      "explanation": "Use present perfect continuous for ongoing symptoms."
    }
  ]
}
```

---

## 📸 Skrinshotlar Galereyasi (Screenshots)

### 🔐 Tizimga Kirish va Talaba Portali
| Kirish Sahifasi | Talaba Boshqaruv Paneli |
| :---: | :---: |
| ![Login](screenshots/01_login.png) | ![Student Dashboard](screenshots/03_student_dashboard.png) |

| Yo'nalish Modullari | Virtual Bemor Simulyatori |
| :---: | :---: |
| ![Student Modules](screenshots/04_student_modules.png) | ![Module Detail](screenshots/05_student_module_detail.png) |

| Grammatika Tekshiruvi | Talaba Profili & Statistikasi |
| :---: | :---: |
| ![Grammar Checker](screenshots/grammar_checker_result.png) | ![Student Profile](screenshots/student_profile_page_v2.png) |

---

### 👩‍🏫 O'qituvchi va 👨‍💼 Admin Portallari
| O'qituvchi Hisobotlari | Admin Foydalanuvchilar Boshqaruvi |
| :---: | :---: |
| ![Teacher Reports](screenshots/teacher_reports_page.png) | ![Admin Users](screenshots/admin_users.png) |

| Admin Guruhlar Taqsimoti | Admin Interaktiv Kontent Menejeri |
| :---: | :---: |
| ![Admin Groups](screenshots/admin_groups_management.png) | ![Admin Content](screenshots/admin_content_manager_v2.png) |

---

## 🛠 Texnologiyalar Steki (Tech Stack)

### Frontend
- **React 19** — Zamonaviy komponent arxitekturasi va Hooklar
- **Vite 6** — Yuqori tezlikdagi frontend build va dev tool
- **Tailwind CSS v4** — Moslashuvchan va chiroyli dizayn tizimi
- **React Router DOM v7** — Xavfsiz marshrutlash va rollarga asoslangan yo'naltirish
- **React Icons (Remix Icons)** — Tibbiyot va boshqaruv piktogrammalari
- **React Hot Toast** — Bildirishnomalar va xatoliklar boshqaruvi
- **Web Speech API & MediaRecorder** — Nutqni aniqlash (STT) va ovozli eshittirish (TTS)

### Backend
- **Node.js (v20+) & Express.js** — REST API server
- **Sequelize ORM** — MySQL relyatsion ma'lumotlar bazasi boshqaruvi
- **MySQL 8.0+** — Tezkor va ishonchli relyatsion DB
- **JWT (JSON Web Token) & bcryptjs** — Xavfsiz autentifikatsiya va parollarni shifrlash
- **Helmet & CORS** — Veb xavfsizlik himoya choralari
- **Google GenAI SDK (Gemini)** — Virtual bemor simulyatsiyasi va baholash mexanizmi

---

## 📚 Tizim Hujjatlari Xaritasi (System Documentation)

Barcha batafsil texnik va pedagogik qo'llanmalar [`docs/system/`](./docs/system/) jildida saqlanadi:

| № | Hujjat | Tavsif |
|---|:---|:---|
| 01 | [`01_overview.md`](./docs/system/01_overview.md) | Tizim arxitekturasi, asosiy maqsad va texnologiyalar |
| 02 | [`02_roles.md`](./docs/system/02_roles.md) | Foydalanuvchi rollari huquqlari (Student, Teacher, Admin) |
| 03 | [`03_menus.md`](./docs/system/03_menus.md) | Sahifalar ierarxiyasi va navigatsiya tuzilmasi |
| 04 | [`04_database.md`](./docs/system/04_database.md) | MySQL jadvallari, indekslar va Sequelize modellari |
| 05 | [`05_api_endpoints.md`](./docs/system/05_api_endpoints.md) | REST API marshrutlari, parametrlar va status kodlar |
| 06 | [`06_ai_integration.md`](./docs/system/06_ai_integration.md) | Gemini AI ulanishi, tizim promptlari va JSON formatlari |
| 07 | [`07_frontend_architecture.md`](./docs/system/07_frontend_architecture.md) | React komponentlar tuzilmasi va holat boshqaruvi |
| 08 | [`08_modules_and_content.md`](./docs/system/08_modules_and_content.md) | Modullar va kontent sxemasi (5 yo'nalish), virtual bemor ssenariysi |
| 09 | [`09_security_and_auth.md`](./docs/system/09_security_and_auth.md) | JWT, bcrypt, CORS, Role guards va xavfsizlik himoyasi |
| 10 | [`10_deployment_and_setup.md`](./docs/system/10_deployment_and_setup.md) | Nginx, PM2, SSL sertifikati va ishlab chiqarish konfiguratsiyasi |
| 11 | [`11_admin_panel_functions.md`](./docs/system/11_admin_panel_functions.md) | Admin paneli funksiyalari, foydalanuvchilar va kontent menejeri |
| 12 | [`12_curriculum_and_10_dental_modules.md`](./docs/system/12_curriculum_and_10_dental_modules.md) | Stomatologiya modullarining klinik o'quv dasturi (namunaviy yo'nalish) |
| 13 | [`13_90_minute_pedagogical_cycle.md`](./docs/system/13_90_minute_pedagogical_cycle.md) | 6 bosqichli dars sikli va vaqt taqsimoti |
| 14 | [`14_speech_and_voice_processing.md`](./docs/system/14_speech_and_voice_processing.md) | Ovozli muloqot, nutqni matnga o'girish (STT) va TTS texnologiyalari |
| 15 | [`15_business_pricing_and_roadmap.md`](./docs/system/15_business_pricing_and_roadmap.md) | Tijorat paketlari, narxlar va rivojlanish rejasi |
| 16 | [`16_ai_evaluation_matrix_and_prompt_engineering.md`](./docs/system/16_ai_evaluation_matrix_and_prompt_engineering.md) | AI prompt injiniringi va ko'p faktorli baholash rubrikalari |
| 17 | [`17_data_pipeline_datas_json.md`](./docs/system/17_data_pipeline_datas_json.md) | Kontent konveyeri: Word → `datas.json` → `node datas.js` → MySQL |
| 18 | [`18_specialties_and_curricula.md`](./docs/system/18_specialties_and_curricula.md) | 5 ta yo'nalish, kodlar va 58 ta modul ro'yxati |

---

## ⚡ Mahalliy O'rnatish va Ishga Tushirish (Quick Start)

### 1. Talablar (Prerequisites)
- **Node.js**: v18.0 yoki undan yuqori
- **MySQL**: 8.0+ (yoki XAMPP / Laragon / Community Server)
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/) orqali olingan kalit

---

### 2. Repozitoriyani Klonlash
```bash
git clone https://github.com/muzaffarbekmustafayev/virtual-english-med-lab.git
cd virtual-english-med-lab
```

---

### 3. Backend Sozlash va Ishga Tushirish
```bash
cd backend
npm install

# .env faylini yarating va quyidagi o'zgaruvchilarni kiriting:
# PORT=5000
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASS=your_password
# DB_NAME=virtual_patient_db
# JWT_SECRET=your_super_jwt_secret_key_here
# GEMINI_API_KEY=your_gemini_api_key_here

# Ma'lumotlar bazasini yaratish va o'quv kontentini yuklash:
node create-db.js
node datas.js          # datas/datas.json → yo'nalishlar, modullar, lug'at, iboralar, grammatika, testlar

# Serverni ishga tushirish (Development rejimi):
npm run dev
```

---

### 4. Frontend Sozlash va Ishga Tushirish
```bash
cd ../frontend
npm install

# Loyihani ishga tushirish:
npm run dev
```

Brauzeringizda quyidagi manzilni oching:  
👉 **`http://localhost:5173`**

---

## 🔑 Standart Test Akkauntlari (Default Seed Users)

| Rol | Email | Parol | Ruxsatlar |
|:---|:---|:---|:---|
| **Admin** | `admin@gmail.com` | `admin123` | To'liq tizim boshqaruvi, foydalanuvchilar va kontent CRUD |
| **Teacher** | `teacher@vpe.uz` | `teacher123` | Guruhlar monitoringi, talabalar natijalari va Excel eksport |
| **Student** | `student@vpe.uz` | `student123` | O'z yo'nalishidagi modullar, AI suhbat, grammatika tekshiruvi va forum |

*(server birinchi ishga tushganda avtomatik yaratiladi — `initDb.service.js`)*

---

## 🌐 Production Deploy (Qisqa Qo'llanma)

1. **Frontend Build**:
   ```bash
   cd frontend
   npm run build
   ```
2. **Backend PM2 bilan doimiy ishga tushirish**:
   ```bash
   cd ../backend
   npm install -g pm2
   node datas.js                       # o'quv kontentini bazaga yuklash
   pm2 start server.js --name "virtual-med-backend"
   ```
3. **Nginx orqali teskari proksi (Reverse Proxy) va SSL (Certbot)** orqali xavfsiz ulanishni ta'minlang.

---

## 📄 Litsenziya va Muallif

- **Muallif:** [Mustafayev Muzaffarbek](https://github.com/muzaffarbekmustafayev)
- **Tashkilot:** Toshkent Davlat Stomatologiya Instituti / Virtual English Med Lab
- **Litsenziya:** [MIT License](LICENSE)

---
<p align="center">
  <b>Virtual Patient English</b> — Kelajak shifokorlarining xalqaro tibbiy muloqot ko'nikmalarini rivojlantirish platformasi! 🦷✨
</p>
