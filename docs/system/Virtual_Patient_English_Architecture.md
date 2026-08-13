# Virtual Patient English — Loyihani Qurish, Arxitektura va Vazifalar Rejasi (.md)

Ushbu hujjat **Virtual Patient English** (Tibbiyot talabalari uchun sun'iy intellektga asoslangan klinik muloqot platformasi) loyihasining texnik arxitekturasi, ma'lumotlar bazasi strukturasi va dasturlash bosqichlarini o'z ichiga oladi [11, 120]. Tizim **React (Frontend)**, **Node.js/Express (Backend)** va **MySQL (Ma'lumotlar bazasi)** texnologiyalar stekida quriladi.

---

## 1. Loyihaning Umumiy Kontsepti va Ishlash Sikli

Platformaning asosiy maqsadi — tibbiyot (birinchi bosqichda stomatologiya) talabalariga real klinik vaziyatlarda bemorlar bilan ingliz tilida erkin va to'g'ri muloqot qilishni o'rgatishdir [11, 110, 120].

Har bir o'quv moduli **90 daqiqalik dars formatiga** va quyidagi tizimli siklga asoslanadi [3, 112]:
1. **Vocabulary (15 daq):** Mavzuga oid asosiy tibbiy so'zlarni o'rganish [3, 112].
2. **Smart Phrasebook (10 daq):** Dialoglarda ishlatiladigan tayyor iboralar va yordamchi dialog konstruksiyalari [3, 112].
3. **Virtual Patient (20 daq - 1st Attempt):** AI-bemor bilan ovozli yoki yozma muloqot [3, 112]. Talaba shifokor rolida bemorning shikoyatlarini aniqlaydi [1, 110]. Qiynalganda Phrasebook shpargalkasidan foydalanishi mumkin [1, 110].
4. **AI Feedback (10 daq):** Suhbat yakunida grammatika (grammar), lug'at boyligi (vocabulary), muloqot ravonligi (fluency), talaffuz (pronunciation) va klinik muloqot (clinical communication) ko'rsatkichlari bo'yicha baholash va xatolar tahlili [2, 111, 112].
5. **Retry (15 daq):** Yo'l qo'yilgan xatolarni tuzatib, suhbatni qayta bajarish [2, 111, 112].
6. **Final Challenge (15 daq):** Phrasebook yordamisiz, yangi bemor ssenariysini mustaqil yakunlash [2, 111, 112].
7. **Wrap-up (5 daq):** Dars yakunini chiqarish va natijalarni saqlash [3, 112].

---

## 2. Loyihaning Texnik Arxitekturasi (Tech Stack)

