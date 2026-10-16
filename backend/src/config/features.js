// Vaqtinchalik/sozlanadigan xususiyatlar (feature flags)
//
// UNLOCK_ALL_MODULES — true bo'lsa modullar ketma-ketligi (avvalgi modulni 60% ga o'tish sharti)
// tekshirilmaydi. Odatiy holatda false: talaba faqat avvalgi moduldan kamida 60% olsa keyingisiga o'tadi.
const UNLOCK_ALL_MODULES = process.env.UNLOCK_ALL_MODULES === 'true';

const PASS_THRESHOLD = 60; // modul "o'tilgan" hisoblanadigan minimal ball: 60%

module.exports = { UNLOCK_ALL_MODULES, PASS_THRESHOLD };
