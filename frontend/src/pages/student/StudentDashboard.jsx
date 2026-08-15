import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import api from "../../lib/api";
import {
  RiBookOpenLine, RiTrophyLine, RiCheckboxCircleLine, RiBarChartLine,
  RiArrowRightLine, RiTimeLine, RiSparklingLine, RiStethoscopeLine,
  RiQuillPenLine, RiChatSmile2Line, RiFireLine
} from "react-icons/ri";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard")
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('student.dashboard.greeting_morning');
    if (h < 17) return t('student.dashboard.greeting_afternoon');
    return t('student.dashboard.greeting_evening');
  };

  const statDefs = (d) => [
    { label: t('student.dashboard.total_modules'),     value: d.total_modules || 10,  icon: RiBookOpenLine,       color: "#2563eb", bg: "bg-blue-50 text-blue-600 border-blue-200" },
    { label: t('student.dashboard.completed_modules'), value: d.completed_modules || 0,   icon: RiCheckboxCircleLine, color: "#059669", bg: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { label: t('student.dashboard.average_score'),     value: (d.average_score || 0) + "%", icon: RiTrophyLine,         color: "#d97706", bg: "bg-amber-50 text-amber-600 border-amber-200" },
    { label: t('student.dashboard.course_progress'),   value: (d.progress_percent || 0) + "%", icon: RiBarChartLine,      color: "#7c3aed", bg: "bg-purple-50 text-purple-600 border-purple-200" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Hero Greeting Banner ── */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                <RiStethoscopeLine />
                <span>{t('nav.student_portal')}</span>
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {user?.specialty?.name || "Stomatologiya"}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {user?.full_name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
              {t('student.dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => navigate('/student/modules')}
              className="btn-primary-gradient"
            >
              <RiBookOpenLine className="text-base" />
              <span>{t('student.dashboard.view_modules_btn')}</span>
              <RiArrowRightLine />
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
        ) : data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statDefs(data).map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="card-standard p-5 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{s.label}</span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.bg}`}>
                        <Icon className="text-lg" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* ── 3. Course Progression Milestone ── */}
            <div className="card-standard p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{t('student.dashboard.course_progress')}</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {t('student.dashboard.modules_done_of', { completed: data.completed_modules || 0, total: data.total_modules || 10 })}
                  </p>
                </div>
                <span className="text-2xl font-black text-blue-600">{data.progress_percent || 0}%</span>
              </div>
              
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, data.progress_percent || 0))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold pt-1">
                <span>0% (Boshlang'ich)</span>
                <span className="text-blue-600 font-bold">{t('student.dashboard.unlock_requirement')}</span>
                <span>100% (Klinik Shifokor)</span>
              </div>
            </div>

            {/* ── 4. Recent Activity Timeline ── */}
            {data?.recent_activity?.length > 0 && (
              <div className="card-standard p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <RiTimeLine className="text-blue-600 text-lg" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">{t('student.dashboard.recent_activity')}</h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {data.recent_activity.map((a) => {
                    const sc = a.overall_score || 0;
                    const scBadge = sc >= 80 ? "badge-emerald" : sc >= 60 ? "badge-amber" : "badge-rose";
                    return (
                      <div key={a.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center text-xs font-black shrink-0">
                            #{a.module?.order_index || 1}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{a.module?.title}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {t('student.dashboard.attempt')} · {new Date(a.created_at).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <span className={`badge-standard ${scBadge}`}>
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
                className="card-standard-hover p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    <RiBookOpenLine />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{t('student.dashboard.view_modules_btn')}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">10 ta klinik bosqich</p>
                  </div>
                </div>
                <RiArrowRightLine className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>

              <div
                onClick={() => navigate('/student/grammar')}
                className="card-standard-hover p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    <RiQuillPenLine />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{t('student.dashboard.grammar_checker_btn')}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">AI tibbiy tahlil</p>
                  </div>
                </div>
                <RiArrowRightLine className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>

              <div
                onClick={() => navigate('/student/forum')}
                className="card-standard-hover p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    <RiChatSmile2Line />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{t('nav_forum')}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Klinik keyslar & savollar</p>
                  </div>
                </div>
                <RiArrowRightLine className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
