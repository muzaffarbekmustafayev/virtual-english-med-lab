// Vaqtinchalik/sozlanadigan xususiyatlar (feature flags)
//
// UNLOCK_ALL_MODULES — true bo'lsa modullar ketma-ketligi (avvalgi modulni 60% ga o'tish sharti)
// tekshirilmaydi: talaba istalgan modulni ochishi mumkin. TEST uchun yoqilgan.
// Qayta yoqish (60% shartini tiklash): .env ga UNLOCK_ALL_MODULES=false yozing yoki pastdagi default'ni false qiling.
const UNLOCK_ALL_MODULES = process.env.UNLOCK_ALL_MODULES
  ? process.env.UNLOCK_ALL_MODULES === 'true'
  : true;

const PASS_THRESHOLD = 60; // modul "o'tilgan" hisoblanadigan minimal ball (%)

module.exports = { UNLOCK_ALL_MODULES, PASS_THRESHOLD };
