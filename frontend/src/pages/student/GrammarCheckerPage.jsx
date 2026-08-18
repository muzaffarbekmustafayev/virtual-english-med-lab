import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../lib/api";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "react-hot-toast";
import {
  RiQuillPenLine, RiCheckboxCircleLine, RiFileCopyLine,
  RiSparklingLine, RiLightbulbLine, RiStethoscopeLine,
  RiCheckLine, RiCloseLine, RiBookOpenLine, RiErrorWarningLine,
  RiQuestionLine, RiBrainLine, RiSpeakLine, RiArrowRightLine,
  RiSearchLine, RiRefreshLine, RiAwardLine, RiShieldCheckLine,
  RiVolumeUpLine
} from "react-icons/ri";

// ── 1. Comprehensive Clinical Grammar Rules Database ──────────
const CLINICAL_GRAMMAR_RULES = [
  {
    id: 1,
    title: "Present Simple for Chronic Symptoms & General Truths",
    titleUz: "Present Simple — Surunkali simptomlar va umumiy tibbiy holatlar",
    formula: "Subject + Verb(s/es) + Object / Time Expression",
    clinicalUse: "Bemorning surunkali shikoyatlari, doimiy og'riqlar va anatomiya tavsifida qo'llaniladi.",
    examples: [
      { en: "The patient feels sharp pain when chewing hard food.", uz: "Bemor qattiq ovqat chaynaganda o'tkir og'riq sezadi." },
      { en: "Enamel protects the inner dentin layer.", uz: "Emal ichki dentin qavatini himoya qiladi." }
    ],
    commonError: "❌ The patient feeling pain when he eat. ➔ ✓ The patient feels pain when he eats."
  },
  {
    id: 2,
    title: "Present Continuous for Immediate & Changing Symptoms",
    titleUz: "Present Continuous — Ayni paytdagi va o'zgaruvchan belgilar",
    formula: "Subject + am/is/are + Verb-ing + Object",
    clinicalUse: "Ayni ko'rik vaqtida sodir bo'layotgan yoki vaqt o'tishi bilan kuchayib borayotgan jarayonlarda qo'llaniladi.",
    examples: [
      { en: "The gingival swelling is increasing rapidly.", uz: "Milkdagi shish tez sur'atda kattalashmoqda." },
      { en: "The patient is currently taking analgesics.", uz: "Bemor hozirda og'riqsizlantiruvchi dorilar qabul qilmoqda." }
    ],
    commonError: "❌ Swelling increase now. ➔ ✓ The swelling is increasing now."
  },
  {
    id: 3,
    title: "Present Perfect for Medical History & Duration (Since / For)",
    titleUz: "Present Perfect — Anamnez yig'ish va davomiylik (Since / For)",
    formula: "Subject + have/has + Past Participle (V3) + for/since",
    clinicalUse: "O'tmishda boshlanib, hozirgacha davom etayotgan kasallik davomiyligini aniqlashda qo'llaniladi.",
    examples: [
      { en: "I have had this throbbing toothache for three days.", uz: "Menda uch kundan beri bu zirqiragan tish og'rig'i bor." },
      { en: "The patient has experienced bleeding since yesterday.", uz: "Bemor kechadan beri qon ketishini boshdan kechirmoqda." }
    ],
    commonError: "❌ I have pain since 3 days. ➔ ✓ I have had pain for 3 days."
  },
  {
    id: 4,
    title: "Modal Verbs for Patient Advice & Warnings (Should, Must, May)",
    titleUz: "Modal Fe'llar — Bemorga tavsiyalar va tibbiy ko'rsatmalar",
    formula: "Subject + modal (should / must / may) + Base Verb (V1)",
    clinicalUse: "Shifokor tavsiyalari, profilaktika choralari va dori qabul qilish qoidalarini tushuntirishda qo'llaniladi.",
    examples: [
      { en: "You should rinse with chlorhexidine twice daily.", uz: "Siz kuniga ikki marta xlorgeksidin bilan chayishingiz kerak." },
      { en: "You must not chew on the left side for 24 hours.", uz: "Siz 24 soat davomida chap tomonda chaynamasligingiz shart." }
    ],
    commonError: "❌ You should to rinse your mouth. ➔ ✓ You should rinse your mouth."
  },
  {
    id: 5,
    title: "Passive Voice in Clinical Charting & Procedures",
    titleUz: "Passive Voice — Klinik hujjatlashtirish va muolajalar bayoni",
    formula: "Subject + be (is/are/was/were) + Past Participle (V3)",
    clinicalUse: "Tibbiy tarix yozishda shifokorning o'zi emas, balki bajarilgan muolajaga urg'u berishda qo'llaniladi.",
    examples: [
      { en: "Local anesthesia was administered in the right mandibular quadrant.", uz: "O'ng pastki jag' sohasiga mahalliy anesteziya qilindi." },
      { en: "The composite resin is cured with LED light.", uz: "Kompozit plomba LED yorug'lik bilan qotiriladi." }
    ],
    commonError: "❌ Doctor was extracted tooth. ➔ ✓ The tooth was extracted by the doctor."
  },
  {
    id: 6,
    title: "First & Second Conditionals for Triage & Prognosis",
    titleUz: "Shart Mayli (Conditionals) — Prognoz va davolash natijalarini tushuntirish",
    formula: "If + Present Simple, will + V1 (Real) / If + Past Simple, would + V1 (Hypothetical)",
    clinicalUse: "Davolash natijalari, xavf-xatarlar va agar muolaja qilinmasa nima bo'lishini tushuntirishda qo'llaniladi.",
    examples: [
      { en: "If we do not perform a root canal, the infection will spread.", uz: "Agar ildiz kanalini davolamasak, infeksiya tarqaladi." },
      { en: "If you had acute pain, we would prescribe stronger analgesics.", uz: "Agar sizda o'tkir og'riq bo'lsa, kuchliroq og'riqsizlantiruvchi yozib berar edik." }
    ],
    commonError: "❌ If you will not brush, caries will develop. ➔ ✓ If you do not brush, caries will develop."
  }
];

