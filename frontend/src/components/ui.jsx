// Umumiy premium UI bo'laklari: sarlavha, stat-tile, grafiklar, badge'lar, bo'sh holat.
import { useLanguage } from '../contexts/LanguageContext';
import { RiInboxLine } from 'react-icons/ri';

/* ── Score helpers ─────────────────────────────────────────── */
export const scoreTone = (s) => (s >= 80 ? 'emerald' : s >= 60 ? 'blue' : s > 0 ? 'amber' : 'slate');
export const scoreBadge = (s) => `badge-standard badge-${scoreTone(s)}`;
export const scoreText = (s) => (s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-blue-600' : s > 0 ? 'text-amber-600' : 'text-slate-400');
export const scoreBar = (s) => (s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-500' : s > 0 ? 'bg-amber-500' : 'bg-slate-300');

export function ScoreBadge({ value, suffix = '%', className = '' }) {
  const v = Number(value) || 0;
  return <span className={`${scoreBadge(v)} tabular ${className}`}>{v}{suffix}</span>;
}

/* ── Dates ─────────────────────────────────────────────────── */
// Chrome'dagi uz-UZ ICU oy nomlarini "M08" ko'rinishida beradi — shuning uchun o'zbekcha oylar qo'lda
const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
export function formatDate(date, language, { day = true } = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (language === 'uz') return `${day ? d.getDate() + ' ' : ''}${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', year: 'numeric', ...(day ? { day: 'numeric' } : {}) });
}
export function formatDay(date, language) {
  const d = new Date(date);
  if (language === 'uz') return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
  return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
}

export function useRelativeTime() {
  const { t, language } = useLanguage();
  return (date) => {
    if (!date) return t('ui_never');
    const d = new Date(date);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return t('ui_today');
    if (days === 1) return t('ui_yesterday');
    if (days < 30) return t('ui_days_ago', { n: days });
    return formatDate(d, language);
  };
}

/* ── Page header (hero) ────────────────────────────────────── */
export function PageHeader({ badge, badgeIcon: BadgeIcon, badgeTone = 'blue', title, subtitle, actions, tone = '', children }) {
  return (
    <div className={`card-hero ${tone} p-5 sm:p-7`}>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="min-w-0">
          {badge && (
            <span className={`badge-standard badge-${badgeTone} mb-3`}>
              {BadgeIcon && <BadgeIcon className="text-xs" />}
              {badge}
            </span>
          )}
          <h1 className="text-2xl sm:text-[1.9rem] font-extrabold text-slate-900 tracking-tight leading-tight text-balance">{title}</h1>
          {subtitle && <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium max-w-2xl">{subtitle}</p>}
          {children}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Stat tile ─────────────────────────────────────────────── */
const TONES = {
  blue:    'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber:   'bg-amber-50 text-amber-600 border-amber-100',
  purple:  'bg-purple-50 text-purple-600 border-purple-100',
  rose:    'bg-rose-50 text-rose-600 border-rose-100',
  cyan:    'bg-cyan-50 text-cyan-600 border-cyan-100',
  indigo:  'bg-indigo-50 text-indigo-600 border-indigo-100',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
  teal:    'bg-teal-50 text-teal-600 border-teal-100',
};

export function StatTile({ label, value, sub, icon: Icon, tone = 'blue', valueClass = '', trend }) {
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between gap-2">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${TONES[tone] || TONES.blue}`}>
            <Icon className="text-[15px]" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={`stat-value ${valueClass}`}>{value}</span>
        {trend !== undefined && trend !== null && (
          <span className={`text-[11px] font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}
          </span>
        )}
      </div>
      {sub && <span className="stat-sub truncate">{sub}</span>}
    </div>
  );
}

/* ── Card with section header ──────────────────────────────── */
export function SectionCard({ icon: Icon, iconClass = 'text-blue-600', title, desc, right, children, className = '', bodyClass = '' }) {
  return (
    <div className={`card-standard overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="min-w-0">
          <h2 className="section-title">
            {Icon && <Icon className={`text-base ${iconClass}`} />}
            <span className="truncate">{title}</span>
          </h2>
          {desc && <p className="section-desc">{desc}</p>}
        </div>
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────── */
export function EmptyState({ icon: Icon = RiInboxLine, title, hint, className = '' }) {
  return (
    <div className={`py-12 px-6 text-center ${className}`}>
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="text-xl" />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {hint && <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm mx-auto">{hint}</p>}
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────── */
export function Skeleton({ className = 'h-24' }) {
  return <div className={`skeleton ${className}`} />;
}

/* ── Progress bar ──────────────────────────────────────────── */
export function Progress({ value = 0, tone, className = '', height = 'h-2' }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`progress-track ${height} ${className}`}>
      <div className={`progress-fill ${tone || scoreBar(v)}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ── Avatar ────────────────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600', 'from-emerald-600 to-teal-500', 'from-violet-600 to-fuchsia-500',
  'from-amber-500 to-orange-500', 'from-cyan-600 to-sky-500', 'from-rose-500 to-pink-500',
];
export function Avatar({ name = '', size = 'w-9 h-9 text-xs', className = '', seed }) {
  const key = (seed ?? name).toString();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
  const g = AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
  return (
    <div className={`${size} rounded-xl bg-gradient-to-tr ${g} text-white font-black flex items-center justify-center shrink-0 shadow-sm ${className}`}>
      {name?.trim()?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

/* ── Charts (pure SVG, no deps) ────────────────────────────── */
export function BarChart({ data = [], valueKey = 'sessions', labelKey = 'date', height = 140, tone = '#2563eb', formatLabel, showValues = true }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  const n = data.length || 1;
  const W = 100, H = 100; // percentage-based viewBox
  const gap = 1.6;
  const bw = (W - gap * (n - 1)) / n;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" x2={W} y1={H - p * H} y2={H - p * H} stroke="#e2e8f0" strokeWidth="0.3" strokeDasharray="1 1" />
        ))}
        {data.map((d, i) => {
          const v = Number(d[valueKey]) || 0;
          const h = (v / max) * (H - 6);
          const x = i * (bw + gap);
          return (
            <g key={i}>
              <rect x={x} y={H - h} width={bw} height={h} rx="1" fill={tone} opacity={v ? 0.9 : 0.25}>
                <title>{`${d[labelKey]}: ${v}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1.5 text-[10px] font-bold text-slate-400 tabular">
        {data.map((d, i) => {
          const show = n <= 8 || i === 0 || i === n - 1 || i % Math.ceil(n / 7) === 0;
          return (
            <span key={i} className="flex-1 text-center truncate" style={{ minWidth: 0 }}>
              {show ? (formatLabel ? formatLabel(d[labelKey]) : d[labelKey]) : ''}
            </span>
          );
        })}
      </div>
      {showValues && (
        <div className="flex justify-between mt-0.5 text-[10px] font-black text-slate-700 tabular">
          {data.map((d, i) => (
            <span key={i} className="flex-1 text-center">{n <= 14 ? (Number(d[valueKey]) || '') : ''}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function DistributionBars({ data = [], total }) {
  const sum = total ?? data.reduce((a, b) => a + (b.count || 0), 0);
  const tones = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  return (
    <div className="space-y-3">
      {data.map((b, i) => {
        const pct = sum ? Math.round((b.count / sum) * 100) : 0;
        return (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700 tabular">{b.label}%</span>
              <span className="font-bold text-slate-500 tabular">{b.count} · {pct}%</span>
            </div>
            <Progress value={pct} tone={tones[i] || 'bg-slate-400'} height="h-2.5" />
          </div>
        );
      })}
    </div>
  );
}

export function CompetencyBars({ comps = {}, labels = {} }) {
  const items = [
    ['grammar', 'bg-indigo-500'], ['vocabulary', 'bg-blue-500'], ['fluency', 'bg-emerald-500'],
    ['pronunciation', 'bg-cyan-500'], ['clinical', 'bg-amber-500'],
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map(([k, tone]) => (
        <div key={k} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 truncate">{labels[k] || k}</span>
            <span className="text-xs font-black text-slate-900 tabular">{comps[k] ?? 0}%</span>
          </div>
          <Progress value={comps[k] ?? 0} tone={tone} height="h-1.5" />
        </div>
      ))}
    </div>
  );
}

export function RadialScore({ value = 0, size = 92, stroke = 9, label }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = v >= 80 ? '#059669' : v >= 60 ? '#2563eb' : v > 0 ? '#d97706' : '#cbd5e1';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slate-900 tabular leading-none">{v}%</span>
        {label && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
