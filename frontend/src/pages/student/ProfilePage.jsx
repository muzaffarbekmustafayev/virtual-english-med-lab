import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import {
  RiUser3Line, RiBookOpenLine, RiBarChartLine,
  RiGroupLine, RiMailLine, RiCheckLine,
  RiEditBoxLine, RiKey2Line, RiStethoscopeLine,
  RiLockLine, RiTrophyLine, RiCheckboxCircleLine,
  RiShieldCheckLine, RiAwardLine, RiRobot2Line,
  RiArrowRightLine, RiTimeLine, RiSpeedLine,
  RiBrainLine, RiSpeakLine, RiVolumeUpLine,
  RiSparkling2Line, RiSave3Line, RiRefreshLine
} from 'react-icons/ri';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t, getLocalized } = useLanguage();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [modules, setModules]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit profile states
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    specialty_id: user?.specialty?.id || '',
    group_id: user?.group?.id || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Security states
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [dashRes, modRes] = await Promise.all([
        api.get('/student/dashboard').catch(() => ({ data: null })),
        api.get('/student/modules').catch(() => ({ data: [] })),
      ]);
      setDashboard(dashRes.data);
      setModules(modRes.data || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const avg = dashboard?.average_score || 0;
  const completedCount = dashboard?.completed_modules || 0;
  const totalModules = dashboard?.total_modules || 10;
  const progressPct = totalModules ? Math.min(100, Math.round((completedCount / totalModules) * 100)) : 0;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success(t('common.success') || "Profil ma'lumotlari saqlandi!");
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error') || "Xatolik yuz berdi");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Parollar mos kelmadi");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.put('/auth/password', passwordForm);
      toast.success(t('common.success') || "Parol muvaffaqiyatli yangilandi!");
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error') || "Xatolik yuz berdi");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── 1. Hero Profile Header Banner (Fully Responsive) ─────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
          {/* Subtle top decoration background */}
          <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
            
            {/* Left: User Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/20 shrink-0">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {user?.full_name || 'Jasur Toshmatov'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold">
                    <RiShieldCheckLine className="text-blue-600" />
                    <span>{t('nav.roles.student') || 'Talaba'}</span>
                  </span>
                </div>

                <p className="text-slate-500 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                  <RiMailLine className="text-slate-400 text-sm" />
                  <span>{user?.email || 'student@vpe.uz'}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-slate-700 text-xs font-bold">
                    <RiStethoscopeLine className="text-blue-600" />
                    <span>{user?.specialty?.name || 'Stomatologiya'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-slate-700 text-xs font-bold">
                    <RiGroupLine className="text-indigo-600" />
                    <span>{user?.group?.name || '401-Stomatologiya'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Performance Stat Badges */}
            <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shrink-0 w-full sm:w-auto justify-around sm:justify-start">
              <div className="text-center px-2 sm:px-3 border-r border-slate-200/80">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                  <RiCheckboxCircleLine className="text-slate-500 text-xs" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    {t('student.dashboard.completed_modules') || 'Yakunlangan'}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {completedCount} <span className="text-xs font-medium text-slate-400">/ {totalModules}</span>
                </p>
              </div>

              <div className="text-center px-2 sm:px-3">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                  <RiTrophyLine className="text-emerald-500 text-xs" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    {t('student.dashboard.average_score') || "O'rtacha Ball"}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-600">
                  {avg}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── 2. Tab Navigation ────────────────────────────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RiBarChartLine className="text-base" />
            <span>{t('student.profile.overall_stats') || "Umumiy ko'rsatkichlar"}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RiEditBoxLine className="text-base" />
            <span>{t('student.profile.personal_info') || "Shaxsiy ma'lumotlar va xavfsizlik"}</span>
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: OVERVIEW & ACADEMIC PROGRESS ─────────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 4 Key KPI Metrics Cards (Fully Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Course Progress */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {t('student.dashboard.course_progress') || "O'quv kursi jarayoni"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <RiSpeedLine size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{progressPct}%</p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5">{completedCount} / {totalModules} modul yakunlangan</p>
                </div>
              </div>

              {/* Card 2: Average Score */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {t('student.dashboard.average_score') || "O'rtacha Ball"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <RiTrophyLine size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600">{avg}%</p>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-3">Eng yaxshi klinik natijalar</p>
              </div>

              {/* Card 3: Virtual Patient Chat Count */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Virtual Bemor
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <RiRobot2Line size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">
                    {completedCount} ta
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-3">Simulyatsiya muloqotlari</p>
              </div>

              {/* Card 4: CEFR Level */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      CEFR Daraja
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <RiAwardLine size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-purple-700">
                    {avg >= 85 ? 'B2 Clinical' : avg >= 60 ? 'B1 Medical' : 'A2 Foundation'}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-3">Medical English Lab</p>
              </div>
            </div>

            {/* 5-Competency Matrix Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RiBarChartLine className="text-indigo-600" />
                  <span>Klinik Kompetensiya Matritsasi</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">Barcha modullar bo'yicha</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {[
                  { name: 'Grammatika',       icon: RiBrainLine,       score: Math.min(100, Math.round(avg * 0.96)), color: 'bg-indigo-600' },
                  { name: 'Tibbiy Terminlar', icon: RiBookOpenLine,    score: Math.min(100, Math.round(avg * 1.02)), color: 'bg-blue-600' },
                  { name: 'Nutq Ravonligi',   icon: RiSpeakLine,       score: Math.min(100, Math.round(avg * 0.98)), color: 'bg-emerald-600' },
                  { name: 'Talaffuz/Fonetika',icon: RiVolumeUpLine,    score: Math.min(100, Math.round(avg * 0.95)), color: 'bg-cyan-600' },
                  { name: 'Klinik Anamnez',   icon: RiStethoscopeLine, score: Math.min(100, Math.round(avg * 1.01)), color: 'bg-amber-500' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-black text-slate-900">{item.score}%</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                        <div className={`${item.color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Progress & History List */}
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RiBookOpenLine className="text-blue-600" />
                  <span>{t('student.profile.history_title') || "Modullarni topshirish tarixi"}</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">{modules.length} ta modul</span>
              </div>

              <div className="divide-y divide-slate-100">
                {modules.map((m) => {
                  const isCompleted = m.is_completed;
                  const isUnlocked  = m.is_unlocked;
                  const score = m.best_score;
                  const description = getLocalized(m, 'description');

                  return (
                    <div
                      key={m.id}
                      onClick={() => isUnlocked && navigate(`/student/modules/${m.id}`)}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                        isUnlocked ? 'hover:bg-slate-50/80 cursor-pointer' : 'opacity-60 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                            : isUnlocked
                            ? 'bg-blue-100 border border-blue-200 text-blue-700'
                            : 'bg-slate-100 border border-slate-200 text-slate-400'
                        }`}>
                          {isCompleted ? (
                            <RiCheckLine className="text-base" />
                          ) : isUnlocked ? (
                            m.order_index
                          ) : (
                            <RiLockLine className="text-sm" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                            {m.order_index}. {m.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 font-medium mt-0.5">
                            {description || m.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0 pt-1 sm:pt-0">
                        {score !== null ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                            <RiSparkling2Line className="text-xs" />
                            <span>{score}%</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${
                            isUnlocked
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-slate-100 border border-slate-200 text-slate-400'
                          }`}>
                            {isUnlocked ? (t('common.in_progress') || 'Jarayonda') : (t('common.locked') || 'Qulflangan')}
                          </span>
                        )}

                        {isUnlocked && (
                          <span className="text-slate-400 hover:text-blue-600 hidden sm:inline">
                            <RiArrowRightLine />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: PERSONAL INFO & SECURITY SETTINGS ───────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            
            {/* Form 1: Personal Info */}
            <div className="card-standard p-6 sm:p-7 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <RiUser3Line className="text-blue-600 text-base" />
                <span>{t('student.profile.personal_info') || "Shaxsiy ma'lumotlar"}</span>
              </h3>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('auth.full_name') || "F.I.Sh"}
                  </label>
                  <div className="relative flex items-center">
                    <RiUser3Line className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="input-standard has-icon-left text-xs sm:text-sm"
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('auth.email') || "Elektron pochta"}
                  </label>
                  <div className="relative flex items-center">
                    <RiMailLine className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="input-standard has-icon-left text-xs sm:text-sm bg-slate-100/70 text-slate-400 cursor-not-allowed border-slate-200"
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RiSave3Line />
                    <span>{profileSaving ? (t('common.loading') || 'Saqlanmoqda...') : (t('common.save') || 'Saqlash')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Form 2: Password Security */}
            <div className="card-standard p-6 sm:p-7 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <RiKey2Line className="text-purple-600 text-base" />
                <span>{t('auth.password') || "Xavfsizlik va Parolni o'zgartirish"}</span>
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Yangi parol
                  </label>
                  <div className="relative flex items-center">
                    <RiLockPasswordLine className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="input-standard has-icon-left text-xs sm:text-sm"
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Parolni tasdiqlash
                  </label>
                  <div className="relative flex items-center">
                    <RiLockPasswordLine className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="input-standard has-icon-left text-xs sm:text-sm"
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RiRefreshLine />
                    <span>{passwordSaving ? (t('common.loading') || 'Yangilanmoqda...') : (t('common.update') || 'Parolni yangilash')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
