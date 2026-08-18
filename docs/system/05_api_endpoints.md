# Virtual Patient English — Backend REST API Endpointlari

Ushbu hujjat **Virtual Patient English** platformasining barcha backend REST API marshrutlari, so'rov va javob strukturalari, autentifikatsiya talablari va xatolik kodlarini o'z ichiga oladi.

---

## 1. Umumiy Arxitektura va Middleware

- **Base URL:** `http://localhost:5000/api`
- **Format:** JSON (`Content-Type: application/json`)
- **Autentifikatsiya:** JWT (JSON Web Token) `Authorization: Bearer <token>` sarlavhasi (Header) orqali yuboriladi.
- **Role Guards (Ruxsatnomalar):** `authMiddleware` va `roleMiddleware(['student' | 'teacher' | 'admin'])` foydalaniladi.

---

## 2. Avtorizatsiya API (`/api/auth`)

### 2.1 Foydalanuvchi Registratsiyasi
- **Endpoint:** `POST /api/auth/register`
- **Auth:** Ochiq (Public)
- **Request Body:**
  ```json
  {
    "full_name": "Mustafayev Muzaffar",
    "email": "student@example.com",
    "password": "Password123!",
    "role": "student",
    "specialty_id": 1,
    "group_id": 1
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "full_name": "Mustafayev Muzaffar",
      "email": "student@example.com",
      "role": "student",
      "specialty_id": 1,
      "group_id": 1,
      "current_level": 1
    }
  }
  ```

### 2.2 Tizimga Kirish (Login)
- **Endpoint:** `POST /api/auth/login`
- **Auth:** Ochiq (Public)
- **Request Body:**
  ```json
  {
    "email": "student@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "full_name": "Mustafayev Muzaffar",
      "email": "student@example.com",
      "role": "student",
      "specialty_id": 1,
      "group_id": 1,
      "current_level": 1
    }
  }
  ```

### 2.3 Joriy Foydalanuvchi Profilini Olish
- **Endpoint:** `GET /api/auth/me`
- **Auth:** JWT Token talab qilinadi
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": 1,
      "full_name": "Mustafayev Muzaffar",
      "email": "student@example.com",
      "role": "student",
      "specialty": { "id": 1, "name": "Dentistry" },
      "group": { "id": 1, "name": "401-Stomatologiya" },
      "current_level": 1
    }
  }
  ```

---

## 3. Talaba API (`/api/student`)

### 3.1 Modullar Ro'yxatini Olish
- **Endpoint:** `GET /api/student/modules`
- **Auth:** `student` roli
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "title": "Dental Pain & Sensitivity",
      "description": "Sovuq/issiq ta'sirida tish og'rishi ssenariysi",
      "order_index": 1,
      "is_completed": true,
      "best_score": 88
    },
    {
      "id": 2,
      "title": "Tooth Extraction Consultation",
      "description": "Tish olib tashlash konsultatsiyasi",
      "order_index": 2,
      "is_completed": false,
      "best_score": null
    }
  ]
  ```

### 3.2 Modul Lug'atini Olish
- **Endpoint:** `GET /api/student/modules/:id/vocabulary`
- **Auth:** `student` roli
- **Response (200 OK):**
  ```json
  [
    {
      "id": 101,
      "word": "Hypersensitivity",
      "translation": "Yuqori ta'sirchanlik",
      "definition": "Extreme responsiveness to hot, cold, or sweet stimuli.",
      "example": "The patient complains of tooth hypersensitivity when drinking cold ice water.",
      "audio_url": "/uploads/audio/hypersensitivity.mp3"
    }
  ]
  ```

### 3.3 Smart Phrasebook Iboralarini Olish
- **Endpoint:** `GET /api/student/modules/:id/phrasebook`
- **Auth:** `student` roli
- **Response (200 OK):**
  ```json
  [
    {
      "id": 201,
      "category": "Asking about pain triggers",
      "phrase": "Is the pain triggered by cold or hot beverages?",
      "hint_uz": "Og'riq sovuq yoki issiq ichimliklardan qo'ziydimi?",
      "step_order": 1
    }
  ]
  ```

### 3.4 AI-Bemor Dialog Sessiyasini Boshlash
- **Endpoint:** `POST /api/student/modules/:id/conversations`
- **Auth:** `student` roli
- **Request Body:**
  ```json
  {
    "attempt_type": "first_attempt" // "first_attempt" | "retry" | "final_challenge"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "conversation_id": 45,
    "status": "active",
    "attempt_type": "first_attempt",
    "initial_patient_message": "Hello doctor... My tooth has been hurting terribly since yesterday."
  }
  ```

### 3.5 Chat Xabari Yuborish va AI Javobini Olish
- **Endpoint:** `POST /api/student/conversations/:id/messages`
- **Auth:** `student` roli
- **Request Body:**
  ```json
  {
    "message": "Hello! How long have you felt this pain, and what triggers it?"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "student_message": {
      "id": 102,
      "sender": "student",
      "text_content": "Hello! How long have you felt this pain, and what triggers it?",
      "created_at": "2026-08-13T19:00:00Z"
    },
    "patient_reply": {
      "id": 103,
      "sender": "patient",
      "text_content": "It started 2 days ago, doctor. It gets much worse whenever I drink cold liquids.",
      "created_at": "2026-08-13T19:00:02Z"
    }
  }
  ```

