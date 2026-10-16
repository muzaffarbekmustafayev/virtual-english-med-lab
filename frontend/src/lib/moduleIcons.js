import {
  RiToothLine,
  RiHeartPulseLine,
  RiLungsLine,
  RiBrainLine,
  RiSyringeLine,
  RiVirusLine,
  RiThermometerLine,
  RiCapsuleLine,
  RiFirstAidKitLine,
  RiMicroscopeLine,
  RiHospitalLine,
  RiHandHeartLine,
  RiShieldCrossLine,
  RiStethoscopeLine,
} from 'react-icons/ri';

/**
 * Modul mavzusi va yo'nalishiga qarab eng mos tibbiy icon va rangni qaytaradi.
 *
 * Mavzular:
 * - Stomatologiya / Tish / Milk / Karies: RiToothLine (Cyan/Teal)
 * - Ko'krak qafasi / Yurak / Koronar sindrom: RiHeartPulseLine (Rose/Red)
 * - Nafas / Astma / O'pka / Yo'tal / Kislorod: RiLungsLine (Sky/Blue)
 * - Insult / Miya / Tutqanoq / Nevrologiya: RiBrainLine (Violet/Purple)
 * - Diabet / Qand / Insulin / Emlash: RiSyringeLine (Emerald/Green)
 * - Infeksiya / Sepsis / Toshma / Virus: RiVirusLine (Amber/Yellow)
 * - Isitma / Tana harorati / Hayotiy ko'rsatkichlar: RiThermometerLine (Orange)
 * - Dori / Farmakologiya / Zaharlanish: RiCapsuleLine (Indigo)
 * - Chaqaloq / Yangi tug'ilgan / Pediatriya: RiHandHeartLine (Pink)
 * - Buyrak / Siydik yo'li / Anemiya / Qon / Laboratoriya: RiMicroscopeLine (Teal)
 * - Yara / Bog'lov / Bosim yaralari / Gigiyena: RiShieldCrossLine (Lime/Emerald)
 * - Shoshilinch / Travma / Shok / Kuyish / Qorin og'rig'i: RiFirstAidKitLine (Red/Rose)
 * - Qabul / Bo'lim / Kasalxona / Chiqarish: RiHospitalLine (Blue)
 * - Umumiy konsultatsiya / Standart tibbiy ko'rik: RiStethoscopeLine (Blue)
 */
