# Virtual Patient English — Ma'lumotlar Bazasi Sxemasi (MySQL)

## Umumiy Ma'lumot

Tizim **MySQL v8.0+** ma'lumotlar bazasida ishlaydi. Barcha jadvallar o'rtasida **Foreign Key** bog'liqliklar o'rnatilgan va **CASCADE** o'chirish qoidalari qo'llanilgan.

**ORM:** Sequelize (Node.js) — migratsiyalar va modellar uchun.

---

## Jadvallar Ro'yxati

| # | Jadval nomi | Maqsad |
|---|------------|--------|
| 1 | `specialties` | Tibbiy mutaxassisliklar |
| 2 | `student_groups` | Akademik guruhlar |
| 3 | `users` | Barcha foydalanuvchilar (talaba, o'qituvchi, admin) |
| 4 | `teacher_groups` | O'qituvchi ↔ Guruh bog'liqlik jadvali |
| 5 | `modules` | O'quv modullari va AI ssenariylari |
| 6 | `vocabulary` | Har bir modulning tibbiy lug'ati |
| 7 | `phrasebook` | Smart Phrasebook tayyor iboralari |
| 8 | `conversations` | Dialog sessiyalari va ballar |
| 9 | `messages` | Chat xabarlari |
| 10 | `tests` | Test / Quiz savollari |
| 11 | `test_results` | Talabalarning test natijalari |
| 12 | `forum_messages` | Forum xabarlari |

---

## SQL Sxema

```sql
-- ================================================================
-- 1. MUTAXASSISLIKLAR (Specialties)
-- Tibbiy yo'nalishlar: Stomatologiya, Pediatriya, Davolash ishi...
-- ================================================================
CREATE TABLE specialties (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,       -- Masalan: Stomatologiya
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================================================================
-- 2. AKADEMIK GURUHLAR (Student Groups)
-- Masalan: 401-Stomatologiya, 301-Pediatriya
-- ================================================================
CREATE TABLE student_groups (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,         -- Masalan: 401-Stomatologiya
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ================================================================
-- 3. FOYDALANUVCHILAR (Users)
-- Talaba, o'qituvchi va admin — hammasi shu jadvalda saqlanadi
-- ================================================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    specialty_id    INT,                      -- Faqat talabalar uchun
    group_id        INT,                      -- Faqat talabalar uchun
    current_level   INT DEFAULT 1,            -- Talabaning o'sish darajasi
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE SET NULL,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL
);


-- ================================================================
-- 4. O'QITUVCHI ↔ GURUH BOG'LIQLIK JADVALI (Teacher Groups)
-- Bir o'qituvchi bir nechta guruhga biriktirilishi mumkin
-- ================================================================
CREATE TABLE teacher_groups (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id  INT NOT NULL,
    group_id    INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
);


-- ================================================================
-- 5. O'QUV MODULLARI (Modules)
-- Har bir modul 90 daqiqalik dars — AI ssenariysi ham shu yerda
-- ================================================================
CREATE TABLE modules (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    specialty_id            INT NOT NULL,
    title                   VARCHAR(150) NOT NULL,  -- Masalan: Dental Pain & Sensitivity
    description             TEXT,
    patient_context         TEXT NOT NULL,   -- AI-bemor uchun system prompt (1-urinish va Retry)
    final_challenge_context TEXT NOT NULL,   -- Final Challenge uchun murakkab prompt
    order_index             INT NOT NULL,    -- Modullar ketma-ketligi (1-10)
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
);


-- ================================================================
-- 6. LUG'AT (Vocabulary)
-- Har bir modulga tegishli tibbiy so'zlar
-- ================================================================
CREATE TABLE vocabulary (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    module_id   INT NOT NULL,
    word        VARCHAR(100) NOT NULL,   -- Inglizcha so'z/atama
    translation VARCHAR(150) NOT NULL,  -- O'zbekcha tarjimasi
    definition  TEXT,                   -- Inglizcha ta'rifi
    example     TEXT,                   -- Misol gap
    audio_url   VARCHAR(255),           -- Talaffuz audiosi (.mp3 fayl yo'li)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);


-- ================================================================
-- 7. SMART PHRASEBOOK (Phrasebook)
-- Dialog davomida talabaga ko'mak beruvchi tayyor iboralar
-- ================================================================
CREATE TABLE phrasebook (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    module_id   INT NOT NULL,
    category    VARCHAR(100) NOT NULL,  -- Masalan: "Asking about pain triggers"
    phrase      VARCHAR(255) NOT NULL,  -- Tayyor ibora: "Is the pain triggered by...?"
    hint_uz     TEXT,                   -- O'zbekcha izoh
    step_order  INT DEFAULT 1,          -- Phrasebook ichida tartib raqami
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);


-- ================================================================
-- 8. DIALOG SESSIYALARI (Conversations)
-- Har bir talabaning har bir urinishi — bali ham shu yerda
-- ================================================================
CREATE TABLE conversations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    student_id          INT NOT NULL,
    module_id           INT NOT NULL,
    attempt_type        ENUM('first_attempt', 'retry', 'final_challenge') NOT NULL,
    status              ENUM('active', 'completed') DEFAULT 'active',
    grammar_score       INT DEFAULT 0,      -- 1-10 ball
    vocabulary_score    INT DEFAULT 0,      -- 1-10 ball
    fluency_score       INT DEFAULT 0,      -- 1-10 ball
    pronunciation_score INT DEFAULT 0,      -- 1-10 ball
    clinical_score      INT DEFAULT 0,      -- 1-10 ball
    overall_score       INT DEFAULT 0,      -- 0-100 umumiy ball
    general_feedback    TEXT,               -- AI tomonidan berilgan batafsil izoh
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);


-- ================================================================
-- 9. CHAT XABARLARI (Messages)
-- Suhbat davomidagi har bir xabar — talaba va AI-bemor
-- ================================================================
CREATE TABLE messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender          ENUM('student', 'patient') NOT NULL,
    text_content    TEXT NOT NULL,
    audio_url       VARCHAR(255),   -- Talaba ovozli gapirsa, audio faylning yo'li
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);


-- ================================================================
-- 10. TEST SAVOLLARI (Tests / Quizzes)
-- Har bir modul uchun 4 variantli test savollari
-- ================================================================
CREATE TABLE tests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    module_id       INT NOT NULL,
    question        TEXT NOT NULL,
    option_a        VARCHAR(255) NOT NULL,
    option_b        VARCHAR(255) NOT NULL,
    option_c        VARCHAR(255) NOT NULL,
    option_d        VARCHAR(255) NOT NULL,
    correct_option  CHAR(1) NOT NULL,   -- 'A', 'B', 'C' yoki 'D'
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);


-- ================================================================
-- 11. TEST NATIJALARI (Test Results)
-- Har bir talabaning modul bo'yicha test natijalari
-- ================================================================
CREATE TABLE test_results (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    module_id   INT NOT NULL,
    score       INT NOT NULL,    -- 100 ballik tizimda
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);


-- ================================================================
-- 12. FORUM XABARLARI (Forum Messages)
-- Barcha foydalanuvchilar (talaba + o'qituvchi + admin) xabarlari
-- ================================================================
CREATE TABLE forum_messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    sender_id       INT NOT NULL,
    message_text    TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Jadvallar Orasidagi Bog'liqlik Diagrammasi

```
specialties
    ├── users (specialty_id → specialties.id)
    └── modules (specialty_id → specialties.id)
            ├── vocabulary (module_id → modules.id)
            ├── phrasebook (module_id → modules.id)
            ├── tests (module_id → modules.id)
            └── conversations (module_id → modules.id)
                        └── messages (conversation_id → conversations.id)

student_groups
    ├── users (group_id → student_groups.id)
    └── teacher_groups (group_id → student_groups.id)
            └── users/teacher (teacher_id → users.id)

users
    ├── conversations (student_id → users.id)
    ├── test_results (student_id → users.id)
    └── forum_messages (sender_id → users.id)
```

---

## Muhim Maydonlar Izohi

| Jadval | Maydon | Izoh |
|--------|--------|------|
| `users` | `role` | `student` / `teacher` / `admin` — tizim huquqlari shu maydonga asoslanadi |
| `users` | `current_level` | Talabaning darajasi — o'tilgan modullar soniga qarab oshib boradi |
| `modules` | `patient_context` | GPT-4o ga yuboriladigan system prompt — AI bemorning rolini belgilaydi |
| `modules` | `final_challenge_context` | Final Challenge uchun yangi, murakkabroq ssenariy |
| `conversations` | `attempt_type` | `first_attempt`, `retry`, `final_challenge` — suhbat turi |
| `conversations` | `overall_score` | 0-100 ball — 5 ta mezon bo'yicha weighted hisoblangan umumiy baho |
| `messages` | `audio_url` | Whisper API orqali matnga o'girilishidan avval saqlanadigan audio fayl yo'li |
| `tests` | `correct_option` | `'A'`, `'B'`, `'C'` yoki `'D'` — to'g'ri javob |
