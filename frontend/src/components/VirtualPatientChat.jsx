import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  RiMicLine, RiMicOffLine, RiStopCircleLine, RiVolumeUpLine,
  RiLoader4Line, RiHeartPulseLine,
  RiCheckDoubleLine, RiUser3Line,
  RiSendPlane2Line, RiSpeedLine,
  RiStethoscopeLine, RiLightbulbLine,
  RiEyeLine, RiChatQuoteLine, RiSoundModuleLine,
  RiSparkling2Line, RiRefreshLine, RiKeyboardLine,
  RiPlayCircleLine, RiVoiceprintLine, RiAwardLine
} from 'react-icons/ri';
import { toast } from 'react-hot-toast';

// 10 ta modul uchun klinik mavzular va moslashtirilgan boshlang'ich bemor shikoyatlari
const MODULE_THEMES = {
  1: {
    name: 'Dental Pain & Sensitivity',
    badge: 'Acute Sensitivity & Pain Assessment',
    emoji: '🦷',
    iconTag: 'Tooth Nerve & Cold Pain',
    accentColor: 'rose',
    gradientBg: 'from-rose-50 via-slate-50 to-amber-50/60',
    chiefComplaint: 'Sharp shooting pain when drinking cold liquids & throbbing night ache',
    initialGreeting: "Hello Doctor. I've had a sharp, throbbing pain in my lower left tooth for three days now, especially with cold liquids.",
    symptoms: ['Cold Sensitivity', 'Percussion Pain', 'Throbbing Night Ache'],
  },
  2: {
    name: 'Caries & Restorative Care',
    badge: 'Enamel Decay & Composite Restoration',
    emoji: '✨',
    iconTag: 'Enamel Cavity & Filling',
    accentColor: 'cyan',
    gradientBg: 'from-cyan-50 via-slate-50 to-blue-50/60',
    chiefComplaint: 'Food getting caught in upper molar with mild sweet sensitivity',
    initialGreeting: "Good morning Doctor. Food keeps getting caught in my upper right molar, and I feel a sharp sensitivity with sweets.",
    symptoms: ['Cavity / Enamel Decay', 'Sweet Sensitivity', 'Dark Fissure Spot'],
  },
  3: {
    name: 'Periodontal Evaluation',
    badge: 'Gingival Bleeding & Periodontal Pockets',
    emoji: '🩸',
    iconTag: 'Gums & Calculus Probe',
    accentColor: 'emerald',
    gradientBg: 'from-emerald-50 via-slate-50 to-teal-50/60',
    chiefComplaint: 'Bleeding gums when brushing & persistent bad breath',
    initialGreeting: "Hello Doctor. My gums have been bleeding noticeably every time I brush, and they feel sore around my lower teeth.",
    symptoms: ['Bleeding on Probing', 'Subgingival Calculus', 'Gum Recession'],
  },
  4: {
    name: 'Tooth Extraction & Surgery',
    badge: 'Surgical Preparation & Local Anesthesia',
    emoji: '🩺',
    iconTag: 'Surgical Forceps & Anesthesia',
    accentColor: 'indigo',
    gradientBg: 'from-indigo-50 via-slate-50 to-purple-50/60',
    chiefComplaint: 'Severe broken crown with recurrent abscess in lower right quadrant',
    initialGreeting: "Doctor, my lower right tooth broke last week and my cheek is swollen with severe throbbing pain. Can you check it?",
    symptoms: ['Root Rest Retention', 'Local Anesthesia Planning', 'Post-Op Instructions'],
  },
  5: {
    name: 'Endodontic Consultation',
    badge: 'Root Canal & Pulp Necrosis',
    emoji: '⚡',
    iconTag: 'Pulp Chamber & Canal Files',
    accentColor: 'amber',
    gradientBg: 'from-amber-50 via-slate-50 to-orange-50/60',
    chiefComplaint: 'Continuous throbbing radiated pain unresponsive to regular analgesics',
    initialGreeting: "Hello Doctor, the pain in my back tooth is unbearable and radiates up into my ear. Regular painkillers aren't helping at all.",
    symptoms: ['Pulpitis / Necrosis', 'Thermal Lingering Pain', 'Apical Tenderness'],
  },
  6: {
    name: 'Orthodontic Assessment',
    badge: 'Malocclusion & Bracket Alignment',
    emoji: '📐',
    iconTag: 'Brackets & Archwire',
    accentColor: 'blue',
    gradientBg: 'from-blue-50 via-slate-50 to-sky-50/60',
    chiefComplaint: 'Crowding of anterior mandibular incisors and difficulty chewing',
    initialGreeting: "Hi Doctor. I'm concerned about the crowding of my front lower teeth and difficulty with chewing. What options do I have?",
    symptoms: ['Class II Malocclusion', 'Anterior Crowding', 'Cephalometric Analysis'],
  },
  7: {
    name: 'Prosthodontic Rehabilitation',
    badge: 'Crowns, Bridges & Dentures',
    emoji: '👑',
    iconTag: 'Ceramic Crown & Implant Bridge',
    accentColor: 'violet',
    gradientBg: 'from-violet-50 via-slate-50 to-indigo-50/60',
    chiefComplaint: 'Missing premolar causing aesthetic concern and bite imbalance',
    initialGreeting: "Good day Doctor. I lost a premolar tooth a few months ago and would like to discuss crowns, bridges, or dental implants.",
    symptoms: ['Missing Tooth Edentulism', 'Shade Selection A2/A3', 'Impression Taking'],
  },
  8: {
    name: 'Pediatric Dentistry',
    badge: 'Primary Dentition & Gentle Communication',
    emoji: '🧸',
    iconTag: 'Primary Molars & Fluoride Gel',
    accentColor: 'pink',
    gradientBg: 'from-pink-50 via-slate-50 to-rose-50/60',
    chiefComplaint: '7-year-old child with early childhood caries on primary molar',
    initialGreeting: "Hello Doctor, my tooth hurts when I eat ice cream or cold food. I was a bit scared to visit today.",
    symptoms: ['Tell-Show-Do Method', 'Pit & Fissure Sealants', 'Fluoride Varnish'],
  },
  9: {
    name: 'Oral Pathology & Biopsy',
    badge: 'Mucosal Lesions & Differential Diagnosis',
    emoji: '🔬',
    iconTag: 'Histopathology & White Plaque',
    accentColor: 'teal',
    gradientBg: 'from-teal-50 via-slate-50 to-emerald-50/60',
    chiefComplaint: 'Painless white patch on buccal mucosa lasting for over 3 weeks',
    initialGreeting: "Hello Doctor. I noticed a painless white patch inside my cheek about three weeks ago that hasn't gone away.",
    symptoms: ['Leukoplakia', 'Mucosal Ulceration', 'Biopsy Referral'],
  },
  10: {
    name: 'Dental Trauma & Emergency',
    badge: 'Tooth Avulsion & Maxillofacial Emergency',
    emoji: '🚨',
    iconTag: 'Tooth Luxation & Splinting',
    accentColor: 'red',
    gradientBg: 'from-red-50 via-slate-50 to-rose-50/60',
    chiefComplaint: 'Sports trauma resulting in avulsion of maxillary central incisor',
    initialGreeting: "Doctor! I was hit during a sports match an hour ago and my front tooth got knocked out. I brought it in a glass of milk!",
    symptoms: ['Avulsed Incisor 21', 'Storage in Milk', 'Emergency Reimplantation'],
  },
};

