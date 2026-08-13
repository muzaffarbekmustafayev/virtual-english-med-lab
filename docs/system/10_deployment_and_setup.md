# Virtual Patient English — O'rnatish va Joylashtirish Qo'llanmasi

Ushbu hujjat **Virtual Patient English** loyihasini mahalliy (local) kompyuterda ishga tushirish, ma'lumotlar bazasini yaratish hamda ishlab chiqarish (production) serveriga joylashtirish bo'yicha to'liq qo'llanmadir.

---

## 1. Tizim Talablari (Prerequisites)

- **Node.js:** v18.0.0 yoki undan yuqori
- **npm:** v9.0.0 yoki undan yuqori
- **MySQL Database:** v8.0 yoki undan yuqori
- **Google Gemini API Key:** (Google AI Studio platformasidan olingan kalit)

---

## 2. Mahalliy Ishga Tushirish Bosqichlari (Local Setup)

### 1-qadam: Omborini klonlash
```bash
git clone https://github.com/muzaffarbekmustafayev/virtual-english-med-lab.git
cd virtual-english-med-lab
```

### 2-qadam: Backend Sozlamalari
```bash
cd backend
npm install
```
Backend katalogida `.env` faylini yaratib, quyidagi o'zgaruvchilarni kiriting:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=virtual_med_lab
JWT_SECRET=your_custom_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Ma'lumotlar bazasini yaratish va seederlarni ishga tushirish:
```bash
node create-db.js
npm run seed  # agar seeder skripti mavjud bo'lsa
```

Backend serverini ishga tushirish:
```bash
npm run dev
```
*(Backend server `http://localhost:5000` manzilida ishlaydi)*

### 3-qadam: Frontend Sozlamalari
```bash
cd ../frontend
npm install
```
Frontendni ishga tushirish:
```bash
npm run dev
```
*(Frontend `http://localhost:5173` manzilida ochiladi)*

---

## 3. Serverga Joylashtirish (Production Deployment)

### Backend Deployment (Node.js VPS / Ubuntu)
1. PM2 Process Manager orqali serverni fonda ishga tushirish:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "virtual-med-lab-backend"
   pm2 save
   ```
2. Nginx Reverse Proxy sozlamasi:
   `http://api.virtualmedlab.uz` so'rovlarini `localhost:5000` portiga yo'naltirish.

### Frontend Deployment (Vite Production Build)
1. Production bundle yaratish:
   ```bash
   npm run build
   ```
2. Paydo bo'lgan `dist/` papkasini Nginx yoki Vercel/Netlify hostingga yuklash.
3. Nginx SPA rewrites (`try_files $uri $uri/ /index.html;`) sozlamasini kiritish.
