import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import {
  Avatar, StatTile, SectionCard, EmptyState, Progress, Skeleton,
  CompetencyBars, ScoreBadge, RadialScore, scoreText, formatDate
} from '../components/ui';
import {
  RiUser3Line, RiBookOpenLine, RiBarChartLine, RiGroupLine, RiMailLine,
  RiCheckLine, RiKey2Line, RiStethoscopeLine, RiLockLine, RiTrophyLine,
  RiShieldCheckLine, RiUserStarLine, RiRobot2Line, RiArrowRightLine,
  RiSparkling2Line, RiSave3Line, RiRefreshLine, RiLockPasswordLine,
  RiEyeLine, RiEyeOffLine, RiCalendarLine, RiTeamLine, RiSettings4Line,
  RiHospitalLine, RiMessage3Line, RiSpeedLine, RiFileListLine
} from 'react-icons/ri';

const ROLE_META = {
  student: { icon: RiStethoscopeLine, badge: 'blue',    hero: '',             iconBox: 'bg-blue-50 text-blue-600 border-blue-100',       iconText: 'text-blue-600' },
  teacher: { icon: RiUserStarLine,    badge: 'emerald', hero: 'hero-emerald', iconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100', iconText: 'text-emerald-600' },
  admin:   { icon: RiShieldCheckLine, badge: 'purple',  hero: 'hero-purple',  iconBox: 'bg-purple-50 text-purple-600 border-purple-100',   iconText: 'text-purple-600' },
};

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { t, getLocalized, language } = useLanguage();
  const navigate = useNavigate();
  const role = user?.role || 'student';
  const meta = ROLE_META[role] || ROLE_META.student;
  const RoleIcon = meta.icon;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);          // rolga qarab: student dashboard / teacher dashboard / admin overview
  const [modules, setModules] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups] = useState([]);

  // ── Forms ──
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    specialty_id: user?.specialty?.id || user?.specialty_id || '',
    group_id: user?.group?.id || user?.group_id || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const fresh = await refreshUser();
        if (fresh && alive) {
          setProfileForm((f) => ({ ...f, full_name: fresh.full_name || f.full_name, specialty_id: fresh.specialty?.id || fresh.specialty_id || '', group_id: fresh.group?.id || fresh.group_id || '' }));
        }
        if (role === 'student') {
          const [d, m, s, g] = await Promise.all([
            api.get('/student/dashboard').catch(() => ({ data: null })),
            api.get('/student/modules').catch(() => ({ data: [] })),
            api.get('/auth/specialties').catch(() => ({ data: [] })),
            api.get('/auth/groups').catch(() => ({ data: [] })),
          ]);
          if (!alive) return;
          setData(d.data); setModules(m.data || []); setSpecialties(s.data || []); setGroups(g.data || []);
        } else if (role === 'teacher') {
          const d = await api.get('/teacher/dashboard').catch(() => ({ data: null }));
          if (!alive) return;
          setData(d.data);
        } else {
          const d = await api.get('/admin/overview').catch(() => ({ data: null }));
          if (!alive) return;
          setData(d.data);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const specialtyName = getLocalized(user?.specialty, 'name') || user?.specialty?.name || '';
  const groupName = user?.group?.name || '';
  const memberSince = user?.created_at ? formatDate(user.created_at, language, { day: false }) : null;
  const ROLE_LABEL = { student: t('role_student'), teacher: t('role_teacher'), admin: t('role_admin') }[role];
  const ROLE_DESC = { student: t('profile_student_role_desc'), teacher: t('profile_teacher_role_desc'), admin: t('profile_admin_role_desc') }[role];
  const COMP_LABELS = { grammar: t('comp_grammar'), vocabulary: t('comp_vocabulary'), fluency: t('comp_fluency'), pronunciation: t('comp_pronunciation'), clinical: t('comp_clinical') };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) return;
    setProfileSaving(true);
    try {
      const payload = { full_name: profileForm.full_name.trim() };
      if (role === 'student') {
        payload.specialty_id = profileForm.specialty_id ? Number(profileForm.specialty_id) : null;
        payload.group_id = profileForm.group_id ? Number(profileForm.group_id) : null;
      }
      const res = await api.put('/auth/profile', payload);
      updateUser(res.data.user);
      toast.success(t('profile_saved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('ui_error_generic'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwd.new_password.length < 6) { toast.error(t('ui_password_min')); return; }
    if (pwd.new_password !== pwd.confirm_password) { toast.error(t('ui_password_mismatch')); return; }
    setPwdSaving(true);
    try {
      await api.put('/auth/password', { current_password: pwd.current_password, new_password: pwd.new_password });
      toast.success(t('ui_password_updated'));
      setPwd({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('ui_error_generic'));
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Hero stats (rolga qarab) ──
  const heroStats = (() => {
    if (role === 'student') {
      const avg = data?.average_score || 0;
      const done = data?.completed_modules || 0;
      const total = data?.total_modules || modules.length || 0;
      return [
        { label: t('student.dashboard.completed_modules'), value: `${done}`, sub: `/ ${total}` },
        { label: t('student.dashboard.average_score'), value: `${avg}%`, cls: scoreText(avg) },
      ];
    }
    if (role === 'teacher') {
      return [
        { label: t('ui_groups'), value: data?.total_groups ?? 0 },
        { label: t('ui_students'), value: data?.total_students ?? 0 },
        { label: t('stats_group_avg'), value: `${data?.average_score || 0}%`, cls: scoreText(data?.average_score || 0) },
      ];
    }
    return [
      { label: t('ui_students'), value: data?.students ?? 0 },
      { label: t('ui_teachers'), value: data?.teachers ?? 0 },
      { label: t('stats_global_avg'), value: `${data?.avg_score || 0}%`, cls: scoreText(data?.avg_score || 0) },
    ];
  })();

  const filteredGroups = groups.filter((g) => !profileForm.specialty_id || String(g.specialty_id) === String(profileForm.specialty_id));

  const TABS = [
    { id: 'overview', label: t('profile_overview_tab'), icon: RiBarChartLine },
    { id: 'settings', label: t('profile_settings_tab'), icon: RiSettings4Line },
    { id: 'security', label: t('profile_security_tab'), icon: RiKey2Line },
  ];

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        {/* ── Hero ── */}
        <div className={`card-hero ${meta.hero} p-5 sm:p-7`}>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left min-w-0">
              <Avatar name={user?.full_name} seed={user?.id} size="w-20 h-20 text-3xl" className="rounded-3xl ring-4 ring-white shadow-lg" />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{user?.full_name || t('ui_user')}</h1>
                  <span className={`badge-standard badge-${meta.badge}`}><RoleIcon /> {ROLE_LABEL}</span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">{ROLE_DESC}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 text-xs font-bold">
                    <RiMailLine className="text-slate-400" /><span className="truncate max-w-[220px]">{user?.email}</span>
                  </span>
                  {specialtyName && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 text-xs font-bold">
                      <RiStethoscopeLine className="text-blue-600" /><span>{specialtyName}</span>
                    </span>
                  )}
                  {role === 'student' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 text-xs font-bold">
                      <RiGroupLine className="text-indigo-600" /><span>{groupName || t('ui_no_group')}</span>
                    </span>
                  )}
                  {memberSince && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-slate-200/80 text-slate-500 text-xs font-bold">
                      <RiCalendarLine className="text-slate-400" /><span>{t('ui_member_since')}: {memberSince}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-stretch divide-x divide-slate-200/80 bg-white/80 backdrop-blur border border-slate-200/90 rounded-2xl shrink-0 w-full lg:w-auto">
              {heroStats.map((s, i) => (
                <div key={i} className="flex-1 lg:flex-none text-center px-4 sm:px-5 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">{s.label}</p>
                  <p className={`text-xl sm:text-2xl font-black tabular mt-0.5 ${s.cls || 'text-slate-900'}`}>
                    {loading ? '…' : s.value}{s.sub && <span className="text-xs font-semibold text-slate-400 ml-1">{s.sub}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="text-sm" /><span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6 animate-fade-in">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : role === 'student' ? (
              <StudentOverview data={data} modules={modules} t={t} getLocalized={getLocalized} navigate={navigate} COMP_LABELS={COMP_LABELS} />
            ) : role === 'teacher' ? (
              <TeacherOverview data={data} t={t} navigate={navigate} />
            ) : (
              <AdminOverviewMini data={data} t={t} navigate={navigate} />
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 animate-fade-in">
            <SectionCard icon={RiUser3Line} title={t('profile_personal_info')} desc={t('profile_personal_info_desc')} className="lg:col-span-3" bodyClass="p-5 sm:p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="pf-name">{t('auth.full_name')}</label>
                  <div className="relative flex items-center">
                    <RiUser3Line className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
                    <input id="pf-name" type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="input-standard has-icon-left text-sm" required minLength={2} />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="pf-email">{t('auth.email')}</label>
                  <div className="relative flex items-center">
                    <RiMailLine className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
                    <input id="pf-email" type="email" value={user?.email || ''} disabled className="input-standard has-icon-left text-sm" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1"><RiLockLine /> {t('profile_email_locked')}</p>
                </div>

                {role === 'student' && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5"><RiHospitalLine className="text-blue-600" /> {t('profile_academic')}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 mb-3">{t('profile_academic_hint')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="field-label" htmlFor="pf-spec">{t('ui_specialty')}</label>
                        <select id="pf-spec" value={profileForm.specialty_id} onChange={(e) => setProfileForm({ ...profileForm, specialty_id: e.target.value, group_id: '' })} className="input-standard text-sm">
                          <option value="">{t('ui_not_selected')}</option>
                          {specialties.map((s) => <option key={s.id} value={s.id}>{s.icon ? `${s.icon} ` : ''}{getLocalized(s, 'name') || s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="pf-group">{t('ui_group')}</label>
                        <select id="pf-group" value={profileForm.group_id} onChange={(e) => setProfileForm({ ...profileForm, group_id: e.target.value })} className="input-standard text-sm">
                          <option value="">{t('ui_not_selected')}</option>
                          {filteredGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={profileSaving} className="btn-primary">
                    <RiSave3Line /><span>{profileSaving ? t('ui_saving') : t('ui_save')}</span>
                  </button>
                </div>
              </form>
            </SectionCard>

            <div className="lg:col-span-2 space-y-4">
              <div className="card-standard p-5 space-y-3">
                <p className="section-title"><RoleIcon className={meta.iconText} /> {t('ui_role')}</p>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${meta.iconBox}`}><RoleIcon className="text-lg" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">{ROLE_LABEL}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{ROLE_DESC}</p>
                  </div>
                </div>
                {role === 'student' && (
                  <div className="text-[11px] text-slate-500 font-medium space-y-1.5 pt-1">
                    <p className="flex items-center gap-2"><RiStethoscopeLine className="text-blue-600" /> {t('ui_specialty')}: <strong className="text-slate-800">{specialtyName || t('ui_not_selected')}</strong></p>
                    <p className="flex items-center gap-2"><RiGroupLine className="text-indigo-600" /> {t('ui_group')}: <strong className="text-slate-800">{groupName || t('ui_no_group')}</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 animate-fade-in">
            <SectionCard icon={RiKey2Line} iconClass="text-purple-600" title={t('auth.password')} desc={t('profile_security_desc')} className="lg:col-span-3" bodyClass="p-5 sm:p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <PwdInput t={t} id="pw-cur" label={t('ui_current_password')} value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} shown={showPwd.current} onToggle={() => setShowPwd({ ...showPwd, current: !showPwd.current })} autoComplete="current-password" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PwdInput t={t} id="pw-new" label={t('ui_new_password')} value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} shown={showPwd.next} onToggle={() => setShowPwd({ ...showPwd, next: !showPwd.next })} autoComplete="new-password" />
                  <PwdInput t={t} id="pw-conf" label={t('ui_confirm_password')} value={pwd.confirm_password} onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })} shown={showPwd.confirm} onToggle={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} autoComplete="new-password" />
                </div>
                {pwd.new_password && (
                  <div className="space-y-1">
                    <Progress value={Math.min(100, pwd.new_password.length * 10)} tone={pwd.new_password.length >= 10 ? 'bg-emerald-500' : pwd.new_password.length >= 6 ? 'bg-amber-500' : 'bg-rose-500'} height="h-1.5" />
                    <p className="text-[11px] text-slate-400 font-medium">{t('ui_password_min')}</p>
                  </div>
                )}
                <div className="pt-1 flex justify-end">
                  <button type="submit" disabled={pwdSaving} className="btn-dark">
                    <RiRefreshLine /><span>{pwdSaving ? t('ui_updating') : t('ui_update_password')}</span>
                  </button>
                </div>
              </form>
            </SectionCard>
            <div className="lg:col-span-2">
              <div className="card-standard p-5 space-y-3">
                <p className="section-title"><RiShieldCheckLine className="text-emerald-600" /> {t('profile_security_tab')}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{t('ui_password_hint')}</p>
                <ul className="text-[11px] text-slate-500 font-medium space-y-1.5">
                  <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500" /> {t('ui_password_min')}</li>
                  <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500" /> {t('ui_confirm_password')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function PwdInput({ id, label, value, onChange, shown, onToggle, placeholder = '••••••••', autoComplete, t }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="relative flex items-center">
        <RiLockPasswordLine className="absolute left-3.5 text-slate-400 text-base pointer-events-none" />
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="input-standard has-icon-left has-icon-right text-sm"
          required
        />
        <button type="button" onClick={onToggle} className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1" aria-label={shown ? t('ui_hide_password') : t('ui_show_password')}>
          {shown ? <RiEyeOffLine /> : <RiEyeLine />}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ Student overview ═══════════ */
function StudentOverview({ data, modules, t, getLocalized, navigate, COMP_LABELS }) {
  const avg = data?.average_score || 0;
  const completed = data?.completed_modules || 0;
  const total = data?.total_modules || modules.length || 0;
  const progress = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const sessions = (data?.module_results || []).reduce((a, m) => a + (m.attempts || 0), 0);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label={t('student.dashboard.course_progress')} value={`${progress}%`} sub={`${completed} / ${total} ${t('ui_module_short')}`} icon={RiSpeedLine} tone="blue" />
        <StatTile label={t('student.dashboard.average_score')} value={`${avg}%`} sub={t('profile_best_results')} icon={RiTrophyLine} tone="emerald" valueClass={scoreText(avg)} />
        <StatTile label={t('profile_virtual_patient')} value={sessions} sub={t('profile_sim_dialogues')} icon={RiRobot2Line} tone="indigo" />
        <StatTile label="CEFR" value={(data?.cefr_level || 'A2').split(' ')[0]} sub={data?.cefr_level || ''} icon={RiSparkling2Line} tone="amber" />
      </div>

      <SectionCard icon={RiBarChartLine} iconClass="text-indigo-600" title={t('profile_competency_title')} desc={t('profile_all_modules')} bodyClass="p-5">
        <CompetencyBars comps={data?.competencies || {}} labels={COMP_LABELS} />
      </SectionCard>

      <SectionCard icon={RiBookOpenLine} title={t('profile_module_history')} right={<span className="badge-standard badge-slate">{modules.length} {t('ui_module_short')}</span>}>
        {modules.length === 0 ? <EmptyState title={t('ui_no_data')} /> : (
          <div className="divide-y divide-slate-100">
            {modules.map((m) => {
              const unlocked = m.is_unlocked; const done = m.is_completed; const score = m.best_score;
              return (
                <div key={m.id} onClick={() => unlocked && navigate(`/student/modules/${m.id}`)}
                  className={`px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${unlocked ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-60'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : unlocked ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {done ? <RiCheckLine /> : unlocked ? m.order_index : <RiLockLine className="text-sm" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{m.order_index}. {getLocalized(m, 'title') || m.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{getLocalized(m, 'description') || m.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {score !== null && score !== undefined ? <ScoreBadge value={score} /> : (
                      <span className={`badge-standard ${unlocked ? 'badge-amber' : 'badge-slate'}`}>{unlocked ? t('common.in_progress') : t('common.locked')}</span>
                    )}
                    {unlocked && <RiArrowRightLine className="text-slate-300 hidden sm:block" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ═══════════ Teacher overview ═══════════ */
function TeacherOverview({ data, t, navigate }) {
  const groups = data?.groups || [];
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label={t('teacher.dashboard.assigned_groups')} value={data?.total_groups ?? 0} icon={RiGroupLine} tone="emerald" />
        <StatTile label={t('ui_students')} value={data?.total_students ?? 0} sub={`${data?.active_students ?? 0} ${t('ui_active').toLowerCase()}`} icon={RiTeamLine} tone="blue" />
        <StatTile label={t('stats_group_avg')} value={`${data?.average_score || 0}%`} icon={RiTrophyLine} tone="amber" valueClass={scoreText(data?.average_score || 0)} />
        <StatTile label={t('ui_sessions')} value={data?.recent_conversations ?? 0} sub={`${data?.sessions_7d ?? 0} · ${t('ui_this_week').toLowerCase()}`} icon={RiMessage3Line} tone="indigo" />
      </div>
      <SectionCard icon={RiGroupLine} iconClass="text-emerald-600" title={t('profile_my_groups')} right={
        <button onClick={() => navigate('/teacher/dashboard')} className="btn-secondary-soft text-xs py-1.5 px-3">{t('ui_details')} <RiArrowRightLine /></button>
      }>
        {groups.length === 0 ? <EmptyState icon={RiGroupLine} title={t('profile_no_groups')} /> : (
          <div className="divide-y divide-slate-100">
            {groups.map((g) => (
              <div key={g.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <RadialScore value={g.average_score} size={56} stroke={6} />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{g.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{g.specialty_name || '—'} · {g.student_count} {t('ui_student')} · {g.completed_sessions} {t('stats_sessions_label')}</p>
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1"><span>{t('ui_progress')}</span><span className="tabular">{g.average_progress}%</span></div>
                  <Progress value={g.average_progress} tone="bg-emerald-500" height="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ═══════════ Admin overview (mini) ═══════════ */
function AdminOverviewMini({ data, t, navigate }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label={t('ui_students')} value={data?.students ?? 0} sub={`${data?.active_students_7d ?? 0} · ${t('stats_active_7d').toLowerCase()}`} icon={RiTeamLine} tone="blue" />
        <StatTile label={t('ui_teachers')} value={data?.teachers ?? 0} icon={RiUserStarLine} tone="emerald" />
        <StatTile label={t('ui_groups')} value={data?.groups ?? 0} icon={RiGroupLine} tone="indigo" />
        <StatTile label={t('ui_modules')} value={data?.modules ?? 0} icon={RiFileListLine} tone="amber" />
      </div>
      <div className="card-standard p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-title"><RiShieldCheckLine className="text-purple-600" /> {t('profile_system_summary')}</p>
          <p className="section-desc">{t('admin.overview.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/admin/overview')} className="btn-primary">{t('stats_overview')} <RiArrowRightLine /></button>
      </div>
    </>
  );
}