export function getModuleVisual(module, specialtyCode) {
  const text = (
    (module?.title || '') + ' ' +
    (module?.title_en || '') + ' ' +
    (module?.title_uz || '') + ' ' +
    (module?.title_ru || '') + ' ' +
    (module?.description || '') + ' ' +
    (module?.description_en || '')
  ).toLowerCase();

  const spec = String(specialtyCode || module?.specialty?.code || module?.specialty_code || '').toUpperCase();

  // 1. Dental / Stomatologiya
  if (
    spec.includes('STOM') ||
    spec.includes('DENT') ||
    text.includes('dental') ||
    text.includes('tooth') ||
    text.includes('teeth') ||
    text.includes('tish') ||
    text.includes('зуб') ||
    text.includes('caries') ||
    text.includes('кариес') ||
    text.includes('pulpitis') ||
    text.includes('пульпит') ||
    text.includes('gum') ||
    text.includes('milk') ||
    text.includes('десн') ||
    text.includes('extraction') ||
    text.includes('prosthetic') ||
    text.includes('abscess')
  ) {
    return {
      icon: RiToothLine,
      bg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80 shadow-cyan-500/10',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      accent: 'cyan',
    };
  }

  // 2. Yurak / Ko'krak qafasi / Koronar sindrom / EKG
  if (
    text.includes('chest pain') ||
    text.includes('coronary') ||
    text.includes('heart') ||
    text.includes('cardiac') ||
    text.includes("ko'krak") ||
    text.includes('yurak') ||
    text.includes('серд') ||
    text.includes('груд')
  ) {
    return {
      icon: RiHeartPulseLine,
      bg: 'bg-rose-50 text-rose-600 border-rose-200/80 shadow-rose-500/10',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      accent: 'rose',
    };
  }

  // 3. Nafas yo'llari / Bronxial astma / O'pka / Kislorod / Yo'tal / Pnevmoniya
  if (
    text.includes('asthma') ||
    text.includes('lung') ||
    text.includes('respiratory') ||
    text.includes('oxygen') ||
    text.includes('cough') ||
    text.includes('breathing') ||
    text.includes('wheezing') ||
    text.includes('pneumonia') ||
    text.includes('nafas') ||
    text.includes("yo'tal") ||
    text.includes('bronx') ||
    text.includes('астм') ||
    text.includes('дыхан')
  ) {
    return {
      icon: RiLungsLine,
      bg: 'bg-sky-50 text-sky-600 border-sky-200/80 shadow-sky-500/10',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      accent: 'sky',
    };
  }

  // 4. Insult / Miya / Tutqanoq / Epilepsiya / Nevrologiya
  if (
    text.includes('stroke') ||
    text.includes('brain') ||
    text.includes('seizure') ||
    text.includes('epilep') ||
    text.includes('neurolog') ||
    text.includes('insult') ||
    text.includes('инсульт') ||
    text.includes('tutqanoq') ||
    text.includes('sudorog') ||
    text.includes('bosh miya')
  ) {
    return {
      icon: RiBrainLine,
      bg: 'bg-violet-50 text-violet-600 border-violet-200/80 shadow-violet-500/10',
      badge: 'bg-violet-50 text-violet-700 border-violet-200',
      accent: 'violet',
    };
  }

  // 5. Diabet / Giperglikemiya / Insulin / Emlash (Vaksina)
  if (
    text.includes('diabet') ||
    text.includes('диабет') ||
    text.includes('insulin') ||
    text.includes('инсулин') ||
    text.includes('hyperglyc') ||
    text.includes('dka') ||
    text.includes('vaccin') ||
    text.includes('emlash') ||
    text.includes('вакцин')
  ) {
    return {
      icon: RiSyringeLine,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80 shadow-emerald-500/10',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accent: 'emerald',
    };
  }

  // 6. Infeksiya / Sepsis / Virus / Toshmalar
  if (
    text.includes('infection') ||
    text.includes('инфекц') ||
    text.includes('infeksiya') ||
    text.includes('sepsis') ||
    text.includes('сепсис') ||
    text.includes('rash') ||
    text.includes('toshma') ||
    text.includes('сыпь')
  ) {
    return {
      icon: RiVirusLine,
      bg: 'bg-amber-50 text-amber-600 border-amber-200/80 shadow-amber-500/10',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      accent: 'amber',
    };
  }

  // 7. Isitma / Tana harorati / Hayotiy ko'rsatkichlar (Vital signs)
  if (
    text.includes('fever') ||
    text.includes('лихорад') ||
    text.includes('isitma') ||
    text.includes('vital signs') ||
    text.includes('hayotiy') ||
    text.includes('показател')
  ) {
    return {
      icon: RiThermometerLine,
      bg: 'bg-orange-50 text-orange-600 border-orange-200/80 shadow-orange-500/10',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      accent: 'orange',
    };
  }

  // 8. Dori vositalari / Zaharlanish / Overdose / Farmakologiya
  if (
    text.includes('medication') ||
    text.includes('лекарств') ||
    text.includes('dori') ||
    text.includes('overdose') ||
    text.includes('intoxication') ||
    text.includes('poison') ||
    text.includes('отравлен') ||
    text.includes('zaharlanish')
  ) {
    return {
      icon: RiCapsuleLine,
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-indigo-500/10',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accent: 'indigo',
    };
  }

  // 9. Chaqaloq / Yangi tug'ilgan / Bolalar parvarishi
  if (
    text.includes('newborn') ||
    text.includes('новорожд') ||
    text.includes('chaqaloq') ||
    text.includes('child growth') ||
    text.includes('pediatr') ||
    text.includes('бола')
  ) {
    return {
      icon: RiHandHeartLine,
      bg: 'bg-pink-50 text-pink-600 border-pink-200/80 shadow-pink-500/10',
      badge: 'bg-pink-50 text-pink-700 border-pink-200',
      accent: 'pink',
    };
  }

  // 10. Buyrak / Siydik yo'li / Qon / Anemiya / Piyelonefrit
  if (
    text.includes('urinary') ||
    text.includes('kidney') ||
    text.includes('почк') ||
    text.includes('мочевывод') ||
    text.includes('buyrak') ||
    text.includes('siydik') ||
    text.includes('pyelonephritis') ||
    text.includes('пиелонефрит') ||
    text.includes('anemia') ||
    text.includes('анемия') ||
    text.includes('bleeding') ||
    text.includes('кровотечен') ||
    text.includes('qon ketish')
  ) {
    return {
      icon: RiMicroscopeLine,
      bg: 'bg-teal-50 text-teal-600 border-teal-200/80 shadow-teal-500/10',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      accent: 'teal',
    };
  }

  // 11. Yara / Bog'lov / Bosim yaralari / Infeksiya oldini olish
  if (
    text.includes('wound') ||
    text.includes('рана') ||
    text.includes('yara') ||
    text.includes('pressure injury') ||
    text.includes('пролежн') ||
    text.includes('hygiene') ||
    text.includes('гигиен') ||
    text.includes('gigiyena')
  ) {
    return {
      icon: RiShieldCrossLine,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80 shadow-emerald-500/10',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accent: 'emerald',
    };
  }

  // 12. Shoshilinch / Travma / Kuyish / Shok / Qorin og'rig'i (Acute abdomen)
  if (
    text.includes('burn') ||
    text.includes('ожог') ||
    text.includes('kuyish') ||
    text.includes('trauma') ||
    text.includes('травма') ||
    text.includes('travma') ||
    text.includes('shock') ||
    text.includes('шок') ||
    text.includes('shok') ||
    text.includes('anaphylaxis') ||
    text.includes('анафилакс') ||
    text.includes('abdominal pain') ||
    text.includes('acute abdomen') ||
    text.includes("qorin og'rig'i") ||
    text.includes('боль в животе') ||
    text.includes('emergency')
  ) {
    return {
      icon: RiFirstAidKitLine,
      bg: 'bg-red-50 text-red-600 border-red-200/80 shadow-red-500/10',
      badge: 'bg-red-50 text-red-700 border-red-200',
      accent: 'red',
    };
  }

  // 13. Qabul / Chiqarish / Statsionar / Palata
  if (
    text.includes('admission') ||
    text.includes('приём') ||
    text.includes('qabul') ||
    text.includes('discharge') ||
    text.includes('выписк') ||
    text.includes('chiqarish') ||
    text.includes('ward') ||
    text.includes('hospital')
  ) {
    return {
      icon: RiHospitalLine,
      bg: 'bg-blue-50 text-blue-600 border-blue-200/80 shadow-blue-500/10',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      accent: 'blue',
    };
  }

  // 14. Boshlang'ich yoki umumiy klinik konsultatsiya
  return {
    icon: RiStethoscopeLine,
    bg: 'bg-blue-50 text-blue-600 border-blue-200/80 shadow-blue-500/10',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'blue',
  };
}
