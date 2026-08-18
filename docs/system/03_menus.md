# Virtual Patient English — Menular va Sahifalar Tuzilishi

Tizimda **Role-based Routing** (rolga asoslangan marshrutlash) ishlatiladi. Har bir foydalanuvchi tizimga kirganida uning roli (`student`, `teacher`, `admin`) aniqlanadi va unga mos interfeys va sidebar ko'rsatiladi.

---

## A. TALABA PANELI

### Sidebar Navigatsiya Menusi

| Icon | Menu nomi | Route | Tavsif |
|------|-----------|-------|--------|
| 📊 | **Dashboard** | `/student/dashboard` | Bosh sahifa — umumiy progress va so'nggi faollik |
| 🦷 | **My Modules** | `/student/modules` | 10 ta o'quv moduli ro'yxati |
| 📝 | **Grammar Checker** | `/student/grammar` | Matnni mustaqil grammatik tekshirish |
| 💬 | **Forum** | `/student/forum` | Jamoaviy muloqot xonasi |
| 👤 | **My Profile** | `/student/profile` | Shaxsiy ma'lumotlar va reyting |
| 🚪 | **Logout** | — | Tizimdan chiqish |

---

### Sahifalar Batafsil Tarkibi

#### 1. Dashboard Sahifasi `/student/dashboard`

**Maqsad:** Talabaning umumiy o'quv holatini bir ko'rinishda taqdim etish.

**Sahifa komponentlari:**

| Komponent | Tavsif |
|-----------|--------|
| **Profil sarlavhasi** | Talabaning ismi, mutaxassisligi (masalan: Dentistry) va joriy darajasi (Level 1, 2...) |
| **Statistika kartochkalari** | O'tilgan modullar foizi / umumiy o'rtacha ball (Overall Score) |
| **Progress grafik** | Haftalik o'sish dinamikasi — radar chart yoki bar chart |
| **So'nggi faollik** | Oxirgi topshirilgan modul va uning natijasi |
| **Modullar tezkor ro'yxati** | Davom ettirilishi kerak bo'lgan modullar tugmasi (Continue) |

---

#### 2. My Modules Sahifasi `/student/modules`

**Maqsad:** Talabaga o'z mutaxassisligiga tegishli 10 ta modulni ro'yxat ko'rinishida taqdim etish.

**Sahifa komponentlari:**

| Komponent | Tavsif |
|-----------|--------|
| **Modullar ro'yxati** | Har bir modul kartochkasi: raqami, nomi, qisqa tavsif, holati (o'tilgan / davom etayotgan / boshlanmagan) |
| **Modul holati belgisi** | ✅ Yakunlangan / 🔄 Davomida / 🔒 Qulflangan |
| **Boshlash tugmasi** | Tanlangan modulni ochish va dars siklini boshlash |

**Modul Tafsilotlari Sahifasi** `/student/modules/:id`

Bu sahifada 90 daqiqalik o'quv siklini boshqaradigan **Step-by-Step Stepper** (qadam boshqaruvchi) mavjud:

---

##### Step 1 — Vocabulary (Lug'at)
| Element | Tavsif |
|---------|--------|
| So'zlar jadval/kartochkasi | Inglizcha so'z, o'zbekcha tarjimasi, inglizcha ta'rifi, misol gap |
| Audio tugmasi | 🔊 Bosish bilan talaffuz audiosi ijro etiladi |
| Tugmalash holati | Barcha so'zlarni ko'rganidan so'ng "Keyingi bosqich" tugmasi faollashadi |

##### Step 2 — Smart Phrasebook (Iboralar)
| Element | Tavsif |
|---------|--------|
| Kategoriyalar bo'yicha iboralar | "Asking about pain triggers", "Explaining treatment" kabi guruhlangan tayyor iboralar |
| O'zbekcha izoh | Har bir iboraning qachon va qanday ishlatilishi haqida qisqa izoh |
| Ko'rish rejimi | Faqat ko'rib chiqish, dars davomida esa shpargalka sifatida ochiladi |

