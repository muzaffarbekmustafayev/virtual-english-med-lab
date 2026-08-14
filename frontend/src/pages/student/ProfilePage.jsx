import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  RiUser3Line, RiTrophyLine, RiBookOpenLine, RiBarChartLine,
  RiFirstAidKitLine, RiGroupLine, RiMailLine, RiCalendarLine,
  RiCheckboxCircleLine, RiTimeLine, RiMedalLine, RiSparklingLine,
  RiRocketLine, RiStarLine, RiAwardLine, RiFlashlightLine,
  RiTargetLine, RiGraduationCapLine, RiSave3Line, RiKey2Line,
  RiUserStarLine, RiShieldCheckLine, RiLoader4Line, RiHistoryLine,
  RiEditBoxLine, RiCheckLine, RiAlertLine, RiStethoscopeLine,
  RiLockLine, RiArrowRightLine, RiHeartPulseLine, RiMessage3Line
} from 'react-icons/ri';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [modules, setModules]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'settings' | 'history'

  // Edit profile states
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups]           = useState([]);
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

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard').catch(() => ({ data: null })),
      api.get('/student/modules').catch(() => ({ data: [] })),
      api.get('/auth/specialties').catch(() => ({ data: [] })),
      api.get('/auth/groups').catch(() => ({ data: [] })),
    ]).then(([dashRes, modRes, specRes, groupRes]) => {
      setDashboard(dashRes.data);
      setModules(modRes.data || []);
      setSpecialties(specRes.data || []);
      setGroups(groupRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const avg = dashboard?.average_score || 0;
  const completedCount = dashboard?.completed_modules || 0;
  const totalModules = dashboard?.total_modules || 10;
  const progressPct = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;

  const achievements = [
    { icon: <RiRocketLine />,      label: 'Birinchi Qadam',   desc: '1-modulni yakunlash', achieved: completedCount >= 1, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { icon: <RiStarLine />,        label: 'Klinik Tajriba',   desc: '5 ta modulni yakunlash', achieved: completedCount >= 5, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { icon: <RiTrophyLine />,      label: 'Stomatolog Usta', desc: 'Barcha 10 ta modul', achieved: completedCount >= 10, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { icon: <RiAwardLine />,       label: 'A\'lochi Shifokor',desc: 'O\'rtacha ball 90%+', achieved: avg >= 90, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { icon: <RiFlashlightLine />,  label: 'Tezkor Muloqot',   desc: '3 ta modul o\'tildi', achieved: completedCount >= 3, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { icon: <RiTargetLine />,      label: 'Yuqori Aniqlik',   desc: 'Overall ball 80%+', achieved: avg >= 80, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success("Profil muvaffaqiyatli yangilandi");
    } catch (err) {
      toast.error(err.response?.data?.error || "Profilni yangilashda xatolik");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Yangi parollar bir-biriga mos kelmadi");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.put('/auth/password', passwordForm);
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Parolni yangilashda xatolik");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Layout>
      {/* ── 1. Hero Profile Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-1 shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-white text-3xl font-black">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Faol" />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Talaba • {user?.current_level || 1}-bosqich
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-3 flex items-center justify-center sm:justify-start gap-1.5">
                <RiMailLine className="text-slate-500" /> {user?.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                  <RiStethoscopeLine className="text-indigo-400" /> {user?.specialty?.name || 'Stomatologiya'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                  <RiGroupLine className="text-cyan-400" /> {user?.group?.name || '401-Stomatologiya'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge in Header */}
          <div className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-md border border-slate-700/70 rounded-2xl p-4 shrink-0">
            <div className="text-center px-3 border-r border-slate-700">
              <p className="text-xs text-slate-400 font-medium">Yakunlangan</p>
              <p className="text-2xl font-black text-white mt-0.5">{completedCount} <span className="text-xs font-normal text-slate-400">/ {totalModules}</span></p>
            </div>
            <div className="text-center px-3">
              <p className="text-xs text-slate-400 font-medium">O'rtacha Ball</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">{avg}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Top Level Navigation Tabs ── */}
      <div className="flex items-center gap-2 mb-7 border-b border-gray-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <RiBarChartLine /> O'zlashtirish va Statistikalar
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <RiEditBoxLine /> Profil va Parol Sozlamalari
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <RiHistoryLine /> Mashg'ulotlar Tarixi
        </button>
      </div>

      {/* ── 3. Tab: Overview & Analytics ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Kurs O'zlashtirishi</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  <RiBookOpenLine />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mb-1.5">{progressPct}%</p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">O'rtacha Overall</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <RiAwardLine />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mb-1.5">{avg}%</p>
              <p className="text-xs text-gray-500 font-medium">Barcha suhbatlar va testlar bo'yicha</p>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Klinik Muloqot</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm">
                  <RiMessage3Line />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mb-1.5">
                {dashboard?.recent_activity?.length || 0} ta
              </p>
              <p className="text-xs text-gray-500 font-medium">AI bemor bilan bajarilgan sessiyalar</p>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Daraja (CEFR)</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  <RiGraduationCapLine />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-700 mb-1.5">B2 Clinical</p>
              <p className="text-xs text-gray-500 font-medium">Medical English Proficient</p>
            </div>
          </div>

          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col (7 / 12): Modules Matrix & Clinical Skills */}
            <div className="lg:col-span-7 space-y-6">
              {/* 5 Core Clinical Skills Breakdown */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <RiHeartPulseLine className="text-indigo-600" /> Klinik Ko'nikmalar Tahlili
                </h3>
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>Grammatika va Tibbiy Sintaksis</span>
                      <span className="font-bold text-indigo-600">{avg ? Math.min(100, avg + 2) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${avg ? Math.min(100, avg + 2) : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>Stomatologik Lug'at va Atamalar</span>
                      <span className="font-bold text-cyan-600">{avg ? Math.min(100, avg + 5) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${avg ? Math.min(100, avg + 5) : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>Muloqot Ravonligi va Ishonch</span>
                      <span className="font-bold text-emerald-600">{avg}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${avg}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>Talaffuz va Audio Tushunish</span>
                      <span className="font-bold text-amber-600">{avg ? Math.max(0, avg - 3) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${avg ? Math.max(0, avg - 3) : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>Klinik Etika va Bemorga Empatiya</span>
                      <span className="font-bold text-rose-600">{avg ? Math.min(100, avg + 4) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${avg ? Math.min(100, avg + 4) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Progress Matrix */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <RiBookOpenLine className="text-indigo-600" /> Stomatologik Modullar Matritsasi
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">10 ta modul</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {modules.map((m) => {
                    const isCompleted = m.is_completed;
                    const isUnlocked  = m.is_unlocked;
                    const score = m.best_score;

                    return (
                      <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCompleted ? 'bg-emerald-100 text-emerald-700' : isUnlocked ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {isCompleted ? <RiCheckLine /> : isUnlocked ? m.order_index : <RiLockLine />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-snug">{m.order_index}. {m.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {score !== null ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {score}%
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isUnlocked ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isUnlocked ? 'Boshlanmagan' : 'Qulflangan'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col (5 / 12): Achievements & Recent Sessions */}
            <div className="lg:col-span-5 space-y-6">
              {/* Badges & Achievements */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <RiTrophyLine className="text-amber-500" /> Yutuqlar va Nishonlar
                  </h3>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {achievements.filter(a => a.achieved).length} / {achievements.length} Ochiq
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((ach, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border text-center transition-all ${
                        ach.achieved
                          ? `${ach.color} shadow-sm font-medium`
                          : 'bg-gray-50/70 border-gray-200 text-gray-400 opacity-60'
                      }`}
                    >
                      <div className="text-2xl mb-1 flex justify-center">{ach.icon}</div>
                      <p className="text-xs font-bold leading-tight">{ach.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{ach.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Mini List */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <RiHistoryLine className="text-cyan-600" /> So'nggi Mashg'ulotlar
                </h3>

                {dashboard?.recent_activity?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recent_activity.slice(0, 4).map((act) => (
                      <div key={act.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{act.module?.title || 'Klinik Suhbat'}</p>
                          <p className="text-gray-400 text-[11px]">{new Date(act.created_at).toLocaleDateString('uz-UZ')}</p>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {act.overall_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">Hozircha mashg'ulotlar o'tkazilmagan</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Tab: Settings & Security ── */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Edit Profile Info Form */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <RiEditBoxLine className="text-indigo-600" /> Shaxsiy Ma'lumotlarni Tahrirlash
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">To'liq Ism-Familiya</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Manzili</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Mutaxassislik</label>
                <select
                  value={profileForm.specialty_id}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Akademik Guruh</label>
                <select
                  value={profileForm.group_id}
                  onChange={(e) => setProfileForm({ ...profileForm, group_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50 mt-2"
              >
                <RiSave3Line /> {profileSaving ? "Saqlanmoqda..." : "O'zgarishlarni Saqlash"}
              </button>
            </form>
          </div>

          {/* Security / Password Form */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <RiKey2Line className="text-indigo-600" /> Parolni O'zgartirish
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Joriy Parol</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Yangi Parol</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Yangi Parolni Tasdiqlang</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50 mt-2"
              >
                <RiShieldCheckLine /> {passwordSaving ? "Yangilanmoqda..." : "Parolni Yangilash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. Tab: Full Study History ── */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <RiHistoryLine className="text-indigo-600" /> Barcha Mashg'ulotlar Tarixi
          </h3>
          {dashboard?.recent_activity?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {dashboard.recent_activity.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.module?.title || 'Virtual Patient Session'}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString('uz-UZ')}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black rounded-lg border border-emerald-200 text-xs">
                    {item.overall_score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-gray-400 text-sm">Hozircha mashg'ulotlar tarixi mavjud emas</p>
          )}
        </div>
      )}
    </Layout>
  );
}
