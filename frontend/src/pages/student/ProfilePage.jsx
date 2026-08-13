import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  RiUser3Line, RiTrophyLine, RiBookOpenLine, RiBarChartLine,
  RiFirstAidKitLine, RiGroupLine, RiMailLine, RiCalendarLine,
  RiCheckboxCircleLine, RiTimeLine, RiMedalLine, RiSparklingLine,
} from 'react-icons/ri';

function AchievementBadge({ icon, label, color, achieved }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${achieved ? `${color} shadow-sm` : 'bg-slate-50 border-slate-200 opacity-40'}`}>
      <span className="text-xl">{icon}</span>
      <p className="text-[10px] font-bold text-center leading-tight">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard').then(r => setDashboard(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avg = dashboard?.average_score || 0;
  const progress = dashboard?.progress_percent || 0;

  const achievements = [
    { icon: '🚀', label: 'First Module',  color: 'bg-indigo-50 border-indigo-200 text-indigo-700', achieved: (dashboard?.completed_modules || 0) >= 1 },
    { icon: '🌟', label: '5 Modules',     color: 'bg-amber-50 border-amber-200 text-amber-700',    achieved: (dashboard?.completed_modules || 0) >= 5 },
    { icon: '🏆', label: 'All Modules',   color: 'bg-emerald-50 border-emerald-200 text-emerald-700', achieved: dashboard?.completed_modules === dashboard?.total_modules && (dashboard?.total_modules || 0) > 0 },
    { icon: '💯', label: 'Perfect Score', color: 'bg-rose-50 border-rose-200 text-rose-700',       achieved: avg >= 95 },
    { icon: '⚡',  label: 'Fast Learner', color: 'bg-cyan-50 border-cyan-200 text-cyan-700',        achieved: (dashboard?.completed_modules || 0) >= 3 },
    { icon: '🎯', label: 'High Achiever', color: 'bg-purple-50 border-purple-200 text-purple-700', achieved: avg >= 80 },
  ];

  return (
    <Layout>
      {/* ── Profile Banner ──────────────────────────────── */}
      <div className="animate-fade-up mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-6 shadow-xl shadow-indigo-500/20">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-16 -bottom-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <RiSparklingLine className="absolute top-4 right-4 text-white/20 text-5xl" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-black flex-shrink-0 border-2 border-white/30 shadow-lg">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{user?.full_name}</h1>
            <p className="text-white/70 text-sm mt-0.5 flex items-center gap-1.5">
              <RiMailLine className="text-xs" /> {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20">
                <RiUser3Line className="text-[10px]" /> Student
              </span>
              {user?.specialty?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20">
                  <RiFirstAidKitLine className="text-[10px]" /> {user.specialty.name}
                </span>
              )}
              {user?.group?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20">
                  <RiGroupLine className="text-[10px]" /> {user.group.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : dashboard && (
        <>
          <div className="animate-fade-up delay-100 grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Modules',   value: dashboard.total_modules,               icon: <RiBookOpenLine />,        color: 'from-indigo-500 to-indigo-600' },
              { label: 'Completed',       value: dashboard.completed_modules,           icon: <RiCheckboxCircleLine />,  color: 'from-emerald-500 to-teal-500'  },
              { label: 'Avg Score',       value: `${dashboard.average_score}%`,         icon: <RiTrophyLine />,          color: 'from-amber-500 to-orange-500'  },
              { label: 'Progress',        value: `${dashboard.progress_percent}%`,      icon: <RiBarChartLine />,        color: 'from-cyan-500 to-blue-500'     },
            ].map((s, i) => (
              <div key={s.label}
                   className={`animate-fade-up bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 group hover:shadow-md transition-all delay-${(i+1)*100}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-base mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                  {s.icon}
                </div>
                <p className="text-xl font-black text-slate-900">{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Progress bar ──────────────────────────────── */}
          <div className="animate-fade-up delay-200 bg-white border border-slate-200/80 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Overall Progress</h3>
              <span className="text-sm font-black text-indigo-600">{progress}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-fill"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
              <span>0%</span><span>100% 🎓</span>
            </div>
          </div>

          {/* ── Achievements ──────────────────────────────── */}
          <div className="animate-fade-up delay-300 bg-white border border-slate-200/80 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                <RiMedalLine className="text-amber-500 text-sm" />
              </span>
              Achievements
              <span className="ml-auto text-[11px] text-slate-400">
                {achievements.filter(a => a.achieved).length}/{achievements.length} earned
              </span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {achievements.map(a => (
                <AchievementBadge key={a.label} {...a} />
              ))}
            </div>
          </div>

          {/* ── Recent Activity ───────────────────────────── */}
          {dashboard?.recent_activity?.length > 0 && (
            <div className="animate-fade-up delay-400 bg-white border border-slate-200/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <RiTimeLine className="text-indigo-500 text-sm" />
                </span>
                Recent Activity
              </h3>
              <div className="space-y-1">
                {dashboard.recent_activity.map((a, i) => {
                  const score = a.overall_score || 0;
                  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
                  const scoreBg   = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
                  return (
                    <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm text-slate-900 font-semibold">{a.module?.title}</p>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5 flex items-center gap-1">
                          <RiCalendarLine className="text-[10px]" />
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          · {a.attempt_type?.replace(/_/g,' ')}
                        </p>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${scoreBg} ${scoreColor}`}>
                        {score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}


