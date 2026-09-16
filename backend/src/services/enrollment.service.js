const { Specialty, StudentGroup } = require('../models');

/**
 * Talabaning yo'nalish (specialty) va guruh (group) bog'lanishini bitta joyda tekshiradi.
 *
 * Qoidalar:
 *  - guruh tanlangan bo'lsa, yo'nalish avtomatik guruhning yo'nalishi bo'ladi
 *    (guruh va yo'nalish bir-biriga zid bo'lishi mumkin emas)
 *  - yo'nalish o'zgarsa va eski guruh boshqa yo'nalishga tegishli bo'lsa — guruh tozalanadi
 *  - talaba o'zi (self-service) guruhni faqat guruhsiz bo'lganda tanlay oladi; guruhdan guruhga
 *    o'tkazishni admin qiladi (o'qituvchi statistikasi buzilmasligi uchun)
 *
 * @param {{ specialty_id?: any, group_id?: any }} input  so'rovdan kelgan qiymatlar (undefined = o'zgartirilmaydi)
 * @param {{ specialty_id: number|null, group_id: number|null }} current  talabaning hozirgi holati
 * @param {{ actor: 'student'|'admin' }} opts
 * @returns {Promise<{ ok: true, updates: object, specialtyChanged: boolean, groupChanged: boolean } | { ok: false, error: string }>}
 */
async function resolveEnrollment(input, current, { actor = 'student' } = {}) {
  const toId = (v) => (v === undefined ? undefined : (v === null || v === '' ? null : parseInt(v, 10)));
  let specialtyId = toId(input.specialty_id);
  let groupId = toId(input.group_id);
  if (specialtyId !== undefined && specialtyId !== null && Number.isNaN(specialtyId)) return { ok: false, error: "Yo'nalish noto'g'ri" };
  if (groupId !== undefined && groupId !== null && Number.isNaN(groupId)) return { ok: false, error: "Guruh noto'g'ri" };

  // o'zgartirilmagan maydonlar hozirgi qiymatida qoladi
  const nextSpecialty = specialtyId === undefined ? (current.specialty_id ?? null) : specialtyId;
  let nextGroup = groupId === undefined ? (current.group_id ?? null) : groupId;

  let group = null;
  if (nextGroup !== null) {
    group = await StudentGroup.findByPk(nextGroup, { attributes: ['id', 'name', 'specialty_id'] });
    if (!group) return { ok: false, error: 'Guruh topilmadi' };
  }

  let finalSpecialty = nextSpecialty;
  if (group) {
    if (specialtyId !== undefined && specialtyId !== null && group.specialty_id && group.specialty_id !== specialtyId) {
      // yo'nalish aniq berilgan va guruhga zid
      if (groupId !== undefined) return { ok: false, error: "Tanlangan guruh boshqa yo'nalishga tegishli" };
      // faqat yo'nalish o'zgartirilgan — eski guruh mos kelmaydi, tozalanadi
      nextGroup = null;
      group = null;
    } else if (group.specialty_id) {
      finalSpecialty = group.specialty_id; // guruh yo'nalishni belgilaydi
    }
  }

  if (finalSpecialty !== null) {
    const spec = await Specialty.findByPk(finalSpecialty, { attributes: ['id'] });
    if (!spec) return { ok: false, error: "Yo'nalish topilmadi" };
  }

  const specialtyChanged = (current.specialty_id ?? null) !== finalSpecialty;
  const groupChanged = (current.group_id ?? null) !== nextGroup;

  if (actor === 'student' && groupChanged && nextGroup !== null && current.group_id && !specialtyChanged) {
    return { ok: false, error: "Guruhni o'zgartirish uchun administratorga murojaat qiling" };
  }

  return { ok: true, updates: { specialty_id: finalSpecialty, group_id: nextGroup }, specialtyChanged, groupChanged };
}

module.exports = { resolveEnrollment };
