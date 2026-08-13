import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  RiDashboardLine, RiBookOpenLine, RiQuillPenLine,
  RiChatSmile2Line, RiUser3Line, RiLogoutBoxLine,
  RiGroupLine, RiBarChartLine, RiSettings4Line,
  RiFileListLine, RiTeamLine, RiUserStarLine,
  RiShieldCheckLine, RiHeartPulseLine, RiCloseLine,
} from "react-icons/ri";

const STUDENT_NAV = [
  { to: "/student/dashboard", icon: RiDashboardLine,  label: "Dashboard",       },
  { to: "/student/modules",   icon: RiBookOpenLine,   label: "Modules",         },
  { to: "/student/grammar",   icon: RiQuillPenLine,   label: "Grammar Checker", },
  { to: "/student/forum",     icon: RiChatSmile2Line, label: "Forum",           },
  { to: "/student/profile",   icon: RiUser3Line,      label: "Profile",         },
];
const TEACHER_NAV = [
  { to: "/teacher/dashboard", icon: RiDashboardLine,  label: "Dashboard" },
  { to: "/teacher/groups",    icon: RiGroupLine,      label: "Groups"    },
  { to: "/teacher/reports",   icon: RiBarChartLine,   label: "Reports"   },
  { to: "/teacher/forum",     icon: RiChatSmile2Line, label: "Forum"     },
];
const ADMIN_NAV = [
  { to: "/admin/overview",  icon: RiDashboardLine, label: "Overview"  },
  { to: "/admin/users",     icon: RiTeamLine,      label: "Users"     },
  { to: "/admin/groups",    icon: RiGroupLine,     label: "Groups"    },
  { to: "/admin/content",   icon: RiFileListLine,  label: "Content"   },
  { to: "/admin/settings",  icon: RiSettings4Line, label: "Settings"  },
];
const NAV_MAP = { student: STUDENT_NAV, teacher: TEACHER_NAV, admin: ADMIN_NAV };
const ROLE_CONFIG = {
  student: { icon: RiUser3Line,       label: "Student", color: "#3b82f6" },
  teacher: { icon: RiUserStarLine,    label: "Teacher", color: "#10b981" },
  admin:   { icon: RiShieldCheckLine, label: "Admin",   color: "#a855f7" },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_MAP[user?.role] || [];
  const role = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;
  const handleLogout = () => { 
    logout(); 
    toast.success("Tizimdan muvaffaqiyatli chiqdingiz");
    if (onClose) onClose();
    navigate("/login"); 
  };

  return (
    <aside
      id="main-sidebar"
      style={{ background: "#0f1c2e" }}
      className={`fixed top-0 left-0 h-screen w-[260px] flex flex-col z-50 border-r border-white/10 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Brand & Mobile Close */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="flex items-center justify-between">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,0.35)", flexShrink: 0 }}>
            <RiHeartPulseLine style={{ color: "white", fontSize: 18 }} />
          </div>
          <div>
            <p style={{ color: "white", fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Virtual Patient</p>
            <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>English Lab</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close Sidebar"
        >
          <RiCloseLine className="text-xl" />
        </button>
      </div>

      {/* User */}
      <div style={{ padding: "14px 12px 10px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: role.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={{ color: "rgba(255,255,255,0.90)", fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 10.5, fontWeight: 500 }}>{role.label}{user?.specialty?.name ? " · " + user.specialty.name : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
        <p style={{ color: "rgba(255,255,255,0.20)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 8px 8px" }}>Navigation</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={"nav-" + item.label.toLowerCase().replace(/\s+/g, "-")}
                onClick={() => onClose && onClose()}
                style={{ animationDelay: i * 0.05 + "s" }}
                className="sidebar-item"
              >
                {({ isActive }) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px 9px 8px", borderRadius: 9, borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent", background: isActive ? "rgba(59,130,246,0.10)" : "transparent", transition: "all 0.15s ease", cursor: "pointer" }}>
                    <Icon style={{ fontSize: 16.5, color: isActive ? "#60a5fa" : "rgba(255,255,255,0.42)", flexShrink: 0, transition: "color 0.15s" }} />
                    <p style={{ fontSize: 13, fontWeight: isActive ? 600 : 450, color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)", letterSpacing: "-0.01em", transition: "color 0.15s", flex: 1 }}>{item.label}</p>
                    {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div style={{ padding: "8px 10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button id="sidebar-logout-btn" onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.32)", fontSize: 13, fontWeight: 500, transition: "all 0.15s ease" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.10)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.32)"; }}
        >
          <RiLogoutBoxLine style={{ fontSize: 16.5 }} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
