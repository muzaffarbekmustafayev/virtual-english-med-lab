# Virtual Patient English — O'rnatish va Production Deployment Qo'llanmasi

Ushbu hujjat **Virtual Patient English** loyihasini mahalliy (local) kompyuterda ishga tushirish, ma'lumotlar bazasini sozlash hamda ishlab chiqarish (production) VPS serveriga joylashtirish bo'yicha to'liq qo'llanmadir.

---

## 1. Tizim Talablari (System Requirements)

- **Node.js:** v18.0.0 yoki v20.x / v22.x LTS
- **npm:** v9.0.0+
- **MySQL Database:** v8.0+
- **Process Manager:** PM2 (Production uchun)
- **Web Server:** Nginx (Reverse Proxy & Static Hosting uchun)
- **SSL Certificate:** Let's Encrypt / Certbot

---

## 2. Mahalliy Ishga Tushirish Bosqichlari (Local Development Setup)

### 1-qadam: Omborini klonlash
```bash
git clone https://github.com/muzaffarbekmustafayev/virtual-english-med-lab.git
cd virtual-english-med-lab
```

### 2-qadam: Backend Sozlamalari va Baza
```bash
cd backend
npm install
```

`backend/.env` faylini yaratish:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=virtual_patient_db
JWT_SECRET=vpe_local_secret_2026
GEMINI_API_KEY=AIzaSy...
```

Ma'lumotlar bazasini yaratish va urug'lantirish (seed):
```bash
node create-db.js
npm run seed
```

Backend dev serverini ishga tushirish:
```bash
npm run dev
```
*(Backend API `http://localhost:5000` da ishga tushadi)*

### 3-qadam: Frontend Sozlamalari
```bash
cd ../frontend
npm install
npm run dev
```
*(Frontend `http://localhost:5173` da ishga tushadi)*

---

## 3. Production Deployment (VPS Linux / Ubuntu 22.04 LTS)

### A. Nginx Reverse Proxy Sozlamasi (`/etc/nginx/sites-available/vpe.conf`)

```nginx
server {
    listen 80;
    server_name vpe.uz www.vpe.uz;

    # Frontend Static Build Files
    root /var/www/virtual-english-med-lab/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads (Audio & Files)
    location /uploads/ {
        alias /var/www/virtual-english-med-lab/backend/uploads/;
    }
}
```

### B. PM2 Process Manager bilan Backendni Ishga Tushirish
```bash
cd /var/www/virtual-english-med-lab/backend
npm install --production
pm2 start server.js --name "vpe-backend"
pm2 save
pm2 startup
```

### C. SSL Sertifikati (Certbot / HTTPS)
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d vpe.uz -d www.vpe.uz
```

---

## 4. Ma'lumotlar Bazasini Zaxiralash (Database Backup)

Avtomatik kunlik backup olish uchun cron-job skripti (`/etc/cron.daily/mysql-backup`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vpe_db"
mkdir -p $BACKUP_DIR
mysqldump -u root -p'YourPassword' virtual_patient_db | gzip > "$BACKUP_DIR/vpe_db_$(date +%Y%m%d).sql.gz"
find $BACKUP_DIR -type f -mtime +7 -delete
```
