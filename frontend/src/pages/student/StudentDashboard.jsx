import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import api from "../../lib/api";
import {
  RiBookOpenLine, RiTrophyLine, RiCheckboxCircleLine, RiBarChartLine,
  RiArrowRightLine, RiTimeLine, RiSparklingLine, RiStethoscopeLine,
  RiQuillPenLine, RiChatSmile2Line, RiFireLine, RiCompass3Line,
  RiPulseLine, RiAwardLine, RiShieldCheckLine, RiBrainLine,
  RiSpeakLine, RiVolumeUpLine, RiCheckLine, RiLockLine, RiSparkling2Line
} from "react-icons/ri";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, language, getLocalized } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard")
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
        </div>
      </Layout>
    );
  }

  const avgScore = data?.stats?.avg_score || data?.average_score || 0;
  const progressPct = data?.stats?.progress_pct || data?.progress_percent || 0;
  const completedCount = data?.stats?.completed_modules || data?.completed_modules || 0;
  const totalCount = data?.stats?.total_modules || data?.total_modules || 10;

  const statCards = [
    { label: t('student.dashboard.total_modules'),     value: totalCount,               icon: RiBookOpenLine,       color: "blue",    iconBg: "bg-blue-50 text-blue-600 border-blue-200" },
    { label: t('student.dashboard.completed_modules'), value: completedCount,           icon: RiCheckboxCircleLine, color: "emerald", iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { label: t('student.dashboard.avg_score'),         value: `${avgScore}%`,           icon: RiTrophyLine,         color: "amber",   iconBg: "bg-amber-50 text-amber-600 border-amber-200" },
    { label: t('student.dashboard.overall_progress'),  value: `${progressPct}%`,        icon: RiBarChartLine,      color: "purple",  iconBg: "bg-purple-50 text-purple-600 border-purple-200" },
  ];

  const comps = data?.competencies || {
    grammar: Math.min(100, Math.round(avgScore * 0.95)),
    vocabulary: Math.min(100, Math.round(avgScore * 1.02)),
    fluency: Math.min(100, Math.round(avgScore * 0.98)),
    pronunciation: Math.min(100, Math.round(avgScore * 0.94)),
    clinical: Math.min(100, Math.round(avgScore * 1.01)),
  };

  const moduleResults = data?.module_results || [];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ── 1. Hero Welcome & Diagnostic Banner ── */}
        <div className="card-standard p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border border-slate-200/90 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="badge-standard badge-blue">
                  <RiStethoscopeLine className="text-xs" />
                  {t('student.dashboard.badge')}
                </span>
                <span className="text-xs text-slate-600 font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80">
                  {user?.specialty?.name || "Stomatologiya"}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {t('student.dashboard.greeting', { name: user?.full_name?.split(' ')[0] || 'Talaba' })} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
                {t('student.dashboard.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/student/modules')}
                className="btn-primary text-xs font-extrabold py-3 px-6 shadow-md hover:shadow-lg transition-all"
              >
                <RiBookOpenLine className="text-base" />
                <span>{t('student.dashboard.view_modules_btn')}</span>
                <RiArrowRightLine className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Stat Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card-standard p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 line-clamp-1">
                    {c.label}
                  </span>
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg border shrink-0 ${c.iconBg}`}>
                    <Icon />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-4">
                  {c.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── 3. Course Progress Bar ── */}
        <div className="card-standard p-6 sm:p-7 bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {t('student.dashboard.progress_title')}
              </p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {completedCount} / {totalCount} {t('student.dashboard.modules_completed')}
              </p>
            </div>
            <span className="text-2xl font-black text-blue-600">
              {progressPct}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] font-bold text-slate-400">
            <span>{t('student.dashboard.progress_start')}</span>
            <span className="text-blue-600 font-extrabold">{t('student.dashboard.unlock_requirement')}</span>
            <span>{t('student.dashboard.progress_end')}</span>
          </div>
        </div>

        {/* ── 4. DETAILED PERSONAL RESULTS & COMPETENCY MATRIX ── */}
        <div className="space-y-6">
          {/* Competency Matrix */}
          <div className="card-standard p-6 sm:p-7 bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RiBarChartLine className="text-indigo-600 text-base" />
                  <span>Klinik Kompetensiyalar va Natijalar Matritsasi</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Barcha modullardagi urinishlar va simulyatsiyalar asosidagi shaxsiy reyting
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {[
                { name: 'Grammatika',       icon: RiBrainLine,       score: comps.grammar,       color: 'bg-indigo-600' },
                { name: 'Tibbiy Terminlar', icon: RiBookOpenLine,    score: comps.vocabulary,    color: 'bg-blue-600' },
                { name: 'Nutq Ravonligi',   icon: RiSpeakLine,       score: comps.fluency,       color: 'bg-emerald-600' },
                { name: 'Talaffuz/Fonetika',icon: RiVolumeUpLine,    score: comps.pronunciation, color: 'bg-cyan-600' },
                { name: 'Klinik Anamnez',   icon: RiStethoscopeLine, score: comps.clinical,      color: 'bg-amber-500' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-black text-slate-900">{item.score}%</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div className={`${item.color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module-by-Module Scores Table */}
          {moduleResults.length > 0 && (
            <div className="card-standard overflow-hidden bg-white border border-slate-200/90 shadow-2xs">
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <RiTrophyLine className="text-amber-500 text-base" />
                    <span>Modullar Bo'yicha Shaxsiy Natijalar</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Har bir klinik modul bo'yicha test va muloqot ballari
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">{moduleResults.length} ta modul</span>
              </div>

              <div className="divide-y divide-slate-100">
                {moduleResults.map((m) => {
                  const title = getLocalized(m, 'title') || m.title;
                  const sc = m.score;
                  const isCompleted = m.is_completed;
                  const scBadge = sc >= 80 ? "badge-emerald" : sc >= 60 ? "badge-blue" : sc > 0 ? "badge-rose" : "badge-slate";

                  return (
                    <div
                      key={m.id}
                      onClick={() => navigate(`/student/modules/${m.id}`)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sc > 0
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {isCompleted ? <RiCheckLine className="text-lg" /> : `#${m.order_index}`}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                            {m.order_index}. {title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {m.quiz_score !== null && (
                              <span className="text-[11px] font-bold text-slate-500">
                                Test: <strong className="text-slate-800">{m.quiz_score}%</strong>
                              </span>
                            )}
                            {m.chat_score !== null && (
                              <span className="text-[11px] font-bold text-slate-500">
                                · Muloqot: <strong className="text-slate-800">{m.chat_score}%</strong>
                              </span>
                            )}
                            {m.attempts > 0 && (
                              <span className="text-[11px] text-slate-400">
                                ({m.attempts} ta urinish)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0">
                        {sc !== null && sc > 0 ? (
                          <span className={`badge-standard ${scBadge} font-black text-xs px-3 py-1`}>
                            <RiSparkling2Line className="text-xs" />
                            <span>Yakuniy: {sc}%</span>
                          </span>
                        ) : (
                          <span className="badge-standard badge-slate text-xs">
                            Topshirilmagan
                          </span>
                        )}

                        <span className="text-slate-400 hover:text-blue-600 hidden sm:inline">
                          <RiArrowRightLine />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity Stream */}
          {data?.recent_activity?.length > 0 && (
            <div className="card-standard p-6 bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RiTimeLine className="text-blue-600 text-lg" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">{t('student.dashboard.recent_activity')}</h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400">{data.recent_activity.length} ta so'nggi urinish</span>
              </div>

              <div className="divide-y divide-slate-100">
                {data.recent_activity.map((a) => {
                  const sc = a.overall_score || 0;
                  const scBadge = sc >= 80 ? "badge-emerald" : sc >= 60 ? "badge-amber" : "badge-rose";
                  return (
                    <div key={a.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          #{a.module?.order_index || 1}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900">{getLocalized(a.module, 'title') || a.module?.title}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {t('student.dashboard.attempt')} · {new Date(a.created_at).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <span className={`badge-standard ${scBadge} shrink-0 font-black`}>
                        {sc}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 5. Quick Navigation Action Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/student/modules')}
              className="card-standard-hover p-5 flex items-center justify-between group bg-white border border-slate-200/90 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <RiBookOpenLine />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{t('student.dashboard.view_modules_btn')}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('student.modules.title')}</p>
                </div>
              </div>
              <RiArrowRightLine className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all text-lg" />
            </div>

            <div
              onClick={() => navigate('/student/grammar')}
              className="card-standard-hover p-5 flex items-center justify-between group bg-white border border-slate-200/90 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <RiQuillPenLine />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{t('student.dashboard.grammar_checker_btn')}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('nav_grammar')}</p>
                </div>
              </div>
              <RiArrowRightLine className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all text-lg" />
            </div>

            <div
              onClick={() => navigate('/student/forum')}
              className="card-standard-hover p-5 flex items-center justify-between group bg-white border border-slate-200/90 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <RiChatSmile2Line />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{t('nav_forum')}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('nav_forum')}</p>
                </div>
              </div>
              <RiArrowRightLine className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all text-lg" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
