import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  RiBookOpenLine, RiCheckboxCircleLine, RiTimeLine, RiLockLine,
  RiArrowRightLine, RiTrophyLine, RiFirstAidKitLine, RiStethoscopeLine,
  RiMicroscopeLine, RiSyringeLine, RiHeartPulseLine, RiHospitalLine,
  RiNurseLine, RiMedicineBottleLine, RiClipboardLine, RiHeartLine,
  RiPlayLine, RiStarLine,
} from 'react-icons/ri';

const MODULE_ICONS = [
  RiFirstAidKitLine, RiStethoscopeLine, RiMicroscopeLine, RiSyringeLine,
  RiHeartPulseLine, RiHospitalLine, RiNurseLine, RiMedicineBottleLine,
  RiClipboardLine, RiHeartLine,
];

const STATUS_CONFIG = {
  completed:    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', label: 'Completed',    icon: RiCheckboxCircleLine, dot: 'bg-emerald-400' },
  'in-progress':{ bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',   label: 'In Progress',  icon: RiTimeLine,           dot: 'bg-amber-400'  },
  'not-started':{ bg: 'bg-slate-50',    text: 'text-slate-600',    border: 'border-slate-200',   label: 'Not Started',  icon: RiPlayLine,           dot: 'bg-slate-400'   },
  locked:       { bg: 'bg-rose-50',     text: 'text-rose-600',     border: 'border-rose-200',    label: 'Locked',       icon: RiLockLine,           dot: 'bg-rose-400'    },
};

const GRADIENT_PAIRS = [
  'from-indigo-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-indigo-500',
  'from-teal-500 to-cyan-500',
  'from-orange-500 to-amber-500',
  'from-blue-500 to-indigo-500',
  'from-rose-500 to-pink-500',
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
    </div>
  );
}

export default function ModulesPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    api.get('/student/modules').then(r => setModules(r.data)).finally(() => setLoading(false));
  }, []);

  const getStatus = (mod) => {
    if (!mod.is_unlocked) return 'locked';
    if (mod.is_completed) return 'completed';
    if (mod.best_score !== null) return 'in-progress';
    return 'not-started';
  };

  const filtered = filter === 'all'
    ? modules
    : modules.filter(m => getStatus(m) === filter);

  const counts = {
    all:          modules.length,
    completed:    modules.filter(m => getStatus(m) === 'completed').length,
    'in-progress':modules.filter(m => getStatus(m) === 'in-progress').length,
    'not-started':modules.filter(m => getStatus(m) === 'not-started').length,
    locked:       modules.filter(m => getStatus(m) === 'locked').length,
  };

  const FILTERS = [
    { key: 'all',          label: 'All' },
    { key: 'not-started',  label: 'Not Started' },
    { key: 'in-progress',  label: 'In Progress' },
    { key: 'completed',    label: 'Completed' },
    { key: 'locked',       label: 'Locked' },
  ];

  return (
    <Layout>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="animate-fade-up mb-7">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <RiBookOpenLine />
              </span>
              My Modules
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 ml-11">
              {counts.completed} of {counts.all} modules completed
            </p>
          </div>
          {/* mini progress */}
          <div className="text-right">
            <p className="text-2xl font-black text-indigo-600">
              {counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0}%
            </p>
            <p className="text-[11px] text-slate-400 font-medium">completion rate</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-fill"
            style={{
              width: `${counts.all > 0 ? (counts.completed / counts.all) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            }}
          />
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────── */}
      <div className="animate-fade-up delay-100 flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              filter === f.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {f.label}
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
              filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Module Grid ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <RiBookOpenLine className="text-4xl mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No modules found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mod, i) => {
            const status   = getStatus(mod);
            const cfg      = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;
            const ModIcon  = MODULE_ICONS[(mod.order_index - 1) % MODULE_ICONS.length];
            const gradient = GRADIENT_PAIRS[(mod.order_index - 1) % GRADIENT_PAIRS.length];
            const isLocked = !mod.is_unlocked;
            const score    = mod.best_score;
            const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';

            return (
              <div
                key={mod.id}
                id={`module-card-${mod.id}`}
                onClick={() => { if (!isLocked) navigate(`/student/modules/${mod.id}`); }}
                style={{ animationDelay: `${i * 0.05}s` }}
                className={`animate-fade-up relative bg-white border rounded-2xl p-5 transition-all duration-250 group ${
                  isLocked
                    ? 'border-slate-200 opacity-60 cursor-not-allowed'
                    : 'border-slate-200/80 cursor-pointer hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl flex-shrink-0 shadow-lg ${!isLocked ? 'group-hover:scale-105 transition-transform duration-200' : ''}`}>
                    {isLocked ? <RiLockLine /> : <ModIcon />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Module {mod.order_index}</p>
                        <h3 className={`text-sm font-bold text-slate-900 leading-tight mt-0.5 ${!isLocked ? 'group-hover:text-indigo-600 transition-colors' : ''}`}>
                          {mod.title}
                        </h3>
                      </div>
                      {/* Status badge */}
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {mod.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{mod.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <RiTimeLine className="text-[10px]" /> 90 min
                        </span>
                        {score !== null && (
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${scoreColor}`}>
                            <RiTrophyLine className="text-[10px]" /> {score}%
                          </span>
                        )}
                      </div>
                      {!isLocked && (
                        <RiArrowRightLine className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-200" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Locked overlay tooltip */}
                {isLocked && mod.order_index > 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                      <RiLockLine /> Score 60%+ in previous module to unlock
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}


