import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  RiBookOpenLine, RiCheckboxCircleLine, RiTimeLine,
  RiArrowRightLine, RiArrowLeftLine, RiStethoscopeLine,
  RiShieldCheckLine, RiRefreshLine, RiSparklingLine,
  RiFileTextLine, RiCloseLine, RiBarChartLine, RiCheckLine,
  RiErrorWarningLine, RiBrainLine,
  RiLineChartLine, RiGridLine, RiFlagLine, RiFlagFill, RiVolumeUpLine,
  RiDashboardLine, RiSearchLine,
  RiMedicineBottleLine, RiLightbulbLine, RiInformationLine, RiCheckDoubleLine
} from 'react-icons/ri';
import { Progress, RadialScore } from '../../components/ui';

export default function PrePostTestPage({ mode: propMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine mode: 'pre_test' or 'post_test'
  const mode = propMode || (location.pathname.includes('post-test') ? 'post_test' : 'pre_test');
  const isPre = mode === 'pre_test';

  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [result, setResult] = useState(null);
  const [growthAnalysis, setGrowthAnalysis] = useState(null);

  // Flow State
  const [testStarted, setTestStarted] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Taking test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qNumber]: 'A'|'B'|'C'|'D' }
  const [flagged, setFlagged] = useState({}); // { [qNumber]: boolean }
  const [submitting, setSubmitting] = useState(false);

  // Modals & Panels
  const [showQuestionsDrawer, setShowQuestionsDrawer] = useState(false);
  const [drawerFilter, setDrawerFilter] = useState('all'); // 'all' | 'unanswered' | 'flagged' | 'answered'
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  // Results & Review State
  const [showDetailedReview, setShowDetailedReview] = useState(true);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'correct' | 'incorrect'
  const [reviewSectionFilter, setReviewSectionFilter] = useState('all'); // 'all' | 'grammar' | 'vocab' | 'clinical'
  const [reviewSearch, setReviewSearch] = useState('');

  // Storage Key for draft
  const draftStorageKey = useMemo(() => {
    const uid = user?.id || 'anon';
    return `med_test_draft_${mode}_${uid}`;
  }, [mode, user?.id]);

  // Load test data
  useEffect(() => {
    fetchTestData();
  }, [mode]);

  // Check for saved draft answers in localStorage
  useEffect(() => {
    if (!completed && testData) {
      try {
        const saved = localStorage.getItem(draftStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.answers === 'object' && Object.keys(parsed.answers).length > 0) {
            setAnswers(parsed.answers);
            if (parsed.flagged) setFlagged(parsed.flagged);
            if (typeof parsed.elapsedTime === 'number') setElapsedTime(parsed.elapsedTime);
            setHasDraft(true);
          }
        }
      } catch (_) {}
    }
  }, [completed, testData, draftStorageKey]);

  // Timer Effect when test is actively in progress
  useEffect(() => {
    if (testStarted && !completed) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const next = prev + 1;
          // Periodically save elapsed time
          if (next % 5 === 0) {
            try {
              const currentDraft = localStorage.getItem(draftStorageKey);
              const parsed = currentDraft ? JSON.parse(currentDraft) : {};
              parsed.elapsedTime = next;
              localStorage.setItem(draftStorageKey, JSON.stringify(parsed));
            } catch (_) {}
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStarted, completed, draftStorageKey]);

  // Fetch Test from API
  const fetchTestData = () => {
    setLoading(true);
    const endpoint = isPre ? '/student/pre-test' : '/student/post-test';
    api.get(endpoint)
      .then(res => {
        const d = res.data;
        if (isPre) {
          setCompleted(Boolean(d.completed));
          if (d.completed) {
            setResult(d.result);
            setTestData(d.test_info);
          } else {
            setTestData(d.test);
          }
        } else {
          setIsUnlocked(d.is_unlocked !== false);
          setCompleted(Boolean(d.completed));
          setTestData(d.test);
          setResult(d.result);
          setGrowthAnalysis(d.growth_analysis);
        }
      })
      .catch(err => {
        toast.error(err.response?.data?.error || "Test ma'lumotlarini yuklashda xatolik yuz berdi");
      })
      .finally(() => setLoading(false));
  };

  // Select option handler
  const handleSelectOption = (qNumber, optionKey) => {
    setAnswers(prev => {
      const updated = { ...prev, [qNumber]: optionKey };
      try {
        localStorage.setItem(draftStorageKey, JSON.stringify({
          answers: updated,
          flagged,
          elapsedTime
        }));
      } catch (_) {}
      return updated;
    });
  };

  // Toggle flag handler
  const handleToggleFlag = (qNumber) => {
    setFlagged(prev => {
      const updated = { ...prev, [qNumber]: !prev[qNumber] };
      try {
        localStorage.setItem(draftStorageKey, JSON.stringify({
          answers,
          flagged: updated,
          elapsedTime
        }));
      } catch (_) {}
      return updated;
    });
  };

  // Reset/Start fresh
  const handleResetDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setAnswers({});
    setFlagged({});
    setElapsedTime(0);
    setHasDraft(false);
    setCurrentIndex(0);
    toast.success("Yangi urinish boshlandi");
    setTestStarted(true);
  };

  // TTS Voice Question Pronunciation
  const handleSpeakQuestion = (text) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Ovozli o'qish brauzeringizda qo'llab-quvvatlanmaydi");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const questions = testData?.questions || [];
  const totalQuestions = questions.length || 40;
  const currentQ = questions[currentIndex] || null;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!testStarted || completed || showQuestionsDrawer || showConfirmSubmit) return;

    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        if (currentQ) handleSelectOption(currentQ.number, key);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        if (currentQ) handleSelectOption(currentQ.number, map[e.key]);
      } else if (e.key === 'ArrowRight' || key === 'N') {
        setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || key === 'P') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (key === 'F') {
        if (currentQ) handleToggleFlag(currentQ.number);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testStarted, completed, showQuestionsDrawer, showConfirmSubmit, currentQ, totalQuestions, answers, flagged]);

  // Submit Test
  const handleSubmit = async () => {
    setShowConfirmSubmit(false);
    setSubmitting(true);
    try {
      const endpoint = isPre ? '/student/pre-test/submit' : '/student/post-test/submit';
      const res = await api.post(endpoint, {
        answers,
        time_spent_seconds: elapsedTime
      });

      // Clear draft on successful submit
      localStorage.removeItem(draftStorageKey);

      toast.success(isPre ? "Pre-test muvaffaqiyatli topshirildi!" : "Post-test yakunlandi!");
      setCompleted(true);
      setTestStarted(false);
      setResult(res.data.result);
      if (res.data.growth_analysis) {
        setGrowthAnalysis(res.data.growth_analysis);
      }
      if (res.data.evaluation) {
        setResult(prev => ({ ...prev, evaluation: res.data.evaluation }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Testni topshirishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Jump to first unanswered question
  const handleJumpToFirstUnanswered = () => {
    const firstUnansweredIndex = questions.findIndex(q => !answers[q.number]);
    if (firstUnansweredIndex !== -1) {
      setCurrentIndex(firstUnansweredIndex);
      setShowConfirmSubmit(false);
      setShowQuestionsDrawer(false);
    } else {
      toast.success("Barcha savollarga javob berilgan!");
    }
  };

  // Retake Pre-test handler
  const handleRetakeTest = () => {
    setShowRetakeConfirm(false);
    setCompleted(false);
    setResult(null);
    setAnswers({});
    setFlagged({});
    setElapsedTime(0);
    setCurrentIndex(0);
    localStorage.removeItem(draftStorageKey);
    setTestStarted(true);
  };

  // ══════════════════════════════════════════════════════════════
  // HELPER: Format Question Blank (renders "___" nicely as a highlighted badge)
  // ══════════════════════════════════════════════════════════════
  const renderFormattedQuestion = (text) => {
    if (!text) return null;
    if (!text.includes('___')) {
      return <span>{text}</span>;
    }
    const parts = text.split(/___+/);
    return (
      <span>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="inline-flex items-center px-2 py-0.5 mx-1.5 rounded-lg bg-blue-100/80 text-blue-800 font-mono font-bold text-xs tracking-widest border border-blue-300 shadow-2xs align-middle">
                [ _____ ]
              </span>
            )}
          </span>
        ))}
      </span>
    );
  };

  // Helper for Section Category Tag & Icon
  const getSectionInfo = (sectionName) => {
    const s = (sectionName || '').toLowerCase();
    if (s.includes('grammar') || s.includes('section a')) {
      return {
        label: "Tibbiy grammatika",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        icon: RiFileTextLine
      };
    }
    if (s.includes('vocab') || s.includes('section b')) {
      return {
        label: "Tibbiy leksika & terminologiya",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        icon: RiMedicineBottleLine
      };
    }
    return {
      label: "Klinik muloqot & Konsultatsiya",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: RiStethoscopeLine
    };
  };

  // Filtered review questions
  const filteredReviewDetails = useMemo(() => {
    if (!result?.quiz_details) return [];
    let list = result.quiz_details;

    if (reviewFilter === 'correct') {
      list = list.filter(d => d.is_correct);
    } else if (reviewFilter === 'incorrect') {
      list = list.filter(d => !d.is_correct);
    }

    if (reviewSectionFilter !== 'all') {
      list = list.filter(d => {
        const sec = (d.section || '').toLowerCase();
        if (reviewSectionFilter === 'grammar') return sec.includes('grammar') || sec.includes('section a');
        if (reviewSectionFilter === 'vocab') return sec.includes('vocab') || sec.includes('section b');
        if (reviewSectionFilter === 'clinical') return !sec.includes('grammar') && !sec.includes('vocab');
        return true;
      });
    }

    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase().trim();
      list = list.filter(d =>
        d.question.toLowerCase().includes(q) ||
        String(d.number).includes(q)
      );
    }

    return list;
  }, [result?.quiz_details, reviewFilter, reviewSectionFilter, reviewSearch]);

  // ══════════════════════════════════════════════════════════════
  // VIEW: LOADING SKELETON
  // ══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
          <div className="h-32 bg-white rounded-3xl border border-slate-200 shadow-sm" />
          <div className="h-96 bg-white rounded-3xl border border-slate-200 shadow-sm" />
          <div className="h-20 bg-white rounded-3xl border border-slate-200 shadow-sm" />
        </div>
      </Layout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: POST-TEST LOCKED (If modules are not yet completed)
  // ══════════════════════════════════════════════════════════════
  if (!isPre && !isUnlocked && !completed) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center text-4xl mb-6 shadow-sm">
            <RiShieldCheckLine />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
            Post-test hozircha qulflangan
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto text-sm sm:text-base">
            Yakuniy Post-test va O'sish tahlilini topshirish uchun avval mutaxassisligingiz bo'yicha barcha o'quv modullarini kamida 60% natija bilan muvaffaqiyatli yakunlashingiz kerak.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/student/modules')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 text-sm"
            >
              <RiBookOpenLine className="text-lg" /> O'quv modullariga o'tish
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: COMPLETED TEST RESULT & LEARNING GAIN ANALYSIS
  // ══════════════════════════════════════════════════════════════
  if (completed && result) {
    const score = result.overall_score ?? result.quiz_score ?? 0;
    const details = result.quiz_details || [];
    const correctCount = details.filter(d => d.is_correct).length;
    const totalQCount = details.length || questions.length || 40;
    const recommendations = result.evaluation?.recommendations || [];
    const cefr = result.evaluation?.cefr_level || (score >= 80 ? 'B2 Clinical Pro' : score >= 60 ? 'B1 Medical' : 'A2 Foundation');

    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 shadow-2xl border border-blue-900/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wide border border-blue-400/30 mb-4">
                <RiSparklingLine className="text-amber-400 text-sm" />
                {isPre ? "Dastlabki diagnostik baholash (Pre-test)" : "Yakuniy baholash & O'sish tahlili (Post-test)"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                {isPre
                  ? "Dastlabki bilim darajangiz muvaffaqiyatli qayd etildi!"
                  : "Post-test yakunlandi va o'sish tahlili hisoblandi!"}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {isPre
                  ? "Pre-test natijasi sizning kursni boshlashdan oldingi boshlang'ich ko'rsatkichingiz hisoblanadi. Endi o'quv modullarini to'liq o'rganishingiz mumkin!"
                  : "Kurs davomida erishgan ilmiy o'sish sur'atingiz (Learning Gain) va tibbiy ingliz tili kompetensiyalaringiz dinamikasi quyida keltirilgan."}
              </p>
            </div>
          </div>

          {/* ─── POST-TEST SPECIFIC: LEARNING GAIN & GROWTH HERO ─── */}
          {!isPre && growthAnalysis && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl border border-indigo-100">
                    <RiLineChartLine />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      O'sish va Dinamika Tahlili (PhD Experiment: Learning Gain)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pre-test (boshlang'ich) vs Post-test (yakuniy) ilmiy taqqoslovi
                    </p>
                  </div>
                </div>
                <div className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {growthAnalysis.gain_category_uz}
                </div>
              </div>

              {/* 3 Comparative KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Boshlang'ich (Pre-test)
                  </span>
                  <div className="text-3xl font-extrabold text-slate-800 mt-2">
                    {growthAnalysis.pre_score}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Kurs boshlanishidagi daraja</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center shadow-lg shadow-emerald-500/20">
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                    Umumiy O'sish (Gain)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-2">
                    {growthAnalysis.absolute_gain >= 0 ? `+${growthAnalysis.absolute_gain}` : growthAnalysis.absolute_gain} ball
                  </div>
                  <p className="text-xs text-emerald-100 mt-1 font-medium">
                    {growthAnalysis.percentage_gain >= 0 ? `+${growthAnalysis.percentage_gain}%` : `${growthAnalysis.percentage_gain}%`} nisbiy o'sish sur'ati
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Yakuniy (Post-test)
                  </span>
                  <div className="text-3xl font-extrabold text-indigo-700 mt-2">
                    {growthAnalysis.post_score}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Kurs yakunidagi natija</p>
                </div>
              </div>

              {/* Pedagogical Summary Text */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-xs sm:text-sm text-indigo-950 leading-relaxed">
                <span className="font-bold text-indigo-900 block mb-1 flex items-center gap-1.5">
                  <RiBrainLine className="text-indigo-600 text-base" /> Ilmiy-tadqiqot pedagogik xulosasi:
                </span>
                {growthAnalysis.pedagogical_summary?.uz || growthAnalysis.pedagogical_summary?.en}
              </div>

              {/* Competencies Delta Breakdown */}
              {growthAnalysis.competencies && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700">
                    Ko'nikmalar kesimida o'sish dinamikasi (Pre ➔ Post):
                  </h3>
                  <div className="space-y-3">
                    {/* Grammar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Tibbiy grammatika (Clinical Grammar)</span>
                        <span className="text-emerald-600 font-bold">
                          {growthAnalysis.competencies.grammar.pre}% ➔ {growthAnalysis.competencies.grammar.post}% ({growthAnalysis.competencies.grammar.delta >= 0 ? `+${growthAnalysis.competencies.grammar.delta}%` : `${growthAnalysis.competencies.grammar.delta}%`})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${growthAnalysis.competencies.grammar.pre}%` }} className="bg-slate-300 h-full" />
                        <div style={{ width: `${Math.max(0, growthAnalysis.competencies.grammar.delta)}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>

                    {/* Vocabulary */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Tibbiy leksika va terminologiya (Medical Vocabulary)</span>
                        <span className="text-emerald-600 font-bold">
                          {growthAnalysis.competencies.vocab.pre}% ➔ {growthAnalysis.competencies.vocab.post}% ({growthAnalysis.competencies.vocab.delta >= 0 ? `+${growthAnalysis.competencies.vocab.delta}%` : `${growthAnalysis.competencies.vocab.delta}%`})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${growthAnalysis.competencies.vocab.pre}%` }} className="bg-slate-300 h-full" />
                        <div style={{ width: `${Math.max(0, growthAnalysis.competencies.vocab.delta)}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>

                    {/* Clinical Consultation */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Klinik muloqot va amaliy qo'llash (Clinical Consultation)</span>
                        <span className="text-emerald-600 font-bold">
                          {growthAnalysis.competencies.clinical.pre}% ➔ {growthAnalysis.competencies.clinical.post}% ({growthAnalysis.competencies.clinical.delta >= 0 ? `+${growthAnalysis.competencies.clinical.delta}%` : `${growthAnalysis.competencies.clinical.delta}%`})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${growthAnalysis.competencies.clinical.pre}%` }} className="bg-slate-300 h-full" />
                        <div style={{ width: `${Math.max(0, growthAnalysis.competencies.clinical.delta)}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── GENERAL SCORE CARD & COMPETENCIES ─── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Radial Score Gauge */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/30 border border-slate-100 text-center">
                <RadialScore value={score} size={118} stroke={11} label={isPre ? "Pre-test" : "Post-test"} />
                <div className="mt-3 text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                    CEFR: {cefr}
                  </span>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">
                    {correctCount} / {totalQCount} ta to'g'ri javob ({score}%)
                  </p>
                </div>
              </div>

              {/* Competencies 3 Pillars */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                  <RiBarChartLine className="text-blue-600" />
                  Baholangan kompetensiyalar natijalari:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                    <span className="text-xs text-slate-500 block mb-1 font-semibold">Tibbiy Grammatika</span>
                    <span className="text-2xl font-black text-blue-700">
                      {result.grammar_score ?? 0}%
                    </span>
                    <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div style={{ width: `${result.grammar_score ?? 0}%` }} className="bg-blue-600 h-full rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                    <span className="text-xs text-slate-500 block mb-1 font-semibold">Tibbiy Leksika</span>
                    <span className="text-2xl font-black text-purple-700">
                      {result.vocab_score ?? 0}%
                    </span>
                    <div className="w-full bg-purple-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div style={{ width: `${result.vocab_score ?? 0}%` }} className="bg-purple-600 h-full rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <span className="text-xs text-slate-500 block mb-1 font-semibold">Klinik Muloqot</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {result.clinical_score ?? 0}%
                    </span>
                    <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div style={{ width: `${result.clinical_score ?? 0}%` }} className="bg-emerald-600 h-full rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <RiLightbulbLine className="text-amber-600 text-sm" />
                      Individual pedagogik tavsiyalar:
                    </div>
                    <ul className="text-xs text-amber-950 space-y-1.5 list-disc list-inside">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="leading-relaxed">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {isPre ? (
                    <button
                      onClick={() => navigate('/student/modules')}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 text-sm"
                    >
                      <RiBookOpenLine /> O'quv modullarini boshlash <RiArrowRightLine />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/student/dashboard')}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 text-sm"
                    >
                      <RiDashboardLine /> Dashboardga qaytish
                    </button>
                  )}

                  {isPre && (
                    <button
                      onClick={() => setShowRetakeConfirm(true)}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5"
                    >
                      <RiRefreshLine /> Qaytadan topshirish
                    </button>
                  )}

                  <button
                    onClick={() => setShowDetailedReview(!showDetailedReview)}
                    className="px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5 ml-auto"
                  >
                    <RiFileTextLine /> {showDetailedReview ? "Tahlilni yashirish" : "Savollar tahlilini ko'rish"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── DETAILED ANSWERS REVIEW WITH ADVANCED FILTERS ─── */}
          {showDetailedReview && details.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <RiCheckboxCircleLine className="text-emerald-500 text-xl" />
                    Savolma-savol to'liq tahlil
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Har bir savol bo'yicha berilgan javoblar va to'g'ri variantlar
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reviewFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Barchasi ({details.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reviewFilter === 'correct'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    To'g'ri ({correctCount})
                  </button>
                  <button
                    onClick={() => setReviewFilter('incorrect')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reviewFilter === 'incorrect'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Xato ({details.length - correctCount})
                  </button>
                </div>
              </div>

              {/* Sub-Filters: Category & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Savollar matnidan qidirish..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  {reviewSearch && (
                    <button
                      onClick={() => setReviewSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <RiCloseLine />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={reviewSectionFilter}
                    onChange={(e) => setReviewSectionFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Barcha bo'limlar</option>
                    <option value="grammar">Grammatika</option>
                    <option value="vocab">Leksika & Terminlar</option>
                    <option value="clinical">Klinik muloqot</option>
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {filteredReviewDetails.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    Tanlangan filtr bo'yicha savollar topilmadi.
                  </div>
                ) : (
                  filteredReviewDetails.map((d) => {
                    const sec = getSectionInfo(d.section);
                    const matchingQ = questions.find(q => q.number === d.number);
                    const opts = d.options && Object.keys(d.options).length > 0 ? d.options : matchingQ?.options;

                    return (
                      <div
                        key={d.number}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          d.is_correct
                            ? 'bg-emerald-50/30 border-emerald-200/80'
                            : 'bg-rose-50/30 border-rose-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-500">
                              Savol #{d.number}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sec.badgeClass}`}>
                              {sec.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSpeakQuestion(d.question)}
                              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all text-sm"
                              title="Ingliz tilida tinglash"
                            >
                              <RiVolumeUpLine />
                            </button>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              d.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {d.is_correct ? "To'g'ri" : "Noto'g'ri"}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-slate-800 mb-3 leading-relaxed">
                          {renderFormattedQuestion(d.question)}
                        </p>

                        {/* If options available, render full 4-option breakdown */}
                        {opts && Object.keys(opts).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100">
                            {['A', 'B', 'C', 'D'].map(optKey => {
                              const text = opts[optKey];
                              if (!text) return null;
                              const isCorrectOpt = optKey === d.correct_option;
                              const isStudentSelected = optKey === d.selected_option;

                              let optCardStyle = 'bg-white border-slate-200 text-slate-700';
                              if (isCorrectOpt) {
                                optCardStyle = 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-semibold';
                              } else if (isStudentSelected && !d.is_correct) {
                                optCardStyle = 'bg-rose-100/70 border-rose-300 text-rose-950 font-semibold';
                              }

                              return (
                                <div
                                  key={optKey}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${optCardStyle}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      isCorrectOpt ? 'bg-emerald-600 text-white' : isStudentSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {optKey}
                                    </span>
                                    <span className="truncate">{text}</span>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold">
                                    {isCorrectOpt && (
                                      <span className="text-emerald-700">✓ To'g'ri</span>
                                    )}
                                    {isStudentSelected && (
                                      <span className={d.is_correct ? 'text-emerald-700' : 'text-rose-700'}>
                                        (Siz)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-4 text-xs pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-slate-500">Sizning javobingiz: </span>
                              <span className={`font-bold ${d.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {d.selected_option || 'Belgilanmagan'}
                              </span>
                            </div>
                            {!d.is_correct && (
                              <div>
                                <span className="text-slate-500">To'g'ri javob: </span>
                                <span className="font-bold text-emerald-700">{d.correct_option}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Modal: Confirm Retake */}
          {showRetakeConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-3xl">
                  <RiRefreshLine />
                </div>
                <h3 className="font-extrabold text-slate-800 text-xl">
                  Pre-testni qayta topshirasizmi?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sizning avvalgi natijangiz yangi urinish natijasi bilan yangilanadi. Qaytadan urinishni boshlashga tayyormisiz?
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowRetakeConfirm(false)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleRetakeTest}
                    className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    Ha, boshlash
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: PRE-TEST INTRO / LOBBY SCREEN (If not yet started)
  // ══════════════════════════════════════════════════════════════
  if (!testStarted) {
    const specName = testData?.specialty_name || user?.specialty_name || "Tibbiyot yo'nalishi";

    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6 pb-16">
          {/* Header Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-7 sm:p-10 shadow-xl border border-blue-900/40">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wide border border-blue-400/30">
                <RiSparklingLine className="text-amber-400" />
                {isPre ? "Boshlang'ich tashxisiy baholash" : "Yakuniy baholash & O'sish tahlili"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isPre ? `${specName} — Pre-test` : `${specName} — Post-test`}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                {isPre
                  ? "Pre-test orqali o'quv modullarini boshlashdan avvalgi kasbiy ingliz tili darajangiz (CEFR: A2, B1, B2) va asosiy klinik kompetensiyalaringiz diagnostika qilinadi."
                  : "Post-test orqali barcha modullarni o'zlashtirgandan so'ng erishgan o'sish sur'atingiz (Learning Gain) aniqlanadi."}
              </p>
            </div>
          </div>

          {/* 3 Diagnostic Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100">
                <RiFileTextLine />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Tibbiy Grammatika
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Klinik zamonlar, passiv strukturalar va tibbiy hisobotlarda qo'llaniluvchi grammatik qoidalar (10 ta savol).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl border border-purple-100">
                <RiMedicineBottleLine />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Tibbiy Leksika
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anatomiya, kasallik belgilari, dori guruhlari va ixtisoslashgan terminologiya (15 ta savol).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-100">
                <RiStethoscopeLine />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Klinik Muloqot
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bemor bilan konsultatsiya o'tkazish, shikoyat va anamnez yig'ishdagi dialoglar (15 ta savol).
              </p>
            </div>
          </div>

          {/* Test Guidelines & Parameters */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <RiInformationLine className="text-blue-600 text-lg" />
              Test topshirish qoidalari va yo'riqnoma:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <RiCheckLine className="text-emerald-500 text-base shrink-0 mt-0.5" />
                <span><strong>40 ta savol:</strong> Har bir savolda 4 ta variantdan (A, B, C, D) faqat bitta to'g'ri javob mavjud.</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <RiTimeLine className="text-blue-500 text-base shrink-0 mt-0.5" />
                <span><strong>Vaqt chegarasi yo'q:</strong> O'rtacha 20–30 daqiqa vaqt ajratish tavsiya qilinadi.</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <RiRefreshLine className="text-purple-500 text-base shrink-0 mt-0.5" />
                <span><strong>Erkin harakatlanish:</strong> Istalgan savolga qaytish va javobni o'zgartirish mumkin.</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <RiShieldCheckLine className="text-emerald-500 text-base shrink-0 mt-0.5" />
                <span><strong>Jarima ballari yo'q:</strong> Barcha savollarga diqqat bilan javob belgilash tavsiya etiladi.</span>
              </div>
            </div>

            {/* Saved draft alert */}
            {hasDraft && answeredCount > 0 && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {answeredCount}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">
                      Saqlangan qoralama mavjud
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Siz avval {answeredCount} ta savolga javob belgilagansiz.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetDraft}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all border border-slate-200"
                  >
                    Boshidan boshlash
                  </button>
                  <button
                    onClick={() => setTestStarted(true)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-sm"
                  >
                    Davom ettirish
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => navigate('/student/modules')}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
            >
              Modullarga qaytish
            </button>

            <button
              onClick={() => setTestStarted(true)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center gap-2 transform active:scale-98"
            >
              {hasDraft ? "Testni davom ettirish" : "Testni boshlash"} <RiArrowRightLine className="text-lg" />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: ACTIVE TEST TAKING (Question-by-Question HUD Interface)
  // ══════════════════════════════════════════════════════════════
  const sec = getSectionInfo(currentQ?.section);
  const isCurrentFlagged = Boolean(flagged[currentQ?.number]);
  const currentSelectedOpt = answers[currentQ?.number] || '';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5 pb-20">
        {/* ─── HUD TOP BAR ─── */}
        <div className="sticky top-3 z-30 bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-md shadow-slate-200/40 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                {currentIndex + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 tracking-tight truncate">
                    {isPre ? "Pre-test" : "Post-test"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    #{currentQ?.number} / {totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <RiCheckDoubleLine /> {answeredCount} ta belgilandi
                  </span>
                  {flaggedCount > 0 && (
                    <span className="text-amber-600 font-bold flex items-center gap-0.5">
                      • {flaggedCount} ta belgilangan
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right HUD Controls: Timer & Matrix Toggle & Submit */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Timer Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                <RiTimeLine className="text-blue-500" />
                {formatTime(elapsedTime)}
              </div>

              {/* Questions Drawer Button */}
              <button
                onClick={() => setShowQuestionsDrawer(true)}
                className="px-3.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                title="Barcha savollar ro'yxati"
              >
                <RiGridLine />
                <span className="hidden sm:inline">Savollar</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {unansweredCount > 0 ? `${unansweredCount} qoldi` : 'To\'liq'}
                </span>
              </button>

              {/* Quick Submit Button */}
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-3.5 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
              >
                Yakunlash
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Bajarilish: {progressPct}%</span>
              <span>{answeredCount} / {totalQuestions} savol</span>
            </div>
            <Progress value={progressPct} tone="blue" height="h-2" />
          </div>
        </div>

        {/* ─── CURRENT QUESTION CARD ─── */}
        {currentQ && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            {/* Question Header & Section Meta */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sec.badgeClass}`}>
                  <sec.icon className="text-sm" />
                  {sec.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio TTS button */}
                <button
                  onClick={() => handleSpeakQuestion(currentQ.question)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Savolni inglizcha tinglash"
                >
                  <RiVolumeUpLine className="text-sm" /> Tinglash
                </button>

                {/* Flag for review button */}
                <button
                  onClick={() => handleToggleFlag(currentQ.number)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isCurrentFlagged
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Savolni qayta ko'rib chiqish uchun belgilash"
                >
                  {isCurrentFlagged ? <RiFlagFill className="text-amber-500" /> : <RiFlagLine />}
                  <span>{isCurrentFlagged ? "Belgilangan" : "Belgilash"}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {renderFormattedQuestion(currentQ.question)}
            </div>

            {/* 4 Options (A, B, C, D) */}
            <div className="space-y-3 pt-2">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = currentQ.options?.[optKey] || '';
                if (!optText) return null;
                const isSelected = currentSelectedOpt === optKey;

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectOption(currentQ.number, optKey)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 group ${
                      isSelected
                        ? 'border-blue-600 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 text-blue-950 shadow-md shadow-blue-500/10'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}>
                        {optKey}
                      </div>
                      <span className="text-sm sm:text-base font-semibold pt-1 leading-snug break-words">
                        {optText}
                      </span>
                    </div>

                    <div className="shrink-0 pt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 group-hover:border-slate-400'
                      }`}>
                        {isSelected && <RiCheckLine className="text-xs" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Keyboard hint toolbar */}
            <div className="hidden sm:flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100">
              <span>⌨️ Tugmalar: A, B, C, D — variantlar</span>
              <span>← / → — o'tish</span>
              <span>F — belgilash</span>
            </div>
          </div>
        )}

        {/* ─── BOTTOM NAVIGATION TOOLBAR ─── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RiArrowLeftLine /> Oldingi
          </button>

          {/* Quick jump to next unanswered */}
          {unansweredCount > 0 && (
            <button
              onClick={handleJumpToFirstUnanswered}
              className="hidden sm:flex px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs items-center gap-1.5 transition-all"
            >
              Belgilanmaganiga o'tish ({unansweredCount})
            </button>
          )}

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-1.5"
            >
              Keyingi <RiArrowRightLine />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <RiCheckboxCircleLine className="text-lg" /> Testni yakunlash
            </button>
          )}
        </div>

        {/* ─── MODAL: QUESTIONS MATRIX DRAWER ─── */}
        {showQuestionsDrawer && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <RiGridLine className="text-blue-600" /> Savollar xaritasi (Matrix)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Istalgan savolga to'g'ridan-to'g'ri o'tish uchun raqamni bosing
                  </p>
                </div>
                <button
                  onClick={() => setShowQuestionsDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
                >
                  <RiCloseLine />
                </button>
              </div>

              {/* Filter Tabs in Drawer */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setDrawerFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    drawerFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Barchasi ({totalQuestions})
                </button>
                <button
                  onClick={() => setDrawerFilter('unanswered')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    drawerFilter === 'unanswered'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Javob berilmagan ({unansweredCount})
                </button>
                <button
                  onClick={() => setDrawerFilter('flagged')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    drawerFilter === 'flagged'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Belgilangan ({flaggedCount})
                </button>
                <button
                  onClick={() => setDrawerFilter('answered')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    drawerFilter === 'answered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Javob berilgan ({answeredCount})
                </button>
              </div>

              {/* Grid of Question Number Buttons */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 py-2">
                {questions.map((q, idx) => {
                  const isAns = Boolean(answers[q.number]);
                  const isFlag = Boolean(flagged[q.number]);
                  const isCurr = idx === currentIndex;

                  // Apply Filter
                  if (drawerFilter === 'unanswered' && isAns) return null;
                  if (drawerFilter === 'flagged' && !isFlag) return null;
                  if (drawerFilter === 'answered' && !isAns) return null;

                  return (
                    <button
                      key={q.number}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowQuestionsDrawer(false);
                      }}
                      className={`h-11 rounded-2xl font-bold text-xs flex flex-col items-center justify-center relative transition-all ${
                        isCurr
                          ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : isAns
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span>{q.number}</span>
                      {isFlag && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                      {isAns && !isCurr && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Legend */}
              <div className="pt-2 flex flex-wrap gap-4 items-center text-[11px] text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-blue-600" /> Hozirgi
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-blue-50 border border-blue-200" /> Bajarilgan
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" /> Belgilangan
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-slate-100" /> Javob berilmagan
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL: CONFIRM SUBMISSION ─── */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 text-center">
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl border ${
                unansweredCount > 0 ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {unansweredCount > 0 ? <RiErrorWarningLine /> : <RiCheckboxCircleLine />}
              </div>

              <h3 className="font-extrabold text-slate-800 text-xl">
                Testni yakunlaysizmi?
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2 text-left">
                <div className="flex justify-between font-semibold">
                  <span>Jami savollar:</span>
                  <span className="font-bold text-slate-800">{totalQuestions} ta</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Javob berilgan:</span>
                  <span className="font-bold text-emerald-600">{answeredCount} ta ({progressPct}%)</span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex justify-between font-semibold text-rose-600">
                    <span>Javob berilmagan:</span>
                    <span className="font-bold">{unansweredCount} ta</span>
                  </div>
                )}
                {flaggedCount > 0 && (
                  <div className="flex justify-between font-semibold text-amber-600">
                    <span>Belgilab qo'yilgan:</span>
                    <span className="font-bold">{flaggedCount} ta</span>
                  </div>
                )}
              </div>

              {unansweredCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 text-left">
                  <span className="font-bold block mb-1">⚠️ Diqqat:</span>
                  Siz {unansweredCount} ta savolga javob belgilamadingiz. Belgilanmagan savollarga 0 ball hisoblanadi.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                {unansweredCount > 0 ? (
                  <button
                    onClick={handleJumpToFirstUnanswered}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  >
                    Davom etish
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  >
                    Qaytish
                  </button>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? "Baholanmoqda..." : "Ha, yakunlash"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}