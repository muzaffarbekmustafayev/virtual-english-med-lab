import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiBarChartGroupedLine, RiFileExcel2Line, RiFilter3Line,
  RiSearchLine, RiBookOpenLine, RiGroupLine
} from 'react-icons/ri';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [reportsData, setReportsData] = useState({
    groups: [],
    modules: [],
    summary: {
      total_students: 0,
      average_overall: 0,
      average_grammar: 0,
      average_vocab: 0,
      average_clinical: 0,
    },
    reports: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedGroup !== 'all') params.group_id = selectedGroup;
      if (selectedModule !== 'all') params.module_id = selectedModule;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/teacher/reports', { params });
      setReportsData(res.data || {
        groups: [],
        modules: [],
        summary: { total_students: 0, average_overall: 0, average_grammar: 0, average_vocab: 0, average_clinical: 0 },
        reports: [],
      });
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedGroup, selectedModule]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  // Export to Excel CSV format with UTF-8 BOM
  const exportToExcel = () => {
    const headers = [
      'ID',
      t('teacher.groups.student_name'),
      t('auth.email'),
      t('auth.group'),
      t('teacher.reports.students_table'),
      'Test Score (%)',
      'Grammar (%)',
      'Vocabulary (%)',
      'Fluency (%)',
      'Pronunciation (%)',
      'Clinical (%)',
      'Overall Score (%)'
    ];

    const rows = reportsData.reports.map((r) => [
      r.student_id,
      `"${r.full_name}"`,
      `"${r.email}"`,
      `"${r.group_name}"`,
      r.completed_sessions,
      r.quiz_score,
      r.grammar_score,
      r.vocab_score,
      r.fluency_score,
      r.pron_score,
      r.clinical_score,
      r.overall_score
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Virtual_Patient_Reports_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-emerald">
                <RiBarChartGroupedLine /> Klinik Analitika
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                <RiBarChartGroupedLine />
              </span>
              {t('teacher.reports.title')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('teacher.reports.subtitle')}</p>
          </div>

          <button
            onClick={exportToExcel}
            className="btn-primary-gradient bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            <RiFileExcel2Line className="text-base" />
            <span>{t('teacher.reports.export_btn')} (CSV)</span>
          </button>
        </div>

        {/* ── 2. Summary KPI Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="card-standard p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('teacher.dashboard.total_students')}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{reportsData.summary?.total_students || 0}</p>
          </div>
          <div className="card-standard p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('student.detail.total_score')}</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{reportsData.summary?.average_overall || 0}%</p>
          </div>
          <div className="card-standard p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('student.detail.metrics.grammar')}</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{reportsData.summary?.average_grammar || 0}%</p>
          </div>
          <div className="card-standard p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('student.detail.metrics.vocabulary')}</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{reportsData.summary?.average_vocab || 0}%</p>
          </div>
          <div className="card-standard p-4 col-span-2 md:col-span-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('student.detail.metrics.clinical')}</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{reportsData.summary?.average_clinical || 0}%</p>
          </div>
        </div>

        {/* ── 3. Filters ── */}
        <div className="card-standard p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <RiFilter3Line className="text-slate-400 text-sm" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-standard py-2 text-xs font-bold"
            >
              <option value="all">{t('teacher.reports.filter_group')}: {t('common.all')}</option>
              {reportsData.groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="input-standard py-2 text-xs font-bold"
            >
              <option value="all">{t('teacher.reports.filter_module')}: {t('teacher.reports.all_modules')}</option>
              {reportsData.modules.map((m) => (
                <option key={m.id} value={m.id}>#{m.order_index} {m.title}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-standard pl-9 py-2 text-xs"
            />
          </form>
        </div>

        {/* ── 4. Reports Table ── */}
        <div className="card-standard overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{t('teacher.reports.students_table')}</h3>
            <span className="badge-standard badge-slate">{reportsData.reports.length} ta natija</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reportsData.reports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Hisobotlar topilmadi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">{t('teacher.groups.student_name')}</th>
                    <th className="px-5 py-3">{t('auth.group')}</th>
                    <th className="px-5 py-3 text-center">{t('student.detail.steps.quiz')}</th>
                    <th className="px-5 py-3 text-center">{t('student.detail.metrics.grammar')}</th>
                    <th className="px-5 py-3 text-center">{t('student.detail.metrics.vocabulary')}</th>
                    <th className="px-5 py-3 text-center">{t('student.detail.metrics.clinical')}</th>
                    <th className="px-5 py-3 text-right">{t('student.detail.total_score')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {reportsData.reports.map((r) => (
                    <tr key={r.student_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">#{r.student_id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{r.full_name}</p>
                        <p className="text-[11px] text-slate-400">{r.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="badge-standard badge-slate">
                          {r.group_name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{r.quiz_score}%</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{r.grammar_score}%</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{r.vocab_score}%</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{r.clinical_score}%</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`badge-standard ${
                          r.overall_score >= 80
                            ? 'badge-emerald'
                            : r.overall_score >= 60
                            ? 'badge-amber'
                            : 'badge-rose'
                        }`}>
                          {r.overall_score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
