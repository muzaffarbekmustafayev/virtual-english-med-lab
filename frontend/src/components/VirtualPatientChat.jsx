import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  RiMicLine, RiStopCircleLine, RiVolumeUpLine,
  RiLoader4Line, RiHeartPulseLine, RiPhoneLine,
  RiCheckDoubleLine, RiUser3Line, RiRobot2Line,
  RiArrowRightSLine, RiKeyboardLine, RiSendPlane2Line, RiAlertLine,
  RiPulseLine, RiSparkling2Line, RiSpeedLine,
  RiStethoscopeLine, RiLightbulbLine, RiMedicineBottleLine,
  RiFirstAidKitLine, RiShieldStarLine, RiEyeLine, RiEyeOffLine,
  RiChatQuoteLine, RiSoundModuleLine
} from 'react-icons/ri';

// 10 ta modul uchun maxsus klinik mavzu parametrlari va vizual ikonkalari
const MODULE_THEMES = {
  1: {
    name: 'Dental Pain & Sensitivity',
    badge: 'Acute Sensitivity & Pain Assessment',
    emoji: '🦷',
    iconTag: 'Tooth Nerve & Cold Pain',
    accentColor: 'rose',
    gradientBg: 'from-rose-50 via-slate-50 to-amber-50/60',
    ringColor: 'ring-rose-400/40',
    glowColor: 'shadow-rose-500/10',
    chiefComplaint: 'Sharp shooting pain when drinking cold liquids & throbbing night ache',
    symptoms: ['Cold Sensitivity', 'Percussion Pain', 'Throbbing Night Ache'],
  },
  2: {
    name: 'Caries & Restorative Care',
    badge: 'Enamel Decay & Composite Restoration',
    emoji: '✨',
    iconTag: 'Enamel Cavity & Filling',
    accentColor: 'cyan',
    gradientBg: 'from-cyan-50 via-slate-50 to-blue-50/60',
    ringColor: 'ring-cyan-400/40',
    glowColor: 'shadow-cyan-500/10',
    chiefComplaint: 'Food getting caught in upper molar with mild sweet sensitivity',
    symptoms: ['Cavity / Enamel Decay', 'Sweet Sensitivity', 'Dark Fissure Spot'],
  },
  3: {
    name: 'Periodontal Evaluation',
    badge: 'Gingival Bleeding & Periodontal Pockets',
    emoji: '🩸',
    iconTag: 'Gums & Calculus Probe',
    accentColor: 'emerald',
    gradientBg: 'from-emerald-50 via-slate-50 to-teal-50/60',
    ringColor: 'ring-emerald-400/40',
    glowColor: 'shadow-emerald-500/10',
    chiefComplaint: 'Bleeding gums when brushing & persistent bad breath',
    symptoms: ['Bleeding on Probing', 'Subgingival Calculus', 'Gum Recession'],
  },
  4: {
    name: 'Tooth Extraction & Surgery',
    badge: 'Surgical Preparation & Local Anesthesia',
    emoji: '🩺',
    iconTag: 'Surgical Forceps & Anesthesia',
    accentColor: 'indigo',
    gradientBg: 'from-indigo-50 via-slate-50 to-purple-50/60',
    ringColor: 'ring-indigo-400/40',
    glowColor: 'shadow-indigo-500/10',
    chiefComplaint: 'Severe broken crown with recurrent abscess in lower right quadrant',
    symptoms: ['Root Rest Retention', 'Local Anesthesia Planning', 'Post-Op Instructions'],
  },
  5: {
    name: 'Endodontic Consultation',
    badge: 'Root Canal & Pulp Necrosis',
    emoji: '⚡',
    iconTag: 'Pulp Chamber & Canal Files',
    accentColor: 'amber',
    gradientBg: 'from-amber-50 via-slate-50 to-orange-50/60',
    ringColor: 'ring-amber-400/40',
    glowColor: 'shadow-amber-500/10',
    chiefComplaint: 'Continuous throbbing radiated pain unresponsive to regular analgesics',
    symptoms: ['Pulpitis / Necrosis', 'Thermal Lingering Pain', 'Apical Tenderness'],
  },
  6: {
    name: 'Orthodontic Assessment',
    badge: 'Malocclusion & Bracket Alignment',
    emoji: '📐',
    iconTag: 'Brackets & Archwire',
    accentColor: 'blue',
    gradientBg: 'from-blue-50 via-slate-50 to-sky-50/60',
    ringColor: 'ring-blue-400/40',
    glowColor: 'shadow-blue-500/10',
    chiefComplaint: 'Crowding of anterior mandibular incisors and difficulty chewing',
    symptoms: ['Class II Malocclusion', 'Anterior Crowding', 'Cephalometric Analysis'],
  },
  7: {
    name: 'Prosthodontic Rehabilitation',
    badge: 'Crowns, Bridges & Dentures',
    emoji: '👑',
    iconTag: 'Ceramic Crown & Implant Bridge',
    accentColor: 'violet',
    gradientBg: 'from-violet-50 via-slate-50 to-indigo-50/60',
    ringColor: 'ring-violet-400/40',
    glowColor: 'shadow-violet-500/10',
    chiefComplaint: 'Missing premolar causing aesthetic concern and bite imbalance',
    symptoms: ['Missing Tooth Edentulism', 'Shade Selection A2/A3', 'Impression Taking'],
  },
  8: {
    name: 'Pediatric Dentistry',
    badge: 'Primary Dentition & Gentle Communication',
    emoji: '🧸',
    iconTag: 'Primary Molars & Fluoride Gel',
    accentColor: 'pink',
    gradientBg: 'from-pink-50 via-slate-50 to-rose-50/60',
    ringColor: 'ring-pink-400/40',
    glowColor: 'shadow-pink-500/10',
    chiefComplaint: '7-year-old child with early childhood caries on primary molar',
    symptoms: ['Tell-Show-Do Method', 'Pit & Fissure Sealants', 'Fluoride Varnish'],
  },
  9: {
    name: 'Oral Pathology & Biopsy',
    badge: 'Mucosal Lesions & Differential Diagnosis',
    emoji: '🔬',
    iconTag: 'Histopathology & White Plaque',
    accentColor: 'teal',
    gradientBg: 'from-teal-50 via-slate-50 to-emerald-50/60',
    ringColor: 'ring-teal-400/40',
    glowColor: 'shadow-teal-500/10',
    chiefComplaint: 'Painless white patch on buccal mucosa lasting for over 3 weeks',
    symptoms: ['Leukoplakia', 'Mucosal Ulceration', 'Biopsy Referral'],
  },
  10: {
    name: 'Dental Trauma & Emergency',
    badge: 'Tooth Avulsion & Maxillofacial Emergency',
    emoji: '🚨',
    iconTag: 'Tooth Luxation & Splinting',
    accentColor: 'red',
    gradientBg: 'from-red-50 via-slate-50 to-rose-50/60',
    ringColor: 'ring-red-400/40',
    glowColor: 'shadow-red-500/10',
    chiefComplaint: 'Sports trauma resulting in avulsion of maxillary central incisor',
    symptoms: ['Avulsed Incisor 21', 'Storage in Hank\'s / Milk', 'Flexible Splint 14 Days'],
  },
};

