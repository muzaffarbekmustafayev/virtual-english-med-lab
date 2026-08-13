import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import VirtualPatientChat from '../../components/VirtualPatientChat';
import api from '../../lib/api';
import {
  RiCheckLine, RiArrowRightLine, RiArrowLeftLine,
  RiVolumeUpLine, RiRepeatLine, RiTrophyLine,
  RiMicLine, RiBarChartGroupedLine, RiBookLine,
  RiLightbulbLine, RiRobot2Line, RiQuestionLine, RiHospitalLine, RiMessage3Line, RiCloseLine,
  RiLockLine, RiCheckboxCircleLine, RiStethoscopeLine
} from 'react-icons/ri';

// Asosiy ketma-ketlik: 1 → 2 → 3 → 4 → 5 → 6
// Har bir qadam ochilishi uchun oldingi majburiy qadam yakunlanishi shart
const STEPS = [
  { id: 1, label: 'Vocabulary',      short: 'Vocab',    requiredPrev: null  },
  { id: 2, label: 'Phrasebook',      short: 'Phrase',   requiredPrev: 1     },
  { id: 3, label: 'Gap Filling',     short: 'Gap Fill', requiredPrev: 2     },
  { id: 4, label: 'Quiz',            short: 'Quiz',     requiredPrev: 3     },
  { id: 5, label: 'Virtual Patient', short: 'Chat',     requiredPrev: 4     },
  { id: 6, label: 'Overall Results', short: 'Results',  requiredPrev: 5     },
];

const SCORE_COLORS = {
  grammar_score: 'from-indigo-500 to-purple-500',
  vocabulary_score: 'from-cyan-500 to-blue-500',
  fluency_score: 'from-emerald-500 to-teal-500',
  pronunciation_score: 'from-amber-500 to-orange-500',
  clinical_score: 'from-rose-500 to-pink-500',
};
const SCORE_LABELS = {
  grammar_score: 'Grammar', vocabulary_score: 'Vocabulary',
  fluency_score: 'Fluency', pronunciation_score: 'Pronunciation', clinical_score: 'Clinical',
};

