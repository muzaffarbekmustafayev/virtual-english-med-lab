import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import {
  RiBookOpenLine, RiTrophyLine, RiCheckboxCircleLine, RiBarChartLine,
  RiArrowRightLine, RiTimeLine, RiArrowRightUpLine, RiFlashlightLine,
} from "react-icons/ri";

const STAT_DEFS = (d) => [
  { label: "Total Modules",   value: d.total_modules,      icon: RiBookOpenLine,       color: "#1e3a5f", bg: "#eef2ff" },
  { label: "Completed",       value: d.completed_modules,  icon: RiCheckboxCircleLine, color: "#059669", bg: "#ecfdf5" },
  { label: "Average Score",   value: d.average_score + "%",icon: RiTrophyLine,         color: "#d97706", bg: "#fffbeb" },
  { label: "Progress",        value: d.progress_percent+"%",icon: RiBarChartLine,      color: "#2563eb", bg: "#eff6ff" },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <Layout>
      {/* ── Page title ─────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 4 }}>
          Student Portal
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d1b2a", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {greeting}, {user?.full_name?.split(" ")[0]}
        </h1>
        <p style={{ fontSize: 13.5, color: "#6b7280", marginTop: 6 }}>
          {user?.specialty?.name || "Medical English"} · Keep practicing to unlock new modules.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 108, borderRadius: 16 }} />)}
        </div>
      ) : data && (
        <>
          {/* ── Stat cards ──────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 28 }}
               className="lg:grid-cols-4">
            {STAT_DEFS(data).map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="animate-fade-up card" style={{ padding: "20px 22px", animationDelay: i * 0.06 + "s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ fontSize: 18, color: s.color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0d1b2a", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 5, fontWeight: 500 }}>{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* ── Progress section ─────────────────────────────── */}
          <div className="animate-fade-up delay-200 card" style={{ padding: "22px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6b7280" }}>Course Progress</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0d1b2a", marginTop: 2 }}>
                  {data.completed_modules} of {data.total_modules} modules completed
                </p>
              </div>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563eb" }}>{data.progress_percent}%</span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
              <div className="progress-fill" style={{ height: "100%", width: data.progress_percent + "%", background: "linear-gradient(90deg, #1e3a5f, #2563eb)", borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
              <span>Start</span>
              <span>60% — required to unlock next</span>
              <span>100%</span>
            </div>
          </div>

          {/* ── Recent activity ──────────────────────────────── */}
          {data?.recent_activity?.length > 0 && (
            <div className="animate-fade-up delay-300 card" style={{ padding: "22px 24px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6b7280" }}>
                  <RiTimeLine style={{ display: "inline", marginRight: 5 }} />Recent Activity
                </p>
              </div>
              <div>
                {data.recent_activity.map((a, i) => {
                  const sc = a.overall_score || 0;
                  const scColor = sc >= 80 ? "#059669" : sc >= 60 ? "#d97706" : "#dc2626";
                  const scBg    = sc >= 80 ? "#ecfdf5" : sc >= 60 ? "#fffbeb" : "#fef2f2";
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < data.recent_activity.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0d1b2a" }}>{a.module?.title}</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2, textTransform: "capitalize" }}>
                          {a.attempt_type?.replace(/_/g, " ")} · {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: scColor, background: scBg, padding: "3px 10px", borderRadius: 8 }}>{sc}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────────── */}
          <div className="animate-fade-up delay-400 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="btn-primary" onClick={() => navigate("/student/modules")} style={{ justifyContent: "center", padding: "14px 20px", fontSize: 14, borderRadius: 12 }}>
              <RiBookOpenLine /> View All Modules <RiArrowRightLine />
            </button>
            <button className="btn-ghost" onClick={() => navigate("/student/grammar")} style={{ justifyContent: "center", padding: "14px 20px", fontSize: 14, borderRadius: 12, fontWeight: 600 }}>
              <RiFlashlightLine style={{ color: "#d97706" }} /> Grammar Checker <RiArrowRightLine />
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}
