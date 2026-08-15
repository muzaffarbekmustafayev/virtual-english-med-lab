import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { RiGroupLine, RiArrowRightLine, RiUser3Line, RiTrophyLine, RiBarChartLine, RiUserStarLine } from 'react-icons/ri';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-emerald">
                <RiUserStarLine /> {t('nav.teacher_portal')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('teacher.dashboard.title')}</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('teacher.dashboard.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/groups')}
              className="btn-primary-gradient bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <RiGroupLine />
              <span>{t('teacher.groups.title')}</span>
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('teacher.dashboard.assigned_groups'), value: data?.total_groups ?? 0, icon: RiGroupLine, badge: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
              { label: t('teacher.dashboard.total_students'), value: data?.total_students ?? 0, icon: RiUser3Line, badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              { label: t('teacher.dashboard.group_avg_score'), value: data?.average_score ? `${data.average_score}%` : '0%', icon: RiTrophyLine, badge: 'bg-amber-50 text-amber-600 border-amber-200' },
              { label: t('teacher.dashboard.completed_sessions'), value: data?.recent_conversations ?? 0, icon: RiBarChartLine, badge: 'bg-blue-50 text-blue-600 border-blue-200' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card-standard p-5 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{s.label}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.badge}`}>
                      <Icon className="text-lg" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 3. Quick Action Navigation ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => navigate('/teacher/groups')}
            className="card-standard-hover p-6 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                <RiGroupLine />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t('teacher.groups.title')}</h3>
                <p className="text-xs text-slate-500 font-medium">Guruhlar ro'yxati va talabalar faolligi</p>
              </div>
            </div>
            <RiArrowRightLine className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all text-xl" />
          </div>

          <div
            onClick={() => navigate('/teacher/reports')}
            className="card-standard-hover p-6 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                <RiBarChartLine />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t('teacher.dashboard.quick_reports_btn')}</h3>
                <p className="text-xs text-slate-500 font-medium">Batafsil klinik hisobotlar va Excel eksport</p>
              </div>
            </div>
            <RiArrowRightLine className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all text-xl" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