// ── 2. Common Clinical English Mistakes & Pitfalls ────────────
const COMMON_MISTAKES = [
  {
    bad: "I prescribe patient amoxicillin 500mg.",
    good: "I prescribe amoxicillin 500mg for the patient. / I prescribe the patient amoxicillin.",
    category: "Prescription Grammar",
    explanation: "'Prescribe' fe'lidan so'ng dori nomi to'g'ridan-to'g'ri keladi yoki 'for the patient' qo'shimchasi bilan ishlatiladi."
  },
  {
    bad: "The tooth is hurting since 3 days.",
    good: "The tooth has been hurting for 3 days.",
    category: "Duration & Tenses",
    explanation: "Davomiylik va muddat (for 3 days) ifodalanganda Present Perfect Continuous ('has been hurting') talab qilinadi."
  },
  {
    bad: "Doctor will make an injection now.",
    good: "The doctor will give an injection / administer local anesthesia now.",
    category: "Clinical Collocations",
    explanation: "Tibbiyotda ukol qilish uchun 'make injection' emas, balki 'give an injection' yoki 'administer anesthesia' qo'llaniladi."
  },
  {
    bad: "The patient is having 35 years old.",
    good: "The patient is 35 years old.",
    category: "Patient Demographics",
    explanation: "Yoshni bildirishda 'have' fe'li emas, 'to be' (is/are) qo'llaniladi."
  },
  {
    bad: "Do you have allergic for antibiotics?",
    good: "Are you allergic to any antibiotics? / Do you have an allergy to antibiotics?",
    category: "Anamnesis Inquiry",
    explanation: "'Allergic' bu sifat bo'lib, 'to' predlogi bilan ishlatiladi ('allergic to penicillin')."
  },
  {
    bad: "Please open your mouth big.",
    good: "Please open your mouth wide.",
    category: "Doctor-Patient Commands",
    explanation: "Og'izni katta ochish buyrug'ida 'big' emas, 'wide' (keng/katta) ravishi ishlatiladi."
  }
];