### 3.6 Ovozli Xabar Yuborish (Speech-to-Text)
- **Endpoint:** `POST /api/student/conversations/:id/voice-message`
- **Auth:** `student` roli
- **Content-Type:** `multipart/form-data`
- **Request Body:** Form field `audio` (.webm/.wav file)
- **Response (200 OK):** Transkripsiya matni va AI javobi.

### 3.7 Suhbatni Yakunlash va AI Feedback Olish
- **Endpoint:** `POST /api/student/conversations/:id/finalize`
- **Auth:** `student` roli
- **Response (200 OK):**
  ```json
  {
    "conversation_id": 45,
    "status": "completed",
    "scores": {
      "grammar_score": 8,
      "vocabulary_score": 9,
      "fluency_score": 8,
      "pronunciation_score": 7,
      "clinical_score": 9,
      "overall_score": 85
    },
    "general_feedback": "Excellent clinical communication! You accurately inquired about pain onset and triggers.",
    "errors": [
      {
        "original": "Where it is hurting?",
        "corrected": "Where does it hurt?",
        "explanation": "Use 'does' for present simple question structure with subject-verb order."
      }
    ]
  }
  ```

### 3.8 Modul Testini Topshirish
- **Endpoint:** `POST /api/student/modules/:id/test/submit`
- **Auth:** `student` roli
- **Request Body:**
  ```json
  {
    "answers": [
      { "question_id": 1, "selected_option": "B" },
      { "question_id": 2, "selected_option": "A" }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "score": 90,
    "total_questions": 10,
    "correct_count": 9,
    "passed": true
  }
  ```

### 3.9 Grammatika Tekshirgichi (Grammar Checker)
- **Endpoint:** `POST /api/student/grammar-check`
- **Auth:** Barcha avtorizatsiyadan o'tgan foydalanuvchilar
- **Request Body:**
  ```json
  {
    "text": "The patient have severe pain since yesterday and he take aspirin."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "corrected_text": "The patient has had severe pain since yesterday and he took aspirin.",
    "has_errors": true,
    "errors": [
      {
        "original": "have severe pain",
        "corrected": "has had severe pain",
        "explanation": "Subject 'patient' is singular; use present perfect 'has had' for duration."
      }
    ]
  }
  ```

---

## 4. O'qituvchi API (`/api/teacher`)

### 4.1 Biriktirilgan Guruhlar Ro'yxati
- **Endpoint:** `GET /api/teacher/groups`
- **Auth:** `teacher` roli

### 4.2 Guruh Talabalari va Natijalari
- **Endpoint:** `GET /api/teacher/groups/:groupId/students`
- **Auth:** `teacher` roli

### 4.3 Talaba Tafsilotlari va Suhbatlar Tarixi
- **Endpoint:** `GET /api/teacher/students/:studentId/progress`
- **Auth:** `teacher` roli

### 4.4 Guruh Natijalarini Excel/PDF Eksport Qilish
- **Endpoint:** `GET /api/teacher/groups/:groupId/export?format=excel` (`format=pdf`)
- **Auth:** `teacher` yoki `admin` roli

---

## 5. Admin API (`/api/admin`)

### 5.1 Tizim Umumiy Ko'rinishi va Monitoring
- **Endpoint:** `GET /api/admin/overview`
- **Auth:** `admin` roli

### 5.2 Foydalanuvchilar CRUD
- `GET /api/admin/users` — Barcha foydalanuvchilar ro'yxati
- `POST /api/admin/users` — Yangi foydalanuvchi yaratish
- `PUT /api/admin/users/:id` — Foydalanuvchini tahrirlash
- `DELETE /api/admin/users/:id` — Foydalanuvchini o'chirish
- `POST /api/admin/users/bulk-upload` — Excel orqali ommaviy yuklash

### 5.3 Kontent Boshqaruvi (Content Manager)
- `POST /api/admin/content/scenarios` — Modul ssenariylarini tahrirlash
- `POST /api/admin/content/vocabulary` — Lug'at kiritish/tahrirlash (MP3 yuklash bilan)
- `POST /api/admin/content/phrasebook` — Phrasebook iboralarini tahrirlash
- `POST /api/admin/content/quizzes` — Test savollarini tahrirlash

---

## 6. HTTP Status Kodlari

| Kodu | Ma'nosi | Qachon ishlatiladi |
|------|---------|-------------------|
| **200** | OK | Muvaffaqiyatli so'rov |
| **201** | Created | Yangi resurs (foydalanuvchi, conversation) yaratildi |
| **400** | Bad Request | Noto'g'ri body yoki yetishmayotgan parametrlar |
| **401** | Unauthorized | Token yo'q yoki amal qilish muddati tugagan |
| **403** | Forbidden | Ushbu rol uchun ruxsat yo'q |
| **404** | Not Found | Resurs topilmadi |
| **500** | Internal Error | Server yoki Gemini API ichki xatosi |
