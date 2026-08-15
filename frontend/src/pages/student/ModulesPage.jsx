import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiBookOpenLine, RiCheckboxCircleLine, RiTimeLine, RiLockLine,
  RiArrowRightLine, RiTrophyLine, RiFirstAidKitLine, RiStethoscopeLine,
  RiMicroscopeLine, RiSyringeLine, RiHeartPulseLine, RiHospitalLine,
  RiPlayLine, RiSearchLine
} from 'react-icons/ri';

const MODULE_ICONS = [
  RiFirstAidKitLine, RiStethoscopeLine, RiMicroscopeLine, RiSyringeLine,
  RiHeartPulseLine, RiHospitalLine, RiFirstAidKitLine, RiStethoscopeLine,
  RiMicroscopeLine, RiHeartPulseLine,
];

export default function ModulesPage() {
  const navigate = useNavigate();
  const { t, getLocalized } = useLanguage();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/student/modules')
      .then(r => setModules(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (mod) => {
    if (!mod.is_unlocked) return 'locked';
    if (mod.is_completed) return 'completed';
    if (mod.best_score !== null) return 'in-progress';
    return 'not-started';
  };

  const statusConfig = {
    completed:    { badge: 'badge-emerald', label: t('student.modules.completed_badge'), icon: RiCheckboxCircleLine },
    'in-progress':{ badge: 'badge-amber',   label: t('common.in_progress'),            icon: RiTimeLine },
    'not-started':{ badge: 'badge-blue',    label: t('student.modules.start_btn'),            icon: RiPlayLine },
    locked:       { badge: 'badge-slate',   label: t('student.modules.locked_badge'),                 icon: RiLockLine },
  };

  const filtered = modules
    .filter(m => filter === 'all' ? true : getStatus(m) === filter)
    .filter(m => search.trim() ? (m.title?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase())) : true);

  const counts = {
    all:          modules.length,
    'not-started':modules.filter(m => getStatus(m) === 'not-started').length,
    'in-progress':modules.filter(m => getStatus(m) === 'in-progress').length,
    completed:    modules.filter(m => getStatus(m) === 'completed').length,
    locked:       modules.filter(m => getStatus(m) === 'locked').length,
  };

  const FILTERS = [
    { key: 'all',          label: t('common.all') },
    { key: 'not-started',  label: t('student.modules.start_btn') },
    { key: 'in-progress',  label: t('common.in_progress') },
    { key: 'completed',    label: t('student.modules.completed_badge') },
    { key: 'locked',       label: t('student.modules.locked_badge') },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Page Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-blue">
                {modules.length} {t('nav.modules')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0">
                <RiBookOpenLine />
              </span>
              {t('student.modules.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
              {t('student.modules.subtitle')}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-standard pl-10 text-xs"
            />
          </div>
        </div>

        {/* ── 2. Filter Pills ── */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            const count = counts[f.key] || 0;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3. Modules Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-standard p-12 text-center">
            <p className="text-sm font-bold text-slate-700">{t('student.dashboard.no_recent')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((mod, idx) => {
              const st = getStatus(mod);
              const cfg = statusConfig[st];
              const StatusIcon = cfg.icon;
              const IconComponent = MODULE_ICONS[idx % MODULE_ICONS.length];
              const description = getLocalized(mod, 'description');

              return (
                <div
                  key={mod.id}
                  onClick={() => mod.is_unlocked && navigate(`/student/modules/${mod.id}`)}
                  className={`card-standard p-6 flex flex-col justify-between transition-all ${
                    mod.is_unlocked
                      ? 'hover:border-blue-300 hover:shadow-md cursor-pointer hover:-translate-y-1'
                      : 'bg-slate-50/60 border-slate-200 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center text-xl font-bold shrink-0">
                          <IconComponent />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          {t('student.modules.order')} #{mod.order_index}
                        </span>
                      </div>

                      <span className={`badge-standard ${cfg.badge}`}>
                        <StatusIcon className="text-xs" />
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-2">
                      {mod.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 font-medium">
                      {description || mod.description}
                    </p>
                  </div>

                  {/* Footer & CTA */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    {mod.best_score !== null && (
                      <span className="badge-standard badge-amber">
                        <RiTrophyLine /> {mod.best_score}%
                      </span>
                    )}

                    {mod.is_unlocked ? (
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors ml-auto"
                      >
                        <span>{mod.is_completed ? t('student.modules.review_btn') : mod.best_score !== null ? t('student.modules.continue_btn') : t('student.modules.start_btn')}</span>
                        <RiArrowRightLine />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 ml-auto">
                        <RiLockLine /> {t('student.modules.unlock_tip')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
