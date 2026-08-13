import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  RiSendPlaneLine, RiChatSmile2Line, RiUser3Line,
  RiUserStarLine, RiSettings3Line, RiWifiLine,
  RiHashtag, RiPushpin2Line, RiReplyLine,
  RiAttachmentLine, RiMicLine, RiStopCircleLine,
  RiImageLine, RiFileLine, RiCloseLine,
  RiPlayFill, RiPauseFill, RiVolumeUpLine,
  RiMegaphoneLine, RiStethoscopeLine, RiBookOpenLine,
} from 'react-icons/ri';

const CHANNELS = [
  { id: 'general',       name: 'general',       label: 'Umumiy Chat',        icon: RiHashtag,          desc: 'Erkin muloqot burchagi' },
  { id: 'dental_pain',   name: 'dental_pain',   label: 'Clinical & Dental',  icon: RiStethoscopeLine, desc: 'Bemorlar va klinik holatlar muhokamasi' },
  { id: 'grammar_help',  name: 'grammar_help',  label: 'Grammar & Phrases',  icon: RiBookOpenLine,     desc: 'Grammatika va iboralar bo\'yicha savollar' },
  { id: 'announcements', name: 'announcements', label: 'E\'lonlar',           icon: RiMegaphoneLine,    desc: 'O\'qituvchi va admin e\'lonlari' },
];

const ROLE_GRADIENT = {
  student: 'from-indigo-500 to-indigo-600',
  teacher: 'from-emerald-500 to-teal-500',
  admin:   'from-purple-500 to-pink-500',
};
const ROLE_LABELS = {
  student: { icon: RiUser3Line,     label: 'Student' },
  teacher: { icon: RiUserStarLine,  label: 'Teacher' },
  admin:   { icon: RiSettings3Line, label: 'Admin'   },
};