##### Step 3 — Virtual Patient Chat (AI-bemor bilan suhbat)
| Element | Tavsif |
|---------|--------|
| Bemor avatari | Bemor tasviri, ismi va umumiy holat haqida qisqa ma'lumot (masalan: "John, 35 yosh, tish og'rig'idan shikoyat qilmoqda") |
| Chat oynasi | Real-time matnli suhbat — talaba yozadi, AI bemor javob beradi |
| Mikrofon tugmasi | Talaba ovozli gapirishi mumkin — audio yozib olinib, Whisper API orqali matnga o'giriladi |
| Phrasebook Drawer | O'ng tomonda yordamchi panel: talaba bosganda mos iboralar chiqadi, ularni bosish chat maydoniga ko'chiradi |
| Yakunlash tugmasi | Suhbatni tugatish va baholashga yuborish |

##### Step 4 — AI Feedback (Natijalar)
| Element | Tavsif |
|---------|--------|
| 5 ta mezon progress barlari | Grammar, Vocabulary, Fluency, Pronunciation, Clinical — har biri 1-10 ball |
| Umumiy ball | Overall Score (100 ballik shkalada) |
| Xatolar tahlili | Talabaning xato yozgan gaplari + AI tavsiyasi va to'g'ri varianti |
| Kuchli tomonlar | Talabaning yaxshi bajargan qismlari tavsifi |

##### Step 5 — Retry (Qayta urinish)
| Element | Tavsif |
|---------|--------|
| Qayta boshlash tugmasi | Xatolarni inobatga olib, bir xil ssenariy bilan yangi suhbat boshlash |
| Xatolar eslatmasi | Oldingi suhbatdagi asosiy xatolar ro'yxati ko'rinishida ko'rsatiladi |

##### Step 6 — Final Challenge (Yakuniy sinov)
| Element | Tavsif |
|---------|--------|
| Yangi ssenariy | Murakkab, yangi bemor ssenariyi — Phrasebook va shpargalka yo'q |
| Mustaqil chat | Talaba hech qanday yordam holda to'liq konsultatsiyani ingliz tilida olib boradi |
| Yakuniy baholash | Suhbat yakunida yana AI Feedback ko'rsatiladi |

##### Step 7 — Quiz (Test)
| Element | Tavsif |
|---------|--------|
| 10 ta savol | Har biri 4 variantli (A, B, C, D) to'rt tanlovli test |
| Natija | To'g'ri / noto'g'ri javoblar va yakuniy test bali (100 ballik) |
| Modul yakunlash | Testdan o'tgandan so'ng modul "Yakunlangan" holatiga o'tadi |

---

#### 3. Grammar Checker Sahifasi `/student/grammar`

**Maqsad:** Talabaga istalgan inglizcha matnni mustaqil tekshirish imkonini berish.

| Element | Tavsif |
|---------|--------|
| Matn kiritish maydoni | Katta textarea — talaba inglizcha matn yozadi yoki joylashtiradi |
| "Tekshirish" tugmasi | Matnni OpenAI orqali tahlil qilish |
| Natija oynasi | Xatolar qizil chiziq bilan belgilanadi — ustiga bosganda to'g'ri variant taklif etiladi |

---

#### 4. Forum Sahifasi `/student/forum`

**Maqsad:** Talabalar va o'qituvchilar o'rtasida jamoaviy muloqot.

