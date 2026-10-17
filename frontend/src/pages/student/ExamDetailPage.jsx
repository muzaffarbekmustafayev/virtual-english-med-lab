import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  RiAwardLine, RiBookOpenLine, RiCheckboxCircleLine, RiTimeLine,
  RiArrowRightLine, RiArrowLeftLine, RiTrophyLine, RiStethoscopeLine,
  RiSendPlaneLine, RiMicLine, RiMicOffLine, RiVolumeUpLine,
  RiShieldCheckLine, RiRefreshLine, RiSparklingLine, RiQuestionLine,
  RiFileTextLine, RiUser3Line, RiHospitalLine, RiErrorWarningLine, RiRepeatLine
} from 'react-icons/ri';

export default function ExamDetailPage() {
  const { examType } = useParams();
  const navigate = useNavigate();
  const { t, language, getLocalized } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [examInfo, setExamInfo] = useState(null);
  const [step, setStep] = useState(1); // 1: intro/quiz, 2: patient chat, 3: result

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Chat state
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [finalizingChat, setFinalizingChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Final evaluation state
  const [finalResult, setFinalResult] = useState(null);

  useEffect(() => {
    fetchExamData();
    setupSpeechRecognition();
  }, [examType]);

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${text}` : text));
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error(t('voice_not_supported') || 'Voice recognition not supported');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (_) {
        setIsListening(false);
      }
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const fetchExamData = async () => {
    setLoading(true);
    try {
      const [detailsRes, quizRes, prevRes] = await Promise.all([
        api.get(`/student/exams/${examType}`),
        api.get(`/student/exams/${examType}/quiz`),
        api.get(`/student/exams/${examType}/results`).catch(() => ({ data: { completed: false } }))
      ]);

      setExamInfo(detailsRes.data);
      setQuizQuestions(quizRes.data.questions || []);

      if (prevRes.data?.completed && prevRes.data.result) {
        setFinalResult(prevRes.data.result);
        if (prevRes.data.result.is_passed) {
          setStep(3); // already passed, view certificate
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionKey) => {
    if (quizResult) return; // already submitted
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      toast.error("Iltimos, barcha savollarga javob bering");
      return;
    }
    setSubmittingQuiz(true);
    try {
      const res = await api.post(`/student/exams/${examType}/quiz/submit`, {
        answers: quizAnswers
      });
      setQuizResult(res.data);
      toast.success(`Test yakunlandi: ${res.data.quiz_score}%`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Testni topshirishda xatolik');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setSendingMsg(true);
      const res = await api.post(`/student/exams/${examType}/conversation`);
      setConversation(res.data);
      setMessages([res.data.first_message]);
      setStep(2);
      if (res.data.first_message?.content) {
        speakText(res.data.first_message.content);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Suhbatni boshlashda xatolik');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingMsg || !conversation) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    const tempUserMsg = { id: Date.now(), sender_role: 'student', content: userText };
    setMessages(prev => [...prev, tempUserMsg]);
    setSendingMsg(true);

    try {
      const res = await api.post(`/student/conversations/${conversation.conversation_id}/message`, {
        content: userText
      });
      const patientMsg = res.data.message || { id: Date.now() + 1, sender_role: 'patient', content: res.data.reply };
      setMessages(prev => [...prev, patientMsg]);
      if (patientMsg.content) {
        speakText(patientMsg.content);
      }
    } catch (err) {
      toast.error('Xabar yuborishda xatolik yuz berdi');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleFinalizeExam = async () => {
    if (!conversation) return;
    if (messages.length < 5) {
      toast.error("Kamida 4-5 marta klinik savol-javob o'tkazing");
      return;
    }
    setFinalizingChat(true);
    try {
      const res = await api.post(`/student/exams/${examType}/finalize`, {
        conversation_id: conversation.conversation_id
      });
      setFinalResult(res.data);
      setStep(3);
      if (res.data.is_passed) {
        toast.success(`Tabriklaymiz! Imtihon topshirildi: ${res.data.final_score}%`);
      } else {
        toast.error(`Imtihondan o'tish uchun kamida 70% kerak. Natijangiz: ${res.data.final_score}%`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Baholashda xatolik yuz berdi');
    } finally {
      setFinalizingChat(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-5xl mx-auto py-8">
          <div className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          <div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />
        </div>
      </Layout>
    );
  }

  const exam = examInfo?.exam;
  const caseBrief = examInfo?.case_brief;
  const isMidterm = exam?.type === 'midterm';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* ── 1. Top Navigation & Header ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate('/student/modules')}
            className="btn-secondary text-xs font-bold py-2 px-3.5 self-start sm:self-auto cursor-pointer"
          >
            <RiArrowLeftLine className="text-sm" />
            <span>{t('student.modules.title') || "O'quv rejasiga qaytish"}</span>
          </button>

          {/* Stepper Tabs - mobile horizontal scrollable */}
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 text-[11px] sm:text-xs cursor-pointer ${
                step === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              1. 📝 {t('exam_step_quiz') || "Klinik Test"}
            </button>
            <button
              onClick={() => quizResult && setStep(2)}
              disabled={!quizResult && step < 2}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 text-[11px] sm:text-xs ${
                step === 2
                  ? 'bg-white text-slate-900 shadow-xs'
                  : quizResult
                  ? 'text-slate-500 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              2. 🤖 {t('exam_step_chat') || "Klinik Keys (OSCE)"}
            </button>
            <button
              onClick={() => finalResult && setStep(3)}
              disabled={!finalResult}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 text-[11px] sm:text-xs ${
                step === 3
                  ? 'bg-white text-slate-900 shadow-xs'
                  : finalResult
                  ? 'text-slate-500 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              3. 🏆 {t('exam_step_result') || "Natija & Sertifikat"}
            </button>
          </div>
        </div>

        {/* ── 2. Exam Hero Banner (Glassmorphism + Gradients) ── */}
        <div className={`p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-xl backdrop-blur-xl border border-white/20 ${
          isMidterm
            ? 'bg-gradient-to-r from-amber-600/95 via-orange-600/90 to-amber-700/95 shadow-amber-600/25'
            : 'bg-gradient-to-r from-emerald-700/95 via-teal-700/90 to-cyan-800/95 shadow-emerald-700/25'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/30 shadow-xs">
                  {exam?.badge || (isMidterm ? 'Oraliq imtihon' : 'Yakuniy imtihon')}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white/95 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                  {examInfo?.specialty?.name}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white/95 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                  {t('exam_covered') || "Qamrov"}: {exam?.covered_modules?.length} ta modul
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {getLocalized(exam, 'title') || exam?.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/85 font-medium mt-1.5 sm:mt-2 leading-relaxed">
                {getLocalized(exam, 'description') || exam?.description_uz}
              </p>
            </div>

            {finalResult && (
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shrink-0 text-center w-full md:w-auto min-w-[160px] shadow-lg">
                <p className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-wider">{t('exam_score') || "Umumiy Ball"}</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 sm:mt-1">
                  {finalResult.overall_score || finalResult.final_score}%
                </p>
                <span className={`inline-block mt-1.5 sm:mt-2 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black shadow-xs ${
                  (finalResult.is_passed) ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400 text-slate-950'
                }`}>
                  {finalResult.is_passed ? (t('exam_passed_status') || "Topshirildi") : (t('exam_failed_status') || "Qayta urinish")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Step 1: Comprehensive Quiz ── */}
        {step === 1 && (
          <div className="space-y-5 sm:space-y-6">
            <div className="card-glass p-5 sm:p-7 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-4 mb-5 sm:mb-6 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <RiFileTextLine className="text-blue-600 text-lg sm:text-xl shrink-0" />
                    <span>{t('exam_quiz_title') || "1-qism: Integratsiyalashgan Klinik Test"}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t('exam_quiz_subtitle') || "O'tilgan modullar bo'yicha tibbiy terminologiya va klinik amaliyot savollari"} (10 ta savol)
                  </p>
                </div>
                {quizResult && (
                  <span className="badge-standard badge-amber text-xs sm:text-sm font-black px-3.5 py-1.5 self-start sm:self-auto shadow-xs">
                    <RiTrophyLine /> {quizResult.quiz_score}%
                  </span>
                )}
              </div>

              {/* Questions list */}
              <div className="space-y-6">
                {quizQuestions.map((q, idx) => {
                  const qText = getLocalized(q, 'question') || q.question;
                  const selected = quizAnswers[q.id];
                  const detail = quizResult?.details?.find(d => d.test_id === q.id);

                  return (
                    <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-extrabold text-slate-900 leading-snug">
                          {qText}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-0 sm:pl-9">
                        {['A', 'B', 'C', 'D'].map(optKey => {
                          const optField = `option_${optKey.toLowerCase()}`;
                          const optText = getLocalized(q, optField) || q[optField];
                          if (!optText) return null;

                          const isChosen = selected === optKey;
                          let optStyle = "bg-white border-slate-200 text-slate-700 hover:border-blue-400";

                          if (quizResult) {
                            if (optKey === q.correct_option) {
                              optStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
                            } else if (isChosen && !detail?.is_correct) {
                              optStyle = "bg-rose-50 border-rose-400 text-rose-900 font-bold";
                            } else {
                              optStyle = "bg-white border-slate-200 text-slate-400 opacity-60";
                            }
                          } else if (isChosen) {
                            optStyle = "bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs";
                          }

                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optKey)}
                              disabled={!!quizResult}
                              className={`p-2.5 sm:p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${optStyle}`}
                            >
                              <span className="w-5 h-5 rounded-lg bg-black/5 flex items-center justify-center text-[10px] font-black shrink-0">
                                {optKey}
                              </span>
                              <span className="flex-1 leading-relaxed">{optText}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizResult && detail && (
                        <div className="mt-2 pl-0 sm:pl-9">
                          <p className={`text-xs font-medium p-2.5 rounded-xl ${
                            detail.is_correct ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            <span className="font-bold">
                              {detail.is_correct ? "✓ To'g'ri javob" : "✗ Noto'g'ri javob"}.
                            </span>{' '}
                            {detail.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="pt-5 sm:pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
                {!quizResult ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="btn-primary text-xs font-extrabold py-3 px-6 shadow-md hover:shadow-lg transition-all w-full sm:w-auto sm:ml-auto cursor-pointer"
                  >
                    <span>{submittingQuiz ? "Tekshirilmoqda..." : "Testni topshirish"}</span>
                    <RiArrowRightLine className="text-base" />
                  </button>
                ) : (
                  <button
                    onClick={handleStartChat}
                    className="btn-primary text-xs font-extrabold py-3 px-6 shadow-md hover:shadow-lg transition-all w-full sm:w-auto sm:ml-auto cursor-pointer"
                  >
                    <span>2-bosqich: Virtual bemor muloqotini boshlash</span>
                    <RiArrowRightLine className="text-base" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Step 2: OSCE Clinical Simulation Chat ── */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left: Patient Profile Brief */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card-glass p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl font-bold shrink-0 border border-blue-200/60">
                    <RiUser3Line />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 truncate">{caseBrief?.patient?.name || "Virtual Bemor"}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold truncate">{caseBrief?.role_play || "Klinik Keys"}</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                    <span className="font-black text-slate-400 uppercase text-[10px] block">Asosiy shikoyat</span>
                    <p className="font-bold text-slate-800 mt-0.5 leading-snug">{caseBrief?.chief_complaint || "Klinik murojaat"}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                    <span className="font-black text-slate-400 uppercase text-[10px] block">Bemor holati</span>
                    <p className="text-slate-600 mt-0.5 leading-snug">{caseBrief?.patient?.personality_trait || "Vaziyatga mos muloqot qiling"}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 shadow-2xs">
                    <span className="font-black uppercase text-[10px] block text-amber-700">Klinik Topshiriq</span>
                    <p className="text-[11px] font-medium mt-0.5 leading-relaxed">
                      Ingliz tilida professional anamnez oling, bemorning xavotirlarini tinglang va shoshilinch rejani tushuntiring.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleFinalizeExam}
                  disabled={finalizingChat || messages.length < 4}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm ${
                    messages.length >= 4
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-500/20 hover:shadow-md'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RiAwardLine className="text-base" />
                  <span>{finalizingChat ? "Baholanmoqda..." : "Imtihonni yakunlash va baholash"}</span>
                </button>
              </div>
            </div>

            {/* Right: Real-time Live Consultation Chat */}
            <div className="lg:col-span-2">
              <div className="card-glass flex flex-col h-[520px] sm:h-[580px] overflow-hidden">
                {/* Chat header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-200/70 flex items-center justify-between bg-white/60 backdrop-blur-md rounded-t-3xl gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-extrabold text-slate-800 truncate">
                      OSCE Live Dialogue: {caseBrief?.counterpart_label || "Patient"}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">
                    {messages.length} ta xabar
                  </span>
                </div>

                {/* Messages scroll box */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
                  {messages.map((m) => {
                    const isDoctor = m.sender_role === 'student' || m.sender_role === 'doctor';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 sm:gap-2.5 ${isDoctor ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isDoctor && (
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            P
                          </div>
                        )}
                        <div
                          className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs leading-relaxed ${
                            isDoctor
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-slate-100 text-slate-900 rounded-tl-xs border border-slate-200/80'
                          }`}
                        >
                          <p>{m.content}</p>
                          {!isDoctor && (
                            <button
                              onClick={() => speakText(m.content)}
                              className="mt-1 text-[10px] text-teal-700 hover:text-teal-900 flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <RiVolumeUpLine /> Ovozli tinglash
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {sendingMsg && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                      Bemor javob yozmoqda...
                    </div>
                  )}
                </div>

                {/* Chat input box */}
                <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 border-t border-slate-100 flex items-center gap-2 bg-white rounded-b-3xl">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`p-2.5 rounded-xl border text-sm transition-colors cursor-pointer shrink-0 ${
                      isListening
                        ? 'bg-rose-50 border-rose-400 text-rose-600 animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={isListening ? "Ovozni to'xtatish" : "Ovoz bilan gapirish"}
                  >
                    {isListening ? <RiMicOffLine /> : <RiMicLine />}
                  </button>

                  <input
                    type="text"
                    placeholder="Doctor, type your question in English..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={sendingMsg}
                    className="input-standard flex-1 text-xs"
                  />

                  <button
                    type="submit"
                    disabled={sendingMsg || !inputMessage.trim()}
                    className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  >
                    <RiSendPlaneLine className="text-sm" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Step 3: Exam Result & Official Certificate ── */}
        {step === 3 && finalResult && (
          <div className="space-y-6">
            {/* Certificate Card */}
            <div className="card-standard p-5 sm:p-8 md:p-10 border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 text-center relative overflow-hidden shadow-xl rounded-2xl sm:rounded-3xl">
              <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center text-2xl sm:text-3xl mx-auto shadow-lg shadow-amber-500/30">
                  <RiAwardLine />
                </div>

                <div>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-amber-700">
                    Clinical English Hub — Rasmiy Attestatsiya Sertifikati
                  </span>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1">
                    {finalResult.is_passed ? "Muvaffaqiyatli topshirildi!" : "Imtihon natijasi"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 max-w-md mx-auto">
                    Ushbu sertifikat talabaning klinik ingliz tili muloqot va anamnez olish kompetensiyasini tasdiqlaydi.
                  </p>
                </div>

                {/* Score badge & Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4 border-t border-b border-amber-200/80 py-4 max-w-md mx-auto">
                  <div className="p-2 rounded-xl bg-white/60 sm:bg-transparent">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Klinik Test</span>
                    <span className="text-lg sm:text-xl font-black text-slate-800">{finalResult.quiz_score || 0}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 sm:bg-transparent">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">OSCE Simulyatsiya</span>
                    <span className="text-lg sm:text-xl font-black text-slate-800">{finalResult.chat_score || 0}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 sm:bg-transparent">
                    <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Yakuniy Ball</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-600">
                      {finalResult.overall_score || finalResult.final_score}%
                    </span>
                  </div>
                </div>

                {/* Student Info */}
                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <p><span className="font-bold text-slate-800">Talaba:</span> {user?.full_name}</p>
                  <p><span className="font-bold text-slate-800">Yo'nalish:</span> {examInfo?.specialty?.name}</p>
                  <p><span className="font-bold text-slate-800">Imtihon turi:</span> {exam?.title_uz || exam?.title}</p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/student/modules')}
                    className="btn-primary text-xs font-extrabold py-3 px-6 shadow-md w-full sm:w-auto cursor-pointer"
                  >
                    <RiBookOpenLine />
                    <span>O'quv rejasiga qaytish</span>
                  </button>

                  {!finalResult.is_passed && (
                    <button
                      onClick={() => {
                        setStep(1);
                        setQuizResult(null);
                        setQuizAnswers({});
                        setConversation(null);
                        setMessages([]);
                      }}
                      className="btn-secondary-soft text-xs font-extrabold py-3 px-6 w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RiRepeatLine />
                      <span>Qayta topshirish</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
