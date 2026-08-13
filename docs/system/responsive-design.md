# Dizaynni To'liq Responsive Qilish (Qo'llanma)

Bu hujjat "Virtual English Med Lab" loyihasidagi frontend (React + Tailwind CSS) qismini barcha qurilmalar (mobil telefon, planshet, kompyuter) uchun to'liq moslashuvchan (responsive) qilish bo'yicha asosiy qoidalarni o'z ichiga oladi.

## 1. Asosiy Qoidalar (Mobile-First yondashuvi)
Loyihada Tailwind CSS ishlatilganligi sababli, **"mobile-first" (avval mobil)** yondashuviga amal qilinadi. Bu shuni anglatadiki, yozilgan har qanday klass (masalan: `text-sm`, `p-4`) birinchi navbatda eng kichik ekranlar (telefonlar) uchun amal qiladi. 
Kattaroq ekranlar uchun esa Maxsus "Breakpoint"lar ishlatiladi:
- `sm:` (640px dan katta) - Katta telefonlar yoki kichik planshetlar uchun
- `md:` (768px dan katta) - Planshetlar uchun (iPad)
- `lg:` (1024px dan katta) - Noutbuklar uchun
- `xl:` (1280px dan katta) - Katta monitorlar uchun

**Misol:**
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Telefonlarda 1 ustun, planshetlarda 2 ustun, kompyuterda 4 ustun -->
</div>
```

## 2. Layout (Asosiy qolip) va Sidebar
Loyihada sahifalar asosan ikkiga bo'lingan: Chap tomonda `Sidebar`, o'ng tomonda asosiy tarkib (`main`).

- **Mobil qurilmalarda:** Sidebar ekrandan tashqarida yashirinib turishi (yoki pastki "Bottom Navigation"ga aylanishi) kerak. 
- Menyu tugmasi (Hamburger icon) orqali yon tomondan chiqib keladigan (Off-canvas) Sidebar qilingan.
- **Katta ekranlarda:** Sidebar doimiy ravishda chap tomonda ochiq turadi va asosiy tarkib uning yonidan boshlanadi.

```html
<!-- Layout.jsx misoli -->
<div className="flex h-screen overflow-hidden">
  <Sidebar className="hidden md:flex" /> <!-- Telefonlarda yashiringan -->
  
  <main className="flex-1 overflow-y-auto w-full md:w-[calc(100%-250px)]">
    <!-- Asosiy tarkib -->
  </main>
</div>
```

## 3. Matnlar va Shriftlar
Katta ekranlarda o'qilishi oson bo'lgan katta shriftlar mobil telefonda ekranni to'ldirib yuborishi mumkin. Shuning uchun:
- Sarlavhalar (`h1`, `h2`) uchun o'zgaruvchan o'lchamlar berilishi kerak.
- Masalan: `text-xl md:text-2xl lg:text-3xl`
- Elementlar orasidagi masofa ham mobil uchun qisqaroq bo'lishi lozim: `mb-4 md:mb-6`

## 4. Chat va Interaktiv Oynalar (Virtual Patient)
Chat qismi ekranga to'liq moslashishi kerak. Katta ekranlarda o'rtada chiroyli oyna bo'lib tursa, mobil qurilmalarda ekranning chekkalariga to'liq yopishib turishi (full-width) tavsiya etiladi.

- Chat oynasi balandligi: `min-h-[300px] md:min-h-[400px]`
- Paddinglar: `p-3 md:p-5`
- Tugmalar: Mobil telefonda barmoq bilan bosish oson bo'lishi uchun tugmalar balandligi kamida `44px` (Tailwind'da `h-11` yoki `py-3`) bo'lishi kerak. Kichkina ekranlarda tugmalar yonma-yon emas (`flex-col`), balki ustma-ust tushishi ham mumkin.

## 5. Bo'sh joylar (Padding va Margin)
Kichik ekranlarda bo'sh joylarni tejash zarur. Container'lar uchun umumiy qoida:
- Ekran chetlaridan qoldiriladigan joy: `px-4 md:px-8`

## 6. Grid va Flexbox
Jadvallar, modullar ro'yxati, yoki test javoblari qatorlarini moslashtirishda:
- Modullar ro'yxati: Mobil versiyada ustma-ust (`grid-cols-1`), planshetda ikkita ustun (`md:grid-cols-2`), katta ekranda ko'proq.
- O'ng va chapga joylashuvchi (flex) elementlar kichik ekranda ustma-ust turishi yoki o'ralib qolishi (`flex-wrap`) kerak.

## 7. Rasm va Ikonkalar
Ikonka o'lchamlari va joylashuvi:
- `text-2xl md:text-3xl`
- Katta rasm va video elementlar `w-full h-auto` kabi qoidalar bilan ekranga mos qilib siqilishi (responsive image) ta'minlanadi.

---
**Xulosa:** Loyihadagi har qanday yangi sahifa yoki komponent (masalan, Modul ichidagi test yoki grammatika tekshirgich) yozilganda, brauzerni kichraytirib tekshirib ko'rish, qayerdadir matn siqilib qolmasligi va knopkalar bosishga qulay ekanligiga e'tibor qaratish barcha dasturchilar uchun standart talab hisoblanadi.