| Element | Tavsif |
|---------|--------|
| Mavzular ro'yxati (chap) | Guruhlararo forumning mavjud mavzulari |
| Chat interfeysi (o'ng) | Xabarlar ro'yxati — muallif roliga qarab rang farqlanadi: o'qituvchi yashil, talaba ko'k |
| Yangi xabar | Pastda xabar yozish va yuborish maydoni |

---

#### 5. My Profile Sahifasi `/student/profile`

**Maqsad:** Talabaning shaxsiy ma'lumotlari va statistikasi.

| Element | Tavsif |
|---------|--------|
| Shaxsiy ma'lumotlar | Ism-familiya, email, mutaxassislik, guruh, daraja |
| O'zlashtirish statistikasi | Har bir modul bo'yicha olingan ballar jadvali |
| Umumiy reyting | O'rtacha Grammar, Vocabulary, Clinical ballar |
| Faollik grafigi | Haftalik / oylik progress ko'rsatkichi |

---
---

## B. O'QITUVCHI PANELI

### Sidebar Navigatsiya Menusi

| Icon | Menu nomi | Route | Tavsif |
|------|-----------|-------|--------|
| 📈 | **Dashboard** | `/teacher/dashboard` | Guruhlar va umumiy faollik tahlili |
| 👥 | **My Groups** | `/teacher/groups` | Biriktirilgan guruhlar va talabalar |
| 📊 | **Reports** | `/teacher/reports` | Excel va PDF hisobot generatsiyasi |
| 💬 | **Forum** | `/teacher/forum` | Talabalar savollariga javob berish |
| 🚪 | **Logout** | — | Tizimdan chiqish |

---

### Sahifalar Batafsil Tarkibi

#### 1. Teacher Dashboard Sahifasi `/teacher/dashboard`

| Element | Tavsif |
|---------|--------|
| Umumiy statistika | Jami guruhlar soni, jami talabalar soni, bugun faol bo'lganlar |
| Reyting tahlili | Eng yuqori ball olgan 5 talaba + eng past ko'rsatkichli talabalar |
| Guruhlar faollik xaritasi | Qaysi guruh eng faol ekanini ko'rsatuvchi vizual panel |

---

#### 2. My Groups Sahifasi `/teacher/groups`

**Maqsad:** O'qituvchiga biriktirilgan guruhlar va ularning talabalari.

| Element | Tavsif |
|---------|--------|
| Guruhlar ro'yxati | Barcha biriktirilgan guruhlar (masalan: 401-Stomatologiya, 402-Stomatologiya) |
| Guruh kartochkasi | Guruh nomi, talabalar soni, o'rtacha ball |

**Guruh ichidagi talabalar jadvali** `/teacher/groups/:groupId`:

| Element | Tavsif |
|---------|--------|
| Talabalar jadvali | Ism, oxirgi faollik sanasi, joriy moduli, o'rtacha Overall Score |
| Qidiruv va filtrlash | Ism bo'yicha qidirish, modul bo'yicha saralash |
| Talaba kartochkasi (click) | Talaba ismiga bosish — batafsil natijalar sahifasini ochadi |

**Talaba Batafsil Ko'rinishi** `/teacher/students/:studentId`:

| Element | Tavsif |
|---------|--------|
| Modullar natijalari jadvali | Har bir modul: urinishlar soni, test bali, o'rtacha ball |
| Suhbat tarixi | Talaba va AI-bemor orasidagi dialog xabarlarini to'liq ko'rish |
| Audio player | Talabaning ovozli yozuvlarini tinglash |
| AI Feedback natijalari | Grammar, Vocabulary, Fluency, Pronunciation, Clinical ballar |

---

#### 3. Reports Sahifasi `/teacher/reports`

**Maqsad:** Guruh natijalarini hisobot formatida eksport qilish.

| Element | Tavsif |
|---------|--------|
| Filtrlar | Guruh tanlash, modul tanlash, vaqt oralig'i belgilash |
| Hisobot ko'rish | Ekranda jadval ko'rinishida natijalarni oldindan ko'rish |
| Excel yuklash | Guruh o'zlashtirish jadvalini `.xlsx` formatida yuklab olish |
| PDF generatsiya | Rasmiy hisobotni PDF formatida yaratish va yuklab olish |

---

#### 4. Forum Sahifasi `/teacher/forum`

O'qituvchi uchun forum talaba forumiday ishlaydi, lekin u **moderator** sifatida ishlaydi:

| Element | Tavsif |
|---------|--------|
| Xabarlar ro'yxati | Barcha talabalar xabarlari vaqt bo'yicha |
| Javob yozish | Savollarga javob berish — o'qituvchi xabarlari yashil rang bilan ajralib turadi |

---
---

## C. ADMINISTRATOR PANELI

### Sidebar Navigatsiya Menusi

| Icon | Menu nomi | Route | Tavsif |
|------|-----------|-------|--------|
| 🖥️ | **System Overview** | `/admin/overview` | Tizim statistikasi va monitoring |
| 👤 | **User Accounts** | `/admin/users` | Foydalanuvchilar CRUD boshqaruvi |
| 🏫 | **Academic Groups** | `/admin/groups` | Guruh va mutaxassisliklar boshqaruvi |
| 📂 | **Content Manager** | `/admin/content` | Kontent boshqaruvi (4 ta bo'lim) |
| ⚙️ | **System Settings** | `/admin/settings` | API kalitlari va tizim parametrlari |
| 🚪 | **Logout** | — | Tizimdan chiqish |

---

### Sahifalar Batafsil Tarkibi

#### 1. System Overview Sahifasi `/admin/overview`

**Maqsad:** Platformaning real-time holati va monitoring.

| Element | Tavsif |
|---------|--------|
| Foydalanuvchilar statistikasi | Jami talabalar / o'qituvchilar / adminlar soni |
| Modullar statistikasi | Jami modullar soni, bajarilgan darslar soni |
| OpenAI xarajatlari | GPT-4o va Whisper API xarajatlari hisoblagichi ($ da) |
| Server holati | MB ulanish holati, server loglari |
| So'nggi faollik logi | Oxirgi 10 ta muhim tizim hodisasi |

---

#### 2. User Accounts Sahifasi `/admin/users`

**Maqsad:** Barcha foydalanuvchilarni to'liq boshqarish.

| Element | Tavsif |
|---------|--------|
| Foydalanuvchilar jadvali | Ism, email, rol, guruh, mutaxassislik, ro'yxatdan o'tgan sana |
| Filtrlar | Rol bo'yicha, guruh bo'yicha, yo'nalish bo'yicha filtrlash |
| Qidiruv | Ism yoki email bo'yicha qidirish |
| Yangi foydalanuvchi | "+" tugmasi — modal oyna orqali yangi foydalanuvchi yaratish |
| Tahrirlash | Mavjud foydalanuvchi ma'lumotlarini o'zgartirish |
| O'chirish | Foydalanuvchini tizimdan o'chirish (tasdiqlash modal bilan) |
| Bulk Upload | Excel fayl orqali ko'plab talabalarni bir vaqtda yuklash |

---

#### 3. Academic Groups Sahifasi `/admin/groups`

**Maqsad:** Akademik guruhlar va mutaxassisliklarni boshqarish.

**Guruhlar bo'limi:**

| Element | Tavsif |
|---------|--------|
| Guruhlar ro'yxati | Barcha akademik guruhlar (nom, talabalar soni, biriktirilgan o'qituvchi) |
| Yangi guruh | Yangi akademik guruh yaratish (nom, mutaxassislik, o'qituvchi biriktirish) |
| Tahrirlash / O'chirish | Guruh nomini o'zgartirish yoki o'chirish |

**Mutaxassisliklar bo'limi:**

| Element | Tavsif |
|---------|--------|
| Mutaxassisliklar ro'yxati | Stomatologiya, Pediatriya, Davolash ishi va h.k. |
| Yangi mutaxassislik | Yangi yo'nalish qo'shish |

---

#### 4. Content Manager Sahifasi `/admin/content`

**Maqsad:** O'quv kontentini to'liq boshqarish. 4 ta ichki bo'limga ega:

---

##### 4.1 Module Scenarios — `/admin/content/scenarios`

**Maqsad:** AI-bemorning xulq-atvori va ssenariyini boshqarish.

| Element | Tavsif |
|---------|--------|
| Modullar ro'yxati | 10 ta modul — har biri uchun alohida ssenariy |
| Patient Context tahrirlagich | AI-bemor uchun system prompt (1-urinish va Retry uchun): "Siz John, 35 yoshdagi, sovuq suv ichganda tishingiz og'riydi..." |
| Final Challenge Context | Murakkabroq, yordamsiz sinov uchun AI ssenariysi |
| Visual Editor | Rich text / markdown tahrirlagich orqali promptni vizual shakllantirish |
| Saqlash | O'zgarishlar tizimga darhol qo'llaniladi |

---

##### 4.2 Dictionary & Vocabulary — `/admin/content/vocabulary`

**Maqsad:** Har bir modul uchun tibbiy lug'atni boshqarish.

| Element | Tavsif |
|---------|--------|
| Modulga filtr | Qaysi modul uchun so'zlar ko'rsatilishini tanlash |
| So'zlar jadvali | Mavjud barcha so'zlar: so'z, tarjima, ta'rif, misol, audio |
| Yangi so'z qo'shish | Form: inglizcha so'z, o'zbekcha tarjima, inglizcha ta'rif, misol gap, MP3 audio yuklash |
| Tahrirlash | Mavjud so'zni o'zgartirish |
| O'chirish | So'zni lug'atdan olib tashlash |

---

##### 4.3 Smart Phrasebook — `/admin/content/phrasebook`

**Maqsad:** Dialog davomida talabaga ko'mak beruvchi tayyor iboralarni boshqarish.

| Element | Tavsif |
|---------|--------|
| Modulga filtr | Qaysi modul uchun iboralar ko'rsatilishini tanlash |
| Iboralar ro'yxati | Kategoriya, ibora matni, o'zbekcha izoh, tartib raqami |
| Yangi ibora | Kategoriya nomi, ibora, o'zbekcha izoh, step_order belgilash |
| Tahrirlash / O'chirish | Mavjud iboralarni o'zgartirish yoki o'chirish |

---

##### 4.4 Module Quizzes — `/admin/content/quizzes`

**Maqsad:** Modul testlarini boshqarish.

| Element | Tavsif |
|---------|--------|
| Modulga filtr | Qaysi modul testlari ko'rsatilishini tanlash |
| Savollar ro'yxati | Savollar, A/B/C/D variantlar, to'g'ri javob |
| Yangi savol | Savol matni, 4 ta variant, to'g'ri javob harfi (A, B, C, D) kiritish |
| Tahrirlash / O'chirish | Mavjud savollarni o'zgartirish yoki o'chirish |

---

#### 5. System Settings Sahifasi `/admin/settings`

**Maqsad:** Tizim texnik parametrlarini sozlash.

| Element | Tavsif |
|---------|--------|
| OpenAI API Key | GPT-4o va Whisper uchun API kalit maydoni (shifrlangan holda saqlanadi) |
| GPT model tanlash | `gpt-4o`, `gpt-4o-mini` va h.k. modellardan birini tanlash |
| Tizim parametrlari | AI feedback uchun scoring mezonlari, max token limiti va h.k. |
| Hujjatlar yuklash | PDF/Word formatidagi uslubiy qo'llanmalar yuklash bo'limi |

---

## Umumiy Sahifa Haritasi (Site Map)

```
/ (Login)
├── /student/*
│   ├── dashboard
│   ├── modules
│   │   └── :id (Stepper — 7 ta qadam)
│   ├── grammar
│   ├── forum
│   └── profile
├── /teacher/*
│   ├── dashboard
│   ├── groups
│   │   └── :groupId
│   │       └── students/:studentId
│   ├── reports
│   └── forum
└── /admin/*
    ├── overview
    ├── users
    ├── groups
    ├── content
    │   ├── scenarios
    │   ├── vocabulary
    │   ├── phrasebook
    │   └── quizzes
    └── settings
```