function Avatar({ name, role }) {
  const gradient = ROLE_GRADIENT[role] || 'from-slate-400 to-slate-500';
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm`}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function ForumPage() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState('');
  const [replyingTo, setReplyingTo]       = useState(null);
  const [selectedFile, setSelectedFile]   = useState(null);
  const [loading, setLoading]             = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording]     = useState(false);
  const [audioBlob, setAudioBlob]         = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef    = useRef([]);
  const timerRef          = useRef(null);

  const fileInputRef = useRef(null);
  const bottomRef    = useRef(null);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const loadMessages = (channel = activeChannel) => {
    api.get(`/teacher/forum/messages?channel=${channel}`)
      .then(r => setMessages(r.data))
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

  // Audio Recorder logic
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
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      toast.error('Mikrofon ruxsati berilmadi');
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

  const send = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !selectedFile && !audioBlob) || loading) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('channel', activeChannel);
      if (text.trim()) formData.append('message_text', text.trim());
      if (replyingTo) formData.append('reply_to_id', replyingTo.id);

      if (audioBlob) {
        formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/teacher/forum/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setText('');
      setReplyingTo(null);
      setSelectedFile(null);
      setAudioBlob(null);
      setRecordingTime(0);
      loadMessages(activeChannel);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xabar yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (msgId) => {
    try {
      await api.put(`/teacher/forum/messages/${msgId}/pin`);
      toast.success('Xabar biriktirildi/uzildi');
      loadMessages(activeChannel);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
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
      {/* ── Header ──────────────────────────────────────── */}
      <div className="animate-fade-up mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base shadow-md shadow-indigo-500/20"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <RiChatSmile2Line />
              </span>
              Klinik Muloqot Forumi
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-11">Talabalar va o'qituvchilar interaktiv muloqot xonasi</p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
            <RiWifiLine className="text-emerald-500 text-sm animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Real-Time Live</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Channels + Chat ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-up delay-100">
        
        {/* ── Channel Selector Sidebar ────────────────────── */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-col gap-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Mavzular & Kanallar</p>
          <div className="space-y-1">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              const isActive = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => { setActiveChannel(ch.id); setReplyingTo(null); }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-bold leading-none">{ch.label}</p>
                    <p className={`text-[10px] mt-1 truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{ch.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat Container ──────────────────────────────── */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ height: '70vh' }}>
          
          {/* Pinned Messages Bar */}
          {pinnedMessages.length > 0 && (
            <div className="bg-amber-50/90 border-b border-amber-200/70 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2 overflow-hidden">
                <RiPushpin2Line className="text-amber-600 text-sm flex-shrink-0" />
                <span className="font-bold">Biriktirilgan e'lon:</span>
                <span className="truncate">{pinnedMessages[pinnedMessages.length - 1].message_text}</span>
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <RiChatSmile2Line className="text-2xl text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">Hozircha xabarlar yo'q</p>
                  <p className="text-xs text-slate-400 mt-1">Birinchi bo'lib suhbatni boshlang!</p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMe = msg.sender?.id === user?.id;
              const RoleIcon = ROLE_LABELS[msg.sender?.role]?.icon || RiUser3Line;
              const roleLabel = ROLE_LABELS[msg.sender?.role]?.label || 'User';
              const gradient = ROLE_GRADIENT[msg.sender?.role] || 'from-slate-400 to-slate-500';

              const isImage = msg.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.file_url);

              return (
                <div
                  key={msg.id}
                  className={`animate-fade-up flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar name={msg.sender?.full_name} role={msg.sender?.role} />

                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* Header: Name + Role + Actions */}
                    <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-slate-800">{msg.sender?.full_name}</span>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white shadow-xs`}>
                        <RoleIcon className="text-[9px]" /> {roleLabel}
                      </span>

                      {/* Action buttons (Reply & Pin) */}
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors text-xs ml-1"
                        title="Javob berish"
                      >
                        <RiReplyLine />
                      </button>

                      {isTeacherOrAdmin && (
                        <button
                          onClick={() => togglePin(msg.id)}
                          className={`${msg.is_pinned ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'} p-0.5 transition-colors text-xs`}
                          title="Pin / Unpin"
                        >
                          <RiPushpin2Line />
                        </button>
                      )}
                    </div>

                    {/* Parent Message (Reply Preview) */}
                    {msg.parent && (
                      <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs bg-slate-200/70 border-l-3 border-indigo-500 text-slate-600 max-w-full truncate ${isMe ? 'text-right' : 'text-left'}`}>
                        <span className="font-bold text-indigo-700">@{msg.parent.sender?.full_name}:</span> {msg.parent.message_text || 'Fayl / Ovozli xabar'}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-500/15'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                    }`}>

                      {/* Text */}
                      {msg.message_text && <p className="whitespace-pre-wrap">{msg.message_text}</p>}

                      {/* Image Attachment (Dental X-ray / Image) */}
                      {isImage && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/20">
                          <img src={`http://localhost:5000${msg.file_url}`} alt="Attachment" className="max-h-60 w-auto object-cover" />
                        </div>
                      )}

                      {/* Non-Image File Attachment */}
                      {msg.file_url && !isImage && (
                        <a
                          href={`http://localhost:5000${msg.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-2 flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${
                            isMe ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-slate-100 text-indigo-600 border-slate-200 hover:bg-slate-200'
                          } transition-all`}
                        >
                          <RiFileLine className="text-base" />
                          <span>Hujjatni ko'rish / yuklab olish</span>
                        </a>
                      )}

                      {/* Audio / Voice Message */}
                      {msg.audio_url && (
                        <div className="mt-2 flex items-center gap-2">
                          <audio controls className="h-8 max-w-[220px]">
                            <source src={`http://localhost:5000${msg.audio_url}`} type="audio/webm" />
                          </audio>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* ── Reply Preview Box ──────────────────────────── */}
          {replyingTo && (
            <div className="bg-indigo-50 border-t border-indigo-100 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <RiReplyLine className="text-indigo-600 text-sm flex-shrink-0" />
                <span className="font-bold text-indigo-900">Javob berilmoqda @{replyingTo.sender?.full_name}:</span>
                <span className="text-indigo-700 truncate">{replyingTo.message_text || 'Fayl'}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-700">
                <RiCloseLine className="text-base" />
              </button>
            </div>
          )}

          {/* ── Audio Recording Preview ───────────────────── */}
          {isRecording && (
            <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center justify-between text-xs text-red-700 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="font-bold">Ovoz yozilmoqda... {recordingTime}s</span>
              </div>
              <button onClick={stopRecording} className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700">
                To'xtatish
              </button>
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <RiMicLine className="text-emerald-600 text-base" />
                <span className="font-bold">Ovozli xabar tayyor!</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={send} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                  Yuborish
                </button>
                <button onClick={cancelRecording} className="text-slate-400 hover:text-slate-700">
                  <RiCloseLine className="text-base" />
                </button>
              </div>
            </div>
          )}

          {/* ── Selected File Preview ────────────────────── */}
          {selectedFile && (
            <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <RiAttachmentLine className="text-indigo-600 text-base flex-shrink-0" />
                <span className="font-bold truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-700">
                <RiCloseLine className="text-base" />
              </button>
            </div>
          )}

          {/* ── Input Bar ────────────────────────────────── */}
          <div className="border-t border-slate-200/80 p-3 bg-white">
            <form onSubmit={send} className="flex items-center gap-2">
              
              {/* File Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                title="Fayl yoki Rentgen rasmini biriktirish"
              >
                <RiAttachmentLine className="text-lg" />
              </button>

              {/* Voice Record Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                }`}
                title="Ovozli xabar yuborish"
              >
                <RiMicLine className="text-lg" />
              </button>

              {/* Text Input Area */}
              <div className="flex-1 relative">
                <textarea
                  id="forum-message-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`#${activeChannel} ga xabar yozing... (Enter - yuborish)`}
                  rows={1}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all resize-none leading-relaxed"
                  style={{ minHeight: '42px', maxHeight: '120px' }}
                />
              </div>

              {/* Submit Button */}
              <button
                id="forum-send-btn"
                type="submit"
                disabled={loading || (!text.trim() && !selectedFile && !audioBlob)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <RiSendPlaneLine className="text-base" />
                }
              </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}