// ── 3. Interactive Clinical Grammar Practice Questions ─────────
const PRACTICE_QUESTIONS = [
  {
    id: 1,
    question: "The patient ________ severe sensitivity to hot liquids since yesterday morning.",
    options: ["has experienced", "experiences", "is experiencing", "experienced"],
    correct: 0,
    explanation: "'Since yesterday morning' iborasi Present Perfect ('has experienced') zamonini talab qiladi."
  },
  {
    id: 2,
    question: "You ________ chew hard foods on the newly restored tooth for the next 24 hours.",
    options: ["should not", "must not to", "don't should", "ought not"],
    correct: 0,
    explanation: "Modal fe'llardan ('should not') so'ng fe'lning asosi 'to' siz keladi."
  },
  {
    id: 3,
    question: "Local anesthesia ________ in the buccal fold prior to the tooth extraction.",
    options: ["was administered", "administered", "is administering", "has administer"],
    correct: 0,
    explanation: "O'tmishda bajarilgan tibbiy muolaja Passiv zamonda ('was administered') ifodalanadi."
  },
  {
    id: 4,
    question: "Are you allergic ________ any local anesthetics or penicillin?",
    options: ["to", "for", "with", "on"],
    correct: 0,
    explanation: "'Allergic' sifati har doim 'to' predlogi bilan bog'lanadi (allergic to)."
  },
  {
    id: 5,
    question: "If the infection ________ to the pulp chamber, endodontic therapy will be mandatory.",
    options: ["spreads", "will spread", "is spreading", "spreaded"],
    correct: 0,
    explanation: "1-turdagi shart gaplarda 'if' qismida Present Simple ('spreads') ishlatiladi."
  }
];

