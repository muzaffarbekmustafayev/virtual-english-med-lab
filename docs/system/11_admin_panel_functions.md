# Virtual Patient English — Admin Panel Funksiyalari va Sidebar Hujjati

Ushbu hujjat **Virtual Patient English** platformasidagi Administrator Paneli (Admin Panel) funksiyalari, navigatsiya strukturasi (Sidebar), boshqaruv panellari va texnik imkoniyatlarini batafsil tushuntiradi.

---

## 1. Admin Panel Sidebari (Navigatsiya Menusi)

Admin paneli sidebari platformaning chap qismida joylashgan bo'lib, o'zgarmas `260px` kenglikda va `z-index: 50` bilan doimiy ko'rinib turadi.

### 1.1 Sidebar Strukturasi

```
+-------------------------------------------------------+
|  [LOGO] Virtual Patient English Lab                   |
|  Status: System Admin Active                          |
+-------------------------------------------------------+
|  [AVATAR] Admin User Name                             |
|  Role: Admin (Purple Badge #a855f7)                   |
+-------------------------------------------------------+
|  NAVIGATION                                           |
|  [🖥️]  Overview    (/admin/overview)                  |
|  [👥]  Users       (/admin/users)                     |
|  [🏫]  Groups      (/admin/groups)                    |
|  [📂]  Content     (/admin/content)                   |
|  [⚙️]  Settings    (/admin/settings)                  |
+-------------------------------------------------------+
|  [🚪]  Sign out    (Logout & Clear JWT Session)       |
+-------------------------------------------------------+
```

### 1.2 Sidebar Elementlari va Route'lar Izohi

| Icon | Menu Nomi | Route | Funksional Maqsadi |
|------|-----------|-------|-------------------|
| 🖥️ | **Overview** | `/admin/overview` | Tizim statistikasi, real-time monitoring va AI xarajatlari |
| 👥 | **Users** | `/admin/users` | Barcha foydalanuvchilar (Student, Teacher, Admin) CRUD va Excel yuklash |
| 🏫 | **Groups** | `/admin/groups` | Akademik guruhlar, mutaxassisliklar va o'qituvchilarni biriktirish |
| 📂 | **Content** | `/admin/content` | Ssenariylar, lug'at, phrasebook va testlarni tahrirlash (4 bo'lim) |
| ⚙️ | **Settings** | `/admin/settings` | API kalitlari, AI model parametrlari va uslubiy hujjatlar |
| 🚪 | **Sign out** | `/login` | JWT tokenni tozalash va tizimdan xavfsiz chiqish |

---

## 2. Admin Panel Funksiyalarining Batafsil Sпеsifikatsiyasi

---

### 2.1 System Overview Sahifasi (`/admin/overview`)

**Maqsad:** Platformaning umumiy holati, yuklamasi va sun'iy intellekt xarajatlarini real-vaqt rejimida kuzatish.

