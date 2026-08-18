import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  RiSendPlane2Fill, RiChatSmile2Line, RiUser3Line,
  RiUserStarLine, RiWifiLine,
  RiHashtag, RiPushpin2Line,
  RiMicLine, RiStopCircleLine,
  RiCloseLine, RiStethoscopeLine, RiBookOpenLine,
  RiMegaphoneLine, RiVolumeUpLine
} from 'react-icons/ri';

export default function ForumPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState('');
  const [replyingTo, setReplyingTo]       = useState(null);
  const [loading, setLoading]             = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording]     = useState(false);
  const [audioBlob, setAudioBlob]         = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef    = useRef([]);
  const timerRef          = useRef(null);

  const bottomRef = useRef(null);

  const [channels, setChannels] = useState([]);

  useEffect(() => {
    api.get('/teacher/forum/channels')
      .then(r => {
        const data = r.data || [];
        setChannels(data);
        if (data.length > 0) {
          setActiveChannel(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const ROLE_CONFIG = {
    student: { badge: 'badge-blue', label: 'Talaba' },
    teacher: { badge: 'badge-emerald', label: "O'qituvchi" },
    admin:   { badge: 'badge-purple', label: 'Admin' },
  };

  const loadMessages = (channel = activeChannel) => {
    api.get(`/teacher/forum/messages?channel=${channel}`)
      .then(r => setMessages(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadMessages(activeChannel);
    const interval = setInterval(() => loadMessages(activeChannel), 4000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      toast.error("Mikrofon ruxsati berilmadi");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const send = async () => {
    if (!text.trim() && !audioBlob) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('channel', activeChannel);
      if (text.trim()) formData.append('message_text', text.trim());
      if (replyingTo) formData.append('reply_to_id', replyingTo.id);
      if (audioBlob) formData.append('voice', audioBlob, 'voice_message.webm');

      await api.post('/teacher/forum/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setText('');
      setReplyingTo(null);
      setAudioBlob(null);
      setRecordingTime(0);
      loadMessages(activeChannel);
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);

  return (
    <Layout>
      <div className="space-y-5">
        {/* ── 1. Header ── */}
        <div className="card-standard p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-lg shrink-0">
                <RiChatSmile2Line />
              </span>
              {t('student.forum.title')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">{t('student.forum.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <RiWifiLine className="text-emerald-600 text-sm animate-pulse" />
            <span className="text-[11px] font-extrabold text-emerald-700">Faol Forum</span>
          </div>
        </div>

        {/* ── 2. Channels + Messages Workspace ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Channels Sidebar */}
          {(channels.length > 1 || channels.length === 0 || user?.role !== 'teacher') && (
            <div className="lg:col-span-4 card-standard p-4 flex flex-col gap-2">
              <div className="space-y-1">
                {channels.map(ch => {
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannel(ch.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 ${activeChannel === ch.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className={`mt-0.5 p-1.5 rounded-lg ${activeChannel === ch.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                        <RiHashtag className="text-sm" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm font-bold leading-none mb-1 ${activeChannel === ch.id ? 'text-white' : 'text-slate-900'}`}>
                          {ch.label}
                        </h3>
                        <p className={`text-[10px] font-medium line-clamp-2 ${activeChannel === ch.id ? 'text-blue-100' : 'text-slate-500'}`}>
                          {ch.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {channels.length === 0 && (
                  <p className="text-xs text-slate-500 p-2 text-center">Guruh yoki o'qituvchi biriktirilmagan.</p>
                )}
              </div>
            </div>
          )}

          {/* Chat Stream & Box */}
          {channels.length > 0 && (
            <div className={`card-standard flex flex-col overflow-hidden ${(channels.length > 1 || user?.role !== 'teacher') ? 'lg:col-span-8' : 'lg:col-span-12'}`} style={{ height: '70vh' }}>
              {/* Pinned announcement */}
            {pinnedMessages.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2 overflow-hidden">
                  <RiPushpin2Line className="text-amber-600 text-base shrink-0" />
                  <span className="font-bold">E'lon:</span>
                  <span className="truncate font-medium">{pinnedMessages[pinnedMessages.length - 1].message_text}</span>
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    <RiChatSmile2Line className="text-2xl text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Hozircha xabarlar yo'q</p>
                  <p className="text-[11px] text-slate-400">Birinchi bo'lib fikr yoki savol qoldiring!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  const role = ROLE_CONFIG[m.sender?.role] || ROLE_CONFIG.student;

                  return (
                    <div key={m.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-xl ${isMe ? 'bg-blue-600' : 'bg-slate-700'} flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs`}>
                        {m.sender?.full_name?.[0]?.toUpperCase()}
                      </div>

                      <div className={`max-w-[78%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-800">{m.sender?.full_name}</span>
                          <span className={`badge-standard ${role.badge} text-[10px] py-0 px-1.5`}>
                            {role.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        }`}>
                          {m.message_text && <p className="whitespace-pre-wrap font-medium">{m.message_text}</p>}

                          {m.voice_url && (
                            <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2">
                              <audio controls src={m.voice_url} className="h-8 max-w-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-100 bg-white space-y-2">
              {isRecording ? (
                <div className="flex items-center justify-between p-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span>Ovoz yozilmoqda: {formatSeconds(recordingTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelRecording}
                      className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-rose-700 bg-white rounded-lg border border-rose-200"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={stopRecording}
                      className="px-3 py-1 text-xs font-bold text-white bg-rose-600 rounded-lg shadow-xs"
                    >
                      To'xtatish & Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={startRecording}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                    title="Ovozli xabar yozish"
                  >
                    <RiMicLine className="text-base" />
                  </button>

                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={t('student.forum.reply_placeholder')}
                    className="flex-1 input-standard text-xs py-2.5"
                  />

                  <button
                    onClick={send}
                    disabled={loading || (!text.trim() && !audioBlob)}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    <RiSendPlane2Fill className="text-base" />
                  </button>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
