# Virtual Patient English — Loyihani Qurish, Arxitektura, Rollar va Bo'limlar Strukturasi (v2)

Ushbu hujjat **Virtual Patient English** (Tibbiyot va stomatologiya talabalari uchun sun'iy intellektga asoslangan klinik muloqot platformasi) loyihasining rollari, navigatsiya menulari, bo'limlar strukturasi hamda backend-frontend texnik arxitekturasini qamrab oladi [11, 107, 120]. Tizim **React (Frontend)**, **Node.js/Express (Backend)** va **MySQL (Ma'lumotlar bazasi)** texnologiyalar stekida ishga tushiriladi.

---

## 1. Loyihaning Umumiy Kontsepti va Ishlash Sikli

Platformaning asosiy maqsadi — tibbiyot talabalariga real klinik vaziyatlarda bemorlar bilan ingliz tilida erkin, xavfsiz va to'g'ri muloqot qilishni o'rgatishdir [11, 13, 110, 120].

Har bir o'quv moduli **90 daqiqalik dars formatiga** va quyidagi tizimli o'quv sikliga asoslanadi [3, 112]:
1. **Vocabulary (15 daq):** Mavzuga oid asosiy tibbiy so'zlarni o'rganish [3, 112].
2. **Smart Phrasebook (10 daq):** Dialoglarda ishlatiladigan tayyor iboralar va yordamchi dialog konstruksiyalari [3, 112].
3. **Virtual Patient (20 daq - 1-urinish):** AI-bemor bilan ovozli yoki yozma muloqot [3, 112]. Talaba shifokor rolida bemorning shikoyatlarini aniqlaydi [1, 110]. Qiynalganda Phrasebook shpargalkasidan foydalanishi mumkin [1, 110].
4. **AI Feedback (10 daq):** Suhbat yakunida grammatika (grammar), lug'at boyligi (vocabulary), muloqot ravonligi (fluency), talaffuz (pronunciation) va klinik muloqot (clinical communication) ko'rsatkichlari bo'yicha baholash va xatolar tahlili [2, 111, 112].
5. **Retry (15 daq):** Yo'l qo'yilgan xatolarni tuzatib, suhbatni qayta bajarish [2, 111, 112].
6. **Final Challenge (15 daq):** Phrasebook yordamisiz, yangi bemor ssenariysini mustaqil yakunlash [2, 111, 112].
7. **Wrap-up (5 daq):** Dars yakunini chiqarish va natijalarni saqlash [3, 112].

---

## 2. Loyihaning Texnik Arxitekturasi (Tech Stack)

### Frontend: React.js
- **UI Framework:** Tailwind CSS (responsive, qulay va zamonaviy UI interfeysi uchun).
- **State Management:** React Context API yoki Redux Toolkit (global holat, foydalanuvchi auth va dars jarayonini boshqarish).
- **Routing:** React Router DOM (rolga asoslangan marshrutlash - Role-based routing).
- **Network Client:** Axios (Backend REST API bilan muloqot).
- **Speech API:** Web Speech API va OpenAI Whisper API integratsiyasi (ovozni matnga o'girish va tahlil qilish uchun) [108, 217].
- **Audio Recorder:** O'quvchining ovozli javoblarini yozib olish va backendga yuborish uchun `react-media-recorder` yoki custom audio-worklet.

### Backend: Node.js & Express.js
- **Framework:** Express.js (RESTful API yaratish).
- **ORM:** Sequelize (MySQL bilan ishlashni osonlashtirish, migratsiyalar va modellar uchun).
- **Auth:** JSON Web Token (JWT) + bcrypt (parollarni xavfsiz shifrlash).
- **AI Integratsiya:** OpenAI SDK (GPT-4o orqali virtual bemor agentini va AI Feedback baholash tizimini boshqarish).
- **Media handler:** Multer (ovozli fayllarni va yuklanadigan hujjatlarni qabul qilish uchun) [108, 217].

### Database: MySQL
- **Ma'lumotlar bazasi:** MySQL (v8.0+). Tizimli, tranzaksiyaviy va foydalanuvchilar progressini saqlash uchun relational struktura.

---

## 3. Tizim Rollari va Ularning Vazifalari (Roles & Responsibilities)

Platformada foydalanuvchilar roli ma'lumotlar bazasidagi `role ENUM('student', 'teacher', 'admin')` maydoni orqali ajratiladi. Har bir rol uchun tizim doirasida aniq ruxsatnomalar va vazifalar belgilanadi:

### A. Talaba (Student) — Asosiy Foydalanuvchi
- **O'quv Modullari bilan Ishlash:** Tanlangan mutaxassislik bo'yicha 10 ta o'quv modulida darslarni ketma-ketlikda o'tadi [1, 53, 107].
- **Vocabulary & Phrasebook amaliyoti:** So'zlarni o'rganadi, ularning talaffuz audiosini tinglaydi va dialoglardan oldin tayyor iboralar bilan tanishadi [3, 108].
- **AI Bemor bilan Simulyatsiya:** Virtual bemor bilan yozma yoki ovozli shaklda dialog olib boradi, Phrasebook yordamidan foydalanadi [21, 41, 108].
- **AI Feedback olish:** Suhbat yakunida batafsil tahlil va Grammar, Vocabulary, Fluency, Pronunciation va Clinical ballarini ko'radi [2, 111].
- **Urinishlarni qayta bajarish (Retry):** Yo'l qo'yilgan xatolardan xulosa chiqarib darsni qayta bajaradi [2, 111].
- **Final Challenge topshirish:** Hech qanday ko'mak va shpargalkalarsiz yangi bemor bilan yakuniy konsultatsiyani mustaqil ingliz tilida o'tkazadi [2, 111, 112].
- **Test (Quiz) tizimi:** Modul yakunida o'zlashtirishni tekshiruvchi testlarni topshiradi [107].
- **Mustaqil Imlo Tekshiruvi:** Istalgan tibbiy matnni tizim ichida grammatik va imlo jihatdan bepul tekshiradi [107].
- **Forum muloqoti:** Jamoaviy forumda boshqa talabalar va o'qituvchilar bilan muloqot qiladi, savollar yozadi [107].
- **Shaxsiy statistika:** Shaxsiy profilida o'zlashtirish darajasining oshishini va olingan ballar statistikasini grafik ko'rinishda kuzatadi [108].

### B. O'qituvchi (Teacher) — Nazoratchi va Mentor
- **Guruhlarni Monitoring Qilish:** O'ziga biriktirilgan akademik guruhlar ro'yxatini va ulardagi talabalarni ko'radi [108].
- **Natijalar tahlili:** Talabalarning modullar kesimidagi AI Feedback natijalari va barcha urinishlar bo'yicha ballarini (Grammar, Vocabulary, Clinical va h.k.) kuzatadi [43, 108].
- **Suhbatlarni eshitish/o'qish:** Talaba va AI-bemor o'rtasidagi muloqot chat tarixini o'qiydi va talabaning ovozli audio yozuvlarini eshitadi [108].
- **Natijalarni Yuklab Olish:** Guruh talabalarining dars va test natijalarini Excel (.xlsx) yoki PDF formatida eksport qilib, hisobot sifatida yuklab oladi [109].
- **Forum moderatsiyasi:** Talabalarning forumdagi savollariga javob beradi va akademik muhokamalarni boshqaradi [107].

### C. Administrator (Admin) — Tizim To'liq Boshqaruvchisi
- **Foydalanuvchilarni Boshqarish (CRUD):** Talabalar, o'qituvchilar va yangi adminlarni yaratish, tahrirlash va guruhlarga taqsimlash [108].
- **Guruh va Yo'nalishlar boshqaruvi:** Yangi akademik guruhlar va mutaxassisliklarni (stomatologiya, pediatriya, davolash ishi va h.k.) qo'shish va boshqarish [65, 107, 108].
- **O'quv ssenariylarini sozlash (Scenario Manager):** AI-bemorlar promptlarini, ssenariylarini (Virtual Patient Context, Final Challenge Context) va boshlang'ich tizim buyruqlarini tahrirlash [108].
- **Lug'at va Iboralar boshqaruvi (Vocabulary & Phrasebook CRUD):** Lug'at so'zlarini, tarjimalari, misollar va ularning audio talaffuz fayllarini hamda Smart Phrasebook tayyor iboralarini modullar kesimida kiritish/tahrirlash [108].
- **Test savollari boshqaruvi (Quiz Creator):** Har bir modul uchun to'rt variantli testlarni va ularning to'g'ri javoblarini kiritish va tahrirlash [108].
- **Hujjatlarni yuklash:** Tizim uchun zaruriy uslubiy qo'llanmalar yoki rasmiy hujjatlarni yuklash va boshqarish [108].
- **Tizim va API monitoringi:** OpenAI API xarajatlari, Whisper va GPT model sozlamalari hamda umumiy tizim yuklamasini nazorat qilish [98].

---

## 4. Foydalanuvchi Interfeysi (UI) Menulari va Bo'limlar Strukturasi

React-da rolga asoslangan marshrutlash (Role-based Routing) yordamida interfeys dinamik ravishda o'zgaradi. Quyida har bir rol uchun Sidebar (yon menu) navigatsiyasi va sahifalar tuzilishi keltirilgan:

### A. TALABA (STUDENT) PANELI INTERFEYSI

#### 1. Sidebar Navigatsiya Menusi:
- 📊 **Dashboard (Bosh sahifa):** Umumiy progress va so'nggi natijalar [70].
- 🦷 **My Specialty Modules (Mening modullarim):** 10 ta o'quv moduli ro'yxati [1, 53].
- 📝 **Grammar Checker (Grammatika tekshiruvi):** Matnni mustaqil tekshirish oynasi [107].
- 💬 **Student Forum (Forum):** Guruhlararo umumiy muloqot xonasi [107].
- 👤 **My Profile (Profilim):** Shaxsiy ma'lumotlar va reyting [70].
- 🚪 **Logout (Tizimdan chiqish)**

#### 2. Bo'limlar va Sahifalar Tarkibi:
- **Dashboard Sahifasi:**
  - *Tepada:* Talabaning ismi, joriy mutaxassisligi (masalan, Dentistry) va darajasi (Level 1, 2...) [107, 108].
  - *Statistika kartochkalari:* O'tilgan jami modullar foizi, o'rtacha umumiy ball (Overall Score) [108].
  - *Grafik:* Haftalik o'sish dinamikasi (radar yoki bar chart) [43].
  - *So'nggi faollik:* Oxirgi topshirilgan modul va uning natijasi.
- **Modul Tafsilotlari Sahifasi (`/modules/:id`):**
  - Bu sahifada 90 daqiqalik o'quv siklini boshqaradigan **Step-by-Step Stepper Component (Dars jarayoni boshqaruvchisi)** bo'ladi [3, 25]:
    - **Step 1: Vocabulary Table/Cards** — so'zlar, tarjimalar, misollar va audio tinglash tugmalari [107, 108].
    - **Step 2: Smart Phrasebook View** — darsda kerak bo'ladigan iboralarni toifalar bo'yicha ko'rib chiqish [3].
    - **Step 3: Virtual Patient Interactive Chat** [3, 108]:
      - Bemor tasviri (avatar), ismi va umumiy holati haqida qisqa ma'lumot [45].
      - Chat suhbat oynasi (real-time chat, matnli xabarlar) [39, 148].
      - Audio yozish tugmasi (mikrofon animatsiyasi bilan) [108].
      - O'ng tomonda yordamchi **Phrasebook Drawer** (talaba bosganda dialogga mos tayyor iboralar shablonlari chiqadi va yozish maydoniga ko'chadi) [41, 47].
      - *Suhbatni yakunlash va baholashga yuborish tugmasi.*
    - **Step 4: AI Feedback Scorecard** [3, 49]:
      - Progress barlar orqali 5 ta mezon (Grammar, Vocabulary, Fluency, Pronunciation, Clinical) bo'yicha ballar ko'rsatiladi [2, 3].
      - Xatolar va tavsiyalar: original talaba gaplari, unga mos AI tavsiyalari va tushuntirishlar.
    - **Step 5: Retry Prompt** — qayta suhbatni boshlash tugmasi (oldingi xatolarni inobatga olgan holda) [2, 111].
    - **Step 6: Final Challenge Screen** — shpargalkasiz va yordamchi iboralarsiz ssenariyni mustaqil yechish chat interfeysi [2, 111].
    - **Step 7: Quiz (Test) Section** — 4 variantli 10 ta test savollari va natija [107].
- **Grammar Checker Sahifasi:**
  - Katta matn kiritish maydoni (Text Area) va "Tekshirish" tugmasi [107].
  - Natija oynasi (grammatik va imlo xatolar qizil chiziq bilan belgilangan va ustiga bosganda to'g'ri variant taklif etiladi).
- **Forum Sahifasi:**
  - Chapda mavzular ro'yxati, o'ngda chat muloqot interfeysi. Xabarlar muallifning roli rangida ko'rinadi (Masalan, Shifokor/O'qituvchi xabarlari yashil, talabalariki ko'k) [107].

---

### B. O'QITUVCHI (TEACHER) PANELI INTERFEYSI

#### 1. Sidebar Navigatsiya Menusi:
- 📈 **Teacher Dashboard (Boshqaruv paneli):** Biriktirilgan guruhlar va faollik tahlili [59].
- 👥 **My Student Groups (Guruhlarim):** Akademik guruhlar va talabalar ro'yxati [108].
- 📊 **Performance Reports (Hisobotlar):** Excel va PDF hisobotlarni generatsiya qilish oynasi [109].
- 💬 **Discussion Forum (Forum):** Talabalar savollariga javob berish bo'limi [107].
- 🚪 **Logout**

#### 2. Bo'limlar va Sahifalar Tarkibi:
- **Teacher Dashboard Sahifasi:**
  - Guruhlar jami soni, umumiy talabalar soni, bugun platformada faol bo'lganlar ko'rsatkichi.
  - Reyting baland va past talabalarning tezkor ro'yxati (ogohlantirish yoki rag'batlantirish uchun).
- **My Student Groups Sahifasi (`/teacher/groups`):**
  - Biriktirilgan guruhlar ro'yxati (masalan: *401-Stomatologiya*, *402-Stomatologiya*).
  - Guruh ustiga bosganda **Talabalar Jadvali (Students Grid)** ochiladi [108]:
    - Ism-familiya, oxirgi faollik, joriy modul taraqqiyoti, o'rtacha ball (Overall Score) [108].
  - Talaba ismi ustiga bosganda **Talabaning Batafsil Kartochkasi (Student Detail View)** ochiladi [108]:
    - Har bir modul bo'yicha urinishlar va test natijalari jadvali [108].
    - **Conversation History Player:** Talaba va AI-bemor suhbati xabarlar tarixi va talaba yuborgan ovozli audio fayllarni tinglash uchun audio pleyer [108].
- **Reports Sahifasi:**
  - Guruh, modul va vaqt oralig'i bo'yicha filtrlash bloklari.
  - "Excel shaklida yuklash" va "PDF hisobotini generatsiya qilish" tugmalari [109].

---

### C. ADMINISTRATOR (ADMIN) PANELI INTERFEYSI

#### 1. Sidebar Navigatsiya Menusi:
- 🖥️ **System Overview (Tizim statistikasi):** Umumiy monitoring va OpenAI API yuklamasi [59, 98].
- 👤 **User Accounts (Foydalanuvchilar):** Talaba, o'qituvchi va adminlar ro'yxati va ularni boshqarish [108].
- 🏫 **Academic Groups (Guruhlar boshqaruvi):** Guruhlar va yo'nalishlar (stomatologiya, pediatriya...) [108].
- 📂 **Content Manager (Kontent boshqaruvi):**
  - 📝 *Module Scenarios (Ssenariylar)* [108]
  - 📖 *Dictionary & Vocab (Lug'at)* [108]
  - 💡 *Smart Phrasebook (Iboralar)* [108]
  - ❓ *Module Quizzes (Testlar)* [108]
- ⚙️ **System Settings (Sozlamalar):** OpenAI kalitlari va tizim parametrlari.
- 🚪 **Logout**

#### 2. Bo'limlar va Sahifalar Tarkibi:
- **System Overview Sahifasi:**
  - Platformadagi jami foydalanuvchilar (talaba, o'qituvchi, admin) soni, jami modullar soni [59].
  - OpenAI API xarajatlari hisoblagichi (dollarda, har bir so'rov bo'yicha tahlili) [98].
  - Ma'lumotlar bazasi holati va server loglari.
- **User Accounts Sahifasi:**
  - Foydalanuvchilar jadvali (Filtrlar: roli bo'yicha, guruhi bo'yicha, yo'nalishi bo'yicha) [108].
  - "Yangi foydalanuvchi qo'shish" (Modal oyna), "Tahrirlash" va "O'chirish" tugmalari [108].
  - Excel orqali talabalar ro'yxatini bazaga ommaviy yuklash (Bulk Upload) imkoniyati.
- **Content Manager (Dinamik boshqaruv bo'limlari):**
  - **Module Scenarios Section:** 10 ta modul ssenariylarini yaratish va tahrirlash formasi [108]. System Prompt va Bemor roliga oid kontekstlarni (AI xulq-atvorini belgilash) vizual tahrirlagich orqali sozlash [108].
  - **Vocabulary Section:** Lug'at jadvali. Yangi so'z kiritish, uning o'zbekcha tarjimasi, inglizcha ta'rifi, misol gapini yozish va talaffuz uchun MP3 formatidagi audio faylni yuklash formasi [108].
  - **Smart Phrasebook Section:** Dialog ichida talabaga ko'mak beruvchi iboralarni guruhlash, darsdagi bosqich ketma-ketligini (step_order) sozlash [41, 108].
  - **Module Quizzes Section:** Modul testlarini boshqarish. To'rt variantli savollar va to'g'ri javob kalitini (A, B, C, D) kiritish va tahrirlash interfeysi [108].

---

## 5. Ma'lumotlar Bazasi Strukturasi (MySQL Database Schema)

Rollar, menular va bo'limlar integratsiyasini to'g'ri ta'minlash uchun MySQL ma'lumotlar bazasi sxemasi quyidagi ko'rinishda ishlatiladi:

```sql
-- 1. Mutaxassisliklar jadvali (Specialties)
CREATE TABLE specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Masalan: Stomatologiya, Pediatriya, Davolash ishi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Akademik Guruhlar jadvali (Groups)
CREATE TABLE student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Masalan: 401-Stomatologiya
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Foydalanuvchilar jadvali (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    specialty_id INT,
    group_id INT,
    current_level INT DEFAULT 1, -- Talabaning tizimdagi o'sish darajasi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE SET NULL,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL
);

-- 4. O'qituvchilar va Guruhlar munosabati jadvali (O'qituvchiga guruhlarni biriktirish)
CREATE TABLE teacher_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    group_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
);

-- 5. Modullar jadvali (Modules)
CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    specialty_id INT NOT NULL,
    title VARCHAR(150) NOT NULL, -- Masalan: Dental Pain & Sensitivity
    description TEXT,
    patient_context TEXT NOT NULL, -- AI-bemor uchun prompt ssenariysi (1-urinish va Retry uchun)
    final_challenge_context TEXT NOT NULL, -- Final challenge uchun murakkabroq prompt ssenariysi
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
);

-- 6. Lug'at jadvali (Vocabulary)
CREATE TABLE vocabulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    word VARCHAR(100) NOT NULL, -- Inglizcha so'z/atama
    translation VARCHAR(150) NOT NULL, -- O'zbekcha tarjimasi
    definition TEXT, -- Inglizcha ta'rifi
    example TEXT, -- Misol gap
    audio_url VARCHAR(255), -- Talaffuz audiosi (.mp3)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 7. Smart Phrasebook iboralari (Phrasebook)
CREATE TABLE phrasebook (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    category VARCHAR(100) NOT NULL, -- Masalan: \"Asking about pain triggers\", \"Explaining treatment\"
    phrase VARCHAR(255) NOT NULL, -- Kerakli ibora
    hint_uz TEXT, -- O'zbekcha izohi
    step_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 8. Dialog sessiyalari (Conversations)
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    module_id INT NOT NULL,
    attempt_type ENUM('first_attempt', 'retry', 'final_challenge') NOT NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    grammar_score INT DEFAULT 0,
    vocabulary_score INT DEFAULT 0,
    fluency_score INT DEFAULT 0,
    clinical_score INT DEFAULT 0,
    overall_score INT DEFAULT 0,
    general_feedback TEXT, -- AI-bemor suhbat bo'yicha beradigan izohi va tahlili
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 9. Chat xabarlari (Messages)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender ENUM('student', 'patient') NOT NULL,
    text_content TEXT NOT NULL,
    audio_url VARCHAR(255), -- Talaba ovozli gapirgan bo'lsa audio fayl yo'li
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 10. Test tizimi (Tests & Quizzes)
CREATE TABLE tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL, -- 'A', 'B', 'C' yoki 'D'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 11. Test natijalari (Test Results)
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    module_id INT NOT NULL,
    score INT NOT NULL, -- 100 ballik tizimda
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 12. Forum va jamoaviy muloqot (Forums)
CREATE TABLE forum_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 6. Loyiha Modullari va API Vazifalari (Express.js Routes)

Interfeysning ishlashini ta'minlash uchun Express backendda quyidagi RESTful API marshrutlari yaratiladi:

### 1. Avtorizatsiya API (`/api/auth`)
- `POST /register` -> Foydalanuvchi registratsiyasi (Student va Teacher uchun guruh va yo'nalishlarni bog'lash) [107].
- `POST /login` -> Kirish (JWT token qaytaradi va foydalanuvchi roli bo'yicha frontend navigatsiyasini yo'naltiradi).
- `GET /me` -> Joriy login bo'lgan foydalanuvchining ma'lumotlari, roli va ruxsatnomalarini olish.

### 2. Talabalar Progress API (`/api/student`)
- `GET /modules` -> Talabaning mutaxassisligiga tegishli 10 ta modul ro'yxati va ularning o'tish statusi [1, 53, 108].
- `GET /modules/:id/vocabulary` -> Modulga tegishli lug'at [107].
- `GET /modules/:id/phrasebook` -> Modulga tegishli Smart Phrasebook iboralari [108].
- `POST /modules/:id/conversation` -> Yangi dialog sessiyasini ochish (attempt_type: `first_attempt`, `retry`, `final_challenge`).
- `POST /conversation/:id/message` -> Chat xabarini yuborish (GPT-4o bemor javobini generatsiya qiladi va ma'lumotlar bazasiga saqlaydi).
- `POST /conversation/:id/voice` -> Talabaning mikrofon audio faylini Multer orqali qabul qilish, OpenAI Whisper API orqali matnga o'girish [108].
- `POST /conversation/:id/finalize` -> Dialog sessiyasini yakunlash va AI Feedback baholash modelini ishga tushirish [2, 111].
- `GET /conversation/:id/feedback` -> Generatsiya qilingan Grammar, Vocabulary, Clinical va Fluency ballari va tavsiyalarini olish [2, 49, 111].
- `GET /modules/:id/tests` -> Modul testlarini olish [107].
- `POST /modules/:id/tests/submit` -> Test javoblarini tekshirish va natijasini `test_results` jadvaliga saqlash [108].
- `POST /grammar-check` -> Kiritilgan matnni OpenAI orqali grammatik tekshirib qaytarish [107].

### 3. O'qituvchi API (`/api/teacher`)
- `GET /groups` -> O'qituvchining o'ziga biriktirilgan guruhlar ro'yxati [108].
- `GET /groups/:groupId/students` -> Guruhdagi barcha talabalar va ularning o'rtacha reyting ballari ro'yxati [108].
- `GET /students/:studentId/progress` -> Tanlangan talabaning barcha urinishlar va darslar kesimidagi natijalari [108].
- `GET /conversations/:id/transcript` -> Talabaning bemor bilan olib borgan suhbati chat tarixi va uning audio fayllari yo'llari [108].
- `GET /groups/:groupId/export/excel` -> Guruh o'zlashtirish jadvalini Excel formatida generatsiya qilib yuklash API [109].
- `GET /groups/:groupId/export/pdf` -> Guruh hisobotini PDF formatida yuklash API [109].

### 4. Admin API (`/api/admin`)
- `GET /stats/overview` -> Tizim statistikasi va OpenAI API balansi monitoringi [59, 98].
- `POST /users` -> Foydalanuvchilarni yaratish, tahrirlash va o'chirish (CRUD) [108].
- `POST /users/bulk-upload` -> Excel fayl orqali talabalarni bazaga ommaviy qo'shish API.
- `POST /groups` -> Guruhlar va yo'nalishlarni boshqarish API [108].
- `POST /content/modules` -> Ssenariylarni tahrirlash (CRUD) [108].
- `POST /content/vocabulary` -> Lug'at so'zlarini va ularga tegishli MP3 audio fayllarni yuklash API [108].
- `POST /content/phrasebook` -> Smart Phrasebook iboralarini CRUD qilish API [108].
- `POST /content/quizzes` -> Test savollarini boshqarish (CRUD) API [108].

### 5. Forum va Umumiy Aloqa API (`/api/forum`)
- `GET /messages` -> Forum xabarlarini oxirgi vaqti bo'yicha yuklash (pagination bilan) [107].
- `POST /messages` -> Yangi xabar jo'natish [107].

---

## 6. Qurish va Ishga Tushirish Bosqichlari (Roadmap & Cost)

Loyiha past riskli yondashuv asosida **15 kun ichida** bosqichma-bosqich yakunlanadi [67, 68, 94]:

| Bosqich | Davomiyligi | Bajariladigan ishlar | Natija (Deliverable) |
| :--- | :--- | :--- | :--- |
| **1. Asos (Setup)** | 1-3 kun | MySQL MB jadvallarini yaratish, Node.js REST API skeletini yozish, Auth (JWT) tizimini joriy etish. React frontendda Tailwind CSS va Role-based router tizimini va dizaynini tayyorlash [68, 177]. | Ishlaydigan Auth, foydalanuvchi profili sahifalari va Sidebar navigatsiyasi [68, 70]. |
| **2. Asosiy MVP Sikli** | 4-8 kun | Chat interfeysini ulash. OpenAI GPT-4o bilan Virtual Patient simulyatorini va AI Feedback baholash drayverini ishga tushirish. Ovoz yozib olish va matnga o'girish (Whisper) integratsiyasi [61, 68, 108, 170, 177]. | 1-modul (Dental Pain) misolida to'liq ishlaydigan 90 daqiqalik dars sikli [3, 61, 68, 112]. |
| **3. Kontent va Panellar** | 9-12-kun | Lug'at (Vocabulary) va Smart Phrasebook modullarini interfeysga dinamik chiqarish. O'qituvchi va Admin panellarini qurish, Excel va PDF ko'rinishida hisobot eksportini ulash [68, 108, 109, 177]. | O'qituvchi va Admin boshqaruv panellari, test tizimi, lug'at va forum [107, 108]. |
| **4. Yakuniy Sinov** | 13-15-kun | Barcha 10 ta modulni yuklash, tizimdagi ovozli chatlar va ruxsatnomalar xavfsizligini testdan o'tkazish, loyihani serverga joylashtirish (Deployment) [68, 177]. | To'liq ishga tushirilgan production server va topshirilgan tayyor mahsulot [68, 177]. |

### Loyihani Amalga Oshirish Shartlari:
- **Topshirish muddati:** 15 kun [94].
- **Loyiha qiymati (Variantlar):**
  - *Boshlang'ich paket ($200):* 2 ta to'liq modul, login va profil, virtual bemor chat, sodda admin panel [68, 70, 72, 74, 76].
  - *Optimal paket ($300 - Tavsiya etiladi):* 3 ta to'liq modul, talaba profili, admin panel, o'quvchi natijalari monitoringi va Excel eksport [68, 76, 78, 80, 82, 84].
  - *Kengaytirilgan paket ($600):* 5 ta to'liq modul, barcha modullar uchun to'liq muloqot tizimi, kengaytirilgan statistika paneli, ovozli muloqot va barcha rollar integratsiyasi [68, 84, 88, 90, 92].
- **Oylik AI va Server xarajatlari:** $40–70 atrofida (OpenAI API va VPS server litsenziyalari, buyurtmachi tomonidan to'lanadi) [98].
- **To'lov shartlari:** 50% avans dars boshida, qolgan 50% ishni to'liq topshirganda [96].

---
*Ushbu mukammal arxitektura va bo'limlar rejasi React, Node.js va MySQL texnologiyalarida "Virtual Patient English" loyihasini xatosiz va tushunarli tarzda minimal muddatda qurib topshirishga to'liq asos bo'ladi [67, 176].*