const MODULE_SUGGESTED_QUESTIONS = {
  1: [
    "Hello, what brings you in today?",
    "Where is the pain located?",
    "Is it sensitive to hot or cold food?",
    "How long does the pain linger?"
  ],
  2: [
    "Hello, how can I help you today?",
    "Which tooth is giving you trouble?",
    "Does sweet food cause any discomfort?",
    "Let me examine the cavity under light."
  ],
  3: [
    "Good morning, what seems to be the issue?",
    "Do your gums bleed when you brush or floss?",
    "How long have your gums been swollen?",
    "We need to perform periodontal probing."
  ],
  4: [
    "Hello, what brings you to our dental clinic?",
    "Where is the swelling located in your mouth?",
    "Is the tooth broken down to the root?",
    "We will administer local anesthesia first."
  ],
  5: [
    "Hello, what brings you in today?",
    "Where is the throbbing pain located, and does it radiate to your ear?",
    "Does hot or cold drink trigger severe lingering pain?",
    "Does the tooth hurt when you bite or tap on it?",
    "We need a periapical X-ray to check for pulp necrosis and root canals."
  ],
  6: [
    "Hello, how can I help with your smile today?",
    "Are you concerned about crowded or crooked teeth?",
    "Do you have any difficulty chewing or speaking?",
    "We can discuss ceramic brackets or clear aligners."
  ],
  7: [
    "Good day, what brings you in today?",
    "Which missing tooth are you looking to replace?",
    "Would you prefer a dental crown, bridge, or implant?",
    "Let's take a dental impression for shade matching."
  ],
  8: [
    "Hello there! How are you feeling today?",
    "Can you show me where the tooth hurts?",
    "Does eating ice cream or sweets make it ache?",
    "Let's count your teeth and apply gentle fluoride gel."
  ],
  9: [
    "Hello, what brings you in for consultation?",
    "Where is the white patch or lesion located?",
    "Has the lesion changed in size or color recently?",
    "We should take a gentle diagnostic biopsy."
  ],
  10: [
    "Hello, what is the dental emergency today?",
    "Did you experience any dental trauma or accident?",
    "Is the tooth completely knocked out or loose?",
    "We will perform an emergency dental splint."
  ]
};

