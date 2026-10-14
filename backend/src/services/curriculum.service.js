const { Module, Test, Conversation, ModuleResult, ExamResult, Specialty } = require('../models');
const { UNLOCK_ALL_MODULES, PASS_THRESHOLD } = require('../config/features');

/**
 * Mutaxassislik uchun o'quv dasturi marralari (Oraliq va Yakuniy imtihonlar qoidalari)
 *
 * Qoida:
 * - Davolash ishi (10 modul): 1-5 modul → Oraliq imtihon → 6-10 modul → Yakuniy imtihon
 * - Pediatriya (10 modul): 1-5 modul → Oraliq imtihon → 6-10 modul → Yakuniy imtihon
 * - Stomatologiya (10 modul): 1-5 modul → Oraliq imtihon → 6-10 modul → Yakuniy imtihon
 * - Oliy hamshiralik (18 modul): 1-6 modul → Oraliq I → 7-12 modul → Oraliq II → 13-18 modul → Yakuniy imtihon
 * - Tizim o'zi umumiy qoidada 5 ta moduldan keyin oraliq, oxirgisidan keyin final exam qo'yadi.
 */
function getCurriculumMilestones(specialtyCode, totalModules = 10) {
  const code = (specialtyCode || '').toUpperCase();

  if (code === 'NURSING' || totalModules === 18) {
    return [
      {
        id: 'midterm_1',
        type: 'midterm',
        after_module: 6,
        covered_modules: [1, 2, 3, 4, 5, 6],
        title: 'Oraliq imtihon I (Midterm Exam I)',
        title_uz: 'Oraliq imtihon I (1–6 modullar)',
        title_ru: 'Промежуточный экзамен I (Модули 1–6)',
        title_en: 'Midterm Examination I (Modules 1–6)',
        badge: 'Oraliq I',
        badge_en: 'Midterm I',
        badge_ru: 'Промежуточный I',
        description_uz: "1–6-modullar bo'yicha kompleks klinik bilimlar va amaliy muloqot imtihoni",
        description_ru: 'Комплексный экзамен по клиническим навыкам за модули 1–6',
        description_en: 'Comprehensive clinical communication assessment covering modules 1–6',
      },
      {
        id: 'midterm_2',
        type: 'midterm',
        after_module: 12,
        covered_modules: [7, 8, 9, 10, 11, 12],
        title: 'Oraliq imtihon II (Midterm Exam II)',
        title_uz: 'Oraliq imtihon II (7–12 modullar)',
        title_ru: 'Промежуточный экзамен II (Модули 7–12)',
        title_en: 'Midterm Examination II (Modules 7–12)',
        badge: 'Oraliq II',
        badge_en: 'Midterm II',
        badge_ru: 'Промежуточный II',
        description_uz: "7–12-modullar bo'yicha chuqurlashtirilgan oraliq klinik imtihon",
        description_ru: 'Углубленный экзамен по модулям 7–12',
        description_en: 'Advanced clinical communication assessment covering modules 7–12',
      },
      {
        id: 'final',
        type: 'final',
        after_module: 18,
        covered_modules: Array.from({ length: 18 }, (_, i) => i + 1),
        title: 'Yakuniy davlat attestatsiyasi (Final Exam)',
        title_uz: 'Yakuniy imtihon (Final Exam)',
        title_ru: 'Итоговый экзамен (Final Exam)',
        title_en: 'Comprehensive Final Examination',
        badge: 'Final Exam',
        badge_en: 'Final Exam',
        badge_ru: 'Итоговый экзамен',
        description_uz: "To'liq 18 ta modul bo'yicha yakuniy sertifikatlashtirish imtihoni",
        description_ru: 'Финальный сертификационный экзамен по всем 18 модулям',
        description_en: 'Final comprehensive certification exam covering all 18 modules',
      }
    ];
  }

  // 10 modulli yoki standart holat: 5 dan keyin oraliq, 10 dan keyin final
  const midModule = totalModules > 5 ? 5 : Math.ceil(totalModules / 2);
  const endModule = totalModules;

  return [
    {
      id: 'midterm',
      type: 'midterm',
      after_module: midModule,
      covered_modules: Array.from({ length: midModule }, (_, i) => i + 1),
      title: `Oraliq imtihon (Midterm Exam: 1–${midModule})`,
      title_uz: `Oraliq imtihon (1–${midModule} modullar)`,
      title_ru: `Промежуточный экзамен (Модули 1–${midModule})`,
      title_en: `Midterm Examination (Modules 1–${midModule})`,
      badge: 'Oraliq imtihon',
      badge_en: 'Midterm Exam',
      badge_ru: 'Промежуточный экзамен',
      description_uz: `1–${midModule}-modullar bo'yicha integratsiyalashgan klinik test va virtual bemor imtihoni`,
      description_ru: `Интегрированный промежуточный экзамен по модулям 1–${midModule}`,
      description_en: `Integrated midterm clinical evaluation covering modules 1–${midModule}`,
    },
    {
      id: 'final',
      type: 'final',
      after_module: endModule,
      covered_modules: Array.from({ length: endModule }, (_, i) => i + 1),
      title: `Yakuniy imtihon (Final Exam: 1–${endModule})`,
      title_uz: 'Yakuniy imtihon (Final Exam)',
      title_ru: 'Итоговый экзамен (Final Exam)',
      title_en: 'Comprehensive Final Examination',
      badge: 'Final Exam',
      badge_en: 'Final Exam',
      badge_ru: 'Итоговый экзамен',
      description_uz: "Kurs bo'yicha to'liq yakuniy attestatsiya va malaka sertifikati imtihoni",
      description_ru: 'Итоговая сертификационная аттестация по всему курсу',
      description_en: 'Full course final certification and competence examination',
    }
  ];
}