### Frontend: React.js
- **UI Framework:** Tailwind CSS (tezkor, zamonaviy va responsive dizayn uchun).
- **State Management:** React Context API yoki Redux Toolkit (global holat, foydalanuvchi auth va dars jarayonini boshqarish).
- **Network Client:** Axios (Backend API bilan muloqot).
- **Speech API:** Web Speech API (brauzer ichidagi ovozni matnga o'girish — Speech-to-Text va matnni ovozga aylantirish — Text-to-Speech uchun) yoki OpenAI Whisper API integratsiyasi [108, 217].
- **Audio Recorder:** O'quvchining ovozli javoblarini yozib olish va backendga yuborish uchun kutubxonalar (`react-mic` yoki custom audio-worklet).

### Backend: Node.js & Express.js
- **Runtime Environment:** Node.js (v18+).
- **Framework:** Express.js (RESTful API yaratish).
- **ORM:** Sequelize (MySQL bilan ishlashni osonlashtirish, migratsiyalar va modellar uchun).
- **Auth:** JSON Web Token (JWT) + bcrypt (parollarni xavfsiz shifrlash).
- **AI Integratsiya:** OpenAI SDK (GPT-4o orqali virtual bemor agentini va AI Feedback baholash tizimini boshqarish).
- **Media handler:** Multer (ovozli fayllarni va yuklanadigan hujjatlarni qabul qilish uchun) [108, 217].

### Database: MySQL
- **Ma'lumotlar bazasi:** MySQL (v8.0+). Tizimli, tranzaksiyaviy va foydalanuvchilar progressini saqlash uchun relational struktura.

---

## 3. Ma'lumotlar Bazasi Strukturasi (MySQL Database Schema)

Loyihaning funksiyalaridan kelib chiqib, quyidagi normallashtirilgan jadvallar strukturasi loyihalashtiriladi:

```sql
-- 1. Mutaxassisliklar jadvali (Specialties)
CREATE TABLE specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Masalan: Stomatologiya, Pediatriya, Davolash ishi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Guruhlar jadvali (Groups)
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

-- 4. Modullar jadvali (Modules)
CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    specialty_id INT NOT NULL,
    title VARCHAR(150) NOT NULL, -- Masalan: Dental Pain & Sensitivity
    description TEXT,
    patient_context TEXT NOT NULL, -- AI-bemor uchun prompt ssenariysi
    final_challenge_context TEXT NOT NULL, -- Final challenge uchun boshqa prompt
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
);

-- 5. Lug'at jadvali (Vocabulary)
CREATE TABLE vocabulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    word VARCHAR(100) NOT NULL, -- Inglizcha so'z/atama
    translation VARCHAR(150) NOT NULL, -- O'zbekcha tarjimasi
    definition TEXT, -- Inglizcha ta'rifi
    example TEXT, -- Misol gap
    audio_url VARCHAR(255), -- Talaffuz audiosi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 6. Smart Phrasebook iboralari (Phrasebook)
CREATE TABLE phrasebook (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    category VARCHAR(100) NOT NULL, -- Masalan: "Asking about pain triggers", "Explaining treatment"
    phrase VARCHAR(255) NOT NULL, -- Kerakli ibora
    hint_uz TEXT, -- O'zbekcha izohi
    step_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 7. Dialog sessiyalari (Conversations)
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
    general_feedback TEXT, -- AI-bemor suhbat bo'yicha beradigan izohi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 8. Chat xabarlari (Messages)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender ENUM('student', 'patient') NOT NULL,
    text_content TEXT NOT NULL,
    audio_url VARCHAR(255), -- Talaba ovozli gapirgan bo'lsa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 9. Test tizimi (Tests & Quizzes)
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

-- 10. Test natijalari (Test Results)
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    module_id INT NOT NULL,
    score INT NOT NULL, -- 100 ballik tizimda
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 11. Forum va jamoaviy muloqot (Forums)
CREATE TABLE forum_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. Loyiha Modullari va Vazifalar Taqsimoti

Tizim ishlashi uchun barcha vazifalar **Backend (API)** va **Frontend (React UI)** qismlariga ajratiladi.

### Modul 1: Foydalanuvchilar va Guruhlar (Auth & User Management)
- **Backend vazifalari:**
  - Registratsiya API (Talabalar mutaxassisligi va guruhini tanlaydi) [107, 216].
  - Login API (JWT token qaytaradi, foydalanuvchi roli `student`, `teacher`, `admin` bo'yicha cheklovlar).
  - Profil API (shaxsiy ma'lumotlar va o'tgan modullar statistikasini olish).
- **Frontend vazifalari:**
  - Login va Registratsiya sahifalari.
  - Mutaxassisliklar (Dentistry, Pediatrics va h.k.) va guruhlar ro'yxatini backenddan yuklab olib, dinamik select-box qilish [107, 216].
  - Talaba Profili paneli (umumiy ballar, o'zlashtirish foizi grafiki) [108, 217].

### Modul 2: Lug'at va Iboralar (Vocabulary & Smart Phrasebook)
- **Backend vazifalari:**
  - Tanlangan modulga tegishli so'zlar ro'yxatini (`vocabulary`) olish API [107, 216].
  - Modulga oid `phrasebook` iboralarini kategoriyalar bo'yicha olish API.
  - Matnni grammatik va imloviy tekshirish API (Talaba dars davomida yozgan matnlarini mustaqil tekshirishi uchun) [107, 216].
- **Frontend vazifalari:**
  - **Vocabulary Section:** Kartochkalar ko'rinishida so'zlarni taqdim etish, so'zning o'qilishi (audio tinglash) [107, 108, 216, 217].
  - **Smart Phrasebook Section:** Dialogdan oldin tayyor iboralar bilan tanishish [3, 112]. Dialog vaqtida interfeysning o'ng yoki pastki qismida bosqichma-bosqich yordamchi shpargalka oynasi (qiynalganda ochiladi) [2, 111].

### Modul 3: AI Virtual Bemor Simulyatsiyasi (Virtual Patient Simulation Engine)
Bu platformaning **yuragi** bo'lib, sun'iy intellekt integratsiyasini talab qiladi [11, 120].
- **Backend vazifalari (Node.js & OpenAI):**
  - **Sessiya ochish API:** Talaba suhbatni boshlaganda yangi `conversation` yaratish (attempt_type: `first_attempt`, `retry`, yoki `final_challenge`).
  - **Suhbat API (`/api/chat`):** Talaba xabarini qabul qilish. OpenAI GPT modeliga tizimli prompt yuborish. Prompt ichida quyidagilar bo'ladi:
    - *Bemor roli va konteksti:* Modul ssenariysi (masalan: "Ismingiz John. Sovuq suv ichganda tishingiz kuchli og'riydi. Siz qo'rqasiz...") [1, 45, 110, 154].
    - *Muloqot tili:* Klinik ingliz tili, talabaning darajasiga mos muloqot.
    - AI-bemor javobini qaytarish va uni `messages` jadvaliga saqlash.
  - **Ovozli chat API:** Talabaning ovozli javobini (audio faylini) qabul qilib, uni OpenAI Whisper orqali matnga o'giriish (Speech-to-Text) [108, 217]. AI javobini matn ko'rinishida generatsiya qilib, keyin TTS (Text-to-Speech) orqali ovozli fayl formatida frontendga qaytarish [108, 217].
- **Frontend vazifalari (React Chat Interface):**
  - Real-time chat interfeysi (Talaba va Bemor muloqoti) [39, 148].
  - **Phrasebook Shpargalkasi integratsiyasi:** Interfeysda talabaga mos keluvchi "Is the pain triggered by...?" kabi iboralar shablonlarini chiqarish [47, 156]. Talaba tugmani bossa, ibora chat yozish maydoniga avtomatik ko'chadi [41, 150].
  - **Audio Recording Button:** Talaba mikrofon tugmasini bosib gapiradi, ovoz yozib olinadi va backendga audio formatda jo'natiladi [108, 217].
  - AI-bemorning javobini matnli va dinamik ovozli (audio-pleyer bilan) ijro etish.

### Modul 4: AI Feedback va Retry Tizimi (AI Assessment Engine)
Suhbat tugallanganda talaba natijalarini to'liq tahlil qilish [2, 111].
- **Backend vazifalari:**
  - **Feedback API (`/api/conversation/:id/feedback`):** Suhbat yopilganda, barcha chat xabarlarini OpenAI GPT-ga tahlil uchun yuborish. GPT modelidan qat'iy tuzilgan JSON formatida (Structured Outputs) javob talab qilinadi:
    - `grammar_score` (1-10): Grammatik xatolar soni va bahosi.
    - `vocabulary_score` (1-10): Professional terminlar to'g'ri ishlatilganligi [2, 111].
    - `fluency_score` (1-10): Gaplarning ravonligi.
    - `clinical_score` (1-10): Shifokorlik etikasi va savollarning to'g'riligi (og'riq turi, triggerlari, joyini aniqlay oldimi?) [1, 2, 110, 111].
    - `overall_score` (100 ballik shkalada umumiy ball).
    - `general_feedback` (Talabaning kuchli va zaif tomonlari, grammatik xatolarning to'g'rilangan variantlari ro'yxati).
  - Natijalarni `conversations` jadvaliga yozib olish va saqlash.
- **Frontend vazifalari:**
  - **Natijalar Paneli (AI Feedback UI):** Rang-barang grafik ko'rsatkichlar (radar chart yoki progress barlar) orqali Grammar, Vocabulary va Clinical baholarini chiqarish [43, 49, 152, 158].
  - Xatolar va tavsiyalar ro'yxatini interaktiv formatda ko'rsatish (masalan: talaba xato yozgan gap va uning ostida yashil rangda to'g'ri varianti).
  - **"Retry" tugmasi:** Natijalardan so'ng foydalanuvchiga xatolarni to'g'rilab, yangi urinish (`attempt_type: retry`) yaratish imkoniyati [2, 111].

### Modul 5: Test va Forum Tizimi (Testing & Social Module)
- **Backend vazifalari:**
  - Modulga oid test savollarini yuklash va topshirilgan test natijalarini saqlash API [107, 108, 216, 217].
  - Forum xabarlarini olish va yangi xabar qo'shish API (Real-time muloqot uchun WebSockets yoki standart pooling ishlatilishi mumkin) [107, 216].
- **Frontend vazifalari:**
  - To'rt variantli interaktiv test paneli [107, 216].
  - Forum sahifasi: talabalar o'zaro savol-javob qilishi va muloqot qilishi uchun sodda chat-forum [107, 216].

### Modul 6: Admin va O'qituvchi Boshqaruv Paneli (Admin & Instructor Dashboard)
- **Backend vazifalari:**
  - Talabalar va guruhlar ro'yxati va ularning o'zlashtirish ko'rsatkichlarini olish API [108, 217].
  - Test savollari, lug'at va ssenariylarni CRUD (yaratish, o'chirish, tahrirlash) qilish API [108, 217].
  - **Eksport API:** Guruh natijalarini Excel (.xlsx) yoki PDF formatida generatsiya qilish va yuklab olish imkoniyati [109, 218].
- **Frontend vazifalari:**
  - Guruhlar bo'yicha talabalarning o'zlashtirish foizlari va suhbat ballari jadvali [108, 217].
  - Yangi modul ssenariylari, testlar va lug'atlar qo'shish uchun admin formalari [108, 217].
  - Excel va PDF ko'rinishida yuklab olish tugmalari [109, 218].

---

## 5. Qurish va Ishga Tushirish Bosqichlari (Roadmap)

Loyihani **15 kunlik muddatda** bosqichma-bosqich ishlab chiqish va sinovdan o'tkazish rejasi [68, 177]:

| Bosqich | Davomiyligi | Bajariladigan ishlar |
| :--- | :--- | :--- |
| **1. Asos (Setup)** | 1-3 kun | MySQL MB arxitekturasini yaratish, Node.js API skeletini sozlash, Auth integratsiyasi, React loyihasini Tailwind bilan sozlash va bosh sahifa/profil interfeysini qurish [68, 177]. |
| **2. Asosiy Sikl (MVP)** | 4-8 kun | Chat interfeysini ulash. OpenAI GPT-4o bilan virtual bemor chat integratsiyasi. OpenAI orqali AI Feedback baholash tizimini va dars retry funksiyasini 1-modul (Dental Pain) misolida to'liq ishga tushirish [61, 68, 170, 177]. |
| **3. Kontent & Admin** | 9-12-kun | Stomatologiyaga oid qolgan modullarni yuklash, Vocabulary va Smart Phrasebook modullarini dinamik ulash, Admin panelni talabalar natijalari va Excel eksport bilan tugatish [68, 177]. |
| **4. Sinov va Joylash** | 13-15-kun | Ovozli muloqot va Speech-to-Text tizimini testdan o'tkazish, xatoliklarni tuzatish, serverga joylashtirish (Deployment) va loyihani topshirish [68, 177]. |

---
*Ushbu reja loyihani minimal xavf bilan, aniq natijalar asosida bosqichma-bosqich ishonchli va sifatli qurishga xizmat qiladi [67, 176].*