export default function VirtualPatientChat({
  moduleId,
  module,
  conversationId: initialConversationId,
  phrasebook = [],
  onFinish,
  onTestPass100
}) {
  const { t, getTranslated } = useLanguage();

  // State
  const [activeConvId, setActiveConvId] = useState(initialConversationId || null);
  const [callState, setCallState] = useState('idle'); // 'idle' | 'active' | 'ended'
  const [micState, setMicState] = useState('idle');   // 'idle' | 'listening' | 'processing' | 'speaking'
  const [chatMode, setChatMode] = useState('audio');   // 'audio' | 'text'
  const [visualView, setVisualView] = useState('case'); // 'case' | 'transcript'
  const [chatHistory, setChatHistory] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [audioRecordingSupported, setAudioRecordingSupported] = useState(true);

  // Refs
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
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
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);
  const activeConvIdRef = useRef(initialConversationId || null);

  const parsedModuleId = Number(moduleId) || 1;
  const currentTheme = MODULE_THEMES[parsedModuleId] || MODULE_THEMES[1];

  // Sync activeConvId
  useEffect(() => {
    if (initialConversationId) {
      setActiveConvId(initialConversationId);
      activeConvIdRef.current = initialConversationId;
    }
  }, [initialConversationId]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const lastSoundTimeRef = useRef(0);
  const isSpeakingAudioRef = useRef(false);
  const autoCommitTriggeredRef = useRef(false);
  const voiceFrameCountRef = useRef(0);
  const speechDetectedRef = useRef(false);

  // Audio Context & Mic Visualizer with Noise Suppression & 60fps Hardware JS VAD
  const initAudioAnalyser = async () => {
    try {
      if (micStreamRef.current) return micStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Hardware Bandpass Filter (Removes low frequency fan rumble < 150Hz & high frequency hiss)
      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 150; // Cut off low hums/fans

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(highpass);
      highpass.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyserRef.current && isListeningRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const vol = Math.min(100, Math.round((avg / 128) * 100));
          setVolumeLevel(vol);

          // Noise Gate: Ignore any noise/whispers below 20%
          const NOISE_GATE_THRESHOLD = 20;

          if (vol >= NOISE_GATE_THRESHOLD) {
            voiceFrameCountRef.current += 1;
            // Only confirm intentional speech if sustained for at least 2 frames (prevents click/pop false triggers)
            if (voiceFrameCountRef.current >= 2) {
              isSpeakingAudioRef.current = true;
              speechDetectedRef.current = true;
              lastSoundTimeRef.current = Date.now();
              autoCommitTriggeredRef.current = false;
            }
          } else {
            voiceFrameCountRef.current = 0;
            if (isSpeakingAudioRef.current && !autoCommitTriggeredRef.current) {
              const elapsedSilence = Date.now() - lastSoundTimeRef.current;
              if (elapsedSilence > 500) { // 500ms (0.5s) ultra-fast pause detection
                autoCommitTriggeredRef.current = true;
                isSpeakingAudioRef.current = false;
                console.log('%c⚡ [INSTANT VAD 0.5s] Nutq to\'xtadi (0.5s). AI ga zudlik bilan yuborilmoqda...', 'color: #10b981; font-weight: bold;');
                if (recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch (_) {}
                }
                sendMessage();
              }
            }
          }
        } else {
          setVolumeLevel(0);
        }
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      return stream;
    } catch (e) {
      console.warn('Audio Visualizer setup skipped or permission denied:', e);
      return null;
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

  // Natural English Voice Selection
  const getBestNaturalVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    let v = voices.find(v => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online')) && v.lang.startsWith('en'));
    if (!v) v = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
    if (!v) v = voices.find(v => (v.name.includes('David') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Zira')) && v.lang.startsWith('en'));
    if (!v) v = voices.find(v => v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'));
    if (!v) v = voices.find(v => v.lang.startsWith('en'));
    return v || voices[0];
  }, []);

  // Text-To-Speech (TTS) Engine
  const playTTS = useCallback((text, audioBase64 = null) => {
    return new Promise((resolve) => {
      stopListening();
      isSpeakingRef.current = true;
      setMicState('speaking');

      if (audioBase64) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
          audio.playbackRate = speechRate;
          audio.onended = () => {
            isSpeakingRef.current = false;
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
  }, [speechRate, getBestNaturalVoice]);

  const fallbackBrowserTTS = (text) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        isSpeakingRef.current = false;
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch (_) {}

      const cleanText = text.replace(/[*_~`#[\]]/g, '').trim();
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.lang = 'en-US';
      utt.rate = speechRate;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const voice = getBestNaturalVoice();
      if (voice) utt.voice = voice;

      // Chrome garbage collection protection
      window.__activePatientUtterance = utt;

      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAliveIntervalRef.current);
        }
      }, 5000);

      const cleanup = () => {
        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
        window.__activePatientUtterance = null;
        isSpeakingRef.current = false;
      };

      utt.onend = () => {
        cleanup();
        resolve();
      };

      utt.onerror = () => {
        cleanup();
        resolve();
      };

      try {
        window.speechSynthesis.speak(utt);
      } catch (err) {
        cleanup();
        resolve();
      }
    });
  };

  // Start MediaRecorder (Ultra-compressed 24kbps Opus audio for fast upload)
  const startMediaRecorder = async () => {
    try {
      const stream = micStreamRef.current || await initAudioAnalyser();
      if (!stream) return;
      audioChunksRef.current = [];
      const options = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 24000 }
        : { audioBitsPerSecond: 24000 };
      const mr = new MediaRecorder(stream, options);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start(100);
    } catch (e) {
      console.warn('MediaRecorder setup error:', e);
    }
  };

  const stopMediaRecorderAndGetBase64 = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          resolve(base64);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      };
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {
        resolve(null);
      }
    });
  };

  // Speech-To-Text (STT) Recognition with Fast Turn-Taking
  const startListening = useCallback(() => {
    if (chatModeRef.current !== 'audio') return;
    if (callStateRef.current !== 'active') return;
    if (isSpeakingRef.current || isProcessingRef.current) return;

    speechDetectedRef.current = false;
    isSpeakingAudioRef.current = false;
    autoCommitTriggeredRef.current = false;
    lastSoundTimeRef.current = Date.now();

    // Start background MediaRecorder
    startMediaRecorder();

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      isListeningRef.current = true;
      setMicState('listening');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      console.log('%c🎤 [STT STARTED] Mikrofon eshitishni boshladi (en-US)', 'color: #10b981; font-weight: bold;');
      isListeningRef.current = true;
      setMicState('listening');
    };

    rec.onaudiostart = () => {
      console.log('%c🔊 [AUDIO INPUT] Ovoz signali qabul qilinmoqda...', 'color: #06b6d4;');
    };

    rec.onsoundstart = () => {
      console.log('%c🎵 [SOUND DETECTED] Tovush aniqlandi...', 'color: #3b82f6;');
    };

    rec.onspeechstart = () => {
      console.log('%c🗣️ [SPEECH DETECTED] Nutq gapirilmoqda...', 'color: #8b5cf6; font-weight: bold;');
      speechDetectedRef.current = true;
    };

    rec.onspeechend = () => {
      console.log('%c🤐 [SPEECH PAUSE] Nutq to\'xtadi (0.5s)...', 'color: #ec4899;');
      
      // Fast 500ms pause
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (!transcriptRef.current && isListeningRef.current && !isProcessingRef.current && speechDetectedRef.current) {
          console.log('%c⚡ [AUDIO SEND] 0.5s pauza. Audio Gemini ga yuborilmoqda...', 'color: #06b6d4; font-weight: bold;');
          try { rec.stop(); } catch (_) {}
          sendMessage();
        }
      }, 500);
    };

    rec.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.results.length - 1; i >= 0; i--) {
        const item = event.results[i];
        if (item.isFinal) {
          final = item[0].transcript + ' ' + final;
        } else {
          interim += item[0].transcript;
        }
      }

      const liveText = (final + interim).trim();
      if (liveText) {
        console.log('%c📝 [STT LIVE TRANSCRIPT]:', 'color: #f59e0b; font-weight: bold; font-size: 13px;', liveText);
        setTranscript(liveText);
        transcriptRef.current = liveText;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Fast 500ms pause -> User finished -> Trigger AI
        silenceTimerRef.current = setTimeout(() => {
          if (transcriptRef.current && transcriptRef.current.trim().length > 1 && isListeningRef.current && !isProcessingRef.current) {
            const captured = transcriptRef.current.trim();
            console.log('%c🚀 [AUTO COMMIT 0.5s] Matn AI ga yuborilmoqda:', 'color: #10b981; font-weight: bold;', captured);
            try { rec.stop(); } catch (_) {}
            sendMessage(captured);
          }
        }, 500);
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') {
        // Normal intentional events, do not log or warn
        return;
      }
      console.warn('%c⚠️ [STT ERROR/NOTICE]:', 'color: #ef4444;', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast.error("Mikrofonga ruxsat berilmagan!");
        stopAllAudioAndRecognition();
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      
      // If there's an uncommitted transcript in the buffer, send it
      if (transcriptRef.current && transcriptRef.current.trim().length > 1 && !isProcessingRef.current) {
        const textToSend = transcriptRef.current.trim();
        console.log('%c🚀 [FLUSH BUFFER] Qolgan matn AI ga yuborilmoqda:', 'color: #10b981; font-weight: bold;', textToSend);
        sendMessage(textToSend);
        return;
      }

      // If speech was heard but no text was ever returned, send audio fallback
      if (speechDetectedRef.current && !transcriptRef.current && !isProcessingRef.current && callStateRef.current === 'active' && !isSpeakingRef.current) {
        console.log('%c🎙️ [AUDIO FALLBACK ON END] Audio Gemini ga yuborilmoqda...', 'color: #06b6d4; font-weight: bold;');
        sendMessage();
        return;
      }

      // Restart listening cleanly if call is active and not speaking/processing
      if (callStateRef.current === 'active' && chatModeRef.current === 'audio' && !isSpeakingRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (callStateRef.current === 'active' && chatModeRef.current === 'audio' && !isSpeakingRef.current && !isProcessingRef.current) {
            startListening();
          }
        }, 500);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error('STT start exception:', err);
    }
  }, []);

  const stopListening = () => {
    isListeningRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
  };

  // Send User Message to AI (Either text or recorded audio)
  const sendMessage = async (userText = null) => {
    if (isProcessingRef.current) return;

    stopListening();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const finalUserText = userText || transcriptRef.current || '';
    
    // Stop media recorder and get audio
    const audioBase64 = await stopMediaRecorderAndGetBase64();

    // If both text and audio are completely empty, restart listening
    if (!finalUserText.trim() && !audioBase64) {
      if (callStateRef.current === 'active') {
        startListening();
      }
      return;
    }

    isProcessingRef.current = true;
    setMicState('processing');
    setTranscript('');
    transcriptRef.current = '';

    const convEndpointId = activeConvIdRef.current || 'undefined';

    // 1. If we have text from STT, use text endpoint
    if (finalUserText.trim()) {
      console.log('%c📤 [SENDING TO GEMINI VIA TEXT]:', 'color: #2563eb; font-weight: bold;', finalUserText.trim());
      const newHistory = [...chatHistory, { role: 'user', content: finalUserText.trim(), timestamp: new Date() }];
      setChatHistory(newHistory);

      try {
        const res = await api.post(`/student/conversations/${convEndpointId}/messages`, {
          content: finalUserText.trim(),
          message: finalUserText.trim(),
          text: finalUserText.trim(),
          module_id: parsedModuleId
        });

        if (res.data.conversation_id && res.data.conversation_id !== activeConvIdRef.current) {
          setActiveConvId(res.data.conversation_id);
          activeConvIdRef.current = res.data.conversation_id;
        }

        const patientReply = res.data.message || res.data.reply || "I understand, Doctor. What should we do next?";
        const replyAudio = res.data.audio || null;
        console.log('%c📥 [GEMINI PATIENT REPLY]:', 'color: #10b981; font-weight: bold;', patientReply);

        setChatHistory(prev => [
          ...prev,
          { role: 'patient', content: patientReply, timestamp: new Date(), audio: replyAudio }
        ]);

        isProcessingRef.current = false;

        // Speak patient response
        if (callStateRef.current === 'active') {
          console.log('%c🗣️ [TTS SPEAKING START]:', 'color: #8b5cf6; font-weight: bold;', patientReply);
          await playTTS(patientReply, replyAudio);
          console.log('%c✅ [TTS SPEAKING DONE]: Listening again...', 'color: #10b981;');

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
        const errorMsg = "I understand, Doctor. What do you advise?";
        setChatHistory(prev => [
          ...prev,
          { role: 'patient', content: errorMsg, timestamp: new Date() }
        ]);
        if (callStateRef.current === 'active') {
          await playTTS(errorMsg);
          if (callStateRef.current === 'active') {
            setMicState('listening');
            if (chatModeRef.current === 'audio') startListening();
          }
        }
      }
    } else if (audioBase64) {
      // 2. Direct Multimodal Audio fallback -> Gemini listens to your voice recording directly
      console.log('%c📤 [SENDING AUDIO DIRECTLY TO GEMINI]:', 'color: #06b6d4; font-weight: bold;', 'Base64 audio payload size:', audioBase64.length);
      try {
        const res = await api.post(`/student/conversations/${convEndpointId}/audio-stream`, {
          audioBase64,
          module_id: parsedModuleId
        });

        if (res.data.conversation_id && res.data.conversation_id !== activeConvIdRef.current) {
          setActiveConvId(res.data.conversation_id);
          activeConvIdRef.current = res.data.conversation_id;
        }

        const transcribed = res.data.transcript || "Doctor's clinical inquiry";
        const patientReply = res.data.reply || res.data.message || "I understand, Doctor.";
        console.log('%c📝 [GEMINI TRANSCRIBED DOCTOR]:', 'color: #f59e0b; font-weight: bold;', transcribed);
        console.log('%c📥 [GEMINI PATIENT REPLY]:', 'color: #10b981; font-weight: bold;', patientReply);

        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: transcribed, timestamp: new Date() },
          { role: 'patient', content: patientReply, timestamp: new Date() }
        ]);

        isProcessingRef.current = false;

        if (callStateRef.current === 'active') {
          console.log('%c🗣️ [TTS SPEAKING START]:', 'color: #8b5cf6; font-weight: bold;', patientReply);
          await playTTS(patientReply);
          console.log('%c✅ [TTS SPEAKING DONE]: Listening again...', 'color: #10b981;');

          if (callStateRef.current === 'active') {
            setMicState('listening');
            if (chatModeRef.current === 'audio') {
              startListening();
            }
          }
        }
      } catch (err) {
        console.error('Audio stream error:', err);
        isProcessingRef.current = false;
        if (callStateRef.current === 'active') {
          setMicState('listening');
          startListening();
        }
      }
    }
  };

  const stopAllAudioAndRecognition = () => {
    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    stopAudioAnalyser();
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    isListeningRef.current = false;
    setMicState('idle');
  };

  // Start Consultation Call
  const startCall = async (mode = 'audio') => {
    stopAllAudioAndRecognition();

    setChatMode(mode);
    chatModeRef.current = mode;
    setCallState('active');
    callStateRef.current = 'active';

    if (mode === 'audio') {
      await initAudioAnalyser();
    }

    // Wait for the doctor/student to speak first
    if (callStateRef.current === 'active') {
      setMicState('listening');
      if (mode === 'audio') {
        startListening();
      }
    }
  };

  // Manual Mic Toggle
  const toggleListening = () => {
    if (micState === 'listening') {
      // Manual commit
      if (transcriptRef.current && transcriptRef.current.trim()) {
        sendMessage(transcriptRef.current.trim());
      } else {
        sendMessage();
      }
    } else if (micState === 'idle' || micState === 'speaking') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
      isSpeakingRef.current = false;
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
    transcriptRef.current = '';
  };

  const handleFinish = async () => {
    const userMsgCount = chatHistory.filter(m => m.role === 'user').length;
    if (userMsgCount === 0) {
      toast.error("Baholash olish uchun kamida 1 marta bemor bilan muloqot qiling.");
      return;
    }
    stopAllAudioAndRecognition();
    setIsSubmitting(true);
    try {
      const convId = activeConvIdRef.current || conversationId;
      if (convId) {
        const res = await api.post(`/student/conversations/${convId}/complete`);
        const evalData = res.data?.evaluation || res.data;
        if (onFinish) {
          await onFinish(evalData);
        }
      } else {
        if (onFinish) await onFinish();
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      toast.error("Baholash hisoboti yaratilmoqda...");
      if (onFinish) await onFinish();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isIdle       = callState === 'idle';
  const isActive     = callState === 'active';
  const isEnded      = callState === 'ended';

  const isListening  = isActive && micState === 'listening';
  const isProcessing = isActive && micState === 'processing';
  const isSpeaking   = isActive && micState === 'speaking';

  const userMessagesCount = chatHistory.filter(m => m.role === 'user').length;
  const lastPatientMsg = [...chatHistory].reverse().find(m => m.role === 'patient');

  const statusInfo = isIdle ? {
    title: 'Simulyatsiya Kutilmoqda',
    badge: 'Offline',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400'
  } : isListening ? {
    title: transcript ? "Gapirib bo'lingach avtomatik yuboriladi..." : 'Sizni tinglamoqda... (Gapiring)',
    badge: 'Microphone Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm animate-pulse',
    dotClass: 'bg-emerald-500'
  } : isProcessing ? {
    title: 'AI bemor javob bermoqda...',
    badge: 'AI Processing',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
    dotClass: 'bg-amber-500'
  } : isSpeaking ? {
    title: 'Bemor gapirmoqda (TTS)...',
    badge: 'Patient Speaking',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm',
    dotClass: 'bg-indigo-500'
  } : {
    title: 'Muloqot Yakunlandi',
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
                {t('chat_header_title') || "Virtual Bemor bilan Jonli Muloqot"}
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

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0 justify-start sm:justify-end">
          {/* Status badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass} ${isListening ? 'animate-ping' : ''}`} />
            <span>{statusInfo.badge}</span>
          </div>

          {/* View toggle (Visual / Transcript) */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setVisualView('case')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                visualView === 'case'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RiEyeLine size={13} />
              <span>{t('chat_visual_mode') || "Vizual"}</span>
            </button>
            <button
              onClick={() => setVisualView('transcript')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                visualView === 'transcript'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RiChatQuoteLine size={13} />
              <span>{t('chat_transcript_mode') || "Matn Tarixi"}</span>
              {chatHistory.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                  {chatHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Evaluate Button in Header */}
          {userMessagesCount >= 1 && (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="animate-spin text-xs" />
                  <span>Baholanmoqda...</span>
                </>
              ) : (
                <>
                  <RiAwardLine className="text-xs" />
                  <span>Baholash (7-bosqich)</span>
                </>
              )}
            </button>
          )}

          {/* Voice Speed Control */}
          <div className="hidden sm:flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <RiSpeedLine className="text-indigo-600" />
            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
              title="Ovoz tezligi"
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
          <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8 animate-fade-in">
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
                <span>{t('chat_start_voice') || "Ovozli Suhbatni Boshlash (STT + TTS)"}</span>
              </button>

              <button
                onClick={() => startCall('text')}
                className="py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-sm border border-slate-200 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RiKeyboardLine className="text-lg text-indigo-600" />
                <span>{t('chat_start_text') || "Yozma Muloqot"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 2. ACTIVE / ENDED STATE ── */}
        {(isActive || isEnded) && (
          <div className="flex flex-col flex-1 h-full animate-fade-in">
            
            {/* Mode A: ULTRA-CREATIVE MEDICAL AI SIMULATION SUITE */}
            {visualView === 'case' && (
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center my-auto py-3 animate-fade-in">
                
                {/* Main Holographic Simulation Stage Card */}
                <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-slate-50/80 to-indigo-50/30 border border-slate-200/90 shadow-xl p-5 sm:p-7 backdrop-blur-md">
                  
                  {/* Subtle Background Ambient Lights */}
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                  {/* ── 1. CENTER HOLOGRAPHIC AI PERSONA ORB ── */}
                  <div className="relative flex flex-col items-center justify-center mb-6">
                    
                    {/* Glowing Pulse Rings */}
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
                          isSpeaking
                            ? 'w-48 h-48 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 ring-4 ring-indigo-400/30 animate-pulse scale-110'
                            : isListening
                            ? 'w-48 h-48 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 ring-4 ring-emerald-400/30 animate-pulse scale-105'
                            : isProcessing
                            ? 'w-44 h-44 bg-amber-500/15 ring-4 ring-amber-400/25 animate-spin'
                            : 'w-40 h-40 bg-slate-200/40'
                        }`}
                      />
                      
                      <div
                        className={`absolute rounded-full transition-all duration-1000 pointer-events-none ${
                          isSpeaking
                            ? 'w-60 h-60 bg-indigo-400/10 ring-2 ring-indigo-300/20'
                            : isListening
                            ? 'w-60 h-60 bg-emerald-400/10 ring-2 ring-emerald-300/20'
                            : 'w-48 h-48 bg-transparent'
                        }`}
                      />

                      {/* Main Circular Hologram Portal */}
                      <div className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr shadow-2xl transition-all duration-300 flex items-center justify-center ${
                        isSpeaking
                          ? 'from-indigo-500 via-purple-500 to-pink-500 ring-4 ring-indigo-200'
                          : isListening
                          ? 'from-emerald-500 via-teal-400 to-cyan-500 ring-4 ring-emerald-200 shadow-emerald-200/50'
                          : isProcessing
                          ? 'from-amber-400 via-orange-400 to-amber-500 ring-4 ring-amber-200'
                          : 'from-slate-200 via-slate-300 to-slate-200'
                      }`}>
                        <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center p-2 text-center shadow-inner relative overflow-hidden">
                          {/* Shimmer sweep effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-60 pointer-events-none" />
                          <span className="text-4xl sm:text-5xl filter drop-shadow-md select-none transform transition-transform duration-300 hover:scale-115">
                            {currentTheme.emoji}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-black text-slate-700 tracking-tight mt-1 uppercase max-w-full px-2 truncate">
                            {currentTheme.iconTag}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Positioned Neatly Below Avatar (No Overlap) */}
                    <div className="mt-3.5 z-20">
                      <span className={`text-xs font-black px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-2 transition-all ${
                        isSpeaking
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-indigo-200'
                          : isListening
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-200 animate-pulse'
                          : isProcessing
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-amber-200'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}>
                        {isSpeaking && <RiVolumeUpLine className="animate-bounce text-sm" />}
                        {isListening && <RiMicLine className="animate-pulse text-sm" />}
                        {isProcessing && <RiLoader4Line className="animate-spin text-sm" />}
                        <span>{statusInfo.title}</span>
                      </span>
                    </div>

                    {/* 24-Bar Responsive Equalizer Wave */}
                    <div className="h-9 flex items-center justify-center gap-1 my-3">
                      {[...Array(24)].map((_, i) => {
                        const dynamicHeight = isSpeaking
                          ? Math.max(6, Math.sin(i * 0.5 + Date.now() * 0.008) * 26 + 10)
                          : isListening
                          ? Math.max(4, (volumeLevel / 100) * 30 * Math.abs(Math.sin((i + 1) * 0.6)) + 6)
                          : 4;
                        return (
                          <span
                            key={i}
                            style={{ height: `${dynamicHeight}px` }}
                            className={`w-1 sm:w-1.5 rounded-full transition-all duration-100 ${
                              isSpeaking
                                ? 'bg-gradient-to-t from-indigo-600 via-purple-500 to-pink-400'
                                : isListening
                                ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400'
                                : 'bg-slate-300/70'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Primary Voice Action Button */}
                    {isActive && (
                      <div className="mt-1 flex items-center justify-center gap-3">
                        <button
                          onClick={toggleListening}
                          disabled={isProcessing}
                          className={`px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer transform hover:scale-[1.03] active:scale-[0.97] ${
                            isListening
                              ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-200 ring-4 ring-rose-100 animate-pulse'
                              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-200 ring-4 ring-emerald-100'
                          }`}
                        >
                          {isListening ? (
                            <>
                              <RiStopCircleLine className="text-xl" />
                              <span>To'xtatish va Yuborish</span>
                            </>
                          ) : (
                            <>
                              <RiMicLine className="text-xl animate-pulse" />
                              <span>Gapirishni Boshlash (Mikrofon)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── 2. DUAL CYBER-CLINICAL COMMUNICATION CHANNELS ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Doctor Channel Card */}
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                      isListening && transcript
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-md ring-2 ring-emerald-200/60'
                        : isListening
                        ? 'bg-white border-emerald-200 shadow-xs'
                        : 'bg-white/90 border-slate-200 shadow-xs'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 text-[11px] font-black tracking-wider uppercase">
                          <span className="flex items-center gap-2 text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <RiMicLine size={15} />
                            {transcript ? "Shifokor Nutqi (STT Jonli):" : "Shifokor Kanali (Siz):"}
                          </span>
                          {transcript && isListening && (
                            <button
                              onClick={() => sendMessage(transcript)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <RiSendPlane2Line size={11} /> Hozir yuborish
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed min-h-[50px]">
                          {transcript ? (
                            <span className="text-emerald-950 font-bold">"{transcript}"</span>
                          ) : isListening ? (
                            <span className="text-slate-400 font-normal italic">
                              Doktor, bemorga ingliz tilida savol bering yoki ko'rik o'tkazing...
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">
                              Muloqot qilish uchun yuqoridagi mikrofon tugmasini bosing.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Patient Response Channel Card */}
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                      isSpeaking
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-200/60'
                        : 'bg-white/90 border-slate-200 shadow-xs'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 text-[11px] font-black tracking-wider uppercase">
                          <span className="flex items-center gap-2 text-indigo-700">
                            <RiHeartPulseLine size={15} className={isSpeaking ? "animate-pulse" : ""} />
                            Bemor Javobi (AI Patient):
                          </span>
                          {lastPatientMsg && !isSpeaking && (
                            <button
                              onClick={() => playTTS(lastPatientMsg.content, lastPatientMsg.audio)}
                              className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                            >
                              <RiVolumeUpLine size={13} /> {t('chat_replay_audio') || "Qayta tinglash"}
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-relaxed min-h-[50px]">
                          {isProcessing ? (
                            <span className="text-amber-600 font-bold flex items-center gap-2">
                              <RiLoader4Line className="animate-spin text-base" /> Bemor javob tayyorlamoqda...
                            </span>
                          ) : lastPatientMsg ? (
                            <span className="text-slate-900 font-semibold">{lastPatientMsg.content}</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">
                              Bemor bilan muloqotni boshlang.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── 3. CATEGORIZED CLINICAL INSPIRATION PROMPT CARDS ── */}
                  <div className="mt-5 pt-4 border-t border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <RiLightbulbLine className="text-amber-500 text-sm" />
                        Tavsiya etilgan klinik savollar (Bosish orqali yuborish):
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                        Modul #{parsedModuleId} bo'yicha
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(MODULE_SUGGESTED_QUESTIONS[parsedModuleId] || MODULE_SUGGESTED_QUESTIONS[1]).map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(q)}
                          disabled={isProcessing || !isActive}
                          className="p-2.5 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200/90 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 font-semibold text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 text-left flex items-start gap-2 group"
                        >
                          <span className="text-indigo-500 mt-0.5 text-xs group-hover:scale-125 transition-transform flex-shrink-0">💬</span>
                          <span className="leading-snug">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── 4. DIRECT EVALUATION CALLOUT BANNER ── */}
                  {userMessagesCount >= 1 && (
                    <div className="mt-5 p-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-500/10 text-white animate-fade-in">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black flex items-center gap-2">
                          <RiSparkling2Line className="text-amber-300 text-base" />
                          Muloqot yetarli ({userMessagesCount} ta savol berildi)
                        </h4>
                        <p className="text-xs text-emerald-100 font-medium">
                          Konsultatsiyani yakunlab, AI dan 7-bosqich to'liq klinik baholash hisobotini oling.
                        </p>
                      </div>
                      <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 transform hover:scale-105"
                      >
                        {isSubmitting ? (
                          <>
                            <RiLoader4Line className="animate-spin text-sm text-indigo-600" />
                            <span>Baholanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <RiAwardLine className="text-sm text-amber-500" />
                            <span>Suhbatni Yakunlash va Baholash (7-bosqich)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Mode B: FULL TRANSCRIPT CHAT VIEW */}
            {visualView === 'transcript' && (
              <div className="flex-1 overflow-y-auto max-h-[380px] p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-inner mb-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    {t('chat_simulator') || "Suhbat hali boshlanmadi."}
                  </div>
                ) : (
                  chatHistory.map((msg, index) => {
                    const isDoctor = msg.role === 'user';
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 ${isDoctor ? 'justify-end' : 'justify-start'} animate-fade-in`}
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
                                title={t('chat_replay_audio') || "Qayta eshitish"}
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
              
              {/* Text Input Row */}
              <form onSubmit={handleSendText} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t('chat_input_placeholder') || "Ingliz tilida savol yoki xabar yozing..."}
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
                  <span className="hidden sm:inline">{t('submit') || "Yuborish"}</span>
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
                  title={t('chat_phrasebook_drawer') || "Klinik Iboralar"}
                >
                  <RiLightbulbLine className="text-amber-500 text-base" />
                  <span className="hidden md:inline">{t('chat_phrasebook_drawer') || "Klinik Iboralar"}</span>
                </button>

                {/* End / Hang up call button */}
                {isActive && (
                  <button
                    type="button"
                    onClick={endCall}
                    className="px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    title={t('finish') || "Tugatish"}
                  >
                    <RiStopCircleLine className="text-base text-rose-600" />
                    <span className="hidden sm:inline">{t('finish') || "Yakunlash"}</span>
                  </button>
                )}
              </form>

              {/* Phrasebook Quick Suggestions Drawer */}
              {isDrawerOpen && phrasebook.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 max-h-48 overflow-y-auto animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <RiLightbulbLine className="text-amber-500" /> {t('chat_phrasebook_drawer') || "Klinik Iboralar"}:
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
                      {t('chat_ended') || "Muloqot yakunlandi"} — {chatHistory.length} ta xabar almashildi
                    </h4>
                    <p className="text-xs text-emerald-700">
                      {userMessagesCount >= 1
                        ? "Bemor bilan konsultatsiya yakunlandi. Endi sun'iy intellekt orqali klinik baholash oling."
                        : "Baholash olish uchun kamida 1 marta bemor bilan muloqot qiling."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startCall(chatMode)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                    >
                      {t('retry') || "Qayta boshlash"}
                    </button>

                    <button
                      onClick={handleFinish}
                      disabled={isSubmitting || userMessagesCount === 0}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RiLoader4Line className="animate-spin text-sm" />
                          <span>{t('loading') || "Baholanmoqda..."}</span>
                        </>
                      ) : (
                        <>
                          <RiSparkling2Line className="text-sm" />
                          <span>{t('chat_eval_btn') || "Klinik Baholash Olish"}</span>
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
            ⚡ {t('chat_test_100') || "100% Test topshirish (O'qituvchi/Admin)"}
          </button>
        </div>
      )}
    </div>
  );
}