export default function VirtualPatientChat({
  moduleId,
  module,
  conversationId,
  phrasebook = [],
  onFinish,
  onTestPass100
}) {
  const { t, lang, getTranslated } = useLanguage();
  const [callState, setCallState] = useState('idle');
  const [micState, setMicState] = useState('idle');
  const [chatMode, setChatMode] = useState('audio');
  const [visualView, setVisualView] = useState('case');
  const [chatHistory, setChatHistory] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showReplayAlert, setShowReplayAlert] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const currentAudioRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const callStateRef = useRef('idle');
  const chatModeRef = useRef('audio');
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const messagesEndRef = useRef(null);

  const parsedModuleId = Number(moduleId) || 1;
  const currentTheme = MODULE_THEMES[parsedModuleId] || MODULE_THEMES[1];

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const initAudioAnalyser = async () => {
    try {
      if (audioContextRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyserRef.current && isListeningRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        } else {
          setVolumeLevel(0);
        }
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Audio Visualizer setup skipped:', e);
    }
  };

  const stopAudioAnalyser = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  };

  const getBestNaturalVoice = () => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    let v = voices.find(v => (v.name.includes('Natural') || v.name.includes('Neural')) && (v.lang.startsWith('en') || v.lang === 'en-US'));
    if (!v) v = voices.find(v => v.name.includes('Online') && v.lang.startsWith('en'));
    if (!v) v = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
    if (!v) v = voices.find(v => v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'));
    if (!v) v = voices.find(v => v.lang.startsWith('en'));
    return v || voices[0];
  };

  const startListening = () => {
    if (chatModeRef.current !== 'audio') return;
    if (callStateRef.current !== 'active') return;
    if (isSpeakingRef.current || isProcessingRef.current) return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isListeningRef.current = true;
      setMicState('listening');
    };

    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const liveText = final || interim;
      setTranscript(liveText);

      if (final && final.trim().length > 0) {
        try { rec.stop(); } catch (_) {}
        sendMessage(final.trim());
      }
    };

    rec.onerror = (e) => {
      isListeningRef.current = false;
      if (callStateRef.current === 'active' && !isSpeakingRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (callStateRef.current === 'active' && !isSpeakingRef.current && !isProcessingRef.current) {
            startListening();
          }
        }, 1200);
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      if (callStateRef.current === 'active' && !isSpeakingRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (callStateRef.current === 'active' && !isSpeakingRef.current && !isProcessingRef.current) {
            startListening();
          }
        }, 600);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (_) {}
  };

  const stopListening = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
  };

  const playTTS = (text, audioBase64 = null) => {
    return new Promise((resolve) => {
      stopListening();
      isSpeakingRef.current = true;
      setMicState('speaking');

      if (audioBase64) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
          currentAudioRef.current = audio;
          audio.playbackRate = speechRate;
          audio.onended = () => {
            isSpeakingRef.current = false;
            currentAudioRef.current = null;
            resolve();
          };
          audio.onerror = () => {
            fallbackBrowserTTS(text).then(resolve);
          };
          audio.play().catch(() => {
            fallbackBrowserTTS(text).then(resolve);
          });
          return;
        } catch (_) {
          fallbackBrowserTTS(text).then(resolve);
          return;
        }
      }

      fallbackBrowserTTS(text).then(resolve);
    });
  };

  const fallbackBrowserTTS = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        isSpeakingRef.current = false;
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'en-US';
      utt.rate = speechRate;
      utt.pitch = 1.0;

      const voice = getBestNaturalVoice();
      if (voice) utt.voice = voice;

      utt.onend = () => {
        isSpeakingRef.current = false;
        resolve();
      };
      utt.onerror = () => {
        isSpeakingRef.current = false;
        resolve();
      };

      try {
        window.speechSynthesis.speak(utt);
      } catch (_) {
        isSpeakingRef.current = false;
        resolve();
      }
    });
  };

  const sendMessage = async (userText) => {
    if (!userText || !userText.trim()) return;
    if (isProcessingRef.current) return;

    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    isProcessingRef.current = true;
    setMicState('processing');
    setTranscript('');

    const newHistory = [...chatHistory, { role: 'user', content: userText, timestamp: new Date() }];
    setChatHistory(newHistory);

    try {
      const res = await api.post(`/student/conversations/${conversationId}/messages`, {
        content: userText,
        message: userText
      });

      const patientReply = res.data.message || res.data.reply || "I understand, doctor. What should we do next?";
      const audioBase64 = res.data.audio || null;

      setChatHistory(prev => [
        ...prev,
        { role: 'patient', content: patientReply, timestamp: new Date(), audio: audioBase64 }
      ]);

      isProcessingRef.current = false;

      if (callStateRef.current === 'active') {
        await playTTS(patientReply, audioBase64);

        if (callStateRef.current === 'active') {
          setMicState('listening');
          if (chatModeRef.current === 'audio') {
            startListening();
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      isProcessingRef.current = false;
      const errorMsg = "I'm having a little trouble hearing you, doctor. Could you please repeat that?";
      setChatHistory(prev => [
        ...prev,
        { role: 'patient', content: errorMsg, timestamp: new Date() }
      ]);
      if (callStateRef.current === 'active') {
        await fallbackBrowserTTS(errorMsg);
        if (callStateRef.current === 'active') {
          setMicState('listening');
          if (chatModeRef.current === 'audio') startListening();
        }
      }
    }
  };

  const stopAllAudioAndRecognition = () => {
    stopListening();
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (_) {}
      currentAudioRef.current = null;
    }
    stopAudioAnalyser();
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    isListeningRef.current = false;
    setMicState('idle');
  };

  const startCall = async (mode = 'audio') => {
    stopAllAudioAndRecognition();
    setChatMode(mode);
    chatModeRef.current = mode;
    setCallState('active');
    callStateRef.current = 'active';

    if (mode === 'audio') {
      await initAudioAnalyser();
    }

    setMicState('listening');

    if (mode === 'audio') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert("Brauzeringiz ovozli muloqotni qo'llab-quvvatlamaydi. Microsoft Edge yoki Chrome tavsiya etiladi.");
        setCallState('idle');
        callStateRef.current = 'idle';
        return;
      }
      startListening();
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!textInput.trim() || micState === 'processing') return;
    const text = textInput.trim();
    setTextInput('');
    sendMessage(text);
  };

  const handleQuickPhraseClick = (phraseText) => {
    if (callState !== 'active') return;
    if (chatMode === 'audio') {
      sendMessage(phraseText);
    } else {
      setTextInput(phraseText);
    }
  };

  const endCall = () => {
    stopAllAudioAndRecognition();
    setCallState('ended');
    callStateRef.current = 'ended';
    setTranscript('');
  };

  const handleFinish = async () => {
    if (chatHistory.filter(m => m.role === 'user').length === 0) {
      alert("Suhbat hali boshlanmadi. Avval bemor bilan muloqot qiling.");
      return;
    }
    stopAllAudioAndRecognition();
    setIsSubmitting(true);
    try {
      await onFinish();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isIdle    = callState === 'idle';
  const isActive  = callState === 'active';
  const isEnded   = callState === 'ended';

  const isListening  = isActive && micState === 'listening';
  const isProcessing = isActive && micState === 'processing';
  const isSpeaking   = isActive && micState === 'speaking';

  const userMessagesCount = chatHistory.filter(m => m.role === 'user').length;
  const canEvaluate = isEnded && userMessagesCount >= 1;
  const lastPatientMsg = [...chatHistory].reverse().find(m => m.role === 'patient');

  const statusInfo = isIdle ? {
    title: 'Simulyatsiya Kutilmoqda',
    badge: 'Offline',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400'
  } : isListening ? {
    title: chatMode === 'text' ? 'Matn kiriting...' : t('chat_listening'),
    badge: 'Microphone Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse',
    dotClass: 'bg-emerald-500'
  } : isProcessing ? {
    title: t('chat_processing'),
    badge: 'AI Generating',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500'
  } : isSpeaking ? {
    title: t('chat_speaking'),
    badge: 'TTS Speaking',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500'
  } : {
    title: t('chat_ended'),
    badge: 'Finished',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400'
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col transition-all duration-300">
      
      {/* ─── TOP BAR HEADER ─── */}
      <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <RiHeartPulseLine className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {t('chat_header_title')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                Modul #{parsedModuleId}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentTheme.name} · {currentTheme.badge}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass} ${isListening ? 'animate-ping' : ''}`} />
            <span>{statusInfo.badge}</span>
          </div>

          {/* View toggle (Visual / Transcript) */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setVisualView('case')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                visualView === 'case'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RiEyeLine size={13} />
              <span>{t('chat_visual_mode')}</span>
            </button>
            <button
              onClick={() => setVisualView('transcript')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                visualView === 'transcript'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RiChatQuoteLine size={13} />
              <span>{t('chat_transcript_mode')}</span>
              {chatHistory.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                  {chatHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Voice Speed Control */}
          <div className="hidden sm:flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <RiSpeedLine className="text-indigo-600" />
            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
              title={t('chat_speed')}
            >
              <option value="0.8">0.8x</option>
              <option value="0.95">1.0x</option>
              <option value="1.15">1.2x</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── MAIN STAGE CONTAINER ─── */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center min-h-[460px] bg-slate-50/40">

        {/* ── 1. IDLE STATE ── */}
        {isIdle && (
          <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-blue-500/10 to-emerald-500/10 border-2 border-dashed border-indigo-300 flex items-center justify-center text-5xl shadow-sm">
                <span>{currentTheme.emoji}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-md">
                <RiStethoscopeLine size={18} />
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {currentTheme.name}
            </h3>
            <p className="text-sm text-slate-600 font-medium mb-6 max-w-md leading-relaxed">
              {currentTheme.chiefComplaint}
            </p>

            {/* Quick module symptoms pill list */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {currentTheme.symptoms.map((s, idx) => (
                <span key={idx} className="text-xs px-3 py-1 rounded-full font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  • {s}
                </span>
              ))}
            </div>

            {/* Start Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={() => startCall('audio')}
                className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <RiMicLine className="text-xl animate-pulse" />
                <span>{t('chat_start_voice')}</span>
              </button>

              <button
                onClick={() => startCall('text')}
                className="py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-sm border border-slate-200 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RiKeyboardLine className="text-lg text-indigo-600" />
                <span>{t('chat_start_text')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 2. ACTIVE / ENDED STATE ── */}
        {(isActive || isEnded) && (
          <div className="flex flex-col flex-1 h-full">
            
            {/* Mode A: CASE VISUAL CENTERPIECE */}
            {visualView === 'case' && (
              <div className="flex flex-col items-center justify-center my-auto py-4">
                
                {/* Topic Specific Animated Avatar Centerpiece */}
                <div className="relative flex items-center justify-center mb-6">
                  {/* Outer soundwave pulse aura */}
                  <div
                    className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                      isSpeaking
                        ? 'w-48 h-48 bg-indigo-500/15 ring-8 ring-indigo-400/30 animate-ping'
                        : isListening
                        ? 'w-44 h-44 bg-emerald-500/15 ring-6 ring-emerald-400/25'
                        : 'w-36 h-36 bg-slate-200/40 ring-2 ring-slate-200'
                    }`}
                  />

                  {/* Visual Theme Centerpiece Card */}
                  <div className={`relative z-10 w-32 h-32 rounded-3xl bg-gradient-to-tr ${currentTheme.gradientBg} border-2 border-slate-200/90 shadow-xl flex flex-col items-center justify-center p-3 text-center transition-all ${
                    isSpeaking ? 'scale-105 shadow-indigo-300' : isListening ? 'scale-105 shadow-emerald-200' : ''
                  }`}>
                    <span className="text-4xl filter drop-shadow-sm select-none">
                      {currentTheme.emoji}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-800 tracking-tight mt-1 truncate max-w-full">
                      {currentTheme.iconTag}
                    </span>
                  </div>

                  {/* Pulsing state badge indicator */}
                  <div className="absolute -bottom-3 z-20">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${
                      isSpeaking
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : isListening
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isProcessing
                        ? 'bg-amber-500 text-white border-amber-400'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {isSpeaking && <RiVolumeUpLine className="animate-bounce" />}
                      {isListening && <RiPulseLine className="animate-spin" />}
                      {isProcessing && <RiLoader4Line className="animate-spin" />}
                      <span>{statusInfo.title}</span>
                    </span>
                  </div>
                </div>

                {/* Equalizer Sound Wave Animation */}
                <div className="h-8 flex items-center justify-center gap-1.5 my-3">
                  {[...Array(12)].map((_, i) => {
                    const dynamicHeight = isSpeaking
                      ? Math.max(12, Math.sin(i * 0.8 + Date.now() * 0.005) * 28 + 14)
                      : isListening
                      ? Math.max(8, (volumeLevel / 100) * 32 * Math.sin(i + 1))
                      : 6;
                    return (
                      <span
                        key={i}
                        style={{ height: `${dynamicHeight}px` }}
                        className={`w-1.5 rounded-full transition-all duration-100 ${
                          isSpeaking
                            ? 'bg-indigo-600'
                            : isListening
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Live Transcript / Patient Response Ticker */}
                <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <RiSoundModuleLine className="text-indigo-600" />
                      {isListening ? 'Doktor Nutqi (Live STT):' : 'Bemor Javobi:'}
                    </span>
                    {lastPatientMsg && (
                      <button
                        onClick={() => playTTS(lastPatientMsg.content, lastPatientMsg.audio)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 lowercase font-semibold transition-colors cursor-pointer"
                      >
                        <RiVolumeUpLine size={13} /> {t('chat_replay_audio')}
                      </button>
                    )}
                  </div>

                  <p className="text-sm font-medium text-slate-800 leading-relaxed min-h-[44px]">
                    {isListening && transcript
                      ? `"${transcript}"`
                      : lastPatientMsg
                      ? lastPatientMsg.content
                      : isProcessing
                      ? t('chat_processing')
                      : 'Ingliz tilida anamnez to\'plang va bemorga kerakli tibbiy savollarni bering.'}
                  </p>
                </div>
              </div>
            )}

            {/* Mode B: FULL TRANSCRIPT CHAT VIEW */}
            {visualView === 'transcript' && (
              <div className="flex-1 overflow-y-auto max-h-[380px] p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-inner mb-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    {t('chat_simulator')}
                  </div>
                ) : (
                  chatHistory.map((msg, index) => {
                    const isDoctor = msg.role === 'user';
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 ${isDoctor ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isDoctor && (
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg flex-shrink-0 shadow-2xs">
                            {currentTheme.emoji}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                            isDoctor
                              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-xs'
                              : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-75">
                            <span className="font-bold uppercase tracking-wider">
                              {isDoctor ? 'Doktor' : 'Bemor'}
                            </span>
                            {!isDoctor && (
                              <button
                                onClick={() => playTTS(msg.content, msg.audio)}
                                className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
                                title={t('chat_replay_audio')}
                              >
                                <RiVolumeUpLine size={12} />
                              </button>
                            )}
                          </div>
                          <p className="font-medium">{msg.content}</p>
                        </div>
                        {isDoctor && (
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
                            DR
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* ─── BOTTOM CONTROLS DOCK ─── */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col gap-3">
              
              {/* Text Input Row (when in text mode or manual inquiry) */}
              <form onSubmit={handleSendText} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t('chat_input_placeholder')}
                    disabled={!isActive || isProcessing}
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-all disabled:opacity-50"
                  />
                  {textInput && (
                    <button
                      type="button"
                      onClick={() => setTextInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!textInput.trim() || !isActive || isProcessing}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RiSendPlane2Line />
                  <span className="hidden sm:inline">{t('submit')}</span>
                </button>

                {/* Phrasebook drawer trigger */}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className={`px-3 py-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDrawerOpen
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={t('chat_phrasebook_drawer')}
                >
                  <RiLightbulbLine className="text-amber-500 text-base" />
                  <span className="hidden md:inline">{t('chat_phrasebook_drawer')}</span>
                </button>

                {/* End / Hang up call button */}
                {isActive && (
                  <button
                    type="button"
                    onClick={endCall}
                    className="px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    title={t('finish')}
                  >
                    <RiStopCircleLine className="text-base text-rose-600" />
                    <span className="hidden sm:inline">{t('finish')}</span>
                  </button>
                )}
              </form>

              {/* Phrasebook Quick Suggestions Drawer */}
              {isDrawerOpen && phrasebook.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 max-h-48 overflow-y-auto animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <RiLightbulbLine className="text-amber-500" /> {t('chat_phrasebook_drawer')} ({t('chat_phrasebook_hint')}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {phrasebook.length} ta ibora
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {phrasebook.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickPhraseClick(p.phrase)}
                        className="text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition-all text-xs group cursor-pointer shadow-2xs"
                      >
                        <p className="font-bold text-slate-800 group-hover:text-indigo-700">
                          {p.phrase}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {getTranslated(p, 'hint')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluate & Final Actions */}
              {isEnded && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                  <div>
                    <h4 className="text-sm font-black text-emerald-900">
                      {t('chat_ended')} — {chatHistory.length} ta xabar almashildi
                    </h4>
                    <p className="text-xs text-emerald-700">
                      {userMessagesCount >= 1
                        ? "Bemor bilan konsultatsiya yakunlandi. Endi sun'iy intellekt orqali klinik baholash oling."
                        : t('chat_eval_min_hint')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startCall(chatMode)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                    >
                      {t('retry')}
                    </button>

                    <button
                      onClick={handleFinish}
                      disabled={isSubmitting || userMessagesCount === 0}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RiLoader4Line className="animate-spin text-sm" />
                          <span>{t('loading')}</span>
                        </>
                      ) : (
                        <>
                          <RiSparkling2Line className="text-sm" />
                          <span>{t('chat_eval_btn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Pass Helper */}
      {onTestPass100 && (
        <div className="px-5 py-2.5 bg-slate-100/60 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <span>Virtual Medical English Lab v2.0</span>
          <button
            onClick={onTestPass100}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
          >
            ⚡ {t('chat_test_100')}
          </button>
        </div>
      )}
    </div>
  );
}