export default function ModuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep]               = useState(1);
  // completedSteps: qaysi qadamlar to'liq yakunlangan (lock tizimi uchun)
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(`module_${id}_completed`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (completedSteps.length > 0) {
      localStorage.setItem(`module_${id}_completed`, JSON.stringify(completedSteps));
    }
  }, [completedSteps, id]);

  // Qadam yakunlab keyingisiga o'tish
  const completeAndGoNext = (nextStep) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
    setStep(nextStep);
  };

  // Berilgan qadam ochiq (accessible) ekanligini tekshirish
  const isStepUnlocked = (stepId) => {
    const s = STEPS.find(x => x.id === stepId);
    if (!s) return false;
    if (!s.requiredPrev) return true;             // Step 1 — har doim ochiq
    return completedSteps.includes(s.requiredPrev); // Oldingi qadam yakunlangan bo'lsa ochiq
  };

  // Step indikatoriga bosish — agar qulflangan bo'lsa ogohlantirib qo'yish
  const handleStepClick = (stepId) => {
    if (!isStepUnlocked(stepId)) return;          // Qulflangan — e'tibor bermaydi
    setStep(stepId);
  };

  const [module, setModule]           = useState(null);
  const [vocabulary, setVocabulary]   = useState([]);
  const [phrases, setPhrases]         = useState([]);
  const [convId, setConvId]           = useState(null);
  const [feedback, setFeedback]       = useState(null);
  const [bestFeedback, setBestFeedback] = useState(null);
  const [testResult, setTestResult]   = useState(null);
  const [bestTestResult, setBestTestResult] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Gap fill states
  const [gapExercises, setGapExercises] = useState(() => {
    try { const saved = localStorage.getItem(`module_${id}_gapExercises`); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [gapAnswers, setGapAnswers]   = useState(() => {
    try { const saved = localStorage.getItem(`module_${id}_gapAnswers`); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });
  const [gapChecked, setGapChecked]   = useState(() => {
    try { const saved = localStorage.getItem(`module_${id}_gapChecked`); return saved ? JSON.parse(saved) : false; } catch { return false; }
  });
  
  const [tests, setTests]             = useState([]);
  const [testAnswers, setTestAnswers] = useState(() => {
    try { const saved = localStorage.getItem(`module_${id}_testAnswers`); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  // LocalStorage-ga saqlash (sync)
  useEffect(() => { localStorage.setItem(`module_${id}_gapExercises`, JSON.stringify(gapExercises)); }, [gapExercises, id]);
  useEffect(() => { localStorage.setItem(`module_${id}_gapAnswers`, JSON.stringify(gapAnswers)); }, [gapAnswers, id]);
  useEffect(() => { localStorage.setItem(`module_${id}_gapChecked`, JSON.stringify(gapChecked)); }, [gapChecked, id]);
  useEffect(() => { localStorage.setItem(`module_${id}_testAnswers`, JSON.stringify(testAnswers)); }, [testAnswers, id]);

  // Generate Gap Fill exercises
  const generateGapFill = (phrasesData) => {
    if (!phrasesData || phrasesData.length === 0) return [];
    const shuffled = [...phrasesData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    const allWords = phrasesData
      .map(p => p.phrase.match(/\b[a-zA-Z]{4,}\b/g) || [])
      .flat()
      .map(w => w.toLowerCase());
    const uniqueWords = [...new Set(allWords)];
    
    return selected.map((item, index) => {
      const words = item.phrase.match(/\b[a-zA-Z]{4,}\b/g) || [];
      if (words.length === 0) return null;
      
      const wordToBlank = words[Math.floor(Math.random() * words.length)];
      const blankedPhrase = item.phrase.replace(new RegExp(`\\b${wordToBlank}\\b`, 'i'), '__________');
      
      let distractors = uniqueWords.filter(w => w !== wordToBlank.toLowerCase());
      distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const options = [wordToBlank.toLowerCase(), ...distractors].sort(() => 0.5 - Math.random());
      
      return {
        id: index,
        original: item.phrase,
        blanked: blankedPhrase,
        answer: wordToBlank.toLowerCase(),
        options: options,
        hint: item.hint_uz
      };
    }).filter(Boolean);
  };

  // Matnni ovoz chiqarib o'qish uchun yordamchi funksiya
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // To'xtatish (agar oldingisi gapirayotgan bo'lsa)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Biroz sekinlashtirish tushunishga oson bo'lishi uchun
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [modRes, vocRes, phraseRes, testRes, progressRes] = await Promise.all([
          api.get(`/student/modules/${id}`),
          api.get(`/student/modules/${id}/vocabulary`),
          api.get(`/student/modules/${id}/phrasebook`),
          api.get(`/student/modules/${id}/tests`),
          api.get(`/student/modules/${id}/progress`),
        ]);
        setModule(modRes.data);
        setVocabulary(vocRes.data);
        setPhrases(phraseRes.data);
        setTests(testRes.data);
        
        setGapExercises(prev => {
          if (prev.length > 0) return prev;
          return generateGapFill(phraseRes.data);
        });
        
        const completed = []; // Endi avtomatik ochilmaydi
        if (progressRes.data.test_result) {
          setBestTestResult(progressRes.data.test_result);
          if (progressRes.data.test_result.score >= 60) {
            completed.push(4);
          }
        }
        if (progressRes.data.last_conversation) {
          setBestFeedback(progressRes.data.last_conversation);
          setConvId(progressRes.data.last_conversation.id);
          if (progressRes.data.last_conversation.overall_score >= 60) {
            completed.push(5, 6);
          }
        }
        
        setCompletedSteps(prev => {
          const merged = [...new Set([...prev, ...completed])];
          
          // Agar modul yangi bo'lsa (max=0), 1-bosqichdan (Vocab) boshlanadi.
          // Agar chala bo'lsa, oxirgi tugatilganidan keyingisi ochiladi.
          // Agar to'liq tugatilgan bo'lsa, 6-bosqich (Results) ochiladi.
          const maxCompleted = merged.length > 0 ? Math.max(...merged) : 0;
          const nextStep = Math.min(maxCompleted + 1, 6);
          
          setStep(nextStep);
          return merged;
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Step 3: start conversation
  const startConversation = async (attemptType = 'first_attempt') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/student/modules/${id}/conversation`, { attempt_type: attemptType });
      setConvId(res.data.conversation_id);
      setFeedback(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 5: finalize & get feedback
  const finishConversation = async (testMode = false) => {
    if (!convId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/student/conversation/${convId}/finalize`, { test_mode: testMode });
      setFeedback(res.data);
      setBestFeedback(prev => (!prev || res.data.overall_score > prev.overall_score) ? res.data : prev);
      if (res.data.overall_score >= 60) {
        setCompletedSteps(prev => {
          const newSteps = [...new Set([...prev, 5])];
          return newSteps;
        });
      }
      setStep(6);
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4: Quiz submit
  const submitQuiz = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/student/modules/${id}/tests/submit`, { answers: testAnswers });
      setTestResult(res.data);
      setBestTestResult(prev => (!prev || res.data.score > prev.score) ? res.data : prev);
      if (res.data.score >= 60) {
        setCompletedSteps(prev => [...new Set([...prev, 4])]);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/student/modules')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
          <RiArrowLeftLine />
        </button>
        <div>
          <p className="text-xs text-gray-500">Modul {module?.order_index}</p>
          <h1 className="text-xl font-bold text-gray-900">{module?.title}</h1>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isCompleted = completedSteps.includes(s.id);
          const isCurrent   = step === s.id;
          const isUnlocked  = isStepUnlocked(s.id);
          const isLocked    = !isUnlocked && !isCurrent;

          // Connector line rangi
          const lineColor = isCompleted ? 'bg-emerald-400' : 'bg-gray-200';

          // Circle rangi/stili
          let circleStyle, tooltipText;
          let icon = null;

          if (isCurrent) {
            circleStyle = 'bg-gradient-to-br from-indigo-500 to-cyan-500 border-transparent text-white shadow-md shadow-indigo-500/30';
            tooltipText = s.label;
          } else if (isCompleted) {
            circleStyle = 'bg-emerald-500 border-emerald-500 text-white';
            icon = <RiCheckLine className="text-xs" />;
            tooltipText = `${s.label} — yakunlandi`;
          } else if (isLocked) {
            circleStyle = 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed';
            icon = <RiLockLine className="text-[10px]" />;
            tooltipText = `${s.label} — avval oldingi bosqichni bajaring`;
          } else {
            // Unlocked but not yet started (Ishlanmagan qism)
            circleStyle = 'bg-white border-amber-400 text-amber-500 cursor-pointer hover:border-amber-500 hover:bg-amber-50';
            tooltipText = `${s.label} — Ishlanmagan (qolib ketgan)`;
          }

          return (
            <div key={s.id}
                 className="flex items-center gap-1 flex-shrink-0">
              {/* Circle */}
              <div
                onClick={() => handleStepClick(s.id)}
                title={tooltipText}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${isCurrent || (isUnlocked && !isLocked) ? 'cursor-pointer' : ''}
                  ${circleStyle}`}
              >
                {icon ?? s.id}
              </div>

              {/* Label */}
              <span className={`text-[11px] hidden sm:block whitespace-nowrap mr-1
                ${ isCurrent   ? 'text-indigo-600 font-semibold'
                 : isCompleted ? 'text-emerald-600 font-medium'
                 : isLocked    ? 'text-gray-400'
                 : 'text-gray-500' }`}>
                {s.short}{s.optional ? ' *' : ''}
              </span>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`w-3 h-px flex-shrink-0 ${lineColor}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress summary */}
      {(() => {
        const doneCount = STEPS.filter(s => completedSteps.includes(s.id)).length;
        const pct = Math.round((doneCount / STEPS.length) * 100);
        return (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">{doneCount}/{STEPS.length} bosqich yakunlandi</span>
              <span className="text-xs font-semibold text-indigo-600">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* ── STEP 1: Vocabulary ───────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RiBookLine className="text-indigo-500" /> Vocabulary
            <span className="text-xs text-gray-500 font-normal">— 15 daqiqa</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {vocabulary.map((v) => (
              <div key={v.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {v.word}
                    <button onClick={() => speakText(v.word)} title="So'zni tinglash"
                      className="text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0 bg-indigo-50 hover:bg-indigo-100 p-1 rounded-md">
                      <RiVolumeUpLine size={18} />
                    </button>
                  </span>
                </div>
                <p className="text-sm text-indigo-600 font-medium mb-2">{v.translation}</p>
                {v.definition && (
                  <div className="flex items-start gap-2 mb-2">
                    <p className="text-xs text-gray-600 flex-1">{v.definition}</p>
                    <button onClick={() => speakText(v.definition)} title="Ta'rifni tinglash"
                      className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 bg-gray-50 hover:bg-indigo-50 p-1 rounded-md mt-0.5">
                      <RiVolumeUpLine size={14} />
                    </button>
                  </div>
                )}
                {v.example && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 italic flex-1">"{v.example}"</p>
                    <button onClick={() => speakText(v.example)} title="Gapni tinglash"
                      className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 bg-gray-50 hover:bg-indigo-50 p-1 rounded-md mt-0.5">
                      <RiVolumeUpLine size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {vocabulary.length === 0 && (
            <div className="text-center py-8 text-gray-500">Vocabulary mavjud emas</div>
          )}
          <button onClick={() => completeAndGoNext(2)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            Keyingisi <RiArrowRightLine />
          </button>
        </div>
      )}

      {/* ── STEP 2: Phrasebook ──────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RiLightbulbLine className="text-amber-500" /> Smart Phrasebook
            <span className="text-xs text-gray-500 font-normal">— 10 daqiqa</span>
          </h2>
          {Object.entries(phrases.reduce((acc, p) => { (acc[p.category] = acc[p.category] || []).push(p); return acc; }, {})).map(([cat, items]) => (
            <div key={cat} className="mb-4">
              <h3 className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-2">{cat}</h3>
              <div className="space-y-2">
                {items.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 flex items-start justify-between group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                       onClick={() => speakText(p.phrase)}>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">"{p.phrase}"</p>
                      {p.hint_uz && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><RiMessage3Line /> {p.hint_uz}</p>}
                    </div>
                    <button className="text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0 mt-0.5 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md" title="Tinglash">
                      <RiVolumeUpLine size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {phrases.length === 0 && <div className="text-center py-8 text-gray-500">Phrasebook mavjud emas</div>}
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
              <RiArrowLeftLine /> Orqaga
            </button>
            <button onClick={() => completeAndGoNext(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
              Keyingisi <RiArrowRightLine />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Gap Filling ──────────────────────────────── */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RiBookLine className="text-emerald-500" /> Bo'sh joylarni to'ldiring
            <span className="text-xs text-gray-500 font-normal">— 5 daqiqa</span>
          </h2>
          <div className="space-y-4 mb-6">
            {gapExercises.map((ex) => (
              <div key={ex.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><RiMessage3Line /> {ex.hint}</p>
                <p className="text-base font-medium text-gray-900 mb-3">{ex.id + 1}. {ex.blanked}</p>
                
                <div className="flex flex-wrap gap-2">
                  {ex.options.map((opt, i) => {
                    const isSelected = gapAnswers[ex.id] === opt;
                    let btnClass = isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300';
                      
                    if (gapChecked) {
                      if (opt === ex.answer) {
                        btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold';
                      } else if (isSelected && opt !== ex.answer) {
                        btnClass = 'border-red-500 bg-red-50 text-red-700 line-through';
                      }
                    }
                    
                    return (
                      <button
                        key={i}
                        disabled={gapChecked}
                        onClick={() => setGapAnswers(prev => ({ ...prev, [ex.id]: opt }))}
                        className={`px-4 py-1.5 rounded-lg text-sm border transition-all ${btnClass}`}
                      >
                        {opt} {opt === ex.answer ? ' $' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
              <RiArrowLeftLine /> Orqaga
            </button>
            {!gapChecked ? (
              <button 
                onClick={() => setGapChecked(true)}
                disabled={Object.keys(gapAnswers).length < gapExercises.length}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                Tekshirish
              </button>
            ) : (() => {
              const gapScore = gapExercises.reduce((acc, ex) => acc + (gapAnswers[ex.id] === ex.answer ? 1 : 0), 0);
              const gapPercent = Math.round((gapScore / gapExercises.length) * 100);
              return gapPercent >= 60 ? (
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">{gapPercent}% To'g'ri!</span>
                  <button onClick={() => { completeAndGoNext(4); }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                    Keyingisi: Quiz <RiArrowRightLine />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-red-500 font-bold text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">Natija: {gapPercent}%. Kamida 60% kerak!</span>
                  <button onClick={() => { setGapChecked(false); setGapAnswers({}); setGapExercises(generateGapFill(phrases)); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 text-sm font-medium hover:bg-amber-500/25 transition-colors">
                    <RiRepeatLine /> Qayta urinish
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── STEP 4: Quiz ────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><RiQuestionLine className="text-indigo-500" /> Test / Quiz</h2>
          {!testResult ? (
            <>
              <div className="space-y-4 mb-6">
                {tests.map((t, i) => (
                  <div key={t.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                    <p className="text-sm font-medium text-gray-900 mb-3">{i + 1}. {t.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTestAnswers(prev => ({ ...prev, [t.id]: opt }))}
                          className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                            testAnswers[t.id] === opt
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          <span className="font-bold mr-2">{opt}.</span>
                          {t[`option_${opt.toLowerCase()}`]}
                          {String(t.correct_option).toLowerCase() === opt.toLowerCase() ? ' $' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                  <RiArrowLeftLine /> Orqaga
                </button>
                <button onClick={submitQuiz} disabled={actionLoading || Object.keys(testAnswers).length < tests.length}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                  {actionLoading ? 'Tekshirilmoqda...' : 'Testni yakunlash'}
                </button>
                {bestTestResult && bestTestResult.score >= 60 && (
                  <button onClick={() => completeAndGoNext(5)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg transition-all ml-auto">
                    Keyingisi: Virtual Chat <RiArrowRightLine />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-indigo-900 mb-2">{testResult.score}%</div>
                {testResult.correct !== undefined && (
                  <p className="text-gray-500">{testResult.correct}/{testResult.total} to'g'ri javob</p>
                )}
              </div>
              {testResult.results && (
                <div className="space-y-3 mb-6">
                  {testResult.results.map((r, i) => (
                    <div key={r.question_id || i} className={`flex items-center gap-3 p-3 rounded-xl border ${r.is_correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                      <span className={`text-lg ${r.is_correct ? 'text-emerald-500' : 'text-red-500'}`}>
                        {r.is_correct ? <RiCheckLine /> : <RiCloseLine />}
                      </span>
                      <span className="text-sm text-gray-700">Savol {i+1}: Javobingiz <b>{r.your_answer}</b> {!r.is_correct && <> · To'g'ri: <b className="text-emerald-600">{r.correct_answer}</b></>}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center gap-3 mt-2">
                {testResult.score >= 60 ? (
                  <button onClick={() => completeAndGoNext(5)}
                    className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all mx-auto">
                    Keyingisi: Virtual Chat <RiArrowRightLine />
                  </button>
                ) : (
                  <div className="text-center w-full">
                    <p className="text-red-500 text-sm font-medium mb-3">Keyingi bosqichga o'tish uchun kamida 60% ball to'plashingiz kerak.</p>
                    <button onClick={() => { setTestResult(null); setTestAnswers({}); }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 text-sm font-medium hover:bg-amber-500/25 transition-colors mx-auto inline-flex">
                      <RiRepeatLine /> Qayta urinish
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 5: Virtual Patient (Chat & Feedback) ─────────────────────────── */}
      {step === 5 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RiRobot2Line className="text-cyan-500" /> Virtual Patient Chat
            <span className="text-xs text-gray-500 font-normal">— 20 daqiqa</span>
          </h2>
          
          {!feedback && (
            <div className="mb-6 animate-fade-in relative">
              <div className="absolute -top-10 right-0">
                <button onClick={() => finishConversation(true)}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold rounded-lg transition-colors border border-indigo-200">
                  <RiCheckboxCircleLine className="inline-block mr-1" />
                  Test: 100% bilan yakunlash
                </button>
              </div>
              <VirtualPatientChat
                conversationId={convId}
                onStartConversation={startConversation}
                onRetry={() => {
                  setConvId(null);
                  setFeedback(null);
                }}
                phrases={phrases}
                onFinish={() => finishConversation(false)}
              />
            </div>
          )}

          {actionLoading && !feedback && convId && (
            <div className="mt-4 flex items-center justify-center gap-2 text-amber-400 text-sm">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              AI Feedback generatsiya qilinmoqda...
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
              <RiArrowLeftLine /> Orqaga
            </button>
            {bestFeedback && bestFeedback.overall_score >= 60 && (
              <button onClick={() => completeAndGoNext(6)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg transition-all ml-auto">
                Umumiy Natijani Ko'rish <RiArrowRightLine />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 6: Overall Results ─────────────────────────── */}
      {step === 6 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RiTrophyLine className="text-indigo-500" /> Umumiy Natijalar (Overall Results)
          </h2>
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 text-center mb-6">
            <h3 className="text-gray-500 text-sm font-medium mb-4">Ushbu modul bo'yicha sizning natijalaringiz</h3>
            {(() => {
              const vocabScore = completedSteps.includes(1) ? 100 : 0;
              const phraseScore = completedSteps.includes(2) ? 100 : 0;
              
              let gapScore = 0;
              if (gapExercises && gapExercises.length > 0) {
                const correctCount = gapExercises.reduce((acc, ex) => acc + (gapAnswers[ex.id] === ex.answer ? 1 : 0), 0);
                gapScore = Math.round((correctCount / gapExercises.length) * 100);
              }
              
              const quizScore = bestTestResult?.score || 0;
              const chatScore = bestFeedback?.overall_score || 0;
              
              const overallFinal = Math.round((vocabScore + phraseScore + gapScore + quizScore + chatScore) / 5);

              return (
                <>
                  <div className="mb-8">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 inline-block mb-2">
                      {overallFinal}%
                    </div>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">O'rtacha yakuniy ball (Barcha bo'limlar)</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8 border-t border-slate-100 pt-8">
                    <div>
                      <div className="text-2xl font-black text-indigo-900 mb-1">{vocabScore}%</div>
                      <p className="text-indigo-600 font-medium text-xs">Vocabulary</p>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-blue-600 mb-1">{phraseScore}%</div>
                      <p className="text-blue-700 font-medium text-xs">Phrasebook</p>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-teal-600 mb-1">{gapScore}%</div>
                      <p className="text-teal-700 font-medium text-xs">Gap Fill</p>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-emerald-600 mb-1">{quizScore}%</div>
                      <p className="text-emerald-700 font-medium text-xs">Quiz</p>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-rose-600 mb-1">{chatScore}%</div>
                      <p className="text-rose-700 font-medium text-xs">Virtual Chat</p>
                    </div>
                  </div>
                </>
              );
            })()}
            
            {bestFeedback?.general_feedback && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-left inline-block w-full shadow-inner mb-6">
                <h4 className="text-indigo-800 font-bold mb-3 flex items-center gap-2"><RiLightbulbLine className="text-lg" /> AI Maslahati</h4>
                <p className="text-indigo-700 text-sm leading-relaxed">{bestFeedback.general_feedback}</p>
              </div>
            )}
            
            {bestFeedback && (
              <div className="text-left mt-4 border-t border-gray-100 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Chat ko'nikmalari tahlili</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {Object.entries(SCORE_LABELS).map(([key, label], index, arr) => (
                    <div key={key} className={`bg-white border border-gray-200 shadow-sm rounded-xl p-4 ${index === arr.length - 1 ? 'sm:col-span-2' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500">{label}</span>
                        <span className="text-sm font-bold text-gray-900">{bestFeedback[key]}/10</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${SCORE_COLORS[key]} rounded-full progress-fill`}
                          style={{ width: `${(bestFeedback[key] || 0) * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                
                {bestFeedback.errors?.length > 0 && (
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
                    <h3 className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-3">Xatolar va tuzatmalar</h3>
                    <div className="space-y-3">
                      {bestFeedback.errors.map((e, i) => (
                        <div key={i} className="border-l-2 border-red-500/40 pl-3">
                          <p className="text-xs text-red-500 line-through mb-1">{e.original}</p>
                          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><RiCheckLine /> {e.corrected}</p>
                          {e.explanation && <p className="text-xs text-gray-500 mt-1">{e.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button onClick={() => navigate('/student/modules')}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all mx-auto">
            <RiCheckLine /> Modullarga qaytish
          </button>
        </div>
      )}
    </Layout>
  );
}