export default function GrammarCheckerPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Active tab state: 'checker' | 'rules' | 'mistakes' | 'practice'
  const activeTab = tab || "checker";

  const [text, setText] = useState(() => localStorage.getItem("grammar_text") || "");
  const [mode, setMode] = useState("clinical");
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem("grammar_result");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  // Search filter for rules
  const [ruleSearch, setRuleSearch] = useState("");

  // Practice Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    localStorage.setItem("grammar_text", text);
  }, [text]);

  useEffect(() => {
    if (result) {
      localStorage.setItem("grammar_result", JSON.stringify(result));
    } else {
      localStorage.removeItem("grammar_result");
    }
  }, [result]);

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error(t('student.grammar.input_label') || "Iltimos, tekshirish uchun matn kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/student/grammar-check", { text, mode });
      setResult(res.data);
      toast.success(t('common.success') || "Grammatik tahlil muvaffaqiyatli yakunlandi!");
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error') || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    toast.success("Nusxa olindi!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleTexts = [
    "The patient have severe toothache in lower molar since 3 days and pain get worse with cold water.",
    "Patient is complaining from swollen gum and bleeding when he brush teeth.",
    "I prescribe patient amoxicillin 500mg because he have acute dental abscess.",
    "The caries have reached the dental pulp and causing severe sensitivity.",
    "Doctor was make injection to patient yesterday.",
  ];

  const filteredRules = CLINICAL_GRAMMAR_RULES.filter(r =>
    ruleSearch.trim() === ""
      ? true
      : r.title.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.titleUz.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.formula.toLowerCase().includes(ruleSearch.toLowerCase())
  );

  const handleQuizSelect = (qId, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateQuizScore = () => {
    let correctCount = 0;
    PRACTICE_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correct) correctCount++;
    });
    return Math.round((correctCount / PRACTICE_QUESTIONS.length) * 100);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ── 1. Page Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-standard badge-amber">
                <RiSparklingLine className="text-xs" /> AI Klinik Grammatika Laboratoriyasi
              </span>
              <span className="text-xs font-bold text-slate-400">· Virtual Medical English</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                <RiQuillPenLine />
              </span>
              <span>{t('student.grammar.title') || "Klinik Grammatika Tahlilchisi"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-2xl leading-relaxed">
              {t('student.grammar.subtitle') || "Shifokor-bemor muloqoti, tibbiy yozuvlar va klinik hisobotlar uchun grammatikani sun'iy intellekt orqali tekshiring va o'rganing."}
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Qoidalar</p>
              <p className="text-sm font-black text-slate-900">{CLINICAL_GRAMMAR_RULES.length} ta</p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Mashqlar</p>
              <p className="text-sm font-black text-amber-600">{PRACTICE_QUESTIONS.length} ta</p>
            </div>
          </div>
        </div>

        {/* ── 2. Top Sub-Route Navigation Tabs ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => navigate("/student/grammar/check")}
            className={`pb-3 px-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "checker" || activeTab === "check"
                ? "border-amber-500 text-amber-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <RiSparklingLine className="text-base" />
            <span>AI Tekshiruv (Checker)</span>
          </button>

          <button
            onClick={() => navigate("/student/grammar/rules")}
            className={`pb-3 px-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "rules"
                ? "border-amber-500 text-amber-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <RiBrainLine className="text-base" />
            <span>Klinik Qoidalar & Formulalar</span>
          </button>

          <button
            onClick={() => navigate("/student/grammar/mistakes")}
            className={`pb-3 px-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "mistakes"
                ? "border-amber-500 text-amber-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <RiErrorWarningLine className="text-base" />
            <span>Ko'p Uchraydigan Xatolar</span>
          </button>

          <button
            onClick={() => navigate("/student/grammar/practice")}
            className={`pb-3 px-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "practice"
                ? "border-amber-500 text-amber-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <RiQuestionLine className="text-base" />
            <span>Interaktiv Test & Mashq</span>
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: AI GRAMMAR CHECKER (LIVE ANALYZER) ──────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {(activeTab === "checker" || activeTab === "check") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left Column: Editor */}
            <div className="lg:col-span-6 space-y-4">
              <div className="card-standard p-6 space-y-4 bg-white border border-slate-200/90 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <RiQuillPenLine className="text-amber-500" />
                    <span>{t('student.grammar.input_label') || "Tibbiy matn yoki shifokor jumlasi"}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">{text.length} ta belgi</span>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('student.grammar.placeholder') || "Misol: The patient have severe toothache since 3 days and I prescribe him amoxicillin..."}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-xs md:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-100 transition-all font-mono leading-relaxed"
                />

                {/* Mode Selector & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("clinical")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mode === "clinical"
                          ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-extrabold"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      🦷 Klinik Ingliz Tili
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("general")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mode === "general"
                          ? "bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs font-extrabold"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      🩺 Umumiy Tibbiyot
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const rnd = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                        setText(rnd);
                      }}
                      className="btn-secondary-soft text-xs py-2 px-3"
                    >
                      {t('student.grammar.sample_btn') || "Namuna"}
                    </button>
                    {text && (
                      <button
                        type="button"
                        onClick={() => { setText(""); setResult(null); }}
                        className="btn-secondary-soft text-xs py-2 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        {t('student.grammar.clear_btn') || "Tozalash"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={loading || !text.trim()}
                  className="w-full btn-primary py-3 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
                >
                  <RiSparklingLine className="text-base" />
                  <span>{loading ? (t('student.grammar.checking') || "AI tahlil qilmoqda...") : (t('student.grammar.check_btn') || "Grammatikani Tekshirish")}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Diagnostic Analysis & Results */}
            <div className="lg:col-span-6 space-y-4">
              {result ? (
                <div className="card-standard p-6 space-y-5 animate-scale-in bg-white border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <RiCheckboxCircleLine className="text-emerald-600 text-lg" />
                      <span>{t('student.grammar.result_title') || "AI Tahlil Natijalari"}</span>
                    </h2>
                    {result.score !== undefined && (
                      <span className="badge-standard badge-emerald font-black">
                        {t('student.grammar.accuracy_score') || "Aniqlik"}: {result.score}%
                      </span>
                    )}
                  </div>

                  {/* Corrected sentence block */}
                  {result.corrected && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          {t('student.grammar.corrected_version') || "To'g'rilangan klinik jumla"}
                        </span>
                        <button
                          onClick={() => handleCopy(result.corrected)}
                          className="p-1.5 rounded-lg bg-white text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="Nusxa olish"
                        >
                          {copied ? <RiCheckLine /> : <RiFileCopyLine />}
                          <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                        </button>
                      </div>
                      <p className="text-sm font-bold text-emerald-950 font-mono leading-relaxed">
                        {result.corrected}
                      </p>
                    </div>
                  )}

                  {/* Detailed fixes list */}
                  {result.errors?.length > 0 ? (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        {t('student.grammar.detailed_fixes') || "Aniqlangan tuzatishlar"} ({result.errors.length})
                      </h3>
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {result.errors.map((err, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center gap-2 text-rose-600 line-through font-semibold">
                              <span>❌</span> <span>{err.original || err.error}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-700 font-bold">
                              <span>✓</span> <span>{err.suggested || err.correction}</span>
                            </div>
                            {err.explanation && (
                              <p className="text-slate-500 text-[11px] pl-4 font-medium">
                                💡 {err.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <RiCheckLine className="text-lg" />
                      <span>Jumlada grammatik xatolik topilmadi! A'lo darajadagi klinik muloqot.</span>
                    </div>
                  )}

                  {/* Medical vocab suggestions */}
                  {result.suggestions?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                      <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <RiLightbulbLine /> {t('student.grammar.vocab_suggestions') || "Mavzuga oid tavsiya qilingan terminlar"}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.suggestions.map((s, idx) => (
                          <span key={idx} className="badge-standard badge-blue bg-white">
                            {typeof s === 'string' ? s : s.term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-standard p-12 text-center flex flex-col items-center justify-center text-slate-400 h-full min-h-[340px] bg-white border border-slate-200/90 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-3xl text-amber-600 mb-3.5 shadow-2xs">
                    <RiQuillPenLine />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Tahlil natijalari bu yerda chiqadi</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Chapdagi tahrirlagichga tibbiy matn kiriting va "Grammatikani Tekshirish" tugmasini bosing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: CLINICAL GRAMMAR RULES & FORMULA LIBRARY ────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === "rules" && (
          <div className="space-y-5 animate-fade-in">
            {/* Search filter bar */}
            <div className="card-standard p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 shadow-xs">
              <div className="relative w-full sm:w-80">
                <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Qoidalar yoki formulalarni qidirish..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="input-standard pl-10 text-xs"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                Jami: {filteredRules.length} ta klinik qoida
              </span>
            </div>

            {/* Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredRules.map((r) => (
                <div key={r.id} className="card-standard p-6 space-y-4 bg-white border border-slate-200/90 shadow-sm hover:border-amber-300 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 font-black text-sm flex items-center justify-center border border-amber-200 shrink-0">
                        §{r.id}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Klinik Grammatika
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                          {r.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{r.titleUz}</p>
                      </div>
                    </div>
                  </div>

                  {/* Formula banner */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">
                      <RiLightbulbLine />
                      <span>Formula Strukturasi:</span>
                    </div>
                    <code className="text-xs font-black text-amber-950 font-mono tracking-tight block">
                      {r.formula}
                    </code>
                  </div>

                  {/* Clinical usage description */}
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    💡 {r.clinicalUse}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Misollar:</span>
                    {r.examples.map((ex, exIdx) => (
                      <div key={exIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-0.5">
                        <p className="font-bold text-slate-900">"{ex.en}"</p>
                        <p className="text-[11px] text-slate-500 font-medium">{ex.uz}</p>
                      </div>
                    ))}
                  </div>

                  {/* Common mistake callout */}
                  <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/80 text-[11px] text-rose-800 font-medium">
                    {r.commonError}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: COMMON CLINICAL MISTAKES & COMPARISONS ──────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === "mistakes" && (
          <div className="space-y-5 animate-fade-in">
            <div className="card-standard p-6 bg-white border border-slate-200 shadow-xs">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <RiErrorWarningLine className="text-rose-500 text-lg" />
                <span>Klinik Muloqotda Eng Ko'p Yo'l Qo'yiladigan Xatolar Tahlili</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tibbiy amaliyotda noto'g'ri grammatik jumlalar bemor tushunmovchiligi va xato tashxisga sabab bo'lishi mumkin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMMON_MISTAKES.map((m, idx) => (
                <div key={idx} className="card-standard p-5 space-y-3 bg-white border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="badge-standard badge-rose">
                      #{idx + 1} {m.category}
                    </span>
                  </div>

                  {/* Bad vs Good */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mb-0.5">Xato variant:</span>
                      <p className="font-bold text-rose-900 line-through">"{m.bad}"</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">To'g'ri klinik variant:</span>
                      <p className="font-bold text-emerald-950">"{m.good}"</p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs text-slate-600 font-medium leading-relaxed pt-1 border-t border-slate-100">
                    💡 <strong>Sabab:</strong> {m.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── TAB 4: INTERACTIVE PRACTICE QUIZ & TEST ────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === "practice" && (
          <div className="space-y-6 animate-fade-in">
            {/* Quiz Banner */}
            <div className="card-standard p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-50/50 via-white to-blue-50/50 border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RiAwardLine className="text-amber-600 text-lg" />
                  <span>Klinik Grammatika Interaktiv Testi</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Bemor bilan muloqot va anamnez yig'ishga oid grammatik bilimlaringizni sinab ko'ring.
                </p>
              </div>

              {quizSubmitted && (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Natijangiz</p>
                    <p className="text-lg font-black text-emerald-600">{calculateQuizScore()}%</p>
                  </div>
                  <button
                    onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Qayta topshirish"
                  >
                    <RiRefreshLine />
                  </button>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {PRACTICE_QUESTIONS.map((q, qIdx) => {
                const selected = quizAnswers[q.id];
                const isAnswered = selected !== undefined;
                const isCorrect = selected === q.correct;

                return (
                  <div key={q.id} className="card-standard p-6 space-y-4 bg-white border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Savol #{qIdx + 1}
                      </span>
                      {quizSubmitted && (
                        <span className={`badge-standard ${isCorrect ? 'badge-emerald' : 'badge-rose'}`}>
                          {isCorrect ? "✓ To'g'ri" : "✕ Xato"}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-extrabold text-slate-900 leading-snug">
                      {q.question}
                    </p>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selected === optIdx;
                        let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";

                        if (quizSubmitted) {
                          if (optIdx === q.correct) {
                            btnStyle = "bg-emerald-100 border-emerald-300 text-emerald-950 font-black";
                          } else if (isChosen && !isCorrect) {
                            btnStyle = "bg-rose-100 border-rose-300 text-rose-950 font-black";
                          } else {
                            btnStyle = "bg-slate-50 border-slate-200 opacity-50";
                          }
                        } else if (isChosen) {
                          btnStyle = "bg-amber-100 border-amber-400 text-amber-950 font-black ring-2 ring-amber-200";
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleQuizSelect(q.id, optIdx)}
                            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span className="mr-2 text-slate-400">
                              {String.fromCharCode(65 + optIdx)})
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation when submitted */}
                    {quizSubmitted && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                        💡 <strong>Izoh:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Submit Bar */}
            {!quizSubmitted ? (
              <button
                onClick={() => {
                  if (Object.keys(quizAnswers).length < PRACTICE_QUESTIONS.length) {
                    toast.error("Iltimos, barcha savollarga javob bering!");
                    return;
                  }
                  setQuizSubmitted(true);
                  toast.success("Test yakunlandi!");
                }}
                className="w-full btn-primary py-3.5 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
              >
                Testni Yakunlash va Natijani Ko'rish
              </button>
            ) : (
              <div className="card-standard p-6 text-center space-y-3 bg-emerald-50/60 border border-emerald-200">
                <h3 className="text-base font-black text-emerald-900">
                  Sizning Yakuniy Natijangiz: {calculateQuizScore()}%
                </h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  {calculateQuizScore() >= 80
                    ? "A'lo darajada! Siz klinik grammatik qoidalarni mukammal tushungansiz."
                    : "Qoniqarli. Qoidalarni qayta takrorlab, yana bir bor sinab ko'ring."}
                </p>
                <button
                  onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                  className="btn-secondary-soft text-xs py-2 px-4 shadow-2xs font-bold"
                >
                  Qayta Boshlash
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