/**
 * Imtihonlar uchun maxsus klinik OSCE virtual bemor ssenariylari
 */
function getExamScenario(specialtyCode, examType) {
  const code = (specialtyCode || '').toUpperCase();

  // Davolash ishi
  if (code === 'GEN_MED') {
    if (examType === 'midterm') {
      return {
        role_play: 'General Physician / Medical Resident',
        setting: 'Hospital Emergency Assessment Bay',
        counterpart_label: 'Patient (Mr. Robert Jenkins)',
        patient_profile: {
          name: 'Robert Jenkins',
          age: 56,
          gender: 'Male',
          occupation: 'School Administrator',
          personality_trait: 'Anxious, speaks slowly due to mild chest discomfort and dyspnea',
        },
        medical_condition: {
          chief_complaint: 'Crushing retrosternal chest pain for 2 hours and shortness of breath',
          duration: '2 hours, worsening with exertion',
          symptoms: [
            'Severe crushing pressure behind the breastbone radiating to the left shoulder and jaw',
            'Shortness of breath (dyspnea) at rest',
            'Cold clammy perspiration (diaphoresis)',
            'Mild dizziness and nausea'
          ],
          medical_history: 'Type 2 Diabetes for 8 years, Hypertension for 5 years. Smoker (1 pack/day for 25 years). Takes Metformin and Lisinopril irregularly.',
          allergies: 'No known drug allergies (NKDA)',
          vitals: 'BP 155/95 mmHg, HR 98 bpm, RR 22/min, SpO2 94% on room air, Temp 36.8°C',
          suspected_diagnosis: 'Acute Coronary Syndrome (Suspected STEMI / NSTEMI)',
          expected_clinical_plan: [
            'Obtain immediate 12-lead ECG and continuous cardiac monitoring',
            'Administer chewable Aspirin 300 mg, sublingual Nitroglycerin spray (if systolic BP > 100), and supplemental O2',
            'Draw urgent cardiac enzymes (high-sensitivity Troponin-I), electrolytes, and blood glucose',
            'Reassure patient with empathetic, clear English and prepare for urgent cardiology review'
          ]
        }
      };
    } else {
      // Final exam
      return {
        role_play: 'Lead Consultant / Senior Medical Officer',
        setting: 'Acute Medical Admissions Unit',
        counterpart_label: 'Patient (Mrs. Eleanor Davis)',
        patient_profile: {
          name: 'Eleanor Davis',
          age: 63,
          gender: 'Female',
          occupation: 'Retired Librarian',
          personality_trait: 'Lethargic, confused, feverish, requires calm and clear questioning',
        },
        medical_condition: {
          chief_complaint: 'High fever, severe right flank pain, burning urination, and confusion for 24 hours',
          duration: '3 days of dysuria, acute deterioration over last 12 hours',
          symptoms: [
            'High spiking fevers with rigors (shaking chills)',
            'Severe right costovertebral flank pain',
            'Dysuria, urinary frequency and cloudy foul-smelling urine',
            'Lethargy, mild disorientation to time, and severe fatigue'
          ],
          medical_history: 'Recurrent UTIs, Osteoarthritis, Mild chronic kidney disease (stage 2).',
          vitals: 'BP 92/58 mmHg, HR 118 bpm, RR 24/min, SpO2 95%, Temp 39.2°C, GCS 14/15',
          suspected_diagnosis: 'Acute Pyelonephritis complicated by Sepsis (qSOFA = 2)',
          expected_clinical_plan: [
            'Initiate Sepsis Six pathway within 1 hour',
            'Give high-flow oxygen, take blood cultures and urine cultures before starting antibiotics',
            'Administer broad-spectrum intravenous antibiotics (e.g., Ceftriaxone or Piperacillin-Tazobactam)',
            'Commence rapid IV fluid resuscitation (30 ml/kg balanced crystalloids) and monitor urinary output'
          ]
        }
      };
    }
  }

  // Stomatologiya
  if (code === 'STOM') {
    if (examType === 'midterm') {
      return {
        role_play: 'General Dental Practitioner',
        setting: 'Dental Emergency Clinic',
        counterpart_label: 'Patient (Mr. David Miller)',
        patient_profile: {
          name: 'David Miller',
          age: 41,
          gender: 'Male',
          occupation: 'Architect',
          personality_trait: 'Distressed from severe throbbing tooth pain, hasn\'t slept all night',
        },
        medical_condition: {
          chief_complaint: 'Excruciating throbbing pain in the lower right molar with noticeable facial swelling',
          duration: '3 days, acutely worse since yesterday evening',
          symptoms: [
            'Intense, constant throbbing pain in tooth #46 (lower right first molar)',
            'Facial swelling on the right cheek and tender submandibular lymph nodes',
            'Extreme sensitivity to warm fluids; cold temporarily numbs it',
            'Difficulty chewing and slight trismus (difficulty opening mouth)'
          ],
          medical_history: 'No systemic illnesses. No regular dental check-ups for 4 years.',
          suspected_diagnosis: 'Acute Periapical Abscess secondary to Deep Dental Caries and Pulp Necrosis',
          expected_clinical_plan: [
            'Take periapical radiograph to assess root apex and bone loss',
            'Explain urgent need for endodontic drainage (root canal treatment) or tooth extraction',
            'Prescribe targeted analgesics (Ibuprofen + Paracetamol) and antibiotics if systemic spread is suspected',
            'Deliver oral hygiene and post-operative instructions clearly in polite dental English'
          ]
        }
      };
    } else {
      return {
        role_play: 'Senior Dental Surgeon / Prosthodontist',
        setting: 'Specialist Restorative Dental Suite',
        counterpart_label: 'Patient (Mrs. Victoria Brown)',
        patient_profile: {
          name: 'Victoria Brown',
          age: 52,
          gender: 'Female',
          occupation: 'University Lecturer',
          personality_trait: 'Polite, highly educated, concerned about dental aesthetics, mastication, and long-term costs',
        },
        medical_condition: {
          chief_complaint: 'Bleeding gums, mobile upper incisors, and missing posterior teeth requiring full mouth reconstruction',
          duration: 'Chronic deterioration over several years',
          symptoms: [
            'Spontaneous gum bleeding while brushing and persistent halitosis (bad breath)',
            'Mobility (Grade II) of teeth #11 and #21',
            'Difficulty masticating food due to missing lower molars (#36, #37, #46)',
            'Desire to explore dental implants versus fixed bridge prosthetics'
          ],
          medical_history: 'Well-controlled hypertension. Non-smoker.',
          suspected_diagnosis: 'Generalized Stage III Periodontitis with Partial Edentulism',
          expected_clinical_plan: [
            'Comprehensive periodontal probing chart and full-mouth panoramic orthopantomogram (OPG)',
            'Explain phase 1 periodontal debridement and non-surgical scaling and root planing',
            'Present comparative options: Dental implants vs. crown & bridge prosthetics vs. removable partial denture',
            'Discuss maintenance, costs, recovery timeline, and home oral hygiene regimen'
          ]
        }
      };
    }
  }

  // Pediatriya
  if (code === 'PED') {
    if (examType === 'midterm') {
      return {
        role_play: 'Pediatrician / Medical Officer',
        setting: 'Children\'s Outpatient Clinic',
        counterpart_label: 'Parent (Mrs. Sarah Mitchell, mother of 3-year-old Toby)',
        patient_profile: {
          name: 'Sarah Mitchell (Mother) / Patient: Toby Mitchell (3 years old)',
          age: 3,
          gender: 'Male',
          occupation: 'Toddler',
          personality_trait: 'Mother is very anxious and tearful; child is irritable and clingy',
        },
        medical_condition: {
          chief_complaint: 'High fever up to 39.5°C, barking cough, and poor fluid intake for 2 days',
          duration: '48 hours',
          symptoms: [
            'Stridor and harsh barking seal-like cough, worse at night',
            'High fever partially responding to Paracetamol',
            'Refusing solid foods, only taking small sips of water',
            'Decreased wet nappies (only 2 in the last 24 hours)'
          ],
          medical_history: 'Born at full term. Routine childhood immunisations up to date. Mild eczema.',
          vitals: 'HR 130 bpm, RR 34/min, SpO2 96% on room air, Temp 38.9°C. Mild subcostal recession.',
          suspected_diagnosis: 'Moderate Viral Croup (Laryngotracheobronchitis) with Mild Dehydration',
          expected_clinical_plan: [
            'Acknowledge and validate maternal anxiety with calm, compassionate pediatric communication',
            'Administer single dose of oral Dexamethasone (0.15 mg/kg) or nebulised Budesonide',
            'Encourage frequent small amounts of oral rehydration solution (ORS)',
            'Advise mother on red flag symptoms (severe stridor at rest, cyanosis, lethargy) and when to return urgently'
          ]
        }
      };
    } else {
      return {
        role_play: 'Senior Pediatric Emergency Physician',
        setting: 'Pediatric Emergency Department',
        counterpart_label: 'Parent (Mr. James Wilson, father of 8-year-old Liam)',
        patient_profile: {
          name: 'James Wilson (Father) / Patient: Liam Wilson (8 years old)',
          age: 8,
          gender: 'Male',
          occupation: 'Schoolboy',
          personality_trait: 'Father is alarmed; boy lies still with knees bent to chest due to abdominal pain',
        },
        medical_condition: {
          chief_complaint: 'Severe lower abdominal pain that started around the navel and migrated to the right side',
          duration: '18 hours',
          symptoms: [
            'Pain migrated from periumbilical region to right iliac fossa (McBurney\'s point)',
            'Anorexia (has eaten nothing all day) and two episodes of bilious vomiting',
            'Low-grade fever (38.2°C) and unable to jump or walk upright without crying',
            'Rebound tenderness and guarding on gentle palpation in the right lower quadrant'
          ],
          medical_history: 'No previous surgeries. No known food or drug allergies.',
          vitals: 'HR 112 bpm, RR 22/min, Temp 38.3°C, BP 104/68 mmHg',
          suspected_diagnosis: 'Acute Appendicitis',
          expected_clinical_plan: [
            'Keep patient strictly Nil By Mouth (NPO) and start intravenous maintenance fluids',
            'Provide adequate pediatric IV analgesia (Paracetamol / Morphine as per protocol)',
            'Order emergency ultrasound of the abdomen and urgent pediatric surgical consultation',
            'Explain surgical diagnosis and consent process gently to the father in fluent clinical English'
          ]
        }
      };
    }
  }

  // Oliy hamshiralik (NURSING)
  if (code === 'NURSING') {
    if (examType === 'midterm_1') {
      return {
        role_play: 'Registered Staff Nurse',
        setting: 'Medical Inpatient Ward',
        counterpart_label: 'Patient (Mr. William Parker)',
        patient_profile: {
          name: 'William Parker',
          age: 68,
          gender: 'Male',
          occupation: 'Retired Carpenter',
          personality_trait: 'Cooperative but breathless on exertion, slightly confused about ward routine',
        },
        medical_condition: {
          chief_complaint: 'Newly admitted with Community-Acquired Pneumonia and chronic COPD exacerbation',
          duration: 'Admitted 2 hours ago from the emergency department',
          symptoms: [
            'Productive cough with greenish sputum and shortness of breath on minimal movement',
            'Pleuritic chest pain on deep inspiration (rated 6/10 on visual analogue scale)',
            'Low SpO2 (89% on ambient air, requires titrated nasal cannula oxygen)',
            'Needs vital signs baseline and medication safety check (intravenous Ceftriaxone & nebulisers)'
          ],
          medical_history: 'COPD (Gold Stage 2), Hypertension. Ex-smoker.',
          vitals: 'BP 138/82 mmHg, HR 92 bpm, RR 24/min, SpO2 93% on 2L O2, Temp 38.1°C',
          suspected_diagnosis: 'Community-Acquired Pneumonia with Exacerbation of COPD',
          expected_clinical_plan: [
            'Complete admission nursing assessment and baseline vital signs (NEWS2 score)',
            'Titrate oxygen to target saturation 88-92% (due to chronic hypercapnic respiratory drive risk)',
            'Check patient identity band and allergies before administering intravenous antibiotics and analgesics',
            'Educate patient on deep breathing exercises, sputum clearance, and nurse call-bell use'
          ]
        }
      };
    } else if (examType === 'midterm_2') {
      return {
        role_play: 'Senior Charge Nurse',
        setting: 'High Dependency Post-Operative Unit',
        counterpart_label: 'Relative & Patient (Mrs. Maria Rodriguez)',
        patient_profile: {
          name: 'Maria Rodriguez',
          age: 59,
          gender: 'Female',
          occupation: 'Accountant',
          personality_trait: 'Tense, anxious about sudden chest discomfort and surgical drain output',
        },
        medical_condition: {
          chief_complaint: 'Post-operative day 2 following hemicolectomy: sudden acute dyspnea, tachycardia, and right calf tenderness',
          duration: 'Sudden onset 45 minutes ago',
          symptoms: [
            'Sudden pleuritic right-sided chest pain and tachypnea (RR 28/min)',
            'Tachycardia (HR 115 bpm) and oxygen saturation drop to 91%',
            'Swelling and marked tenderness in the right calf',
            'Anxiety and fear of impending collapse'
          ],
          medical_history: 'Laparoscopic right hemicolectomy 48 hours ago for colon polyps. Bedbound since surgery.',
          suspected_diagnosis: 'Suspected Acute Pulmonary Embolism secondary to Deep Vein Thrombosis (DVT)',
          expected_clinical_plan: [
            'Initiate immediate high-flow oxygen and sit the patient upright',
            'Escalate urgently to ward medical team / MET call using SBAR communication tool',
            'Attach continuous ECG and pulse oximeter, verify IV patency and prepare emergency anticoagulant (LMWH)',
            'Communicate reassuringly with both patient and daughter, explaining steps without causing panic'
          ]
        }
      };
    } else {
      // Final Nursing Exam
      return {
        role_play: 'Nurse Unit Manager / Clinical Nurse Specialist',
        setting: 'Multidisciplinary Stroke Rehabilitation and Discharge Suite',
        counterpart_label: 'Patient & Carer (Mr. Thomas Anderson and his wife)',
        patient_profile: {
          name: 'Thomas Anderson',
          age: 72,
          gender: 'Male',
          occupation: 'Retired Headteacher',
          personality_trait: 'Determined to return home, but struggles with mild expressive dysphasia and right-sided hemiparesis',
        },
        medical_condition: {
          chief_complaint: 'Comprehensive discharge planning and nursing care management following ischaemic stroke and secondary AKI',
          duration: 'Day 12 post-ischaemic stroke',
          symptoms: [
            'Residual right upper limb weakness and impaired fine motor coordination',
            'Mild dysphagia (requires thickened fluids and soft diet)',
            'Pressure ulcer risk (Waterlow score 16 - High Risk)',
            'Complex polypharmacy: Clopidogrel, Atorvastatin, Amlodipine, and strict fluid balance chart'
          ],
          medical_history: 'Ischaemic stroke (left MCA territory), Stage 2 AKI now resolving, Atrial Fibrillation.',
          suspected_diagnosis: 'Post-Stroke Recovery, Secondary Stroke Prevention, and Fall Prevention',
          expected_clinical_plan: [
            'Formulate holistic nursing care plan covering mobility, aspiration risk, pressure injury prevention, and nutrition',
            'Deliver comprehensive discharge teaching to wife regarding medication regimen and signs of stroke recurrence (FAST)',
            'Coordinate community nursing handover and occupational therapy home safety assessment',
            'Communicate with supreme empathy, active listening, and flawless professional nursing terminology'
          ]
        }
      };
    }
  }

  // Tez tibbiy yordam (FIRST_AID) yoki umumiy
  return {
    role_play: 'Emergency Medical Officer / Paramedic Lead',
    setting: 'Emergency Resuscitation Bay',
    counterpart_label: 'Patient / Bystander',
    patient_profile: {
      name: 'Michael Evans',
      age: 48,
      gender: 'Male',
      occupation: 'Civil Engineer',
      personality_trait: 'Diaphoretic, confused, tachypneic',
    },
    medical_condition: {
      chief_complaint: 'Acute collapse, shortness of breath, and profuse sweating',
      duration: 'Acute onset 1 hour ago',
      symptoms: [
        'Acute respiratory distress and stridor',
        'Severe hypotension and tachycardia',
        'Urticarial rash across chest and neck'
      ],
      suspected_diagnosis: 'Acute Anaphylactic Shock or Acute Cardiopulmonary Event',
      expected_clinical_plan: [
        'Apply ABCDE systematic assessment',
        'Administer IM Adrenaline 1:1000 (0.5 mg) and high-flow oxygen immediately',
        'Gain large-bore IV access and infuse rapid crystalloids',
        'Communicate clinical findings fluently in English using SBAR handover'
      ]
    }
  };
}

module.exports = {
  getCurriculumMilestones,
  getExamScenario,
};
