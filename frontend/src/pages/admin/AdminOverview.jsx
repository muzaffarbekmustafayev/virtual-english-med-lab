import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiTeamLine, RiBookOpenLine, RiTrophyLine,
  RiUserStarLine, RiSettings3Line, RiMessage3Line,
  RiArrowRightLine, RiShieldCheckLine, RiHospitalLine
} from 'react-icons/ri';
import {
  FaTooth, FaBaby, FaStethoscope
} from 'react-icons/fa6';

const getSpecialtyTheme = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('stomatolog') || lower.includes('dentist')) {
    return {
      icon: <FaTooth size={20} />,
      badgeIcon: '🦷',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
    };
  }
  if (lower.includes('pediatr')) {
    return {
      icon: <FaBaby size={20} />,
      badgeIcon: '👶',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-700',
    };
  }
  return {
    icon: <FaStethoscope size={20} />,
    badgeIcon: '🩺',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  };
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then(r => {
        setStats(r.data);
        if (r.data?.specialties?.length > 0) {
          setSelectedSpecialtyId(r.data.specialties[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedSpecialty = stats?.specialties?.find(s => s.id === selectedSpecialtyId) || stats?.specialties?.[0];

  const globalCards = stats ? [
    { label: t('admin.overview.total_students'),   value: stats.students,                icon: RiTeamLine,       badge: 'bg-blue-50 text-blue-600 border-blue-200' },
    { label: t('admin.overview.total_teachers'),   value: stats.teachers,                icon: RiUserStarLine,   badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { label: t('admin.overview.total_admins'),     value: stats.admins,                  icon: RiShieldCheckLine, badge: 'bg-purple-50 text-purple-600 border-purple-200' },
    { label: t('admin.overview.total_modules'),    value: stats.modules,                 icon: RiBookOpenLine,   badge: 'bg-amber-50 text-amber-600 border-amber-200' },
    { label: t('admin.overview.total_simulations'),value: stats.completed_conversations, icon: RiMessage3Line,  badge: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    { label: t('admin.overview.global_avg'),       value: `${stats.avg_score}%`,         icon: RiTrophyLine,     badge: 'bg-rose-50 text-rose-600 border-rose-200' },
  ] : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-purple">
                <RiShieldCheckLine /> {t('nav.admin_portal')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('admin.overview.title')}</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('admin.overview.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="btn-primary-gradient"
            >
              <RiTeamLine />
              <span>{t('admin.users.title')}</span>
            </button>
            <button
              onClick={() => navigate('/admin/content')}
              className="btn-secondary-soft"
            >
              <RiBookOpenLine className="text-purple-600" />
              <span>{t('admin.content.title')}</span>
            </button>
          </div>
        </div>

        {/* ── 2. Global Metric Cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {globalCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="card-standard p-4 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.label}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${c.badge}`}>
                      <Icon className="text-base" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 3. Specialty Analytics ── */}
        {stats?.specialties?.length > 0 && (
          <div className="card-standard p-6 sm:p-8 space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RiHospitalLine className="text-blue-600 text-lg" /> {t('admin.overview.specialties_analytics')}
            </h2>

            <div className="flex flex-wrap gap-2.5">
              {stats.specialties.map((spec) => {
                const theme = getSpecialtyTheme(spec.name);
                const isSel = (selectedSpecialty?.id === spec.id);
                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialtyId(spec.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{theme.badgeIcon}</span>
                    <span>{spec.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {spec.student_count || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Specialty Breakdown */}
            {selectedSpecialty && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="card-standard p-5 bg-slate-50/70">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('admin.groups_page.groups_title')}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{selectedSpecialty.groups?.length || 0} ta guruh</p>
                </div>
                <div className="card-standard p-5 bg-slate-50/70">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('admin.overview.total_students')}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{selectedSpecialty.student_count || 0} talaba</p>
                </div>
                <div className="card-standard p-5 bg-slate-50/70">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('student.dashboard.average_score')}</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{selectedSpecialty.avg_score || 0}%</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
