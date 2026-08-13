import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import {
  RiMicLine, RiStopCircleLine, RiVolumeUpLine,
  RiLoader4Line, RiHeartPulseLine, RiPhoneLine,
  RiCheckDoubleLine, RiUser3Line, RiRobot2Line,
  RiArrowRightSLine, RiStethoscopeLine,
  RiKeyboardLine, RiSendPlane2Line
} from 'react-icons/ri';

// callState:
//   'idle'   — suhbat boshlanmagan
//   'active' — qo'ng'iroq davom etyapti
//   'ended'  — foydalanuvchi qo'ng'iroqni yakunladi
//
// micState (faqat 'active' paytida):
//   'listening'  — mikrofon ochiq, foydalanuvchi gapirmoqda
//   'processing' — AI javob bermoqda (API so'rovi)
//   'speaking'   — bemor ovozi yoqulmoqda (TTS)

export default function VirtualPatientChat({ conversationId, onStartConversation, onRetry, phrases, onFinish }) {
  const [callState, setCallState]   = useState('idle');
  const [micState, setMicState]     = useState('listening');
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState([]);   // { role: 'user'|'patient', text }
  const [chatMode, setChatMode]     = useState('none'); // 'audio' or 'text'
  const [textInput, setTextInput]   = useState('');
  const [voices, setVoices]   = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const historyEndRef  = useRef(null);
  const utteranceRef   = useRef(null); // Prevent garbage collection bug in Chrome
  const convIdRef      = useRef(conversationId);

  useEffect(() => {
    convIdRef.current = conversationId;
    if (conversationId && chatHistory.length === 0) {
      // Eski suhbat xabarlarini yuklash
      api.get(`/student/conversation/${conversationId}/messages`).then(res => {
        if (res.data && res.data.length > 0) {
          const history = res.data.map(m => ({
            role: m.sender === 'student' ? 'user' : 'patient',
            text: m.text_content
          }));
          setChatHistory(history);
          setCallState('ended'); // Chunki bu yakunlangan eski suhbat
        }
      }).catch(err => console.error("Xabarlarni yuklashda xatolik:", err));
    }
  }, [conversationId]);

  // Ovozlar ro'yxatini yuklash
  useEffect(() => {
    const loadVoices = () => setVoices(synthRef.current.getVoices());
    loadVoices();
    if (synthRef.current) synthRef.current.onvoiceschanged = loadVoices;
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Chat oxiriga avtomatik scroll
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, transcript]);

  const getNaturalVoice = () => {
    let v = voices.find(v => v.name.includes('Natural') && v.lang.includes('en'));
    if (!v) v = voices.find(v => v.name.includes('Google') && v.lang.includes('en'));
    if (!v) v = voices.find(v => v.lang.includes('en'));
    return v || voices[0];
  };

  // SpeechRecognition ni yaratish va event-larini ulash
  const buildRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => setMicState('listening');

    r.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        interim += event.results[i][0].transcript;
      }
      setTranscript(interim);
    };

    r.onend = () => {
      setTranscript(prev => {
        const final = prev.trim();
        if (final) {
          setMicState('processing');
          sendMessage(final, r);
        } else {
          // Hech narsa aytilmasa — qayta eshitadi
          setMicState('listening');
          setTimeout(() => { try { r.start(); } catch(e){} }, 300);
        }
        return '';
      });
    };

    r.onerror = (e) => {
      if (e.error === 'aborted') return;
      setTimeout(() => { try { r.start(); } catch(e2){} }, 1000);
    };

    return r;
  };

  const sendMessage = async (text, rec) => {
    setChatHistory(prev => [...prev, { role: 'user', text }]);
    try {
      const res = await api.post(`/student/conversation/${convIdRef.current}/message`, { text });
      const reply = res.data.reply;
      setChatHistory(prev => [...prev, { role: 'patient', text: reply }]);
      if (rec) speakText(reply, rec);
      else setMicState('listening'); // Reset processing state for text mode
    } catch (err) {
      console.error(err);
      const errMsg = "Sorry, I didn't catch that. Could you repeat?";
      setChatHistory(prev => [...prev, { role: 'patient', text: errMsg }]);
      if (rec) speakText(errMsg, rec);
      else setMicState('listening');
    }
  };

  const speakText = (text, rec) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setMicState('speaking');

    const utt = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utt; // Prevents the utterance from being garbage collected in Chrome before it finishes
    utt.lang = 'en-US';
    utt.rate = 0.95;
    utt.pitch = 1.0;
    const voice = getNaturalVoice();
    if (voice) utt.voice = voice;

    const resumeListen = () => {
      // Qo'ng'iroq hali aktiv bo'lsa — yana eshita boshla
      setCallState(cs => {
        if (cs === 'active') {
          setMicState('listening');
          setTimeout(() => { try { rec?.start(); } catch(e){} }, 500);
        }
        return cs;
      });
    };

    utt.onend   = resumeListen;
    utt.onerror = resumeListen;
    synthRef.current.speak(utt);
  };

  // ── Qo'ng'iroqni boshlash ─────────────────────────────────
  const startCall = async (mode) => {
    setChatMode(mode);
    setCallState('active');
    setMicState('processing'); // "Thinking..." holati suhbat generatsiya bo'lguncha
    
    if (onStartConversation && !convIdRef.current) {
      try {
        await onStartConversation();
      } catch (err) {
        alert("Xatolik: Suhbatni boshlab bo'lmadi.");
        setCallState('idle');
        return;
      }
    }

    setMicState('listening');
    
    if (mode === 'audio') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert("Your browser does not support voice input. Try using Chrome or Edge.");
        setCallState('idle');
        return;
      }
      const rec = buildRecognition();
      recognitionRef.current = rec;
      try { rec.start(); } catch(e){}
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!textInput.trim() || micState === 'processing') return;
    const text = textInput.trim();
    setTextInput('');
    setMicState('processing');
    sendMessage(text, null);
  };

  // ── Qo'ng'iroqni yakunlash (faqat to'xtatish, baholamasdan) ─
  const endCall = () => {
    if (recognitionRef.current) recognitionRef.current.abort();
    if (synthRef.current) synthRef.current.cancel();
    setCallState('ended');
    setTranscript('');
  };

  // ── Baholash — API ga yuborish ────────────────────────────
  const handleFinish = async () => {
    if (chatHistory.filter(m => m.role === 'user').length === 0) {
      alert("Conversation hasn't started yet. Please talk to the virtual patient first.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onFinish();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── UI state derivations ─────────────────────────────────
  const isIdle    = callState === 'idle';
  const isActive  = callState === 'active';
  const isEnded   = callState === 'ended';

  const isListening  = isActive && micState === 'listening';
  const isProcessing = isActive && micState === 'processing';
  const isSpeaking   = isActive && micState === 'speaking';

  // Baholash tugmasi faqat kamida bitta almashinuv bo'lganda aktiv
  const canEvaluate = isEnded && chatHistory.filter(m => m.role === 'user').length >= 1;

  const statusLabel = isIdle      ? 'Conversation Ended'
    : isListening  ? (chatMode === 'text' ? 'Type message...' : 'Listening...')
    : isProcessing ? 'Thinking...'
    : isSpeaking   ? 'Patient Speaking...'
    : 'Conversation Ended';

  return (
    <div className="flex flex-col bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">

      {/* ── TOP STATUS BAR ───────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <RiHeartPulseLine className={`text-lg ${isActive ? 'text-rose-500 animate-pulse' : 'text-gray-600'}`} />
          <span className="text-gray-300 font-medium text-xs tracking-widest uppercase">
            {statusLabel}
          </span>
        </div>
        <span className="text-xs text-gray-600">
          {chatHistory.length > 0 ? `${chatHistory.length} messages` : '—'}
        </span>
      </div>

      {/* ── CHAT HISTORY ────────────────────────────────── */}
      <div className="overflow-y-auto px-4 py-4 space-y-3 min-h-[280px] max-h-[360px]">

        {/* Bo'sh holat */}
        {chatHistory.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-14">
            <div className="w-20 h-20 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center mb-2">
              <RiRobot2Line className="text-4xl text-cyan-400" />
            </div>
            <p className="text-gray-400 text-sm text-center leading-relaxed">
              Click <span className="text-indigo-400 font-medium">Start Conversation</span> to talk with your virtual patient.<br />
              <span className="text-xs text-gray-500 mt-2 block">The AI will act as a patient, and you are the doctor.</span>
            </p>
          </div>
        )}

        {/* Suhbat tarixini ko'rsatish */}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs
              ${msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-cyan-900/50 border border-cyan-500/30 text-cyan-400'}`}>
              {msg.role === 'user' ? <RiUser3Line /> : <RiRobot2Line />}
            </div>
            {/* Bubble */}
            <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Real-time mikrofon transkripsiyasi */}
        {isListening && transcript && (
          <div className="flex gap-2 flex-row-reverse">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-600 text-white text-xs">
              <RiUser3Line />
            </div>
            <div className="max-w-[78%] px-3.5 py-2 rounded-2xl rounded-tr-sm text-sm text-indigo-200 bg-indigo-600/25 border border-indigo-500/30 italic">
              {transcript}
            </div>
          </div>
        )}

        {/* AI javob kutilyapti — uch nuqta animatsiyasi */}
        {isProcessing && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs flex-shrink-0">
              <RiRobot2Line />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-800 border border-gray-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Bemor gapiryapti indikatori */}
        {isSpeaking && chatHistory.length > 0 && (
          <div className="flex items-center gap-1.5 pl-9">
            <span className="text-xs text-cyan-400 animate-pulse">Patient Speaking</span>
            <RiVolumeUpLine className="text-cyan-400 text-xs animate-pulse" />
          </div>
        )}

        <div ref={historyEndRef} />
      </div>

      {/* ── BOTTOM CONTROLS ─────────────────────────────── */}
      <div className="px-4 py-4 border-t border-gray-800 bg-gray-900/90">

        {/* IDLE: Suhbat boshlanmagan */}
        {isIdle && (
          <div className="flex gap-3">
            <button
              onClick={() => startCall('audio')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
            >
              <RiMicLine className="text-lg" />
              Voice Chat
            </button>
            <button
              onClick={() => startCall('text')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-800 text-white font-semibold text-sm border border-gray-700 hover:bg-gray-700 transition-all active:scale-95"
            >
              <RiKeyboardLine className="text-lg" />
              Text Chat
            </button>
          </div>
        )}

        {/* ACTIVE: Qo'ng'iroq davom etyapti */}
        {isActive && chatMode === 'audio' && (
          <div className="flex items-center gap-3">
            {/* Holat indikatori */}
            <div className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
              ${isListening  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : isSpeaking   ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              {isListening  && <RiMicLine className="animate-pulse flex-shrink-0" />}
              {isProcessing && <RiLoader4Line className="animate-spin flex-shrink-0" />}
              {isSpeaking   && <RiVolumeUpLine className="animate-pulse flex-shrink-0" />}
              <span className="truncate text-xs">
                {isListening  && (transcript || 'Speak to the patient...')}
                {isProcessing && 'Thinking...'}
                {isSpeaking   && 'Patient is speaking...'}
              </span>
            </div>

            {/* Qo'ng'iroqni tugatish tugmasi */}
            <button
              onClick={endCall}
              className="w-11 h-11 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
              title="End Conversation"
            >
              <RiStopCircleLine className="text-lg" />
            </button>
          </div>
        )}

        {isActive && chatMode === 'text' && (
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isProcessing}
              placeholder={isProcessing ? "Thinking..." : "Type your message..."}
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <RiSendPlane2Line className="text-lg" />
            </button>
            <button
              type="button"
              onClick={endCall}
              className="w-11 h-11 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all flex-shrink-0 ml-1"
              title="End Conversation"
            >
              <RiStopCircleLine className="text-lg" />
            </button>
          </form>
        )}

        {/* ENDED: Qo'ng'iroq tugadi */}
        {isEnded && (
          <div className="space-y-2">
            {!canEvaluate && (
              <p className="text-xs text-amber-400 text-center">
                ⚠️ You must speak to the patient at least once to evaluate the conversation
              </p>
            )}
            <div className="flex gap-2">
              {/* Qayta boshlash */}
              <button
                onClick={() => { 
                  setChatHistory([]); 
                  setTranscript(''); 
                  setCallState('idle'); 
                  if (onRetry) onRetry();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 hover:text-white transition-all"
              >
                <RiPhoneLine className="text-sm" />
                Retry
              </button>

              {/* Suhbatni Baholash — faqat chat bo'lsa aktiv */}
              <button
                onClick={handleFinish}
                disabled={!canEvaluate || isSubmitting}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-semibold text-sm transition-all
                  ${canEvaluate && !isSubmitting
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'}`}
              >
                {isSubmitting
                  ? <><RiLoader4Line className="animate-spin" /> Evaluating...</>
                  : <><RiCheckDoubleLine /> Evaluate Conversation <RiArrowRightSLine /></>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