#### Funksiyalari:
1. **Statistika Metrikalari Paneli (KPI Cards):**
   - **Total Users:** Tizimda ro'yxatdan o'tgan barcha foydalanuvchilar soni (Talaba / O'qituvchi / Admin kesimida).
   - **Active Sessions Today:** Bugun dars o'tgan va AI-bemor bilan suhbat qilgan talabalar soni.
   - **Completed Conversations:** Barcha topshirilgan suhbatlar va ularning o'rtacha balli (`Overall Score`).
   - **Test Completion Rate:** Topshirilgan modul testlari soni va o'rtacha muvaffaqiyat ko'rsatkichi.
2. **AI API Monitoring & Cost Calculator:**
   - Gemini API so'rovlari soni va sarflangan tokenlar hisoblagichi.
   - AQSh dollarida ($) hisoblangan taxminiy oylik AI xarajatlari vizualizatsiyasi.
3. **Server & Database Health Check:**
   - MySQL ma mezonli ulanishi (Ping response time, Connection pool status).
   - Server loglari va so'nggi 20 ta tizim hodisalari (System Audit Trail).

---

### 2.2 User Accounts Sahifasi (`/admin/users`)

**Maqsad:** Barcha foydalanuvchilar hisoblarini to'liq nazorat qilish.

#### Funksiyalari:
1. **Foydalanuvchilar Jadvali (Dynamic Data Grid):**
   - Ustunlar: `ID`, `Ism-familiya`, `Email`, `Rol`, `Mutaxassislik`, `Guruh`, `Joriy Daraja`, `Harakatlar`.
   - Qidiruv tizimi (Search input): Ism yoki Email bo'yicha real-time filtrlash.
   - Multi-filtr: Rol bo'yicha (`student`, `teacher`, `admin`), Guruh va Mutaxassislik bo mezon.
2. **Yangi Foydalanuvchi Qo'shish (Single User Create Modal):**
   - Form: Ism-familiya, Email, Parol, Rol tanlash.
   - Agar rol `student` bo'lsa: Mutaxassislik va Guruh dropdown tanlovlari ko'rinadi.
   - Parol bcrypt orqali shifrlanib bazaga yoziladi.
3. **Bulk Excel Upload Engine (Ommaviy Yuklash):**
   - Excel (`.xlsx`) fayl andozasini yuklab olish tugmasi.
   - Excel faylni serverga yuborish va yuzlab talabalarni bir necha sekundda bazaga avtomatik import qilish.
4. **Tahrirlash va O'chirish (Edit & Delete):**
   - Foydalanuvchi ma'lumotlarini va rolini o'zgartirish.
   - Parolni qayta tiklash (Password Reset).
   - Tasdiqlash modal oynasi bilan foydalanuvchini o'chirish (CASCADE qoidalari bilan).

---

### 2.3 Academic Groups & Specialties Sahifasi (`/admin/groups`)

**Maqsad:** O'quv muassasasining tuzilmasini va o'qituvchilar biriktirilishini boshqarish.

#### Funksiyalari:
1. **Mutaxassisliklar Boshqaruvi (Specialties Manager):**
   - Yangi yo'nalish qo'shish (masalan: *Dentistry*, *Pediatrics*, *General Medicine*).
   - Yo'nalish nomini tahrirlash va unga tegishli modullar sonini ko'rish.
2. **Akademik Guruhlar Boshqaruvi (Student Groups Manager):**
   - Yangi guruh yaratish (masalan: *401-Stomatologiya*).
   - Guruh ichidagi talabalar ro'yxati va ularning o'rtacha ko'rsatkichini ko'rish.
3. **O'qituvchiga Guruh Biriktirish (Teacher-Group Assignment Matrix):**
   - O'qituvchini tanlab, unga bir yoki bir nechta akademik guruhlarni biriktirish (`teacher_groups` jadvali orqali).
   - Biriktirilgan guruhlarni tahrirlash yoki biriktirishni bekor qilish.

---

### 2.4 Content Manager Sahifasi (`/admin/content`)

**Maqsad:** Platformadagi barcha 10 ta modulning o'quv kontentini boshqarish. Sahifa 4 ta ichki tab (sub-navigation) ga bo'lingan:

#### 1. Module Scenarios Tab (`/admin/content/scenarios`):
- **AI Patient System Prompt Editor:** 10 ta modul uchun AI bemor xulq-atvorini belgilovchi `patient_context` ni tahrirlash.
- **Final Challenge Context Editor:** Phrasebooksiz yakuniy sinov uchun murakkabroq bemor ssenariysini kiritish.
- **Rich Text / Visual Editor:** Promptlarni qulay formatda tahrirlash.

#### 2. Dictionary & Vocabulary Tab (`/admin/content/vocabulary`):
- Modulni tanlash dropdowni.
- Modulga oid tibbiy so'zlar jadvali (`word`, `translation`, `definition`, `example`).
- MP3 formatdagi talaffuz audio fayllarini yuklash (`Multer` upload middleware orqali).
- Yangi so'z qo'shish, mavjudini tahrirlash va o'chirish.

#### 3. Smart Phrasebook Tab (`/admin/content/phrasebook`):
- Modulga oid tayyor iboralar ro'yxati.
- Kategoriyalar yaratish (*"Asking about pain triggers"*, *"Explaining treatment"*).
- Ibora matni (`phrase`), o'zbekcha izoh (`hint_uz`) va tartib raqami (`step_order`)ni belgilash.

#### 4. Module Quizzes Tab (`/admin/content/quizzes`):
- Modul testlarini boshqarish.
- 4 variantli test savollarini (Option A, B, C, D) kiritish va to'g'ri javob kalitini (`correct_option`: 'A'|'B'|'C'|'D') belgilash.

---

### 2.5 System Settings Sahifasi (`/admin/settings`)

**Maqsad:** Tizim texnik sozlamalari va API parametrlarini boshqarish.

#### Funksiyalari:
1. **API Key Configuration:**
   - Google Gemini API Key maydoni (shifrlangan holda saqlanadi va tahrirlanadi).
2. **AI Model Selector:**
   - `gemini-2.5-flash` va boshqa modellardan birini asosiy model sifatida tanlash.
3. **Scoring Weight Configuration:**
   - AI Feedback dagi 5 mezon (Grammar, Vocabulary, Fluency, Pronunciation, Clinical) ballarining umumiy `overall_score` ga ta'sir qilish ulushini (foizda) sozlash.
4. **Methodological Guides Upload:**
   - PDF/Word formatidagi rasmiy uslubiy qo'llanmalar va o'quv dasturlarini platformaga yuklash va boshqarish.
