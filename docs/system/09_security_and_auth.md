# Virtual Patient English — Xavfsizlik, Autentifikatsiya va Ruxsatnomalar Arxitekturasi

Ushbu hujjat **Virtual Patient English** tizimidagi xavfsizlik arxitekturasi, foydalanuvchilar autentifikatsiyasi (JWT), authorization (Role-Based Access Control - RBAC), parollarni shifrlash (bcrypt), API kalitlari muhofazasi hamda kiberxavfsizlik standartlarini to'liq yoritadi.

---

## 1. Authentication (JWT - JSON Web Token)

- **Parol Shifrlash:** Foydalanuvchilar paroli ma'lumotlar bazasida saqlanishidan avval **`bcryptjs`** yordamida `saltRound = 10` bilan bir tomonlama xeshlanadi (hashing). Parollar hech qachon ochiq matn (plain text) ko'rinishida saqlanmaydi.
- **Token Generatsiyasi:** Muvaffaqiyatli login qilinganda server foydalanuvchining `id`, `email`, `role`, `specialty_id` va `group_id` ma'lumotlarini o'z ichiga olgan JWT tokenini yaratadi (`jwt.sign()`).
- **Token Amal Qilish Muddati:** 24 soat (`expiresIn: '24h'`).
- **Header Standarti:** Har bir himoyalangan API so'rovida token `Authorization: Bearer <token>` sarlavhasi (Header) orqali yuboriladi.

---

## 2. Middleware va Role-Based Access Control (RBAC)

Backend routing qavatida uchta asosiy xavfsizlik middleware modulidan foydalaniladi:

### A. `authMiddleware`
1. So'rov sarlavhasidan `Authorization: Bearer <token>` qiymatini ajratib oladi.
2. Token bo'lmasa yoki yaroqsiz/muddati o'tgan bo'lsa, `401 Unauthorized` status kodi va tegishli JSON xatosini qaytaradi.
3. Token muvaffaqiyatli dekodlansa, foydalanuvchi ma'lumotlarini `req.user` obyektiga biriktiradi.

### B. `roleMiddleware(allowedRoles)`
1. `req.user.role` qiymati berilgan ruxsat etilgan rollar ro'yxatida borligini tekshiradi (masalan: `['admin']` yoki `['teacher', 'admin']`).
2. Agar foydalanuvchining roli mos kelmasa, `403 Forbidden` status kodi bilan kirishni rad etadi.

### C. `ownerOrAdminMiddleware`
- Talaba faqat o'ziga tegishli dialog sessiyalari, test natijalari va profil ma'lumotlarini ko'ra olishini ta'minlaydi. Admin esa barcha resurslarga ruxsatga ega.

---

## 3. Maxfiy Kalitlar va Environment Variables

Tizimdagi barcha maxfiy parametrlar va API kalitlari backend ildizidagi `.env` faylida saqlanadi va `.gitignore` orqali git omboriga tushishining oldi olingan:

```env
# Server Port & Muhit
PORT=5000
NODE_ENV=production

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=vpe_user
DB_PASS=Secure_Password_2026!
DB_NAME=virtual_patient_db

# Security & Secrets
JWT_SECRET=vpe_super_secret_jwt_key_2026_change_in_prod

# External AI APIs
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
```

---

## 4. Kiberxavfsizlik va Himoya Chorasi (Security Measures)

### A. CORS (Cross-Origin Resource Sharing) Protection
Express serverida `cors()` middleware faqat tasdiqlangan domenlar (masalan: `http://localhost:5173` va production frontend domeni) so'rovlarini qabul qiladi. Unrestricted (`*`) CORS sozlamasi taqiqlangan.

### B. Rate Limiting (Brute-Force Himoyasi)
API endpointlariga (xususan `/api/auth/login` va `/api/auth/register`) tezkor ketma-ket so'rovlar hujumini (Brute-Force) qaytarish uchun `express-rate-limit` ishlatiladi:
- **Login Rate Limit:** 15 daqiqada bitta IP dan maksimal 10 marta login urinishi.
- **Global Rate Limit:** 1 daqiqada bitta IP dan maksimal 100 marta API so'rovi.

### C. SQL Injection va XSS Himoyasi
- **SQL Injection:** Sequelize ORM barcha parametri so'rovlarni (Prepared Statements / Parameterized Queries) ishlatadi. Bu SQL injection xatarlarini to'liqlicha yo'qotadi.
- **XSS (Cross-Site Scripting):** React UI avtomatik ravishda barcha dinamik matnlarni HTML entity larga o'girib sanitize qiladi.

### D. Helmet HTTP Headers Security
Express serverida `helmet()` kutubxonasi yoqilgan bo'lib, quyidagi xavfsizlik sarlavhalarini o'rnatadi:
- `X-DNS-Prefetch-Control`
- `X-Frame-Options: DENY` (Clickjacking himoyasi)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
