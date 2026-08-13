# Virtual Patient English — Klinik Ingliz Tili Muloqot Platformasi

**Virtual Patient English** — tibbiyot va stomatologiya talabalari uchun sun'iy intellektga (Gemini AI / GPT-4o) asoslangan **klinik muloqot mashq qilish platformasi**. Platforma talabaga real klinik vaziyatlarda ingliz tilida bemor bilan suhbat qilish ko'nikmalarini xavfsiz va interaktiv muhitda rivojlantirishga imkon beradi.

---

## 🌟 Asosiy Imkoniyatlar

- **10 ta Stomatologik O'quv Moduli**: Real klinik ssenariylar (Dental Pain, Extraction, Caries, Abscess, Emergency va h.k.).
- **90 Daqiqalik 6 Bosqichli Dars Sikli**: Vocabulary ➔ Smart Phrasebook ➔ Virtual Patient Chat ➔ AI Feedback ➔ Retry ➔ Final Challenge.
- **Smart Phrasebook Shpargalkasi**: Chat davomida bosqichma-bosqich yordamchi klinik iboralar.
- **Ovozli Chat (Voice Chat)**: Web Speech API va OpenAI Whisper yordamida nutqni matnga o'girish (STT) hamda ovozli ijro (TTS).
- **Multi-Factor AI Evaluation**: Grammatika, Lug'at atamalari, Ravonlik, Talaffuz va Klinik Etika bo'yicha 100 ballik avtomatik feedback va xatolar tahlili.
- **Role-Based Portals**: Talaba, O'qituvchi va Admin boshqaruv panellari + Excel (.xlsx) natijalar eksporti.

---

## 🛠 Texnologiyalar Steki (Tech Stack)

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 (Responsive & Fluid UI)
- **Routing:** React Router DOM v7
- **Icons & Toast:** React Icons (Remix Icons) + React Hot Toast
- **Audio:** Web Speech API + Web Audio MediaRecorder

### Backend
- **Runtime:** Node.js v24 LTS + Express.js
- **Database ORM:** Sequelize ORM + MySQL 8.0+
- **Security:** JWT (JSON Web Token) + bcryptjs (Salt 10) + CORS + Helmet
- **AI Integratsiyasi:** Google GenAI SDK (Gemini AI) / OpenAI GPT-4o

---

## 📚 Tizim Hujjatlari (Documentation Index)

Barcha batafsil loyiha hujjatlari [`docs/system/`](./docs/system/) papkasida joylashgan:

| Hujjat | Tavsif |
| :--- | :--- |
| [`01_overview.md`](./docs/system/01_overview.md) | Tizimga umumiy ko'rinish va texnologiyalar |
| [`02_roles.md`](./docs/system/02_roles.md) | Tizim rollari (Student, Teacher, Admin) |
| [`03_menus.md`](./docs/system/03_menus.md) | Menular va sahifalar navigatsiya arxitekturasi |
| [`04_database.md`](./docs/system/04_database.md) | MySQL ma'lumotlar bazasi sxemasi va ORM modellar |
| [`05_api_endpoints.md`](./docs/system/05_api_endpoints.md) | Backend REST API endpointlari va so'rovlar spesifikatsiyasi |
| [`06_ai_integration.md`](./docs/system/06_ai_integration.md) | Gemini / OpenAI AI integration va promptlar |
| [`07_frontend_architecture.md`](./docs/system/07_frontend_architecture.md) | React, Vite, Tailwind va UI komponentlar |
| [`08_modules_and_content.md`](./docs/system/08_modules_and_content.md) | Stomatologik modullarga umumiy kirish |
| [`09_security_and_auth.md`](./docs/system/09_security_and_auth.md) | Xavfsizlik, JWT, bcrypt va Role guards |
| [`10_deployment_and_setup.md`](./docs/system/10_deployment_and_setup.md) | Local setup va Production Nginx/PM2 deployment |
| [`11_admin_panel_functions.md`](./docs/system/11_admin_panel_functions.md) | Admin paneli funksiyalari va Excel export |
| [`12_curriculum_and_10_dental_modules.md`](./docs/system/12_curriculum_and_10_dental_modules.md) | 10 ta stomatologik modulning to'liq klinik o'quv dasturi |
| [`13_90_minute_pedagogical_cycle.md`](./docs/system/13_90_minute_pedagogical_cycle.md) | 6 bosqichli 90 daqiqalik dars sikli va vaqt taqsimoti |
| [`14_speech_and_voice_processing.md`](./docs/system/14_speech_and_voice_processing.md) | Ovozli muloqot, STT (Whisper), TTS va nutq tahlili |
| [`15_business_pricing_and_roadmap.md`](./docs/system/15_business_pricing_and_roadmap.md) | Tijorat paketlari ($200, $300, $600), narxlar va roadmap |
| [`16_ai_evaluation_matrix_and_prompt_engineering.md`](./docs/system/16_ai_evaluation_matrix_and_prompt_engineering.md) | AI bemor promptlari, JSON sxemalar va baholash rubrikalari |

---

## 🚀 Mahalliy Ishga Tushirish (Quick Start)

### Prerequisites
- Node.js v18+
- MySQL 8.0+ Server (XAMPP / MySQL Community)
- Google Gemini API Key

### Backend
```bash
cd backend
npm install
# .env faylini to'ldiring
node create-db.js
npm run seed
npm run dev
```

### Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Platforma browseda `http://localhost:5173` manzilida ochiladi.

---
**Muallif:** Mustafayev Muzaffarbek  
**Litsenziya:** MIT License
