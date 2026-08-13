# Virtual Patient English — Tizim Rollari va Vazifalari

## Rollar Haqida Umumiy Ma'lumot

Tizimda **3 ta rol** mavjud. Foydalanuvchining roli ma'lumotlar bazasida `role ENUM('student', 'teacher', 'admin')` maydoni orqali saqlanadi. Har bir rol o'z ruxsatnomalariga ega va interfeys ularning roliga qarab dinamik ravishda o'zgaradi (Role-based Routing).

---

## 1. TALABA (Student) — Asosiy Foydalanuvchi

### Kimlar?
Stomatologiya, pediatriya, davolash ishi va boshqa tibbiyot yo'nalishlaridagi talabalar. Platformaning **asosiy foydalanuvchisi**.

### Umumiy Vazifalari
Talaba tizimga kirgach, o'z mutaxassisligi bo'yicha 10 ta o'quv moduli orqali ingliz tilida klinik muloqot ko'nikmalarini rivojlantiradi.

### Batafsil Ruxsatnomalar va Imkoniyatlar

#### O'quv Jarayoni
| Imkoniyat | Tavsif |
|-----------|--------|
| **Vocabulary o'rganish** | Har bir modulda mavzuga oid tibbiy so'zlar, ularning tarjimasi, inglizcha ta'rifi, misol gap va talaffuz audiosi |
| **Smart Phrasebook ko'rish** | Dialogda ishlatilishi mumkin bo'lgan tayyor iboralar to'plami — suhbat davomida shpargalka sifatida ochish mumkin |
| **Virtual Patient (1-urinish)** | AI-bemor bilan matnli yoki ovozli shaklda 20 daqiqalik suhbat. Talaba shifokor, AI esa bemor rolini o'ynaydi |
| **AI Feedback olish** | Suhbat yakunida 5 ta mezon bo'yicha batafsil baho: Grammar, Vocabulary, Fluency, Pronunciation, Clinical |
| **Retry (Qayta urinish)** | Xatolarni inobatga olib, xuddi shu bemor bilan yangi suhbat boshlash |
| **Final Challenge** | Phrasebook va yordamchi material yo'q holda yangi, murakkabroq bemor ssenariysini yechish |
| **Quiz (Test)** | Modul yakunida 4 variantli 10 savoldan iborat test topshirish |

#### Qo'shimcha Imkoniyatlar
| Imkoniyat | Tavsif |
|-----------|--------|
| **Grammar Checker** | Istalgan inglizcha matnni tizim ichida grammatik va imlo jihatdan tekshirish (bepul) |
| **Forum** | Guruhlararo umumiy muloqot xonasida boshqa talabalar va o'qituvchilar bilan savol-javob |
| **Shaxsiy Profil** | O'zlashtirish darajasi, olingan ballar statistikasi va haftalik o'sish grafikini ko'rish |

