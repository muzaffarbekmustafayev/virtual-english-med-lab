import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader, StatTile, SectionCard, EmptyState, Skeleton, Avatar, ScoreBadge, useRelativeTime, scoreText } from '../../components/ui';
import {
  RiBarChartGroupedLine, RiFileExcel2Line, RiFilter3Line, RiSearchLine,
  RiGroupLine, RiUser3Line, RiTrophyLine, RiBrainLine, RiBookOpenLine, RiStethoscopeLine, RiCloseLine
} from 'react-icons/ri';

const EMPTY = { groups: [], modules: [], summary: { total_students: 0, average_overall: 0, average_grammar: 0, average_vocab: 0, average_clinical: 0 }, reports: [] };

export default function ReportsPage() {
  const { t, getLocalized } = useLanguage();
  const rel = useRelativeTime();
  const [params, setParams] = useSearchParams();
  const [reportsData, setReportsData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const selectedGroup = params.get('group_id') || 'all';
  const selectedModule = params.get('module_id') || 'all';
  const searchQuery = params.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  };

  useEffect(() => { setSearchInput(searchQuery); }, [searchQuery]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const q = {};
    if (selectedGroup !== 'all') q.group_id = selectedGroup;
    if (selectedModule !== 'all') q.module_id = selectedModule;
    if (searchQuery) q.search = searchQuery;
    api.get('/teacher/reports', { params: q })
      .then((res) => { if (alive) setReportsData(res.data || EMPTY); })
      .catch(() => { if (alive) setReportsData(EMPTY); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedGroup, selectedModule, searchQuery]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setParam('search', searchInput.trim()); };
  const hasFilter = selectedGroup !== 'all' || selectedModule !== 'all' || !!searchQuery;
  const clearFilters = () => { setParams({}, { replace: true }); setSearchInput(''); };

  // Excel (CSV, UTF-8 BOM)
  const exportToExcel = () => {
    const headers = ['ID', t('teacher.groups.student_name'), t('auth.email'), t('auth.group'), t('ui_sessions'), 'Quiz (%)', 'Grammar (%)', 'Vocabulary (%)', 'Fluency (%)', 'Pronunciation (%)', 'Clinical (%)', 'Overall (%)'];
    const rows = reportsData.reports.map((r) => [r.student_id, `"${r.full_name}"`, `"${r.email}"`, `"${r.group_name}"`, r.completed_sessions, r.quiz_score, r.grammar_score, r.vocab_score, r.fluency_score, r.pron_score, r.clinical_score, r.overall_score]);
    const csv = '﻿' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Virtual_Patient_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const s = reportsData.summary || EMPTY.summary;
  const groupName = reportsData.groups.find((g) => String(g.id) === String(selectedGroup))?.name;
  const moduleObj = reportsData.modules.find((m) => String(m.id) === String(selectedModule));

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          tone="hero-emerald"
          badge={t('reports_badge')}
          badgeIcon={RiBarChartGroupedLine}
          badgeTone="emerald"
          title={t('teacher.reports.title')}
          subtitle={t('teacher.reports.subtitle')}
          actions={
            <button onClick={exportToExcel} disabled={!reportsData.reports.length} className="btn-emerald">
              <RiFileExcel2Line className="text-base" /><span>{t('teacher.reports.export_btn')} (CSV)</span>
            </button>
          }
        />

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-[96px]" />) : (
            <>
              <StatTile label={t('teacher.dashboard.total_students')} value={s.total_students || 0} icon={RiUser3Line} tone="blue" />
              <StatTile label={t('student.detail.total_score')} value={`${s.average_overall || 0}%`} icon={RiTrophyLine} tone="amber" valueClass={scoreText(s.average_overall || 0)} />
              <StatTile label={t('student.detail.metrics.grammar')} value={`${s.average_grammar || 0}%`} icon={RiBrainLine} tone="indigo" />
              <StatTile label={t('student.detail.metrics.vocabulary')} value={`${s.average_vocab || 0}%`} icon={RiBookOpenLine} tone="cyan" />
              <StatTile label={t('student.detail.metrics.clinical')} value={`${s.average_clinical || 0}%`} icon={RiStethoscopeLine} tone="emerald" />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="card-standard p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 shrink-0"><RiFilter3Line /><span className="text-[11px] font-extrabold uppercase tracking-wider">{t('teacher.reports.filter_group')}</span></div>
          <select value={selectedGroup} onChange={(e) => setParam('group_id', e.target.value)} className="input-standard py-2 text-xs font-bold md:w-56">
            <option value="all">{t('teacher_all_groups')}</option>
            {reportsData.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={selectedModule} onChange={(e) => setParam('module_id', e.target.value)} className="input-standard py-2 text-xs font-bold md:flex-1">
            <option value="all">{t('teacher.reports.filter_module')}: {t('teacher.reports.all_modules')}</option>
            {reportsData.modules.map((m) => <option key={m.id} value={m.id}>#{m.order_index} {getLocalized(m, 'title') || m.title}</option>)}
          </select>
          <form onSubmit={handleSearchSubmit} className="relative md:w-64">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input type="text" placeholder={t('ui_search')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="input-standard has-icon-left py-2 text-xs" />
          </form>
          {hasFilter && (
            <button onClick={clearFilters} className="btn-secondary-soft text-xs py-2 px-3 shrink-0"><RiCloseLine /> {t('reports_clear_filter')}</button>
          )}
        </div>

        {/* Table */}
        <SectionCard icon={RiBarChartGroupedLine} iconClass="text-emerald-600" title={t('teacher.reports.students_table')}
          desc={hasFilter ? `${t('reports_showing_for')}: ${[groupName, moduleObj ? `#${moduleObj.order_index} ${getLocalized(moduleObj, 'title') || moduleObj.title}` : null, searchQuery ? `"${searchQuery}"` : null].filter(Boolean).join(' · ')}` : undefined}
          right={<span className="badge-standard badge-slate">{reportsData.reports.length} {t('reports_results_count')}</span>}>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : reportsData.reports.length === 0 ? (
            <EmptyState icon={RiGroupLine} title={t('reports_no_results')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium min-w-[900px]">
                <thead>
                  <tr>
                    <th>{t('teacher.groups.student_name')}</th>
                    <th>{t('auth.group')}</th>
                    <th className="text-center">{t('ui_sessions')}</th>
                    <th className="text-center">{t('student.detail.steps.quiz')}</th>
                    <th className="text-center">{t('student.detail.metrics.grammar')}</th>
                    <th className="text-center">{t('student.detail.metrics.vocabulary')}</th>
                    <th className="text-center">{t('comp_fluency')}</th>
                    <th className="text-center">{t('comp_pronunciation')}</th>
                    <th className="text-center">{t('student.detail.metrics.clinical')}</th>
                    <th>{t('ui_last_activity')}</th>
                    <th className="text-right">{t('student.detail.total_score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.reports.map((r) => (
                    <tr key={r.student_id}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <Avatar name={r.full_name} seed={r.student_id} size="w-9 h-9 text-xs" />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{r.full_name}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge-standard badge-slate">{r.group_name || '—'}</span></td>
                      <td className="text-center font-bold tabular">{r.completed_sessions}</td>
                      <td className="text-center font-bold tabular text-slate-700">{r.quiz_score}%</td>
                      <td className="text-center font-bold tabular text-slate-700">{r.grammar_score}%</td>
                      <td className="text-center font-bold tabular text-slate-700">{r.vocab_score}%</td>
                      <td className="text-center font-bold tabular text-slate-700">{r.fluency_score}%</td>
                      <td className="text-center font-bold tabular text-slate-700">{r.pron_score}%</td>
                      <td className="text-center font-bold tabular text-slate-700">{r.clinical_score}%</td>
                      <td className="text-slate-500 font-medium whitespace-nowrap">{rel(r.completed_sessions ? r.last_activity : null)}</td>
                      <td className="text-right"><ScoreBadge value={r.overall_score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </Layout>
  );
}
