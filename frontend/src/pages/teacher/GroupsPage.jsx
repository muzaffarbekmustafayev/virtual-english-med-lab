import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader, SectionCard, EmptyState, Skeleton, Avatar, ScoreBadge, RadialScore, useRelativeTime } from '../../components/ui';
import { RiGroupLine, RiArrowRightLine, RiUser3Line, RiBarChartLine, RiMessage3Line } from 'react-icons/ri';

const SPECIALTY_EMOJI = { STOM: '🦷', GEN_MED: '🩺', PED: '👶', NURSING: '💉', FIRST_AID: '🚑' };

export default function GroupsPage() {
  const navigate = useNavigate();
  const { t, getLocalized } = useLanguage();
  const rel = useRelativeTime();
  const [groups, setGroups]           = useState([]);
  const [selectedGroup, setSelected]  = useState(null);
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [studLoading, setStudLoading] = useState(false);

  useEffect(() => {
    api.get('/teacher/groups')
      .then((r) => {
        setGroups(r.data || []);
        if (r.data?.length > 0) loadStudents(r.data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadStudents = async (group) => {
    setSelected(group);
    setStudLoading(true);
    try {
      const res = await api.get(`/teacher/groups/${group.id}/students`);
      setStudents(res.data || []);
    } catch {
      setStudents([]);
    } finally {
      setStudLoading(false);
    }
  };

  const specName = (g) => (g.specialty ? (getLocalized(g.specialty, 'name') || g.specialty.name) : g.specialty_name) || '—';
  const specIcon = (g) => g.specialty?.icon || SPECIALTY_EMOJI[g.specialty?.code] || '🎓';

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          tone="hero-emerald"
          badge={`${groups.length} ${t('ui_group_short')}`}
          badgeIcon={RiGroupLine}
          badgeTone="emerald"
          title={t('teacher.groups.title')}
          subtitle={t('teacher.groups.subtitle')}
          actions={<button onClick={() => navigate('/teacher/dashboard')} className="btn-secondary-soft"><RiBarChartLine className="text-emerald-600" /> {t('nav_dashboard')}</button>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Groups list */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider px-1">{t('teacher.groups.select_group')}</p>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
            ) : groups.length === 0 ? (
              <div className="card-standard"><EmptyState icon={RiGroupLine} title={t('stats_no_groups_teacher')} hint={t('stats_no_groups_teacher_hint')} /></div>
            ) : (
              <div className="space-y-2.5">
                {groups.map((g) => {
                  const isSel = selectedGroup?.id === g.id;
                  return (
                    <button key={g.id} onClick={() => loadStudents(g)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${isSel ? 'border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-500/10 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-slate-900 truncate">{specIcon(g)} {g.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{specName(g)}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1"><RiUser3Line className="text-slate-400" /> {g.student_count || 0}</span>
                            <span className="inline-flex items-center gap-1"><RiMessage3Line className="text-slate-400" /> {g.completed_sessions || 0}</span>
                          </p>
                        </div>
                        <RadialScore value={g.average_score || 0} size={52} stroke={5} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Students table */}
          <div className="lg:col-span-8">
            {!selectedGroup ? (
              <div className="card-standard"><EmptyState icon={RiGroupLine} title={t('teacher.groups.select_group')} /></div>
            ) : (
              <SectionCard icon={RiGroupLine} iconClass="text-emerald-600" title={selectedGroup.name} desc={`${specName(selectedGroup)} · ${t('teacher_students_list')}`}
                right={
                  <div className="flex items-center gap-2">
                    <span className="badge-standard badge-emerald">{students.length} {t('groups_total_students')}</span>
                    <button onClick={() => navigate(`/teacher/reports?group_id=${selectedGroup.id}`)} className="btn-secondary-soft text-xs py-1.5 px-3"><RiBarChartLine className="text-emerald-600" /> {t('stats_view_group_report')}</button>
                  </div>
                }>
                {studLoading ? (
                  <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : students.length === 0 ? (
                  <EmptyState icon={RiUser3Line} title={t('groups_no_students')} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-premium min-w-[560px]">
                      <thead>
                        <tr>
                          <th>{t('teacher.groups.student_name')}</th>
                          <th className="text-center">{t('teacher.groups.average_score')}</th>
                          <th>{t('teacher.groups.last_active')}</th>
                          <th className="text-right">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <Avatar name={s.full_name} seed={s.id} size="w-9 h-9 text-xs" />
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-900 truncate">{s.full_name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium truncate">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-center"><ScoreBadge value={s.average_score || 0} /></td>
                            <td>
                              <p className="text-xs font-bold text-slate-700 truncate max-w-[220px]">{s.last_module || '—'}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{rel(s.last_activity)}</p>
                            </td>
                            <td className="text-right">
                              <button onClick={() => navigate(`/teacher/reports?search=${encodeURIComponent(s.full_name)}&group_id=${selectedGroup.id}`)}
                                className="btn-secondary-soft text-xs py-1.5 px-3 hover:border-emerald-300 hover:text-emerald-700" title={t('teacher.groups.view_student_details')}>
                                {t('ui_report')} <RiArrowRightLine />
                              </button>
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
        </div>
      </div>
    </Layout>
  );
}