### Talabaga Yopiq Imkoniyatlar
- ❌ Boshqa talabalarning ma'lumotlari va natijalari
- ❌ Kontent yaratish yoki tahrirlash (modullar, so'zlar, testlar)
- ❌ Guruhlar va foydalanuvchilarni boshqarish
- ❌ Tizim sozlamalari

---

## 2. O'QITUVCHI (Teacher) — Nazoratchi va Mentor

### Kimlar?
Talabalar guruhlariga biriktirilgan o'qituvchilar yoki kuratorlar. Ular o'z guruhlaridagi talabalarning o'quv jarayonini kuzatadilar va monitoring qiladilar.

### Umumiy Vazifalari
O'qituvchi tizimda **kontent yaratmaydi**, lekin **o'z guruhidagi** talabalarning barcha natijalarini ko'radi, tahlil qiladi va zarur bo'lsa hisobot oladi.

### Batafsil Ruxsatnomalar va Imkoniyatlar

#### Guruh Monitoring
| Imkoniyat | Tavsif |
|-----------|--------|
| **Guruhlar ro'yxati** | O'ziga biriktirilgan barcha akademik guruhlar ro'yxatini ko'rish |
| **Talabalar jadvali** | Har bir guruh ichidagi talabalar ro'yxati: ism, oxirgi faollik, joriy modul, o'rtacha ball |
| **Talaba kartochkasi** | Tanlangan talabaning barcha modullar bo'yicha natijalari — urinishlar soni, test ballari, o'rtacha baho |

#### Natijalar Tahlili
| Imkoniyat | Tavsif |
|-----------|--------|
| **AI Feedback natijalari** | Har bir talabaning Grammar, Vocabulary, Fluency, Pronunciation, Clinical ballarini ko'rish |
| **Suhbat tarixi (Transcript)** | Talaba va AI-bemor o'rtasidagi dialog xabarlarini to'liq o'qish |
| **Audio tinglash** | Talabaning ovozli yozuvlarini audio player orqali tinglash |
| **Reyting tahlili** | Guruhda eng yuqori va eng past ko'rsatkichli talabalarni aniqlash |

#### Hisobot va Eksport
| Imkoniyat | Tavsif |
|-----------|--------|
| **Excel eksport** | Guruh o'zlashtirish jadvalini `.xlsx` formatida yuklab olish |
| **PDF hisobot** | Guruh natijalarini rasmiy hisobot sifatida PDF formatida generatsiya qilish |
| **Filtrlash** | Guruh, modul va vaqt oralig'i bo'yicha natijalarni saralash |

#### Forum
| Imkoniyat | Tavsif |
|-----------|--------|
| **Forum moderatsiyasi** | Talabalar savollariga javob berish va akademik muhokamalarni boshqarish |
| **Xabar yuborish** | Forumga yangi mavzu yoki javob yozish |

### O'qituvchiga Yopiq Imkoniyatlar
- ❌ Boshqa o'qituvchining guruhlarini ko'rish
- ❌ Kontent yaratish yoki tahrirlash (modullar, so'zlar, testlar)
- ❌ Yangi foydalanuvchi qo'shish yoki o'chirish
- ❌ Tizim sozlamalari va API konfiguratsiyasi

---

## 3. ADMINISTRATOR (Admin) — Tizim To'liq Boshqaruvchisi

### Kimlar?
Platformani texnik va mazmuniy jihatdan boshqaradigan super-foydalanuvchi. Odatda loyiha rahbari yoki tizim administratori.

### Umumiy Vazifalari
Admin tizimning barcha qismlarini nazorat qiladi: foydalanuvchilar, guruhlar, kontent (modullar, lug'at, testlar, iboralar), AI ssenariylar va tizim sozlamalari.

### Batafsil Ruxsatnomalar va Imkoniyatlar

#### Foydalanuvchilarni Boshqarish (CRUD)
| Imkoniyat | Tavsif |
|-----------|--------|
| **Foydalanuvchilar ro'yxati** | Barcha talabalar, o'qituvchilar va adminlar jadvalini ko'rish (filtr: rol, guruh, yo'nalish) |
| **Yangi foydalanuvchi** | Modal oyna orqali yangi talaba / o'qituvchi / admin yaratish |
| **Tahrirlash** | Mavjud foydalanuvchi ma'lumotlarini (ism, email, guruh, mutaxassislik) o'zgartirish |
| **O'chirish** | Foydalanuvchini tizimdan olib tashlash |
| **Bulk Upload** | Excel fayl orqali bir vaqtda ko'plab talabalarni tizimga yuklash |

#### Guruh va Mutaxassisliklar Boshqaruvi
| Imkoniyat | Tavsif |
|-----------|--------|
| **Guruhlar CRUD** | Yangi akademik guruh yaratish (masalan: 401-Stomatologiya), tahrirlash, o'chirish |
| **Mutaxassisliklar** | Yangi yo'nalish (stomatologiya, pediatriya, davolash ishi va h.k.) qo'shish |
| **O'qituvchi-guruh biriktirish** | O'qituvchiga bir yoki bir nechta guruhni biriktirish |

#### Kontent Boshqaruvi (Content Manager)
| Imkoniyat | Tavsif |
|-----------|--------|
| **Module Scenarios** | 10 ta modul uchun AI-bemor ssenariyini (Patient Context) va Final Challenge ssenariyini vizual tahrirlash. GPT modelining xulq-atvorini belgilovchi system prompt ni sozlash |
| **Vocabulary (Lug'at)** | Yangi tibbiy so'z qo'shish: so'z, tarjima, ta'rif, misol gap, MP3 audio talaffuz fayli. Mavjud so'zlarni tahrirlash va o'chirish |
| **Smart Phrasebook** | Dialogda ishlatiluvchi tayyor iboralarni qo'shish, kategoriyalash (masalan: "Asking about pain", "Explaining treatment") va step tartibini belgilash |
| **Module Quizzes** | Har bir modul uchun 4 variantli test savollarini (A, B, C, D) va to'g'ri javob kalitini kiritish, tahrirlash |

#### Tizim Monitoringi va Sozlamalar
| Imkoniyat | Tavsif |
|-----------|--------|
| **System Overview** | Jami foydalanuvchilar, modullar, faol sessiyalar soni ko'rsatkichi |
| **OpenAI API monitoring** | GPT va Whisper API xarajatlarini (dollarda) so'rovlar kesimida kuzatish |
| **API kalitlari** | OpenAI API kalit va model parametrlarini sozlash |
| **Server loglari** | Ma'lumotlar bazasi holati va tizim loglari |
| **Hujjatlar yuklash** | Tizim uchun uslubiy qo'llanmalar va rasmiy hujjatlarni yuklash va boshqarish |

### Admin Barcha Imkoniyatlarga Ega
Admin rolida **hech qanday cheklov yo'q** — u tizimning har qanday bo'limiga kirish va boshqarish huquqiga ega.

---

## Rollar Taqqoslama Jadvali

| Imkoniyat | Student | Teacher | Admin |
|-----------|:-------:|:-------:|:-----:|
| O'quv modullarini o'tash | ✅ | ❌ | ❌ |
| AI-bemor bilan suhbat | ✅ | ❌ | ❌ |
| AI Feedback olish | ✅ | ko'rish ✅ | ko'rish ✅ |
| Grammar Checker | ✅ | ❌ | ❌ |
| Forum (talaba) | ✅ | ✅ | ✅ |
| Forum moderatsiya | ❌ | ✅ | ✅ |
| O'z guruhini kuzatish | ❌ | ✅ | ✅ |
| Excel/PDF eksport | ❌ | ✅ | ✅ |
| Foydalanuvchilarni boshqarish | ❌ | ❌ | ✅ |
| Guruhlarni boshqarish | ❌ | ❌ | ✅ |
| Kontent yaratish/tahrirlash | ❌ | ❌ | ✅ |
| Tizim sozlamalari | ❌ | ❌ | ✅ |
| API monitoring | ❌ | ❌ | ✅ |
