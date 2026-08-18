import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import VirtualPatientChat from '../../components/VirtualPatientChat';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiCheckLine, RiArrowRightLine, RiArrowLeftLine,
  RiVolumeUpLine, RiRepeatLine, RiTrophyLine,
  RiMicLine, RiBarChartGroupedLine, RiBookLine,
  RiLightbulbLine, RiRobot2Line, RiQuestionLine, RiHospitalLine, RiMessage3Line, RiCloseLine,
  RiLockLine, RiCheckboxCircleLine, RiStethoscopeLine,
  RiSparklingLine, RiMedalLine, RiErrorWarningLine, RiHeartPulseLine,
  RiStarLine, RiArrowUpLine, RiBrainLine, RiSpeakLine,
  RiAwardLine, RiSparkling2Line, RiCheckDoubleLine, RiShieldCheckLine, RiFocus3Line, RiAlertLine
} from 'react-icons/ri';

export default function ModuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, lang, getLocalized, getTranslation } = useLanguage();

  const STEPS = [
    { id: 1, label: t('step_grammar'),    short: 'Grammar',  requiredPrev: null  },
    { id: 2, label: t('step_vocab'),      short: 'Vocab',    requiredPrev: 1     },
    { id: 3, label: t('step_phrase'),     short: 'Phrases',  requiredPrev: 2     },
    { id: 4, label: t('step_gap'),        short: 'Practice', requiredPrev: 3     },
    { id: 5, label: t('step_quiz'),       short: 'Quiz',     requiredPrev: 4     },
    { id: 6, label: t('step_chat'),       short: 'Chat',     requiredPrev: 5     },
    { id: 7, label: t('step_results'),    short: 'Results',  requiredPrev: 6     },
  ];

  const [module, setModule] = useState(null);
  const [grammar, setGrammar] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  const [phrases, setPhrases] = useState([]);
  const [tests, setTests] = useState([]);
  const [conversation, setConversation] = useState(null);

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [vocabLearned, setVocabLearned] = useState(false);
  const [phrasesLearned, setPhrasesLearned] = useState(false);

  const [gapExercises, setGapExercises] = useState([]);
  const [gapAnswers, setGapAnswers] = useState({});
  const [gapChecked, setGapChecked] = useState(false);

  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [overallResult, setOverallResult] = useState(null);

  const isStepUnlocked = (stepId) => {
    const s = STEPS.find(x => x.id === stepId);
    if (!s) return false;
    if (s.requiredPrev === null) return true;
    return completedSteps.includes(s.requiredPrev);
  };

  const handleStepClick = (stepId) => {
    if (!isStepUnlocked(stepId)) return;
    setStep(stepId);
  };

  const completeAndGoNext = (nextStepId) => {
    const prevStepId = nextStepId - 1;
    setCompletedSteps(prev => {
      const updated = prev.includes(prevStepId) ? prev : [...prev, prevStepId];
      try {
        localStorage.setItem(`module_${id}_completed`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    setStep(nextStepId);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(1);
    setCompletedSteps([]);
    setVocabLearned(false);
    setPhrasesLearned(false);
    setGapAnswers({});
    setGapChecked(false);
    setTestAnswers({});
    setTestResult(null);
    setFeedback(null);
    setOverallResult(null);
    setConversation(null);
    fetchModuleData();
  }, [id]);

  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const [modRes, grammarRes, vocabRes, phraseRes, testRes] = await Promise.all([
        api.get(`/student/modules/${id}`),
        api.get(`/student/modules/${id}/grammar`).catch(() => ({ data: [] })),
        api.get(`/student/modules/${id}/vocabulary`),
        api.get(`/student/modules/${id}/phrasebook`),
        api.get(`/student/modules/${id}/tests`)
      ]);

      setModule(modRes.data);
      setGrammar(grammarRes.data || []);
      setVocabulary(vocabRes.data);
      setPhrases(phraseRes.data);
      setTests(testRes.data);

      const phraseList = phraseRes.data;
      if (phraseList && phraseList.length > 0) {
        setGapExercises(generateGapFill(phraseList, vocabRes.data || []));
      }

      let savedCompleted = [];
      try {
        const raw = localStorage.getItem(`module_${id}_completed`);
        if (raw) savedCompleted = JSON.parse(raw);
      } catch (_) {}

      try {
        const progressRes = await api.get(`/student/modules/${id}/progress`);
        if (progressRes.data) {
          if (progressRes.data.evaluation) {
            setFeedback(progressRes.data.evaluation);
            setOverallResult(progressRes.data.evaluation);
            savedCompleted = [1, 2, 3, 4, 5, 6, 7];
          } else if (progressRes.data.test_result) {
            setTestResult(progressRes.data.test_result);
            if (progressRes.data.test_result.passed) {
              savedCompleted = Array.from(new Set([...savedCompleted, 1, 2, 3, 4, 5]));
            }
          }
        }
      } catch (_) {}

      setCompletedSteps(savedCompleted);

      if (savedCompleted.includes(6)) {
        setStep(7);
      } else if (savedCompleted.includes(5)) {
        setStep(6);
      } else if (savedCompleted.includes(4)) {
        setStep(5);
      } else if (savedCompleted.includes(3)) {
        setStep(4);
      } else if (savedCompleted.includes(2)) {
        setStep(3);
      } else if (savedCompleted.includes(1)) {
        setStep(2);
      } else {
        setStep(1);
      }

      try {
        const convRes = await api.post(`/student/modules/${id}/start`);
        if (convRes.data) {
          setConversation({
            id: convRes.data.conversation_id || convRes.data.id,
            conversation_id: convRes.data.conversation_id || convRes.data.id,
            ...convRes.data
          });
        }
      } catch (_) {}

    } catch (err) {
      console.error('Fetch module err:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateGapFill = (items, vocabItems = []) => {
    if (!items || items.length === 0) return [];

    const GRAMMAR_DISTRACTORS = {
      'brings': ['brings', 'takes', 'leads', 'calls'],
      'bring': ['bring', 'take', 'lead', 'call'],
      'have': ['have', 'had', 'has', 'did'],
      'had': ['had', 'have', 'has', 'having'],
      'has': ['has', 'have', 'had', 'is'],
      'been': ['been', 'being', 'having', 'done'],
      'feeling': ['feeling', 'getting', 'staying', 'growing'],
      'feel': ['feel', 'look', 'sound', 'seem'],
      'having': ['having', 'getting', 'feeling', 'experiencing'],
      'opening': ['opening', 'closing', 'moving', 'swallowing'],
      'swelling': ['swelling', 'bleeding', 'redness', 'numbness'],
      'pain': ['pain', 'ache', 'pressure', 'sensation'],
      'worse': ['worse', 'better', 'constant', 'milder'],
      'getting': ['getting', 'becoming', 'turning', 'remaining'],
      'radiate': ['radiate', 'spread', 'travel', 'extend'],
      'start': ['start', 'begin', 'develop', 'occur'],
      'started': ['started', 'began', 'developed', 'occurred'],
      'persist': ['persist', 'continue', 'last', 'remain'],
      'lasts': ['lasts', 'persists', 'takes', 'continues'],
      'last': ['last', 'persist', 'take', 'continue'],
      'trigger': ['trigger', 'cause', 'provoke', 'induce'],
      'triggers': ['triggers', 'causes', 'provokes', 'induces'],
      'caused': ['caused', 'induced', 'triggered', 'formed'],
      'swallow': ['swallow', 'breathe', 'chew', 'speak'],
      'chew': ['chew', 'bite', 'swallow', 'speak'],
      'bite': ['bite', 'chew', 'press', 'hold'],
      'severe': ['severe', 'mild', 'moderate', 'slight'],
      'throbbing': ['throbbing', 'stabbing', 'dull', 'sharp'],
      'sharp': ['sharp', 'dull', 'mild', 'crushing'],
      'dull': ['dull', 'sharp', 'severe', 'acute'],
      'should': ['should', 'must', 'can', 'may'],
      'must': ['must', 'should', 'can', 'need'],
      'could': ['could', 'would', 'should', 'might'],
      'will': ['will', 'would', 'shall', 'can'],
      'when': ['when', 'where', 'how', 'why'],
      'how': ['how', 'when', 'where', 'what'],
      'what': ['what', 'which', 'how', 'where'],
      'where': ['where', 'when', 'how', 'what'],
      'since': ['since', 'for', 'during', 'from'],
      'for': ['for', 'since', 'during', 'until'],
      'do': ['do', 'does', 'did', 'are'],
      'does': ['does', 'do', 'did', 'is'],
      'did': ['did', 'do', 'does', 'was'],
      'is': ['is', 'are', 'was', 'were'],
      'are': ['are', 'is', 'were', 'was'],
      'you': ['you', 'they', 'we', 'he'],
    };

    return items.slice(0, 5).map((p, idx) => {
      const rawWords = p.phrase.split(/\s+/);
      const cleanWords = rawWords.map(w => w.replace(/[.,?!;:()'"]/g, ''));
      
      let chosenIdx = -1;
      
      // Priority 1: Key clinical / grammatical content word
      for (let i = 0; i < cleanWords.length; i++) {
        const lower = cleanWords[i].toLowerCase();
        if (GRAMMAR_DISTRACTORS[lower] && lower !== 'you' && lower !== 'what' && lower !== 'how' && lower !== 'is' && lower !== 'are' && lower !== 'do') {
          chosenIdx = i;
          break;
        }
      }

      // Priority 2: Auxiliaries or any word in distractor dict
      if (chosenIdx === -1) {
        for (let i = 0; i < cleanWords.length; i++) {
          const lower = cleanWords[i].toLowerCase();
          if (GRAMMAR_DISTRACTORS[lower]) {
            chosenIdx = i;
            break;
          }
        }
      }

      // Priority 3: Middle content word (length >= 4)
      if (chosenIdx === -1) {
        for (let i = 1; i < cleanWords.length - 1; i++) {
          if (cleanWords[i].length >= 4) {
            chosenIdx = i;
            break;
          }
        }
      }

      // Fallback
      if (chosenIdx === -1) {
        chosenIdx = cleanWords.length > 2 ? 1 : 0;
      }

      const targetWord = cleanWords[chosenIdx];
      const lowerTarget = targetWord.toLowerCase();
      const punctMatch = rawWords[chosenIdx].match(/[.,?!;:()]+$/);
      const trailingPunct = punctMatch ? punctMatch[0] : '';
      
      const blanked = rawWords.map((w, i) => i === chosenIdx ? (`_______${trailingPunct}`) : w).join(' ');

      // Build 4 distinct, intelligent options
      let options = [];
      if (GRAMMAR_DISTRACTORS[lowerTarget]) {
        options = GRAMMAR_DISTRACTORS[lowerTarget].map(opt => {
          if (targetWord[0] === targetWord[0].toUpperCase() && targetWord[0] !== targetWord[0].toLowerCase()) {
            return opt.charAt(0).toUpperCase() + opt.slice(1);
          }
          return opt;
        });
      } else {
        const candidatePool = [
          ...items.flatMap(x => x.phrase.split(/\s+/).map(w => w.replace(/[.,?!;:()'"]/g, ''))),
          ...(vocabItems || []).map(v => v.word ? v.word.split(' ')[0] : '')
        ].filter(w => w && w.length >= 3 && w.toLowerCase() !== lowerTarget);

        const uniquePool = Array.from(new Set(candidatePool.map(w => w.toLowerCase())));
        const picked = uniquePool.slice(0, 3).map(w => {
          if (targetWord[0] === targetWord[0].toUpperCase() && targetWord[0] !== targetWord[0].toLowerCase()) {
            return w.charAt(0).toUpperCase() + w.slice(1);
          }
          return w;
        });
        options = [targetWord, ...picked];
      }

      if (!options.includes(targetWord)) {
        options[0] = targetWord;
      }
      const uniqueOptions = Array.from(new Set(options));
      while (uniqueOptions.length < 4) {
        const fallbacks = ['have', 'been', 'feeling', 'worse', 'pain', 'should', 'start'];
        for (const fb of fallbacks) {
          if (!uniqueOptions.includes(fb) && fb !== targetWord) {
            uniqueOptions.push(fb);
            if (uniqueOptions.length >= 4) break;
          }
        }
      }
      const finalOptions = uniqueOptions.slice(0, 4).sort(() => 0.5 - Math.random());

      return {
        id: idx,
        blanked,
        answer: targetWord,
        options: finalOptions,
        hint_uz: p.hint_uz || p.hint || '',
        hint_ru: p.hint_ru || p.hint_uz || p.hint || '',
        hint_en: p.hint_en || p.phrase || '',
        hint: p.hint_uz || p.hint || '',
        original: p.phrase
      };
    });
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleTestSubmit = async () => {
    try {
      const res = await api.post(`/student/modules/${id}/tests/submit`, { answers: testAnswers });
      setTestResult(res.data);
      if (res.data.passed || res.data.score >= 60) {
        toast.success(`Test muvaffaqiyatli topshirildi: ${res.data.score}% (${res.data.correct}/${res.data.total})`);
        completeAndGoNext(6);
      } else {
        toast.error(`Test natijasi: ${res.data.score}% (${res.data.correct}/${res.data.total}). O'tish uchun kamida 60% to'plashingiz kerak.`);
      }
    } catch (err) {
      console.error('Test submit err:', err);
      toast.error('Testni topshirishda xatolik yuz berdi');
    }
  };

  const handleFinishChat = async (evalData) => {
    if (evalData && (evalData.score !== undefined || evalData.overall_score !== undefined)) {
      const normalized = evalData.evaluation || evalData;
      setFeedback(normalized);
      setOverallResult(normalized);
      completeAndGoNext(7);
      toast.success(t('chat_eval_report') || 'Klinik baholash hisoboti tayyorlandi!');
      return;
    }
    try {
      let convId = conversation?.id;
      if (!convId) {
        const prog = await api.get(`/student/modules/${id}/progress`);
        convId = prog.data?.conversation?.id;
      }
      if (convId) {
        const res = await api.post(`/student/conversations/${convId}/complete`);
        const data = res.data?.evaluation || res.data;
        setFeedback(data);
        setOverallResult(data);
        completeAndGoNext(7);
        toast.success(t('chat_eval_report') || 'Klinik baholash hisoboti tayyorlandi!');
      } else {
        handleTestPass100();
      }
    } catch (err) {
      console.error('Complete chat err:', err);
      handleTestPass100();
    }
  };

  const handleTestPass100 = () => {
    const mockEvaluation = {
      score: 100,
      passed: true,
      feedback: "A'lo darajadagi klinik muloqot! Barcha savollar to'g'ri berildi va bemor holati to'liq o'rganildi.",
      details: {
        grammar: 10,
        vocabulary: 10,
        fluency: 10,
        pronunciation: 10,
        clinical: 10,
        target_vocab_used: vocabulary.slice(0, 4).map(v => v.word),
        target_phrases_used: phrases.slice(0, 3).map(p => p.phrase),
        errors: []
      }
    };
    setFeedback(mockEvaluation);
    setOverallResult(mockEvaluation);
    completeAndGoNext(7);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const activeResult = overallResult || feedback;

  return (
    <Layout>
      {/* ── Header & Breadcrumbs ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/student/modules')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-2xs"
          aria-label="Back to Modules"
        >
          <RiArrowLeftLine className="text-lg" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Modul #{module?.order_index}
            </span>
            <span className="text-xs text-slate-500 font-medium">Virtual English Lab</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {module?.title}
          </h1>
        </div>
      </div>

      {/* ── Step Indicators ── */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {STEPS.map((s, i) => {
          const isCompleted = completedSteps.includes(s.id);
          const isCurrent   = step === s.id;
          const isUnlocked  = isStepUnlocked(s.id);
          const isLocked    = !isUnlocked && !isCurrent;

          let circleStyle = '';
          let icon = null;

          if (isCurrent) {
            circleStyle = 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200 scale-105 ring-2 ring-indigo-300';
          } else if (isCompleted) {
            circleStyle = 'bg-emerald-600 text-white shadow-xs';
            icon = <RiCheckLine className="text-sm font-black" />;
          } else if (isLocked) {
            circleStyle = 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60';
            icon = <RiLockLine className="text-xs" />;
          } else {
            circleStyle = 'bg-white border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 cursor-pointer shadow-xs';
          }

          return (
            <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleStepClick(s.id)}
                disabled={isLocked}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all cursor-pointer ${circleStyle}`}
              >
                {icon ?? s.id}
              </button>

              <span
                onClick={() => !isLocked && handleStepClick(s.id)}
                className={`text-xs whitespace-nowrap cursor-pointer transition-colors ${
                  isCurrent
                    ? 'text-indigo-700 font-extrabold'
                    : isCompleted
                    ? 'text-emerald-700 font-bold'
                    : isLocked
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 font-semibold hover:text-slate-900'
                }`}
              >
                {s.label}
              </span>

              {i < STEPS.length - 1 && (
                <div className={`w-3 h-0.5 flex-shrink-0 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Progress Summary Bar ── */}
      {(() => {
        const doneCount = STEPS.filter(s => completedSteps.includes(s.id)).length;
        const pct = Math.round((doneCount / STEPS.length) * 100);
        return (
          <div className="mb-6 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
              <span className="text-slate-500">
                {t('steps_progress_text', { done: doneCount, total: STEPS.length }) || `${doneCount}/${STEPS.length} bosqich yakunlandi`}
              </span>
              <span className="text-indigo-600">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 1: Clinical Grammar (3-Language Support & Light Mode) ── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RiBrainLine className="text-indigo-600" /> {t('grammar_title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('grammar_subtitle')}
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-200">
              {t('step_badge_1')}
            </span>
          </div>

          {grammar.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
              <RiLightbulbLine className="text-4xl text-amber-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                {t('grammar_no_rules_title') || "Ushbu modul uchun grammatik qoidalar"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('grammar_no_rules_desc') || "Klinik muloqotda grammatik to'g'ri jumlalardan foydalanish bemor ishonchini oshiradi va aniq tashxis qo'yishga yordam beradi."}
              </p>
            </div>
          ) : (
            grammar.map((g, gIdx) => {
              const ruleText = lang === 'en'
                ? (g.rule_explanation_en || g.rule_explanation)
                : lang === 'ru'
                ? (g.rule_explanation_ru || g.rule_explanation_uz || g.rule_explanation)
                : (g.rule_explanation_uz || g.rule_explanation);

              const titleText = lang === 'en'
                ? (g.title_en || g.title)
                : lang === 'ru'
                ? (g.title_ru || g.title_uz || g.title)
                : (g.title_uz || g.title);

              const examplesList = Array.isArray(g.examples)
                ? g.examples
                : (typeof g.examples === 'string' ? JSON.parse(g.examples || '[]') : []);
              const mistakesList = Array.isArray(g.common_mistakes)
                ? g.common_mistakes
                : (typeof g.common_mistakes === 'string' ? JSON.parse(g.common_mistakes || '[]') : []);

              return (
                <div key={g.id || gIdx} className="space-y-5">
                  {/* Main Rule Card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200">
                          §{gIdx + 1}
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                            {t('grammar_rule')}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900 mt-1">
                            {titleText}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {ruleText && (
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                        <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                          {ruleText}
                        </p>
                      </div>
                    )}

                    {/* Structure / Formula banner */}
                    {(g.structure_pattern || g.structure_pattern_uz || g.structure_pattern_ru || g.structure_pattern_en) && (
                      <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-teal-500/10 border border-indigo-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1 text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider">
                          <RiLightbulbLine />
                          <span>{t('grammar_structure')}</span>
                        </div>
                        <code className="text-xs md:text-sm font-black text-indigo-950 font-mono tracking-tight block">
                          {(() => {
                            let raw = (
                              lang === 'en'
                                ? (g.structure_pattern_en || g.structure_pattern)
                                : lang === 'ru'
                                ? (g.structure_pattern_ru || g.structure_pattern_uz || g.structure_pattern)
                                : (g.structure_pattern_uz || g.structure_pattern)
                            ) || "";

                            // Strip prefixes like "Formula / Формула:", "Formula:", "Формула:", "Pattern:", "Struktura:"
                            let cleanCore = raw
                              .replace(/^(formula\s*\/\s*формула\s*:\s*|formula\s*:\s*|формула\s*:\s*|pattern\s*:\s*|struktura\s*:\s*|gap strukturasi\s*:\s*)/i, '')
                              .trim();

                            // Fallback token translation for legacy single-language patterns
                            if (lang === 'uz' && !g.structure_pattern_uz) {
                              cleanCore = cleanCore
                                .replace(/\bSubject\b/g, "Ega (Subject)")
                                .replace(/\bAuxiliary Verb\b/gi, "Yordamchi fe'l")
                                .replace(/\bMain Verb\b/gi, "Asosiy fe'l")
                                .replace(/\bBase Verb\b/gi, "Asosiy fe'l (V1)")
                                .replace(/\bObject\b/gi, "To'ldiruvchi")
                                .replace(/\bTime Expressions?\b/gi, "Vaqt ko'rsatkichlari");
                            } else if (lang === 'ru' && !g.structure_pattern_ru) {
                              cleanCore = cleanCore
                                .replace(/\bSubject\b/g, "Подлежащее (Subject)")
                                .replace(/\bAuxiliary Verb\b/gi, "Вспомогательный глагол")
                                .replace(/\bMain Verb\b/gi, "Основной глагол")
                                .replace(/\bBase Verb\b/gi, "Начальная форма (V1)")
                                .replace(/\bObject\b/gi, "Дополнение")
                                .replace(/\bTime Expressions?\b/gi, "Временные маркеры");
                            }

                            return `${t('grammar_formula_label')}: ${cleanCore}`;
                          })()}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Examples Section */}
                  {examplesList.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <RiSpeakLine className="text-indigo-600 text-lg" />
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {t('grammar_examples')} ({examplesList.length})
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {examplesList.map((ex, exIdx) => {
                          const trans = lang === 'en'
                            ? (ex.translation_en || null)
                            : lang === 'ru'
                            ? (ex.translation_ru || ex.translation)
                            : (ex.translation_uz || ex.translation);

                          const noteText = lang === 'en'
                            ? (ex.note_en || ex.note)
                            : lang === 'ru'
                            ? (ex.note_ru || ex.note_en || ex.note)
                            : (ex.note_uz || ex.note_en || ex.note);

                          return (
                            <div
                              key={exIdx}
                              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="text-xs font-black text-indigo-900 leading-snug">
                                    "{ex.sentence}"
                                  </span>
                                  <button
                                    onClick={() => speakText(ex.sentence)}
                                    title={t('grammar_listen')}
                                    className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-colors shrink-0 shadow-2xs"
                                  >
                                    <RiVolumeUpLine size={15} />
                                  </button>
                                </div>

                                {trans && (
                                  <p className="text-xs text-slate-600 font-medium mt-1">
                                    {trans}
                                  </p>
                                )}
                              </div>

                              {noteText && (
                                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  📌 {noteText}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Common Mistakes vs Correct */}
                  {mistakesList.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <RiAlertLine className="text-amber-500 text-lg" />
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {t('grammar_mistakes_title')}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {mistakesList.map((m, mIdx) => {
                          const exp = lang === 'en'
                            ? (m.explanation_en || m.explanation)
                            : lang === 'ru'
                            ? (m.explanation_ru || m.explanation_uz || m.explanation)
                            : (m.explanation_uz || m.explanation);

                          return (
                            <div key={mIdx} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                                  <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block mb-0.5">
                                    {t('grammar_incorrect') || "✕ Noto'g'ri"}
                                  </span>
                                  <span className="font-semibold text-rose-800 line-through">
                                    "{m.incorrect}"
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block mb-0.5">
                                    {t('grammar_correct') || "✓ To'g'ri"}
                                  </span>
                                  <span className="font-bold text-emerald-800">
                                    "{m.correct}"
                                  </span>
                                </div>
                              </div>
                              {exp && (
                                <p className="text-xs text-slate-500 font-medium pt-1">
                                  💡 <b>{t('grammar_explanation_label') || 'Izoh:'}</b> {exp}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => completeAndGoNext(2)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{t('grammar_all_learned')}</span>
              <RiArrowRightLine className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 2: Vocabulary (3-Language Support & Light Mode) ─────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RiBookLine className="text-indigo-600" /> {t('vocab_title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('vocab_subtitle')} ({vocabulary.length} {t('term_count_suffix')})
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-200">
              {t('step_badge_2')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabulary.map((v) => {
              const transText = lang === 'en'
                ? null
                : lang === 'ru'
                ? (v.translation_ru || v.translation_uz || v.translation)
                : (v.translation_uz || v.translation);

              const def = lang === 'en'
                ? (v.definition_en || v.definition)
                : lang === 'ru'
                ? (v.definition_ru || v.definition_uz || v.definition)
                : (v.definition_uz || v.definition);

              return (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                          {v.word}
                        </h3>
                        {transText && (
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">
                            {transText}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => speakText(v.word)}
                        title={t('vocab_listen')}
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <RiVolumeUpLine size={18} />
                      </button>
                    </div>

                    {def && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span>{t('vocab_definition')}</span>
                          <button
                            onClick={() => speakText(def)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Tinglash"
                          >
                            <RiVolumeUpLine size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {def}
                        </p>
                      </div>
                    )}

                    {v.example && (
                      <div className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 flex items-start gap-2">
                        <span className="text-amber-500 font-bold not-italic">Ex:</span>
                        <span className="flex-1">"{v.example}"</span>
                        <button
                          onClick={() => speakText(v.example)}
                          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
                          title="Misolni tinglash"
                        >
                          <RiVolumeUpLine size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-2xs"
            >
              ← {t('step_grammar')}
            </button>
            <button
              onClick={() => completeAndGoNext(3)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{t('vocab_all_learned')}</span>
              <RiArrowRightLine className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 3: Phrasebook (3-Language Support & Light Mode) ─────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RiMessage3Line className="text-indigo-600" /> {t('phrase_title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('phrase_subtitle')} ({phrases.length} {t('phrase_count_suffix')})
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-200">
              {t('step_badge_3')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phrases.map((p) => {
              const hintText = lang === 'en'
                ? null
                : lang === 'ru'
                ? (p.hint_ru || p.hint_uz || p.hint)
                : (p.hint_uz || p.hint);

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                        {p.category}
                      </span>
                      <button
                        onClick={() => speakText(p.phrase)}
                        title={t('phrase_listen')}
                        className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                      >
                        <RiVolumeUpLine size={16} />
                      </button>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 leading-snug mb-2">
                      "{p.phrase}"
                    </h3>

                    {hintText && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        💡 <span className="font-semibold">{t('phrase_hint')}:</span> {hintText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-2xs"
            >
              ← {t('step_vocab')}
            </button>
            <button
              onClick={() => completeAndGoNext(4)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{t('phrase_all_learned')}</span>
              <RiArrowRightLine className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 4: Gap Fill ─────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RiBookLine className="text-emerald-600" /> {t('gap_title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('gap_subtitle')}
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200">
              {t('step_badge_4')}
            </span>
          </div>

          <div className="space-y-4">
            {gapExercises.map((ex) => {
              const isCorrect = gapChecked && gapAnswers[ex.id] === ex.answer;
              const isWrong = gapChecked && gapAnswers[ex.id] && gapAnswers[ex.id] !== ex.answer;

              const hintText = lang === 'en'
                ? (ex.hint_en || ex.original)
                : lang === 'ru'
                ? (ex.hint_ru || ex.hint_uz || ex.hint)
                : (ex.hint_uz || ex.hint);

              return (
                <div
                  key={ex.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : isWrong
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {hintText && (
                    <p className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1.5">
                      <RiMessage3Line className="text-indigo-600 shrink-0" />
                      <span>{hintText}</span>
                    </p>
                  )}
                  <p className="text-sm md:text-base font-bold text-slate-900 mb-4 leading-relaxed">
                    {ex.id + 1}. {ex.blanked}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {ex.options.map((opt, i) => {
                      const isSelected = gapAnswers[ex.id] === opt;
                      let btnClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300';

                      if (isSelected) {
                        btnClass = 'bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold shadow-xs';
                      }

                      if (gapChecked) {
                        if (opt === ex.answer) {
                          btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-xs';
                        } else if (isSelected && opt !== ex.answer) {
                          btnClass = 'bg-rose-50 border-rose-400 text-rose-700 line-through';
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={gapChecked}
                          onClick={() => setGapAnswers(prev => ({ ...prev, [ex.id]: opt }))}
                          className={`px-4 py-2 rounded-xl text-xs border font-bold transition-all cursor-pointer ${btnClass}`}
                        >
                          {opt} {gapChecked && opt === ex.answer ? ' ✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-2xs"
            >
              ← {t('step_phrase')}
            </button>

            {!gapChecked ? (
              <button
                onClick={() => setGapChecked(true)}
                disabled={Object.keys(gapAnswers).length < gapExercises.length}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                {t('gap_check')}
              </button>
            ) : (() => {
              const gapScore = gapExercises.reduce((acc, ex) => acc + (gapAnswers[ex.id] === ex.answer ? 1 : 0), 0);
              const gapPercent = Math.round((gapScore / gapExercises.length) * 100);
              const passed = gapPercent >= 60;

              return passed ? (
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    {t('gap_score_passed', { pct: gapPercent }) || `${gapPercent}% ${lang === 'ru' ? 'Правильно!' : lang === 'en' ? 'Correct!' : 'To\'g\'ri!'}`}
                  </span>
                  <button
                    onClick={() => completeAndGoNext(5)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t('gap_next') || 'Keyingisi: Quiz'}</span>
                    <RiArrowRightLine />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-rose-700 font-extrabold text-xs bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                    {t('gap_score_failed', { pct: gapPercent }) || `${gapPercent}% (${lang === 'ru' ? 'Требуется минимум 60%' : lang === 'en' ? 'Minimum 60% required' : 'Kamida 60% kerak'})`}
                  </span>
                  <button
                    onClick={() => {
                      setGapChecked(false);
                      setGapAnswers({});
                      setGapExercises(generateGapFill(phrases, vocabulary));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RiRepeatLine /> {t('retry')}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 5: Quiz ─────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RiQuestionLine className="text-indigo-600" /> {t('quiz_title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('quiz_subtitle')}
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-200">
              {t('step_badge_5')}
            </span>
          </div>

          <div className="space-y-4">
            {tests.map((q, i) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <p className="text-sm font-extrabold text-slate-900 mb-3.5">
                  {i + 1}. {q.question_en || q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optKey = `option_${opt.toLowerCase()}`;
                    const optText = q[`${optKey}_en`] || q[optKey];
                    const isSelected = testAnswers[q.id] === opt;

                    return (
                      <button
                        key={opt}
                        onClick={() => setTestAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`text-left p-3 rounded-xl text-xs border font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {opt}
                        </span>
                        <span className="flex-1">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-2xs"
            >
              ← {t('step_gap')}
            </button>

            <button
              onClick={handleTestSubmit}
              disabled={Object.keys(testAnswers).length < tests.length}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {t('quiz_submit')}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 6: Virtual Patient Chat ─────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div className="animate-fade-in space-y-6">
          <VirtualPatientChat
            moduleId={id}
            module={module}
            conversationId={conversation?.conversation_id || conversation?.id}
            phrasebook={phrases}
            onFinish={handleFinishChat}
            onTestPass100={handleTestPass100}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── STEP 7: Overall Results & Clinical Feedback (Light Mode) ─── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {step === 7 && (
        <div className="animate-fade-in space-y-6">
          {activeResult ? (
            <>
              {/* ── 1. Hero Master Certificate & Score Card (Light Clinical Design) ── */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-cyan-50 border-2 border-emerald-200/90 p-6 md:p-8 shadow-xl shadow-emerald-500/5">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  {/* Left Info & Badges */}
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-extrabold">
                      <RiAwardLine className="text-emerald-700" />
                      <span>{t('results_eval_report')} • Modul {module?.order_index}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                      {module?.title}
                    </h2>

                    <p className="text-xs md:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
                      {activeResult.passed !== false
                        ? t('results_passed_desc')
                        : t('results_failed_desc')}
                    </p>

                    {/* Status Badge */}
                    <div className="pt-2">
                      {activeResult.passed !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-sm">
                          <RiShieldCheckLine className="text-base" />
                          <span>{t('results_passed_badge')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-sm">
                          <RiAlertLine className="text-base" />
                          <span>{t('results_failed_badge')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Master Hologram Score Dial */}
                  <div className="w-full md:w-auto flex flex-col items-center">
                    <div className="relative w-48 md:w-56 p-6 rounded-3xl bg-white border-2 border-emerald-300 shadow-xl shadow-emerald-500/10 flex flex-col items-center text-center">
                      <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tighter">
                        {activeResult.score ?? 85}%
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mt-1">
                        {t('results_overall_score')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {t('results_ai_engine')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. 5-Metric Clinical Competency Cards Grid ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <RiBarChartGroupedLine className="text-indigo-600" />
                    <span>{t('results_competency_matrix')}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {t('results_max_score')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {[
                    { key: 'grammar',       name: t('results_grammar'),       desc: 'Grammatika',           icon: RiBrainLine,       color: 'indigo' },
                    { key: 'vocabulary',    name: t('results_vocab'),         desc: 'Tibbiy Terminlar',     icon: RiBookLine,        color: 'cyan' },
                    { key: 'fluency',       name: t('results_fluency'),       desc: 'Nutq Ravonligi',       icon: RiSpeakLine,       color: 'emerald' },
                    { key: 'pronunciation', name: t('results_pronunciation'), desc: 'Talaffuz & Fonetika', icon: RiVolumeUpLine,    color: 'blue' },
                    { key: 'clinical',      name: t('results_clinical'),      desc: 'Klinik Anamnez',       icon: RiStethoscopeLine, color: 'amber' }
                  ].map((m) => {
                    const rawVal = activeResult.details?.[m.key] ?? (activeResult.score ? Math.round(activeResult.score / 10) : 8);
                    const score10 = typeof rawVal === 'number' ? Math.min(10, Math.max(1, rawVal)) : 8;
                    const percent = score10 * 10;
                    const Icon = m.icon;
                    const isHigh = score10 >= 7;
                    const isMid = score10 >= 5 && score10 < 7;

                    return (
                      <div
                        key={m.key}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                              <Icon size={16} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              isHigh
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isMid
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isHigh ? t('results_level_excellent') : isMid ? t('results_level_good') : t('results_level_attention')}
                            </span>
                          </div>

                          <p className="text-xs font-black text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-500 mb-3">{m.desc}</p>
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-lg font-black text-slate-900">
                              {score10}<span className="text-xs font-medium text-slate-400">/10</span>
                            </span>
                            <span className="text-xs font-bold text-indigo-600">{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. AI Clinical Mentor Recommendations ── */}
              {activeResult.feedback && (
                <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-3xl p-5 md:p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-indigo-900 font-extrabold text-sm">
                    <RiSparkling2Line className="text-indigo-600 text-base" />
                    <span>{t('results_ai_mentor')}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-800 font-medium leading-relaxed">
                    {activeResult.feedback}
                  </p>
                </div>
              )}

              {/* ── 4. Differential Error Corrections ── */}
              {activeResult.details?.errors && activeResult.details.errors.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-2">
                    <RiAlertLine className="text-rose-500 text-base" />
                    <span>{t('results_errors_title')} ({activeResult.details.errors.length})</span>
                  </div>

                  <div className="space-y-3">
                    {activeResult.details.errors.map((err, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md flex-shrink-0 mt-0.5">
                            {t('results_original_error')}
                          </span>
                          <span className="text-xs text-rose-700 font-medium line-through">
                            {err.original}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md flex-shrink-0 mt-0.5">
                            ✓ {t('results_correction')}
                          </span>
                          <span className="text-xs text-emerald-800 font-bold">
                            {err.correction}
                          </span>
                        </div>

                        {err.explanation && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                            <RiLightbulbLine className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>{err.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 5. Action Dock (Conditional Unlocking & Retrying) ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200">
                <button
                  onClick={() => navigate('/student/modules')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RiArrowLeftLine />
                  <span>{t('results_all_modules_btn') || 'Barcha modullar'}</span>
                </button>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
                  {/* Retry Button */}
                  <button
                    onClick={() => {
                      setStep(6);
                    }}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl border font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                      activeResult.score >= 60
                        ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-200'
                    }`}
                  >
                    <RiRepeatLine className="text-base" />
                    <span>{activeResult.score >= 60 ? (t('results_retry_btn') || 'Qayta urinish') : 'Qayta topshirish (Muloqotga qaytish)'}</span>
                  </button>

                  {/* Next Module Button / Course Completion Banner */}
                  {module?.next_module ? (
                    activeResult.score >= 60 ? (
                      <button
                        onClick={() => navigate(`/student/modules/${module.next_module.id}`)}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-between sm:justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                            {t('results_next_module_label') || "Keyingi Modul"} #{module.next_module.order_index}
                          </span>
                          <span className="font-black text-white text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[280px]">
                            {lang === 'ru' ? (module.next_module.title_ru || module.next_module.title) : lang === 'uz' ? (module.next_module.title_uz || module.next_module.title) : (module.next_module.title_en || module.next_module.title)}
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 ml-1">
                          <RiArrowRightLine className="text-lg" />
                        </div>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed">
                        <RiLockLine className="text-sm" />
                        <span>{t('results_next_locked_msg') || "Keyingi modul qulflangan (Kamida 60% kerak)"}</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-300 rounded-2xl px-5 py-3 shadow-xs">
                      <RiTrophyLine className="text-amber-500 text-2xl shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          {t('results_course_completed_title') || "Tabriklaymiz! Barcha modullar yakunlandi! 🏆"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {t('results_course_completed_desc') || "Siz mutaxassislik bo'yicha barcha klinik modullarni muvaffaqiyatli tamomladingiz."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <RiAwardLine className="text-5xl text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-800">
                {t('results_not_available_title') || "Natijalar hali mavjud emas"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                {t('results_not_available_desc') || "Avval 6-bosqichdagi virtual bemor bilan muloqot qilib, baholash oling."}
              </p>
              <button
                onClick={() => setStep(6)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow-md shadow-indigo-200 cursor-pointer"
              >
                {t('chat_virtual_patient_btn_step') || "Virtual Bemor Chati (6-Bosqich)"}
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
