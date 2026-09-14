# Virtual Patient English — Tizimga Umumiy Ko'rinish

## Loyiha Haqida

**Virtual Patient English** — tibbiyot oliy ta'lim muassasalarining **5 ta yo'nalishi** (Davolash ishi, Stomatologiya, Pediatriya ishi, Hamshiralik ishi, Tez tibbiy yordam) talabalari uchun sun'iy intellektga (AI) asoslangan **klinik muloqot mashq qilish platformasi**. Platforma talabaga real klinik vaziyatlarda ingliz tilida bemor bilan suhbat qilish ko'nikmalarini xavfsiz va interaktiv muhitda rivojlantirishga imkon beradi.

---

## Asosiy Maqsad

- Tibbiyot talabalari **o'z yo'nalishiga mos** (stomatologiya, davolash ishi, pediatriya, tez tibbiy yordam, hamshiralik) klinik ingliz tilini amalda o'rganadilar — har bir talaba faqat o'z yo'nalishidagi modullarni ko'radi
- Real bemor ssenariylari asosida AI-bemor bilan muloqot olib boradilar
- Har bir suhbat yakunida **AI tomonidan batafsil baholash** (feedback) oladilar
- Xatolardan o'rganib, **qayta urinish** (Retry) va **yakuniy sinovdan** (Final Challenge) o'tadilar

---

## Platforma Texnologiyalari (Tech Stack)

| Qatlam | Texnologiya | Maqsad |
|--------|-------------|--------|
| **Frontend** | React.js + Tailwind CSS | Foydalanuvchi interfeysi (UI) |
| **State Management** | React Context API / Redux Toolkit | Global holat va autentifikatsiya |
| **Routing** | React Router DOM | Rolga asoslangan sahifalar |
| **Network** | Axios | Backend REST API bilan aloqa |
| **Ovoz** | Web Speech API + Gemini Live Audio | Ovozni matnga o'girish (STT) va real-time ovozli suhbat |
| **Backend** | Node.js + Express.js | RESTful API serveri |
| **ORM** | Sequelize | MySQL bilan ob'ektli ishlash |
| **Auth** | JWT + bcrypt | Xavfsiz kirish va parol shifrlash |
| **AI Engine** | Google Gemini (`gemini-2.5-flash`) | Virtual bemor agenti, baholash va grammatika tekshiruvi |
| **Media** | Multer | Audio va fayl yuklash |
| **Ma'lumotlar bazasi** | MySQL v8.0+ | Barcha ma'lumotlarni saqlash |

---

## Tizim Rollari

Tizimda **3 ta rol** mavjud:

| Rol | Vazifa |
|-----|--------|
| `student` | O'quv modullari bilan ishlaydi, AI-bemor bilan suhbat qiladi |
| `teacher` | O'z guruhidagi talabalar natijalarini kuzatadi |
| `admin` | Butun tizimni, kontent va foydalanuvchilarni boshqaradi |

---

## O'quv Sikli (90 daqiqa / 1 modul)

```
1. Vocabulary       (15 min)  → Mavzuga oid klinik atamalar
       ↓
2. Smart Phrasebook (10 min)  → Tayyor dialog iboralari
       ↓
3. Virtual Patient  (20 min)  → AI-bemor bilan 1-urinish
       ↓
4. AI Feedback      (10 min)  → Ko'p mezonli batafsil tahlil
       ↓
5. Retry            (15 min)  → Xatolarni tuzatib qayta topshirish
       ↓
6. Final Challenge  (15 min)  → Yordamsiz yakuniy sinov
       ↓
7. Wrap-up           (5 min)  → Natijalarni saqlash
```

---

## O'quv Modullari (5 ta Yo'nalish — 40 ta faol modul + 18 ta tayyorlanayotgan)

| # | Yo'nalish | Kod | Talaba roli | Modullar | Holat |
|---|---|---|---|:-:|---|
| 1 | 🩺 Davolash ishi — General Medicine | `GEN_MED` | Doctor | 10 | ✅ |
| 2 | 🦷 Stomatologiya — Stomatology | `STOM` | Dentist | 10 | ✅ |
| 3 | 👶 Pediatriya ishi — Pediatrics | `PED` | Doctor (AI — bolaning ota-onasi) | 10 | ✅ |
| 4 | 💉 Hamshiralik ishi — Nursing | `NURSING` | Nurse | 18 | ⏸ tayyor emas (`enabled:false`) |
| 5 | 🚑 Tez tibbiy yordam — First Aid (Emergency Medicine) | `FIRST_AID` | Doctor | 10 | ✅ |

Har bir modul: namunaviy shifokor–bemor dialogi, grammatika qoidalari (uz/ru tushuntirish, formulalar, misollar, tipik xatolar), IPA talaffuzli lug'at, kategoriyalangan Smart Phrasebook (bemor javoblari bilan), avtomatik testlar va dialogdan qurilgan virtual bemor ssenariysi. Kontent `datas/` papkasidagi Word fayllardan `node datas.js` buyrug'i bilan bazaga yuklanadi.

To'liq modullar ro'yxati: [`18_specialties_and_curricula.md`](./18_specialties_and_curricula.md). Konveyer: [`17_data_pipeline_datas_json.md`](./17_data_pipeline_datas_json.md).

---

## Tizim Hujjatlari Indeksi

| Fayl | Mavzu |
|------|-------|
| `01_overview.md` | Tizimga umumiy ko'rinish va maqsad |
| `02_roles.md` | Tizim rollari, vazifalari va ruxsatnomalari |
| `03_menus.md` | Menular, sahifalar va navigatsiya arxitekturasi |
| `04_database.md` | MySQL ma'lumotlar bazasi sxemasi va modellar |
| `05_api_endpoints.md` | Backend REST API endpointlari va so'rovlar spesifikatsiyasi |
| `06_ai_integration.md` | Gemini GenAI SDK, promptlar va AI baholash algoritmi |
| `07_frontend_architecture.md` | React, Vite, Tailwind CSS, Stepper va UI komponentlar |
| `08_modules_and_content.md` | Modullar va kontent sxemasi (5 yo'nalish), Word fayldan bazagacha |
| `09_security_and_auth.md` | JWT, bcrypt, Role guard va xavfsizlik standartlari |
| `10_deployment_and_setup.md` | Tizimni o'rnatish, ishga tushirish va production deployment |
| `11_admin_panel_functions.md` | Admin paneli sidebari, funksiyalari va boshqaruv spesifikatsiyasi |
| `12_curriculum_and_10_dental_modules.md` | 10 ta stomatologiya modulining klinik o'quv dasturi (namunaviy yo'nalish) |
| `13_90_minute_pedagogical_cycle.md` | 6 bosqichli 90 daqiqalik dars sikli va vaqt taqsimoti |
| `14_speech_and_voice_processing.md` | Ovozli muloqot, STT (Whisper), TTS va nutq tahlili |
| `15_business_pricing_and_roadmap.md` | Tijorat paketlari ($200/$300/$600), narxlar va 15 kunlik roadmap |
| `16_ai_evaluation_matrix_and_prompt_engineering.md` | AI bemor promptlari, JSON sxemalar va baholash rubrikalari |
| `17_data_pipeline_datas_json.md` | Kontent konveyeri: Word fayllar → `datas/datas.json` → `node datas.js` → MySQL |
| `18_specialties_and_curricula.md` | 5 ta yo'nalish, kodlar, 58 ta modul ro'yxati va statistikasi |
| `responsive-design.md` | Mobil va desktop responsive UI qo'llanmasi |
