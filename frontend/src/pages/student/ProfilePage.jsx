import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import {
  RiUser3Line, RiBookOpenLine, RiBarChartLine,
  RiGroupLine, RiMailLine, RiCheckLine,
  RiEditBoxLine, RiKey2Line, RiStethoscopeLine,
  RiLockLine, RiTrophyLine
} from 'react-icons/ri';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t, getLocalized } = useLanguage();
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

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard').catch(() => ({ data: null })),
      api.get('/student/modules').catch(() => ({ data: [] })),
    ]).then(([dashRes, modRes]) => {
      setDashboard(dashRes.data);
      setModules(modRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const avg = dashboard?.average_score || 0;
  const completedCount = dashboard?.completed_modules || 0;
  const totalModules = dashboard?.total_modules || 10;
  const progressPct = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
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
      toast.success(t('common.success'));
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Hero Profile Header Banner ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-md shadow-blue-500/20 shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{user?.full_name}</h1>
                <span className="badge-standard badge-blue">
                  {t('nav.roles.student')}
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mb-3 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <RiMailLine className="text-slate-400" /> {user?.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="badge-standard badge-slate">
                  <RiStethoscopeLine className="text-blue-600" /> {user?.specialty?.name || 'Stomatologiya'}
                </span>
                <span className="badge-standard badge-slate">
                  <RiGroupLine className="text-indigo-600" /> {user?.group?.name || '401-Guruh'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 shrink-0">
            <div className="text-center px-3 border-r border-slate-200">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t('student.dashboard.completed_modules')}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{completedCount} <span className="text-xs font-normal text-slate-400">/ {totalModules}</span></p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t('student.dashboard.average_score')}</p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{avg}%</p>
            </div>
          </div>
        </div>

        {/* ── 2. Tab Navigation ── */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RiBarChartLine /> {t('student.profile.overall_stats')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RiEditBoxLine /> {t('student.profile.personal_info')}
          </button>
        </div>

        {/* ── Tab 1: Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-standard p-5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('student.dashboard.course_progress')}</span>
                <p className="text-2xl font-black text-slate-900 mt-2 mb-1.5">{progressPct}%</p>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="card-standard p-5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('student.dashboard.average_score')}</span>
                <p className="text-2xl font-black text-emerald-600 mt-2 mb-1.5">{avg}%</p>
                <p className="text-xs text-slate-400 font-semibold">{t('student.profile.best_score')}</p>
              </div>

              <div className="card-standard p-5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Virtual Bemor</span>
                <p className="text-2xl font-black text-slate-900 mt-2 mb-1.5">
                  {dashboard?.recent_activity?.length || 0} ta
                </p>
                <p className="text-xs text-slate-400 font-semibold">Simulyatsiya muloqot</p>
              </div>

              <div className="card-standard p-5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">CEFR Daraja</span>
                <p className="text-2xl font-black text-purple-700 mt-2 mb-1.5">B2 Clinical</p>
                <p className="text-xs text-slate-400 font-semibold">Medical English Lab</p>
              </div>
            </div>

            {/* Module Progress List */}
            <div className="card-standard overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RiBookOpenLine className="text-blue-600" /> {t('student.profile.history_title')}
                </h3>
                <span className="text-xs font-bold text-slate-500">{modules.length} {t('nav.modules').toLowerCase()}</span>
              </div>

              <div className="divide-y divide-slate-100">
                {modules.map((m) => {
                  const isCompleted = m.is_completed;
                  const isUnlocked  = m.is_unlocked;
                  const score = m.best_score;
                  const description = getLocalized(m, 'description');

                  return (
                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted ? 'bg-emerald-100 text-emerald-700' : isUnlocked ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? <RiCheckLine /> : isUnlocked ? m.order_index : <RiLockLine />}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{m.order_index}. {m.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">{description || m.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {score !== null ? (
                          <span className="badge-standard badge-emerald">
                            {score}%
                          </span>
                        ) : (
                          <span className={`badge-standard ${isUnlocked ? 'badge-amber' : 'badge-slate'}`}>
                            {isUnlocked ? t('common.in_progress') : t('common.locked')}
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

        {/* ── Tab 2: Settings / Edit Profile ── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-standard p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <RiUser3Line className="text-blue-600" /> {t('student.profile.personal_info')}
              </h3>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.full_name')}</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="input-standard text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="input-standard text-xs bg-slate-100 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary-gradient"
                  >
                    {profileSaving ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>

            <div className="card-standard p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <RiKey2Line className="text-purple-600" /> {t('auth.password')}
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="input-standard text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')} (tasdiqlash)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="input-standard text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn-primary-gradient bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {passwordSaving ? t('common.loading') : t('common.update')}
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
