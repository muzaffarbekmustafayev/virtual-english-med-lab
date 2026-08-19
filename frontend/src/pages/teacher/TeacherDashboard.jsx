import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiGroupLine, RiArrowRightLine, RiUser3Line, RiTrophyLine,
  RiBarChartLine, RiUserStarLine, RiArrowDownSLine, RiArrowRightSLine,
  RiCalendarLine, RiSearchLine, RiFilter3Line, RiAwardLine,
  RiBrainLine, RiBookOpenLine, RiSpeakLine, RiSparkling2Line,
  RiCheckboxCircleLine
} from 'react-icons/ri';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState(null);

  // Student filtering and search state
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [sortBy, setSortBy] = useState('score-desc');

  useEffect(() => {
    api.get('/teacher/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allStudents = data?.all_students || [];

  // Filter and sort students
  const filteredStudents = allStudents.filter(s => {
    const matchesSearch = search.trim() === '' ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || s.group_id === parseInt(selectedGroup);
    return matchesSearch && matchesGroup;
  }).sort((a, b) => {
    if (sortBy === 'score-desc') return b.average_score - a.average_score;
    if (sortBy === 'score-asc') return a.average_score - b.average_score;
    if (sortBy === 'progress-desc') return b.progress_percent - a.progress_percent;
    if (sortBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    return 0;
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ── 1. Page Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-standard badge-emerald">
                <RiUserStarLine className="text-xs" /> {t('nav.teacher_portal') || "O'qituvchi Boshqaruv Portali"}
              </span>
              <span className="text-xs font-bold text-slate-400">· Medical English Lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('teacher.dashboard.title') || "O'qituvchi Paneli & Guruhlar Tahlili"}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
              {t('teacher.dashboard.subtitle') || "Barcha biriktirilgan talabalar, ularning klinik muloqot ballari, o'zlashtirish foizi va faollik ko'rsatkichlari."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/reports')}
              className="btn-primary text-xs font-extrabold py-3 px-5 shadow-md hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
            >
              <RiBarChartLine className="text-base" />
              <span>Batafsil Hisobotlar</span>
              <RiArrowRightLine className="text-base" />
            </button>
          </div>
        </div>

        {/* ── 2. KPI Stat Cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('teacher.dashboard.assigned_groups') || "Biriktirilgan Guruhlar", value: data?.total_groups ?? 0, icon: RiGroupLine, badge: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
              { label: t('teacher.dashboard.total_students') || "Jami O'quvchilar", value: data?.total_students ?? 0, icon: RiUser3Line, badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              { label: t('teacher.dashboard.group_avg_score') || "O'rtacha Natija Foizi", value: `${data?.average_score || 0}%`, icon: RiTrophyLine, badge: 'bg-amber-50 text-amber-600 border-amber-200' },
              { label: t('teacher.dashboard.completed_sessions') || "Yakunlangan Sessiyalar", value: data?.recent_conversations ?? 0, icon: RiBarChartLine, badge: 'bg-blue-50 text-blue-600 border-blue-200' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card-standard p-5 flex flex-col justify-between hover:border-slate-300 transition-all bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{s.label}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.badge}`}>
                      <Icon className="text-lg" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 3. ALL STUDENTS COMPREHENSIVE PERFORMANCE TABLE ── */}
        {!loading && (
          <div className="card-standard overflow-hidden bg-white border border-slate-200/90 shadow-sm space-y-0">
            {/* Header & Filter Controls */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <RiUser3Line className="text-emerald-600 text-lg" />
                  <span>Barcha O'quvchilar va Ularning Natijalari</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Har bir o'quvchining o'zlashtirish foizi va o'rtacha balli
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Ism yoki email bo'yicha qidiruv..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-standard pl-9 text-xs"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>

                {/* Group Selector */}
                {data?.groups?.length > 0 && (
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="input-standard text-xs w-auto cursor-pointer"
                  >
                    <option value="all">Barcha Guruhlar</option>
                    {data.groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-standard text-xs w-auto cursor-pointer"
                >
                  <option value="score-desc">Ball: Eng yuqori</option>
                  <option value="score-asc">Ball: Eng past</option>
                  <option value="progress-desc">Progress: Eng yuqori</option>
                  <option value="name-asc">Ism (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Students List */}
            {filteredStudents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const sc = s.average_score || 0;
                  const scBadge = sc >= 80 ? "badge-emerald" : sc >= 60 ? "badge-blue" : sc > 0 ? "badge-amber" : "badge-slate";

                  return (
                    <div
                      key={s.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Left: Avatar, Name, Email & Group */}
                      <div className="flex items-center gap-3.5 min-w-[260px]">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {s.full_name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 truncate">
                              {s.full_name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">{s.email}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
                              {s.group_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Progress Bar & Modullar Foizi */}
                      <div className="flex-1 max-w-xs space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Kurs O'zlashtirish
                          </span>
                          <span className="font-black text-slate-900 text-xs">
                            {s.completed_modules} / {s.total_modules} ({s.progress_percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${s.progress_percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Right: 5-Competency Pills & Average Score & Action */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 shrink-0">
                        {/* 5 Competencies Mini Badges */}
                        <div className="hidden xl:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-[10px] font-bold text-slate-600">
                          <span title="Grammatika">🧠 {s.competencies?.grammar || sc}%</span>
                          <span className="text-slate-300">·</span>
                          <span title="Lug'at">📖 {s.competencies?.vocabulary || sc}%</span>
                          <span className="text-slate-300">·</span>
                          <span title="Ravonlik">🗣️ {s.competencies?.fluency || sc}%</span>
                          <span className="text-slate-300">·</span>
                          <span title="Anamnez">🩺 {s.competencies?.clinical || sc}%</span>
                        </div>

                        {/* Average Score Badge */}
                        <div className="text-right">
                          <span className={`badge-standard ${scBadge} text-xs font-black px-3.5 py-1.5 shadow-2xs`}>
                            <RiSparkling2Line className="text-xs" />
                            <span>O'rtacha: {sc}%</span>
                          </span>
                        </div>

                        {/* View Student Report Button */}
                        <button
                          onClick={() => navigate(`/teacher/reports?search=${encodeURIComponent(s.full_name)}`)}
                          className="btn-secondary-soft text-xs py-2 px-3 hover:border-emerald-300 hover:text-emerald-700 transition-all font-bold flex items-center gap-1"
                        >
                          <span>Hisobot</span>
                          <RiArrowRightLine className="text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <RiUser3Line className="text-4xl mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">O'quvchilar topilmadi</p>
                <p className="text-xs text-slate-400 mt-1">Qidiruv yoki guruh filtrini o'zgartirib ko'ring.</p>
              </div>
            )}
          </div>
        )}

        {/* ── 4. Groups Accordion ── */}
        {!loading && data?.groups?.length > 0 && (
          <div className="card-standard overflow-hidden bg-white border border-slate-200/90 shadow-2xs">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <RiGroupLine className="text-emerald-600 text-base" />
                <span>Guruhlar Kesimida Ko'rish</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">{data.groups.length} ta guruh</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {data.groups.map(g => (
                <div key={g.id} className="flex flex-col">
                  {/* Accordion Header */}
                  <button
                    onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)}
                    className={`w-full flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50 transition-colors cursor-pointer ${openGroup === g.id ? 'bg-slate-50/80' : 'bg-white'}`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${openGroup === g.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                        {openGroup === g.id ? <RiArrowDownSLine className="text-lg" /> : <RiArrowRightSLine className="text-lg" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{g.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{g.student_count} ta o'quvchi</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`badge-standard ${g.average_score >= 80 ? 'badge-emerald' : g.average_score >= 60 ? 'badge-blue' : 'badge-amber'} font-black text-xs`}>
                        O'rtacha: {g.average_score}%
                      </span>
                    </div>
                  </button>

                  {/* Accordion Body */}
                  {openGroup === g.id && (
                    <div className="bg-slate-50/50 p-4 sm:px-6 border-t border-slate-100">
                      {g.students && g.students.length > 0 ? (
                        <div className="grid gap-2.5">
                          {g.students.map(s => (
                            <div key={s.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                                  {s.full_name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-black text-slate-900">{s.full_name}</h4>
                                  <p className="text-[11px] font-medium text-slate-400">{s.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">
                                  {s.completed_modules || 0} modul ({s.progress_percent || 0}%)
                                </span>
                                <span className={`badge-standard ${s.average_score >= 80 ? 'badge-emerald' : s.average_score >= 60 ? 'badge-blue' : 'badge-rose'} font-black text-xs`}>
                                  {s.average_score}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-3 font-medium">Bu guruhda o'quvchilar yo'q.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
