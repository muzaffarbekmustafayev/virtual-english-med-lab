# Antigravity Remote Terminal Bot

Bu loyiha kompyuteringiz terminalini masofadan turib Telegram orqali xavfsiz boshqarish imkonini beradi. Boshqa loyihalar uchun ham bemalol ishlatsangiz bo'ladi.

## 🛠 O'rnatish va Ishga tushirish

1. **Bot yaratish:**
   - Telegramda [@BotFather](https://t.me/BotFather) orqali yangi bot yarating va uning `BOT_TOKEN` ini oling.

2. **Admin Chat ID ni topish:**
   - O'zingizning Telegram ID raqamingizni bilish uchun [@userinfobot](https://t.me/userinfobot) ga yozing va ID ni oling.

3. **Sozlamalarni kiritish:**
   - Ushbu papkadagi `.env.example` faylini nusxalab `.env` nomli fayl yarating (yoki shunchaki nomini o'zgartiring).
   - Ichiga o'z ma'lumotlaringizni kiriting:
     ```env
     BOT_TOKEN=123456789:AAH...
     ADMIN_CHAT_ID=12345678
     DEFAULT_CWD=C:\Users\muzaf\Desktop\virtual-english-med-lab
     ```
   *(Izoh: `DEFAULT_CWD` o'zgaruvchisi orqali bot ishga tushganda qaysi papkadan boshlashini belgilab qo'yishingiz mumkin. Buni keyinchalik Telegram ichidan ham o'zgartirsa bo'ladi).*

4. **Kutubxonalarni o'rnatish:**
   Terminalda shu papkaga kirib quyidagi buyruqni bering:
   ```bash
   npm install
   ```

5. **Ishga tushirish:**
   ```bash
   npm start
   ```

## 🚀 Botdan foydalanish

- Botga xohlagan terminal buyrug'ingizni (masalan `dir`, `npm run dev`, `git status`) yozib yuboring.
- Bot sizdan ushbu buyruqni bajarishni so'rab inline tugmalar (✅ Accept / ❌ Reject) chiqaradi. Faqat siz tasdiqlaganingizdan so'nggina kompyuterda ishga tushadi.
- **Boshqa loyihalarda ishlash (Papkani o'zgartirish):**
  Bot orqali boshqa papkaga o'tish uchun botga `cd C:\path\to\another\folder` deb yozing. Bot ushbu papkaga o'tadi va keyingi barcha buyruqlar aynan o'sha papkada bajariladi. Hozirgi papkani ko'rish uchun `pwd` deb yozishingiz mumkin.
