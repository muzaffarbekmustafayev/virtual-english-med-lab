import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PageHeader, StatTile, SectionCard, EmptyState, Skeleton, Progress, Avatar,
  BarChart, DistributionBars, CompetencyBars, ScoreBadge, RadialScore,
  useRelativeTime, scoreText, formatDay
} from '../../components/ui';
import {
  RiTeamLine, RiBookOpenLine, RiTrophyLine, RiUserStarLine, RiMessage3Line,
  RiArrowRightLine, RiShieldCheckLine, RiHospitalLine, RiGroupLine,
  RiPulseLine, RiBarChartBoxLine, RiAlertLine, RiDatabase2Line,
  RiBrainLine, RiBookLine, RiLightbulbLine, RiQuestionLine, RiChat3Line,
  RiCheckDoubleLine, RiMedalLine, RiTimeLine, RiRefreshLine,
  RiFileListLine, RiCheckboxCircleLine
} from 'react-icons/ri';

const SPECIALTY_EMOJI = { STOM: '🦷', GEN_MED: '🩺', PED: '👶', NURSING: '💉', FIRST_AID: '🚑' };
const specEmoji = (s) => s?.icon || SPECIALTY_EMOJI[s?.code] || '🩺';

export default function AdminOverview() {
  const navigate = useNavigate();
  const { t, getLocalized, language } = useLanguage();
  const rel = useRelativeTime();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selSpec, setSelSpec] = useState('all');
  const [moduleSort, setModuleSort] = useState('attempts');

  const load = () => {
    setLoading(true);
    api.get('/admin/overview')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const COMP_LABELS = { grammar: t('comp_grammar'), vocabulary: t('comp_vocabulary'), fluency: t('comp_fluency'), pronunciation: t('comp_pronunciation'), clinical: t('comp_clinical') };
  const fmtDay = (d) => formatDay(d, language);

  const specialties = stats?.specialties || [];
  const specNameById = (id, fallback) => { const sp = specialties.find((x) => x.id === id); return sp ? (getLocalized(sp, 'name') || sp.name) : fallback; };
  const selected = selSpec === 'all' ? null : specialties.find((s) => s.id === selSpec);
  const groupsToShow = useMemo(() => {
    if (!stats) return [];
    if (!selected) return stats.groups_ranking || [];
    return [...(selected.groups || [])].filter((g) => g.id !== 0).sort((a, b) => b.avg_score - a.avg_score);
  }, [stats, selected]);

  const moduleStats = useMemo(() => {
    const arr = [...(stats?.module_stats || [])];
    if (moduleSort === 'avg') arr.sort((a, b) => a.avg_score - b.avg_score);
    else if (moduleSort === 'pass') arr.sort((a, b) => a.pass_rate - b.pass_rate);
    else arr.sort((a, b) => b.attempts - a.attempts);
    return arr.slice(0, 10);
  }, [stats, moduleSort]);

  const alerts = stats?.alerts || {};
  const alertItems = [
    { key: 'ungrouped_students', label: t('stats_alert_ungrouped'), to: '/admin/users', icon: RiTeamLine },
    { key: 'students_without_specialty', label: t('stats_alert_no_specialty'), to: '/admin/users', icon: RiHospitalLine },
    { key: 'groups_without_teacher', label: t('stats_alert_no_teacher'), to: '/admin/groups', icon: RiUserStarLine },
    { key: 'empty_groups', label: t('stats_alert_empty_groups'), to: '/admin/groups', icon: RiGroupLine },
    { key: 'specialties_without_modules', label: t('stats_alert_no_modules'), to: '/admin/content/scenarios', icon: RiFileListLine },
    { key: 'inactive_students', label: t('stats_alert_inactive'), to: '/admin/users', icon: RiTimeLine },
  ].filter((a) => (alerts[a.key] || 0) > 0);

  const content = stats?.content || {};
  const contentItems = [
    { label: t('stats_grammar_rules'), value: content.grammar, icon: RiBrainLine, to: '/admin/content/grammar', tone: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: t('stats_vocab_items'), value: content.vocabulary, icon: RiBookLine, to: '/admin/content/vocabulary', tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { label: t('stats_phrases'), value: content.phrasebook, icon: RiLightbulbLine, to: '/admin/content/phrasebook', tone: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { label: t('stats_quiz_questions'), value: content.tests, icon: RiQuestionLine, to: '/admin/content/quizzes', tone: 'bg-purple-50 text-purple-600 border-purple-100' },
    { label: t('stats_forum_messages'), value: content.forum_messages, icon: RiChat3Line, to: '/teacher/forum', tone: 'bg-emerald-50 text-emerald-600 border-emerald-100', noNav: true },
  ];

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6">
        {/* ── Header ── */}
        <PageHeader
          tone="hero-purple"
          badge={t('nav.admin_portal')}
          badgeIcon={RiShieldCheckLine}
          badgeTone="purple"
          title={t('admin.overview.title')}
          subtitle={t('admin.overview.subtitle')}
          actions={
            <>
              <button onClick={load} className="btn-icon bg-white border-slate-200" title={t('ui_refresh')}><RiRefreshLine className={loading ? 'animate-spin' : ''} /></button>
              <button onClick={() => navigate('/admin/groups')} className="btn-emerald"><RiHospitalLine /><span>{t('stats_manage_structure')}</span></button>
              <button onClick={() => navigate('/admin/users')} className="btn-primary"><RiTeamLine /><span>{t('stats_manage_users')}</span></button>
              <button onClick={() => navigate('/admin/content')} className="btn-secondary-soft"><RiBookOpenLine className="text-purple-600" /><span>{t('stats_manage_content')}</span></button>
            </>
          }
        />

        {/* ── KPI tiles ── */}
        {loading || !stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[104px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
            <StatTile label={t('admin.overview.total_students')} value={stats.students} sub={`+${stats.new_students_30d} · ${t('ui_last_30_days').toLowerCase()}`} icon={RiTeamLine} tone="blue" />
            <StatTile label={t('admin.overview.total_teachers')} value={stats.teachers} sub={`${stats.admins} ${t('role_admins_plural').toLowerCase()}`} icon={RiUserStarLine} tone="emerald" />
            <StatTile label={t('ui_groups')} value={stats.groups} sub={`${specialties.length} ${t('ui_specialty').toLowerCase()}`} icon={RiGroupLine} tone="indigo" />
            <StatTile label={t('admin.overview.total_modules')} value={stats.modules} icon={RiBookOpenLine} tone="amber" />
            <StatTile label={t('admin.overview.total_simulations')} value={stats.completed_conversations} sub={`${stats.sessions_7d} · ${t('ui_last_7_days').toLowerCase()}`} icon={RiMessage3Line} tone="cyan" />
            <StatTile label={t('stats_active_7d')} value={stats.active_students_7d} sub={`${stats.active_students_30d} · ${t('ui_last_30_days').toLowerCase()}`} icon={RiPulseLine} tone="teal" />
            <StatTile label={t('ui_pass_rate')} value={`${stats.pass_rate}%`} icon={RiCheckDoubleLine} tone="emerald" valueClass={scoreText(stats.pass_rate)} />
            <StatTile label={t('admin.overview.global_avg')} value={`${stats.avg_score}%`} icon={RiTrophyLine} tone="rose" valueClass={scoreText(stats.avg_score)} />
          </div>
        )}

        {/* ── Activity + Distribution + Alerts ── */}
        {!loading && stats && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
            <SectionCard icon={RiPulseLine} title={t('stats_activity')} desc={t('stats_activity_desc')} className="xl:col-span-6" bodyClass="p-5"
              right={<span className="badge-standard badge-slate">{t('ui_last_14_days')}</span>}>
              {stats.completed_conversations === 0 ? <EmptyState title={t('ui_no_data')} hint={t('ui_no_data_hint')} /> : (
                <BarChart data={stats.activity_timeline} valueKey="sessions" labelKey="date" formatLabel={fmtDay} height={150} />
              )}
            </SectionCard>

            <SectionCard icon={RiBarChartBoxLine} iconClass="text-indigo-600" title={t('stats_distribution')} desc={t('stats_distribution_desc')} className="xl:col-span-3" bodyClass="p-5">
              <DistributionBars data={stats.score_distribution} />
            </SectionCard>

            <SectionCard icon={RiAlertLine} iconClass="text-amber-600" title={t('stats_alerts')} desc={t('stats_alerts_desc')} className="xl:col-span-3">
              {alertItems.length === 0 ? (
                <EmptyState icon={RiCheckboxCircleLine} title={t('ui_all_good')} className="py-8" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {alertItems.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button key={a.key} onClick={() => navigate(a.to)} className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-amber-50/50 transition-colors group">
                        <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0"><Icon /></span>
                        <span className="text-xs font-bold text-slate-700 flex-1 min-w-0 truncate">{a.label}</span>
                        <span className="text-sm font-black text-amber-600 tabular">{alerts[a.key]}</span>
                        <RiArrowRightLine className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ── Competencies + Content ── */}
        {!loading && stats && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
            <SectionCard icon={RiBrainLine} iconClass="text-indigo-600" title={t('stats_competencies')} desc={t('stats_competencies_desc')} className="xl:col-span-8" bodyClass="p-5">
              <CompetencyBars comps={stats.competencies} labels={COMP_LABELS} />
            </SectionCard>
            <SectionCard icon={RiDatabase2Line} iconClass="text-purple-600" title={t('stats_content')} desc={t('stats_content_desc')} className="xl:col-span-4">
              <div className="divide-y divide-slate-100">
                {contentItems.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button key={c.label} onClick={() => !c.noNav && navigate(c.to)} className={`w-full text-left px-5 py-2.5 flex items-center gap-3 transition-colors ${c.noNav ? 'cursor-default' : 'hover:bg-slate-50'}`}>
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${c.tone}`}><Icon /></span>
                      <span className="text-xs font-bold text-slate-700 flex-1">{c.label}</span>
                      <span className="text-sm font-black text-slate-900 tabular">{c.value ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Specialties ── */}
        {!loading && stats && (
          <SectionCard icon={RiHospitalLine} title={t('stats_specialties')} desc={t('stats_specialties_desc')}
            right={<button onClick={() => navigate('/admin/groups')} className="btn-secondary-soft text-xs py-1.5 px-3"><RiHospitalLine className="text-emerald-600" /> {t('admin_add_specialty')}</button>}>
            <div className="p-5 space-y-5">
              {/* Specialty cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                {specialties.map((s) => {
                  const active = selSpec === s.id;
                  return (
                    <button key={s.id} onClick={() => setSelSpec(active ? 'all' : s.id)}
                      className={`text-left rounded-2xl border p-4 transition-all ${active ? 'border-purple-400 bg-purple-50/60 ring-2 ring-purple-500/10 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xl leading-none">{specEmoji(s)}</p>
                          <p className="text-sm font-extrabold text-slate-900 mt-2 truncate">{getLocalized(s, 'name') || s.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.total_groups} {t('ui_group_short')} · {s.total_teachers} {t('ui_teacher').toLowerCase()} · {s.total_modules} {t('ui_module_short')}</p>
                        </div>
                        <RadialScore value={s.avg_score} size={50} stroke={5} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500">{s.total_students} {t('ui_student')}</span>
                        <span className="text-slate-500">{s.active_students} {t('ui_active').toLowerCase()}</span>
                        <span className="text-slate-900 tabular">{s.total_conversations} {t('ui_session_short')}</span>
                      </div>
                      <Progress value={s.total_students ? Math.round((s.active_students / s.total_students) * 100) : 0} tone="bg-purple-500" height="h-1.5" className="mt-2" />
                    </button>
                  );
                })}
              </div>

              {/* Selected specialty details */}
              {selected && (
                <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-4 sm:p-5 space-y-4 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">{specEmoji(selected)} {getLocalized(selected, 'name') || selected.name}</p>
                    <button onClick={() => setSelSpec('all')} className="text-xs font-bold text-purple-700 hover:underline">{t('ui_all')}</button>
                  </div>
                  <CompetencyBars comps={selected.competencies} labels={COMP_LABELS} />
                </div>
              )}

              {/* Groups table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-2"><RiMedalLine className="text-amber-500" /> {t('stats_groups_ranking')}</p>
                  <span className="text-[11px] font-bold text-slate-400">{t('stats_groups_ranking_desc')}</span>
                </div>
                {groupsToShow.length === 0 ? <EmptyState icon={RiGroupLine} title={t('groups_not_found')} className="py-8" /> : (
                  <div className="overflow-x-auto">
                    <table className="table-premium min-w-[640px]">
                      <thead>
                        <tr>
                          <th className="w-12">#</th>
                          <th>{t('ui_group')}</th>
                          <th>{t('ui_specialty')}</th>
                          <th>{t('ui_teacher')}</th>
                          <th className="text-center">{t('ui_students')}</th>
                          <th className="text-center">{t('ui_sessions')}</th>
                          <th className="text-right">{t('ui_average')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupsToShow.map((g, i) => (
                          <tr key={g.id} className="cursor-pointer" onClick={() => navigate('/admin/groups')}>
                            <td><span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-[11px] font-black ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>{i + 1}</span></td>
                            <td className="font-extrabold text-slate-900">{g.name}</td>
                            <td className="text-slate-500 font-medium">{specNameById(g.specialty_id ?? selected?.id, g.specialty_name || '—')}</td>
                            <td className="text-slate-500 font-medium truncate max-w-[180px]">{(g.teachers || []).map((x) => x.full_name).join(', ') || <span className="text-amber-600">—</span>}</td>
                            <td className="text-center font-bold text-slate-700 tabular">{g.student_count}{g.active_students !== undefined && <span className="text-slate-400 font-medium"> / {g.active_students}</span>}</td>
                            <td className="text-center font-bold text-slate-700 tabular">{g.completed_conversations}</td>
                            <td className="text-right"><ScoreBadge value={g.avg_score} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Modules + Top students + Recent ── */}
        {!loading && stats && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
            <SectionCard icon={RiBookOpenLine} iconClass="text-amber-600" title={t('stats_modules')} desc={t('stats_modules_desc')} className="xl:col-span-6"
              right={
                <select value={moduleSort} onChange={(e) => setModuleSort(e.target.value)} className="input-standard text-xs py-1.5 w-auto">
                  <option value="attempts">{t('ui_attempts')}</option>
                  <option value="avg">{t('ui_average')} ↑</option>
                  <option value="pass">{t('ui_pass_rate')} ↑</option>
                </select>
              }>
              {moduleStats.length === 0 ? <EmptyState title={t('ui_no_data')} hint={t('ui_no_data_hint')} /> : (
                <div className="overflow-x-auto">
                  <table className="table-premium min-w-[560px]">
                    <thead><tr><th>{t('ui_modules')}</th><th className="text-center">{t('ui_attempts')}</th><th className="text-center">{t('ui_students')}</th><th className="text-center">{t('ui_pass_rate')}</th><th className="text-right">{t('ui_average')}</th></tr></thead>
                    <tbody>
                      {moduleStats.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <p className="font-bold text-slate-900 truncate max-w-[260px]">#{m.order_index} {getLocalized(m, 'title') || m.title}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{specNameById(specialties.find((x) => x.code === m.specialty_code)?.id, m.specialty_name)}</p>
                          </td>
                          <td className="text-center font-bold tabular">{m.attempts}</td>
                          <td className="text-center font-bold tabular">{m.students}</td>
                          <td className="text-center">
                            <div className="flex items-center gap-2 justify-center"><Progress value={m.pass_rate} className="w-16" height="h-1.5" /><span className="text-[11px] font-bold tabular">{m.pass_rate}%</span></div>
                          </td>
                          <td className="text-right"><ScoreBadge value={m.avg_score} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard icon={RiMedalLine} iconClass="text-amber-500" title={t('stats_top_students')} desc={t('stats_top_students_desc')} className="xl:col-span-3">
              {(stats.top_students || []).length === 0 ? <EmptyState title={t('ui_no_data')} /> : (
                <div className="divide-y divide-slate-100">
                  {stats.top_students.map((s, i) => (
                    <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-400 w-4 tabular">{i + 1}</span>
                      <Avatar name={s.full_name} seed={s.id} size="w-8 h-8 text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{s.full_name}</p>
                        <p className="text-[10.5px] text-slate-400 font-medium truncate">{s.group_name} · {s.completed_conversations} {t('ui_session_short')}</p>
                      </div>
                      <ScoreBadge value={s.avg_score} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={RiTimeLine} iconClass="text-cyan-600" title={t('stats_recent_activity')} desc={t('stats_recent_activity_desc')} className="xl:col-span-3">
              {(stats.recent_activity || []).length === 0 ? <EmptyState title={t('ui_no_data')} /> : (
                <div className="divide-y divide-slate-100">
                  {stats.recent_activity.map((a) => (
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
      </div>
    </Layout>
  );
}
