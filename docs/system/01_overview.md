# Virtual Patient English — Tizimga Umumiy Ko'rinish

## Loyiha Haqida

**Virtual Patient English** — tibbiyot va stomatologiya talabalari uchun sun'iy intellektga (AI) asoslangan **klinik muloqot mashq qilish platformasi**. Platforma talabaga real klinik vaziyatlarda ingliz tilida bemor bilan suhbat qilish ko'nikmalarini xavfsiz va interaktiv muhitda rivojlantirishga imkon beradi.

---

## Asosiy Maqsad

- Tibbiyot talabalari (birinchi bosqich: **stomatologiya**) klinik ingliz tilini amalda o'rganadilar
- Real bemor ssenariylari asosida AI-bemor bilan muloqot olib boradilar
- Har bir suhbat yakunida **AI tomonidan batafsil baholash** (feedback) oladilar
- Xatolardan o'rganib, **qayta urinish** (Retry) va **yakuniy sinovdan** (Final Challenge) o'tadilar

---

## Platforma Texnologiyalari (Tech Stack)

| Qatlam | Texnologiya | Maqsad |
|--------|-------------|--------|
| **Frontend** | React.js + Tailwind CSS | Foydalanuvchi interfeysi (UI) |
| **State Management** | Redux Toolkit / React Context API | Global holat va autentifikatsiya |
| **Routing** | React Router DOM | Rolga asoslangan sahifalar |
| **Network** | Axios | Backend REST API bilan aloqa |
| **Ovoz** | Web Speech API + OpenAI Whisper | Ovozni matnga o'girish (STT) |
| **Backend** | Node.js + Express.js | RESTful API serveri |
| **ORM** | Sequelize | MySQL bilan ob'ektli ishlash |
| **Auth** | JWT + bcrypt | Xavfsiz kirish va parol shifrlash |
| **AI Engine** | OpenAI GPT-4o | Virtual bemor agenti + baholash |
| **Media** | Multer | Audio va fayl yuklash |
| **Ma'lumotlar bazasi** | MySQL v8.0+ | Barcha ma'lumotlarni saqlash |

---

## Tizim Rollari (3 ta)

| Rol | Vazifa |
|-----|--------|
| `student` | O'quv modullari bilan ishlaydi, AI-bemor bilan suhbat qiladi |
| `teacher` | O'z guruhidagi talabalar natijalarini kuzatadi |
| `admin` | Butun tizimni, kontent va foydalanuvchilarni boshqaradi |

---

## O'quv Sikli (90 daqiqa / 1 modul)

```
Vocabulary (15 min)
    ↓
Smart Phrasebook (10 min)
    ↓
Virtual Patient — 1-urinish (20 min)
    ↓
AI Feedback (10 min)
    ↓
Retry (15 min)
    ↓
Final Challenge (15 min)
    ↓
Wrap-up (5 min)
```

---

## 10 ta O'quv Moduli (Stomatologiya)

| # | Modul nomi | Ssenariy |
|---|-----------|---------|
| 1 | Dental Pain & Sensitivity | Sovuq/issiq ta'sirida tish og'rishi |
| 2 | Tooth Extraction | Tish oldirish konsultatsiyasi |
| 3 | Toothache | Kuchli tish og'rig'i |
| 4 | Dental Abscess | Yuz shishi, og'riq, isitma |
| 5 | Dental Caries | Karies muolajasi |
| 6 | Gum Problems | Milk qonashi va shishi |
| 7 | Impacted Wisdom Tooth | Aqlli tish og'rig'i |
| 8 | Dental Emergency | Shoshilinch stomatologik holat |
| 9 | Dental Restoration & Prosthetics | Implant, crown, protez maslahati |
| 10 | Full Dental Consultation | To'liq murakkab konsultatsiya |

---

## System Hujjatlari Indeksi

| Fayl | Mavzu |
|------|-------|
| `01_overview.md` | Tizimga umumiy ko'rinish va maqsad |
| `02_roles.md` | Tizim rollari, vazifalari va ruxsatnomalari |
| `03_menus.md` | Menular, sahifalar va navigatsiya arxitekturasi |
| `04_database.md` | MySQL ma'lumotlar bazasi sxemasi va modellar |
| `05_api_endpoints.md` | Backend REST API endpointlari va so'rovlar spesifikatsiyasi |
| `06_ai_integration.md` | Gemini GenAI SDK, promptlar va AI baholash algoritmi |
| `07_frontend_architecture.md` | React, Vite, Tailwind CSS, Stepper va UI komponentlar |
| `08_modules_and_content.md` | 10 ta stomatologik modul, lug'at va ssenariylar |
| `09_security_and_auth.md` | JWT, bcrypt, Role guard va xavfsizlik standartlari |
| `10_deployment_and_setup.md` | Tizimni o'rnatish, ishga tushirish va production deployment |
| `11_admin_panel_functions.md` | Admin paneli sidebari, funksiyalari va boshqaruv sopesifikatsiyasi |
| `responsive-design.md` | Mobil va desktop responsive UI qo'llanmasi |

