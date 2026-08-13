# Virtual Patient English — Xavfsizlik va Autentifikatsiya

Ushbu hujjat **Virtual Patient English** tizimidagi xavfsizlik arxitekturasi, foydalanuvchilar autentifikatsiyasi (JWT), authorization (Role Guard), parollarni shifrlash (bcrypt) va API kalitlari muhofazasi tamoyillarini bayon etadi.

---

## 1. Authentication (JWT - JSON Web Token)

- **Parol Shifrlash:** Foydalanuvchilar paroli bazada saqlanishidan avval **`bcryptjs`** yordamida `saltRound = 10` bilan shifrlanadi.
- **Token Generatsiyasi:** Muvaffaqiyatli login qilinganda server foydalanuvchining `id`, `email`, va `role` ma'lumotlarini o'z ichiga olgan JWT tokenini yaratadi.
- **Token Amal Qilish Muddati:** 24 soat (`expiresIn: '24h'`).
- **Header:** Har bir rezervatsiyalangan so'rovda `Authorization: Bearer <token>` ko'rinishida yuboriladi.

---

## 2. Middleware va Role-Based Authorization

Backend routing qavatida ikkita asosiy middleware ishlatiladi:

1. **`authMiddleware`:**
   - So'rov headeridan tokenni ajratib oladi va `jwt.verify()` orqali tekshiradi.
   - Noto'g mezonlarda `401 Unauthorized` qaytaradi.
   - Muvaffaqiyatli tekshirilsa, `req.user` obyektini shakllantiradi.

2. **`roleMiddleware(rolesArray)`:**
   - `req.user.role` ro'yxatda borligini tekshiradi (masalan: `['admin']` yoki `['teacher', 'admin']`).
   - Aks holda `403 Forbidden` rad xabarini beradi.

---

## 3. Maxfiy Kalitlar va Environment Variables

Tizimdagi barcha maxfiy parametrlar backend ildizidagi `.env` faylida saqlanadi va `.gitignore` orqali git omboriga tushishining oldi olingan:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=virtual_med_lab
JWT_SECRET=super_secret_jwt_key_2026
GEMINI_API_KEY=AIzaSy...
```

---

## 4. Input Validation va CORS Protection

- **CORS (Cross-Origin Resource Sharing):** Express `cors()` middleware faqat belgilangan origin (masalan `http://localhost:5173`) dan kelgan so'rovlarni qabul qiladi.
- **SQL Injection Himoyasi:** Sequelize ORM parametrli so'rovlar (Prepared Statements) ishlatgani sababli SQL injection xavfi bartaraf etilgan.
- **XSS (Cross-Site Scripting):** Frontend React komponentlari avtomatik ravishda foydalanuvchi kiritgan matnlarni sanitize qiladi.
