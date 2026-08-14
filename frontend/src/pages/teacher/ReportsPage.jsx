import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  RiBarChartGroupedLine,
  RiFileExcel2Line,
  RiPrinterLine,
  RiFilter3Line,
  RiSearchLine,
  RiUser3Line,
  RiAwardLine,
  RiGroupLine,
  RiCheckDoubleLine
} from 'react-icons/ri';

export default function ReportsPage() {
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
      setReportsData(res.data);
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

  // 1. Export Excel (CSV format with BOM)
  const exportToExcel = () => {
    const headers = [
      'ID',
      'Ism-Familiya',
      'Email',
      'Guruh',
      'Bajarilgan Darslar',
      'Test Bali (%)',
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
      `Virtual_Patient_English_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export PDF / Print Mode
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiBarChartGroupedLine className="text-emerald-500" /> Natijalar va Hisobotlar
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Guruhlar va talabalarning klinik ingliz tili o'zlashtirish ko'rsatkichlari tahlili
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <RiFileExcel2Line className="text-lg" /> Excel (.xlsx) Yuklash
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <RiPrinterLine className="text-lg" /> PDF / Chop etish
          </button>
        </div>
      </div>

      {/* Official Print Header (Only visible when printing) */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">VIRTUAL PATIENT ENGLISH — RASMIY HISOBOT</h1>
        <p className="text-sm text-gray-600">
          Klinik Muloqot va Tibbiy Ingliz Tili Ta'lim Platformasi | Sana: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm print:hidden">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <RiGroupLine /> Guruh
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Barcha guruhlar</option>
              {reportsData.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <RiFilter3Line /> O'quv Moduli
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Barcha modullar</option>
              {reportsData.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.order_index}. {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <RiSearchLine /> Qidiruv (Ism bo'yicha)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Talaba ismini kiriting..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 rounded-xl border border-emerald-200"
              >
                Qidirish
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              <RiUser3Line />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Jami Talabalar</p>
              <h3 className="text-xl font-bold text-gray-900">{reportsData.summary.total_students} ta</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <RiAwardLine />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">O'rtacha Ball (Overall)</p>
              <h3 className="text-xl font-bold text-emerald-600">{reportsData.summary.average_overall}%</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <RiCheckDoubleLine />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Grammar O'rtacha</p>
              <h3 className="text-xl font-bold text-purple-600">{reportsData.summary.average_grammar}%</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <RiBarChartGroupedLine />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Clinical Etika</p>
              <h3 className="text-xl font-bold text-amber-600">{reportsData.summary.average_clinical}%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Metrics Breakdown Visualizer */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Klinik Ko'nikmalar Bo'yicha Guruh Tahlili</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-700">Grammar (Grammatika)</span>
              <span className="text-purple-600 font-bold">{reportsData.summary.average_grammar}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${reportsData.summary.average_grammar}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-700">Vocabulary (Tibbiy Lug'at)</span>
              <span className="text-blue-600 font-bold">{reportsData.summary.average_vocab}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${reportsData.summary.average_vocab}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-700">Clinical Communication (Klinik Muloqot va Etika)</span>
              <span className="text-emerald-600 font-bold">{reportsData.summary.average_clinical}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${reportsData.summary.average_clinical}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 & 4. Interactive Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Talabalar Natijalari Metrikasi</h3>
          <span className="text-xs text-gray-500">Jami: {reportsData.reports.length} ta yozuv</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reportsData.reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Ma'lumot topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <th className="px-4 py-3">Talaba</th>
                  <th className="px-4 py-3">Guruh</th>
                  <th className="px-4 py-3 text-center">Darslar</th>
                  <th className="px-4 py-3 text-center">Quiz</th>
                  <th className="px-4 py-3 text-center">Grammar</th>
                  <th className="px-4 py-3 text-center">Vocab</th>
                  <th className="px-4 py-3 text-center">Fluency</th>
                  <th className="px-4 py-3 text-center">Clinical</th>
                  <th className="px-4 py-3 text-center">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsData.reports.map((r) => (
                  <tr key={r.student_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{r.full_name}</div>
                      <div className="text-xs text-gray-400">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{r.group_name}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">{r.completed_sessions}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-600">{r.quiz_score}%</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.grammar_score}%</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.vocab_score}%</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.fluency_score}%</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.clinical_score}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

      {/* Official Signature Footer for Printed Reports */}
      <div className="hidden print:flex justify-between items-end mt-16 text-xs text-gray-700">
        <div>
          <p className="font-semibold">O'qituvchi Imzosi: _____________________</p>
        </div>
        <div>
          <p className="font-semibold">Sana: ____ / ____ / ________ y.</p>
        </div>
      </div>
    </Layout>
  );
}
