import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  RiSendPlaneLine, RiChatSmile2Line, RiUser3Line,
  RiUserStarLine, RiSettings3Line, RiEmotionLine,
  RiWifiLine,
} from 'react-icons/ri';

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
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  const load = () => {
    api.get('/teacher/forum/messages').then(r => setMessages(r.data)).catch(() => {});
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await api.post('/teacher/forum/messages', { message_text: text });
      setText('');
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); }
  };

  return (
    <Layout>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="animate-fade-up mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <RiChatSmile2Line />
              </span>
              Forum
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-11">Class discussion board</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <RiWifiLine className="text-emerald-500 text-sm" />
            <span className="text-xs font-semibold text-emerald-700">Live</span>
          </div>
        </div>
      </div>

      {/* ── Chat Container ───────────────────────────────── */}
      <div className="animate-fade-up delay-100 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ height: '66vh' }}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <RiChatSmile2Line className="text-2xl text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500">No messages yet</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">Be the first to say something! <RiEmotionLine className="text-amber-500 text-sm" /></p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender?.id === user?.id;
            const RoleIcon = ROLE_LABELS[msg.sender?.role]?.icon || RiUser3Line;
            const roleLabel = ROLE_LABELS[msg.sender?.role]?.label || 'User';
            const gradient = ROLE_GRADIENT[msg.sender?.role] || 'from-slate-400 to-slate-500';
            const prevMsg = messages[i - 1];
            const sameAuthor = prevMsg?.sender?.id === msg.sender?.id;

            return (
              <div
                key={msg.id}
                className={`animate-fade-up flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} ${sameAuthor ? 'mt-1' : 'mt-4'}`}
              >
                {/* Avatar - hide if same author in sequence */}
                <div className="flex-shrink-0 mt-auto">
                  {!sameAuthor ? (
                    <Avatar name={msg.sender?.full_name} role={msg.sender?.role} />
                  ) : (
                    <div className="w-8" />
                  )}
                </div>

                <div className={`flex flex-col max-w-[68%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!sameAuthor && (
                    <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-slate-700">{msg.sender?.full_name}</span>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
                        <RoleIcon className="text-[9px]" /> {roleLabel}
                      </span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.message_text}
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

        {/* ── Input Bar ────────────────────────────────── */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/50">
          <form onSubmit={send} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                id="forum-message-input"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all resize-none pr-10 leading-relaxed"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <RiEmotionLine className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
            </div>
            <button
              id="forum-send-btn"
              type="submit"
              disabled={loading || !text.trim()}
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
    </Layout>
  );
}


