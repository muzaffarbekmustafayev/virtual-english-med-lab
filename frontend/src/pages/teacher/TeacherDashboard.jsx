import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PageHeader, StatTile, SectionCard, EmptyState, Skeleton, Progress, Avatar,
  BarChart, DistributionBars, CompetencyBars, ScoreBadge,
  useRelativeTime, scoreText, formatDay
} from '../../components/ui';
import {
  RiGroupLine, RiArrowRightLine, RiUser3Line, RiTrophyLine, RiBarChartLine,
  RiUserStarLine, RiSearchLine, RiPulseLine, RiBarChartBoxLine, RiBrainLine,
  RiBookOpenLine, RiTimeLine, RiAlertLine, RiMedalLine, RiMessage3Line,
  RiCheckDoubleLine, RiSpeedLine, RiChatSmile2Line, RiRefreshLine
} from 'react-icons/ri';

const SPECIALTY_EMOJI = { STOM: '🦷', GEN_MED: '🩺', PED: '👶', NURSING: '💉', FIRST_AID: '🚑' };

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { t, getLocalized, language } = useLanguage();
  const rel = useRelativeTime();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selGroup, setSelGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score-desc');

  const load = () => {
    setLoading(true);
    api.get('/teacher/dashboard').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const COMP_LABELS = { grammar: t('comp_grammar'), vocabulary: t('comp_vocabulary'), fluency: t('comp_fluency'), pronunciation: t('comp_pronunciation'), clinical: t('comp_clinical') };
  const fmtDay = (d) => formatDay(d, language);

  const groups = data?.groups || [];
  const group = selGroup === 'all' ? null : groups.find((g) => g.id === selGroup);

  // Tanlangan guruh yoki barcha guruhlar bo'yicha ko'rsatkichlar
  const scope = useMemo(() => {
    if (!data) return null;
    if (group) {
      return {
        students: group.students, student_count: group.student_count, active: group.active_students,
        avg: group.average_score, progress: group.average_progress, sessions: group.completed_sessions,
        sessions_7d: group.sessions_7d, pass_rate: group.pass_rate, competencies: group.competencies,
        timeline: group.activity_timeline, distribution: group.score_distribution, matrix: group.module_matrix,
        top: group.top_students, weak: group.weak_students, recent: group.recent_activity, total_modules: group.total_modules,
      };
    }
    const all = data.all_students || [];
    return {
      students: all, student_count: data.total_students, active: data.active_students,
      avg: data.average_score, progress: data.average_progress, sessions: data.recent_conversations,
      sessions_7d: data.sessions_7d, pass_rate: data.pass_rate, competencies: data.competencies,
      timeline: data.activity_timeline, distribution: data.score_distribution, matrix: null,
      top: [...all].filter((s) => s.completed_sessions > 0).sort((a, b) => b.average_score - a.average_score).slice(0, 3),
      weak: all.filter((s) => s.completed_sessions > 0 && s.average_score < 60).sort((a, b) => a.average_score - b.average_score).slice(0, 3),
      recent: data.recent_activity, total_modules: null,
    };
  }, [data, group]);

  const inactive = useMemo(() => (scope?.students || []).filter((s) => s.days_inactive === null || s.days_inactive > 14), [scope]);

  const filteredStudents = useMemo(() => {
    const list = (scope?.students || []).filter((s) => {
      const q = search.trim().toLowerCase();
      return !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
    return list.sort((a, b) => {
      if (sortBy === 'score-desc') return b.average_score - a.average_score;
      if (sortBy === 'score-asc') return a.average_score - b.average_score;
      if (sortBy === 'progress-desc') return b.progress_percent - a.progress_percent;
      if (sortBy === 'activity') return new Date(b.last_activity) - new Date(a.last_activity);
      return a.full_name.localeCompare(b.full_name);
    });
  }, [scope, search, sortBy]);

  const reportLink = (s) => `/teacher/reports?${s ? `search=${encodeURIComponent(s.full_name)}&` : ''}${group ? `group_id=${group.id}` : ''}`;

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <PageHeader
          tone="hero-emerald"
          badge={t('nav.teacher_portal')}
          badgeIcon={RiUserStarLine}
          badgeTone="emerald"
          title={t('teacher.dashboard.title')}
          subtitle={t('teacher.dashboard.subtitle')}
          actions={
            <>
              <button onClick={load} className="btn-icon bg-white border-slate-200" title={t('ui_refresh')}><RiRefreshLine className={loading ? 'animate-spin' : ''} /></button>
              <button onClick={() => navigate('/teacher/forum')} className="btn-secondary-soft"><RiChatSmile2Line className="text-emerald-600" /><span>{t('stats_open_forum')}</span></button>
              <button onClick={() => navigate(group ? `/teacher/reports?group_id=${group.id}` : '/teacher/reports')} className="btn-emerald"><RiBarChartLine /><span>{t('teacher_detailed_reports')}</span><RiArrowRightLine /></button>
            </>
          }
        />

        {/* ── Group selector ── */}
        {!loading && groups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
            <button onClick={() => setSelGroup('all')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${selGroup === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
              <RiGroupLine /> {t('stats_all_my_groups')}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${selGroup === 'all' ? 'bg-white/15' : 'bg-slate-100 text-slate-600'}`}>{data.total_students}</span>
            </button>
            {groups.map((g) => {
              const active = selGroup === g.id;
              return (
                <button key={g.id} onClick={() => setSelGroup(g.id)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${active ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}>
                  <span>{g.specialty?.icon || SPECIALTY_EMOJI[g.specialty?.code] || '🎓'}</span> {g.name}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>{g.student_count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty (no groups) ── */}
        {!loading && groups.length === 0 && (
          <div className="card-standard"><EmptyState icon={RiGroupLine} title={t('stats_no_groups_teacher')} hint={t('stats_no_groups_teacher_hint')} /></div>
        )}

        {/* ── KPI ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[104px]" />)}</div>
        ) : scope && groups.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <StatTile label={group ? t('ui_group') : t('teacher.dashboard.assigned_groups')} value={group ? (group.specialty ? (getLocalized(group.specialty, 'name') || group.specialty.name) : group.name) : data.total_groups} sub={group ? `${group.total_modules} ${t('ui_module_short')}` : undefined} icon={RiGroupLine} tone="emerald" valueClass={group ? 'text-base leading-snug' : ''} />
            <StatTile label={t('teacher.dashboard.total_students')} value={scope.student_count} sub={`${scope.active} ${t('ui_active').toLowerCase()}`} icon={RiUser3Line} tone="blue" />
            <StatTile label={t('stats_group_avg')} value={`${scope.avg || 0}%`} icon={RiTrophyLine} tone="amber" valueClass={scoreText(scope.avg || 0)} />
            <StatTile label={t('stats_avg_progress')} value={`${scope.progress || 0}%`} icon={RiSpeedLine} tone="indigo" />
            <StatTile label={t('ui_pass_rate')} value={`${scope.pass_rate || 0}%`} icon={RiCheckDoubleLine} tone="teal" valueClass={scoreText(scope.pass_rate || 0)} />
            <StatTile label={t('teacher.dashboard.completed_sessions')} value={scope.sessions} sub={`${scope.sessions_7d} · ${t('ui_last_7_days').toLowerCase()}`} icon={RiMessage3Line} tone="cyan" />
          </div>
        )}

        {/* ── Activity / distribution / competencies ── */}
        {!loading && scope && groups.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
            <SectionCard icon={RiPulseLine} iconClass="text-emerald-600" title={t('stats_activity')} desc={t('stats_activity_desc')} className="xl:col-span-7" bodyClass="p-5"
              right={<span className="badge-standard badge-slate">{t('ui_last_14_days')}</span>}>
              {scope.sessions === 0 ? <EmptyState title={t('ui_no_data')} hint={t('ui_no_data_hint')} className="py-8" /> : (
                <BarChart data={scope.timeline} valueKey="sessions" labelKey="date" formatLabel={fmtDay} height={140} tone="#059669" />
              )}
            </SectionCard>
            <SectionCard icon={RiBarChartBoxLine} iconClass="text-indigo-600" title={t('stats_distribution')} desc={t('stats_distribution_desc')} className="xl:col-span-5" bodyClass="p-5">
              <DistributionBars data={scope.distribution} />
            </SectionCard>
            <SectionCard icon={RiBrainLine} iconClass="text-indigo-600" title={t('stats_competencies')} desc={t('stats_competencies_desc')} className="xl:col-span-12" bodyClass="p-5">
              <CompetencyBars comps={scope.competencies} labels={COMP_LABELS} />
            </SectionCard>
          </div>
        )}

        {/* ── Module matrix (only for a selected group) ── */}
        {!loading && group && scope?.matrix && (
          <SectionCard icon={RiBookOpenLine} iconClass="text-amber-600" title={t('stats_module_matrix')} desc={t('stats_module_matrix_desc')}
            right={<span className="badge-standard badge-slate">{group.student_count} {t('ui_student')}</span>}>
            <div className="overflow-x-auto">
              <table className="table-premium min-w-[640px]">
                <thead><tr><th>{t('ui_modules')}</th><th className="text-center">{t('stats_started')}</th><th className="text-center">{t('ui_passed')}</th><th className="text-center">{t('ui_attempts')}</th><th>{t('stats_completion')}</th><th className="text-right">{t('ui_average')}</th></tr></thead>
                <tbody>
                  {scope.matrix.map((m) => (
                    <tr key={m.id}>
                      <td className="font-bold text-slate-900"><span className="text-slate-400 font-black mr-1.5">#{m.order_index}</span>{getLocalized(m, 'title') || m.title}</td>
                      <td className="text-center tabular font-bold">{m.students_attempted}</td>
                      <td className="text-center tabular font-bold text-emerald-700">{m.students_passed}</td>
                      <td className="text-center tabular font-bold">{m.attempts}</td>
                      <td><div className="flex items-center gap-2 min-w-[140px]"><Progress value={m.completion_rate} tone="bg-emerald-500" height="h-1.5" /><span className="text-[11px] font-bold tabular w-9 text-right">{m.completion_rate}%</span></div></td>
                      <td className="text-right">{m.students_attempted ? <ScoreBadge value={m.avg_score} /> : <span className="badge-standard badge-slate">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ── Top / weak / inactive / recent ── */}
        {!loading && scope && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            <MiniList icon={RiMedalLine} iconClass="text-amber-500" title={t('stats_top_students')} desc={t('stats_top_students_desc')} items={scope.top} t={t}
              render={(s) => <ScoreBadge value={s.average_score} />} onClick={(s) => navigate(reportLink(s))} />
            <MiniList icon={RiAlertLine} iconClass="text-rose-500" title={t('stats_weak_students')} desc={t('stats_weak_students_desc')} items={scope.weak} t={t} emptyTitle={t('ui_all_good')}
              render={(s) => <ScoreBadge value={s.average_score} />} onClick={(s) => navigate(reportLink(s))} />
            <MiniList icon={RiTimeLine} iconClass="text-slate-500" title={t('stats_inactive_students')} desc={t('stats_inactive_desc')} items={inactive.slice(0, 5)} t={t} emptyTitle={t('ui_all_good')}
              render={(s) => <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">{rel(s.days_inactive === null ? null : s.last_activity)}</span>} onClick={(s) => navigate(reportLink(s))}
              footer={inactive.length > 5 ? `+${inactive.length - 5}` : null} />
            <SectionCard icon={RiPulseLine} iconClass="text-cyan-600" title={t('stats_recent_activity')} desc={t('stats_recent_activity_desc')}>
              {(scope.recent || []).length === 0 ? <EmptyState title={t('ui_no_data')} className="py-8" /> : (
                <div className="divide-y divide-slate-100">
                  {scope.recent.map((a) => (
                    <div key={a.id} className="px-4 py-2.5 flex items-center gap-3">
                      <Avatar name={a.student_name} seed={a.student_id} size="w-8 h-8 text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{a.student_name}</p>
                        <p className="text-[10.5px] text-slate-400 font-medium truncate">#{a.module_order} {a.module_title} · {rel(a.created_at)}</p>
                      </div>
                      <ScoreBadge value={a.score} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ── Students table ── */}
        {!loading && groups.length > 0 && (
          <SectionCard icon={RiUser3Line} iconClass="text-emerald-600" title={group ? `${t('stats_students_of_group')} · ${group.name}` : t('teacher_all_students_results')} desc={t('ui_course_progress')}
            right={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input type="text" placeholder={t('teacher_search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="input-standard has-icon-left text-xs py-2 w-52 sm:w-64" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-standard text-xs py-2 w-auto">
                  <option value="score-desc">{t('teacher_sort_score_desc')}</option>
                  <option value="score-asc">{t('teacher_sort_score_asc')}</option>
                  <option value="progress-desc">{t('teacher_sort_progress_desc')}</option>
                  <option value="activity">{t('ui_last_activity')}</option>
                  <option value="name-asc">{t('teacher_sort_name')}</option>
                </select>
              </div>
            }>
            {filteredStudents.length === 0 ? <EmptyState icon={RiUser3Line} title={t('teacher_no_students')} hint={t('teacher_no_students_hint')} /> : (
              <div className="overflow-x-auto">
                <table className="table-premium min-w-[820px]">
                  <thead>
                    <tr>
                      <th>{t('ui_name')}</th>
                      {!group && <th>{t('ui_group')}</th>}
                      <th className="min-w-[180px]">{t('ui_course_progress')}</th>
                      <th className="text-center hidden lg:table-cell">{t('comp_grammar')}</th>
                      <th className="text-center hidden lg:table-cell">{t('comp_vocabulary')}</th>
                      <th className="text-center hidden lg:table-cell">{t('comp_clinical')}</th>
                      <th className="text-center">{t('ui_sessions')}</th>
                      <th>{t('ui_last_activity')}</th>
                      <th className="text-right">{t('ui_average')}</th>
                      <th className="text-right">{t('ui_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar name={s.full_name} seed={s.id} size="w-9 h-9 text-xs" />
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 truncate">{s.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        {!group && <td><span className="badge-standard badge-slate">{s.group_name}</span></td>}
                        <td>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1"><span>{s.completed_modules} / {s.total_modules} {t('ui_module_short')}</span><span className="tabular text-slate-900">{s.progress_percent}%</span></div>
                          <Progress value={s.progress_percent} tone="bg-emerald-500" height="h-1.5" />
                        </td>
                        <td className="text-center tabular font-bold hidden lg:table-cell">{s.completed_sessions ? `${s.competencies?.grammar ?? 0}%` : '—'}</td>
                        <td className="text-center tabular font-bold hidden lg:table-cell">{s.completed_sessions ? `${s.competencies?.vocabulary ?? 0}%` : '—'}</td>
                        <td className="text-center tabular font-bold hidden lg:table-cell">{s.completed_sessions ? `${s.competencies?.clinical ?? 0}%` : '—'}</td>
                        <td className="text-center tabular font-bold">{s.completed_sessions}</td>
                        <td className="text-slate-500 font-medium whitespace-nowrap">{rel(s.completed_sessions ? s.last_activity : null)}</td>
                        <td className="text-right"><ScoreBadge value={s.average_score} /></td>
                        <td className="text-right">
                          <button onClick={() => navigate(reportLink(s))} className="btn-secondary-soft text-xs py-1.5 px-3 hover:border-emerald-300 hover:text-emerald-700"><span>{t('ui_report')}</span><RiArrowRightLine /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </Layout>
  );
}

function MiniList({ icon, iconClass, title, desc, items = [], render, onClick, t, emptyTitle, footer }) {
  return (
    <SectionCard icon={icon} iconClass={iconClass} title={title} desc={desc}>
      {items.length === 0 ? <EmptyState title={emptyTitle || t('ui_no_data')} className="py-8" /> : (
        <div className="divide-y divide-slate-100">
          {items.map((s, i) => (
            <button key={s.id} onClick={() => onClick && onClick(s)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
              <Avatar name={s.full_name} seed={s.id} size="w-8 h-8 text-[11px]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{s.full_name}</p>
                <p className="text-[10.5px] text-slate-400 font-medium truncate">{s.group_name} · {s.completed_sessions} {t('ui_session_short')}</p>
              </div>
              {render && render(s, i)}
            </button>
          ))}
          {footer && <p className="px-4 py-2 text-[11px] font-bold text-slate-400 text-right">{footer}</p>}
        </div>
      )}
    </SectionCard>
  );
}
