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
  RiEditBoxLine, RiCheckLine, RiAlertLine
} from 'react-icons/ri';

const ROLE_BADGE = {
  student: { icon: RiUser3Line,       label: "Student", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  teacher: { icon: RiUserStarLine,    label: "Teacher", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  admin:   { icon: RiShieldCheckLine, label: "Admin",   bg: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

function AchievementBadge({ icon, label, color, achieved }) {
  return (
    <div className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all ${achieved ? `${color} shadow-sm` : 'bg-slate-50 border-slate-200 opacity-35'}`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-[11px] font-bold text-center leading-tight">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'security' | 'history'

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
      api.get('/auth/specialties').catch(() => ({ data: [] })),
      api.get('/auth/groups').catch(() => ({ data: [] })),
    ]).then(([dashRes, specRes, groupRes]) => {
      setDashboard(dashRes.data);
      setSpecialties(specRes.data);
      setGroups(groupRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const avg = dashboard?.average_score || 0;
  const progress = dashboard?.progress_percent || 0;
  const RoleIcon = ROLE_BADGE[user?.role]?.icon || RiUser3Line;
  const roleConfig = ROLE_BADGE[user?.role] || ROLE_BADGE.student;

  const achievements = [
    { icon: <RiRocketLine />,      label: 'First Module',  color: 'bg-indigo-50 border-indigo-200 text-indigo-700', achieved: (dashboard?.completed_modules || 0) >= 1 },
    { icon: <RiStarLine />,        label: '5 Modules',     color: 'bg-amber-50 border-amber-200 text-amber-700',    achieved: (dashboard?.completed_modules || 0) >= 5 },
    { icon: <RiTrophyLine />,      label: 'All Modules',   color: 'bg-emerald-50 border-emerald-200 text-emerald-700', achieved: dashboard?.completed_modules === dashboard?.total_modules && (dashboard?.total_modules || 0) > 0 },
    { icon: <RiAwardLine />,       label: 'Perfect Score', color: 'bg-rose-50 border-rose-200 text-rose-700',       achieved: avg >= 95 },
    { icon: <RiFlashlightLine />,  label: 'Fast Learner', color: 'bg-cyan-50 border-cyan-200 text-cyan-700',        achieved: (dashboard?.completed_modules || 0) >= 3 },
    { icon: <RiTargetLine />,      label: 'High Achiever', color: 'bg-purple-50 border-purple-200 text-purple-700', achieved: avg >= 80 },
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
    if (passwordForm.new_password.length < 6) {
      toast.error("Yangi parol kamida 6 belgidan iborat bo'lishi kerak");
      return;
    }

    setPasswordSaving(true);
    try {
      await api.put('/auth/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Parolni o'zgartirishda xatolik");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Layout>
      {/* ── PROFILE DARK HERO BANNER (Sidebar Theme Matching) ───── */}
      <div className="animate-fade-up mb-6 relative overflow-hidden rounded-3xl bg-[#0f1c2e] border border-white/10 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-10 w-44 h-44 rounded-full bg-purple-600/10 blur-xl pointer-events-none" />
        <RiSparklingLine className="absolute top-6 right-6 text-white/15 text-6xl" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black flex-shrink-0 border-2 border-white/20 shadow-xl shadow-blue-500/20">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white">{user?.full_name}</h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${roleConfig.bg}`}>
                  <RoleIcon className="text-xs" /> {roleConfig.label}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5 font-medium">
                <RiMailLine className="text-gray-500" /> {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-gray-300">
                {user?.specialty?.name && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-medium">
                    <RiFirstAidKitLine className="text-blue-400" /> {user.specialty.name}
                  </span>
                )}
                {user?.group?.name && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-medium">
                    <RiGroupLine className="text-emerald-400" /> {user.group.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Score Badge */}
          {dashboard && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 self-stretch md:self-auto justify-around">
              <div className="text-center">
                <p className="text-2xl font-black text-blue-400">{dashboard.completed_modules || 0}</p>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Completed</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-400">{dashboard.average_score || 0}%</p>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Avg Score</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SIDEBAR-STYLE SUB-NAV TABS ────────────────────────── */}
      <div className="animate-fade-up delay-100 flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Achievements', icon: RiBarChartLine },
          { id: 'edit',     label: 'Edit Profile',            icon: RiEditBoxLine  },
          { id: 'security', label: 'Security & Password',     icon: RiKey2Line     },
          { id: 'history',  label: 'Study History',           icon: RiHistoryLine  },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#0f1c2e] text-white border-[#0f1c2e] shadow-md shadow-slate-900/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <Icon className={`text-base ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW & ACHIEVEMENTS ──────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : dashboard && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Modules',   value: dashboard.total_modules,               icon: <RiBookOpenLine />,        color: 'from-indigo-500 to-indigo-600' },
                  { label: 'Completed',       value: dashboard.completed_modules,           icon: <RiCheckboxCircleLine />,  color: 'from-emerald-500 to-teal-500'  },
                  { label: 'Avg Score',       value: `${dashboard.average_score}%`,         icon: <RiTrophyLine />,          color: 'from-amber-500 to-orange-500'  },
                  { label: 'Progress',        value: `${dashboard.progress_percent}%`,      icon: <RiBarChartLine />,        color: 'from-cyan-500 to-blue-500'     },
                ].map((s, i) => (
                  <div key={s.label}
                       className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 group hover:shadow-md transition-all">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-base mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                      {s.icon}
                    </div>
                    <p className="text-xl font-black text-slate-900">{s.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Overall Course Completion</h3>
                  <span className="text-sm font-black text-indigo-600">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #1e3a5f, #2563eb, #10b981)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[11px] text-slate-400 font-medium">
                  <span>0%</span>
                  <span className="flex items-center gap-1 text-slate-600 font-semibold">100% <RiGraduationCapLine className="text-xs" /></span>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200">
                    <RiMedalLine className="text-amber-500 text-base" />
                  </span>
                  Badges & Achievements
                  <span className="ml-auto text-xs text-slate-400 font-medium">
                    {achievements.filter(a => a.achieved).length}/{achievements.length} Earned
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {achievements.map(a => (
                    <AchievementBadge key={a.label} {...a} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: EDIT PROFILE ──────────────────────────────── */}
      {activeTab === 'edit' && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-8 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <RiEditBoxLine className="text-blue-600" /> Profil Ma'lumotlarini Tahrirlash
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ism-Familiya</label>
              <div className="relative">
                <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={profileForm.full_name}
                  onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Manzili</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mutaxassislik</label>
                <select
                  value={profileForm.specialty_id}
                  onChange={e => setProfileForm({ ...profileForm, specialty_id: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  <option value="">Tanlang...</option>
                  {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Akademik Guruh</label>
                <select
                  value={profileForm.group_id}
                  onChange={e => setProfileForm({ ...profileForm, group_id: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  <option value="">Tanlang...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0f1c2e] hover:bg-[#1a2d47] text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
            >
              {profileSaving ? (
                <><RiLoader4Line className="animate-spin text-base" /> Saqlanmoqda...</>
              ) : (
                <><RiSave3Line className="text-base" /> Profilni Saqlash</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 3: SECURITY & PASSWORD ───────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-8 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <RiKey2Line className="text-purple-600" /> Parolni O'zgartirish va Xavfsizlik
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Joriy Parol</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Yangi Parol (Kamida 6 belgi)</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Yangi Parolni Tasdiqlang</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {passwordSaving ? (
                <><RiLoader4Line className="animate-spin text-base" /> Yangilanmoqda...</>
              ) : (
                <><RiKey2Line className="text-base" /> Parolni O'zgartirish</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 4: STUDY HISTORY & LOGS ─────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
            <RiHistoryLine className="text-emerald-600" /> Darslar va Suhbatlar Tarixi
          </h2>

          {dashboard?.recent_activity?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recent_activity.map((a) => {
                const score = a.overall_score || 0;
                const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
                const scoreBg   = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
                return (
                  <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-slate-50/50 transition-all">
                    <div>
                      <h3 className="text-sm text-slate-900 font-bold">{a.module?.title}</h3>
                      <p className="text-xs text-slate-400 capitalize mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1"><RiCalendarLine className="text-xs" /> {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>·</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600 font-medium">{a.attempt_type?.replace(/_/g,' ')}</span>
                      </p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-lg border ${scoreBg} ${scoreColor}`}>
                      {score}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <RiTimeLine className="text-4xl mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Hozircha suhbatlar tarixi mavjud emas</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
