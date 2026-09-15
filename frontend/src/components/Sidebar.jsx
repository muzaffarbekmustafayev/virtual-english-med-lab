import { NavLink, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Avatar } from "./ui";
import {
  RiDashboardLine, RiBookOpenLine, RiQuillPenLine,
  RiChatSmile2Line, RiUser3Line, RiLogoutBoxRLine,
  RiGroupLine, RiBarChartLine, RiFileListLine, RiTeamLine,
  RiHeartPulseLine, RiCloseLine, RiBrainLine, RiBookLine,
  RiLightbulbLine, RiQuestionLine, RiHospitalLine, RiSettings4Line
} from "react-icons/ri";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t, getLocalized } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const NAV = {
    student: [
      { section: t('navigation') },
      { to: "/student/dashboard", icon: RiDashboardLine, label: t('nav_dashboard') },
      { to: "/student/modules", icon: RiBookOpenLine, label: t('nav_modules'), match: '/student/modules' },
      { to: "/student/grammar", icon: RiQuillPenLine, label: t('nav_grammar'), match: '/student/grammar' },
      { to: "/student/forum", icon: RiChatSmile2Line, label: t('nav_forum') },
      { section: t('ui_account') },
      { to: "/student/profile", icon: RiUser3Line, label: t('nav_profile') },
    ],
    teacher: [
      { section: t('navigation') },
      { to: "/teacher/dashboard", icon: RiDashboardLine, label: t('nav_dashboard') },
      { to: "/teacher/groups", icon: RiGroupLine, label: t('nav_groups') },
      { to: "/teacher/reports", icon: RiBarChartLine, label: t('nav_reports') },
      { to: "/teacher/forum", icon: RiChatSmile2Line, label: t('nav_forum') },
      { section: t('ui_account') },
      { to: "/teacher/profile", icon: RiUser3Line, label: t('nav_profile') },
    ],
    admin: [
      { section: t('navigation') },
      { to: "/admin/overview", icon: RiDashboardLine, label: t('nav_admin_overview') },
      { section: t('nav_admin_users_section') },
      { to: "/admin/users", icon: RiTeamLine, label: t('nav_admin_users') },
      { section: t('nav_admin_structure_section') },
      { to: "/admin/groups", icon: RiHospitalLine, label: t('nav_admin_structure') },
      { section: t('nav_admin_content_section') },
      { to: "/admin/content/grammar", icon: RiBrainLine, label: t('nav_admin_grammar') },
      { to: "/admin/content/vocabulary", icon: RiBookLine, label: t('nav_admin_vocabulary') },
      { to: "/admin/content/phrasebook", icon: RiLightbulbLine, label: t('nav_admin_phrasebook') },
      { to: "/admin/content/quizzes", icon: RiQuestionLine, label: t('nav_admin_quizzes') },
      { to: "/admin/content/scenarios", icon: RiFileListLine, label: t('nav_admin_modules') },
      { section: t('ui_account') },
      { to: "/admin/profile", icon: RiSettings4Line, label: t('nav_profile') },
    ],
  };
  const navItems = NAV[user?.role] || [];

  const ROLE_LABEL = { student: t('role_student'), teacher: t('role_teacher'), admin: t('role_admin') };
  const specialtyName = getLocalized(user?.specialty, 'name') || user?.specialty?.name || '';

  const handleLogout = () => {
    logout();
    toast.success(t('ui_sign_out_success'));
    if (onClose) onClose();
    navigate("/login", { replace: true });
  };

  const isActive = (item) => {
    if (item.match) return location.pathname.startsWith(item.match);
    return location.pathname === item.to;
  };

  return (
    <aside
      id="main-sidebar"
      className={`sidebar-dark fixed top-0 left-0 h-[100dvh] w-[264px] flex flex-col z-50 transition-transform duration-300 ease-out md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl shadow-black/40" : "-translate-x-full md:translate-x-0"
      }`}
      aria-label={t('navigation')}
    >
      {/* Brand */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0 ring-1 ring-white/10">
            <RiHeartPulseLine className="text-xl" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13.5px] font-extrabold tracking-tight leading-tight truncate">{t('app_title')}</p>
            <p className="text-blue-300/90 text-[10px] font-bold tracking-[0.14em] uppercase mt-0.5">{t('app_subtitle')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          aria-label={t('ui_close_menu')}
        >
          <RiCloseLine className="text-xl" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto scrollbar-none">
        {navItems.map((item, idx) => {
          if (item.section) {
            return <p key={`s-${idx}`} className="sb-section">{item.section}</p>;
          }
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              id={"nav-" + item.to.replace(/\//g, '-')}
              onClick={() => onClose && onClose()}
              className={`sb-link mb-0.5 ${active ? 'active' : ''}`}
            >
              <Icon className="sb-icon" />
              <span className="truncate flex-1">{item.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] shrink-0" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User card + logout */}
      <div className="p-3 border-t border-white/5 bg-black/10">
        <button
          onClick={() => { navigate(`/${user?.role}/profile`); if (onClose) onClose(); }}
          className="w-full text-left rounded-2xl p-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors group"
          title={t('ui_my_profile')}
        >
          <Avatar name={user?.full_name} seed={user?.id} size="w-9 h-9 text-xs" className="ring-1 ring-white/10" />
          <div className="overflow-hidden flex-1">
            <p className="text-white text-xs font-bold truncate group-hover:text-blue-200 transition-colors">{user?.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              <p className="text-slate-400 text-[10.5px] font-semibold truncate">
                {ROLE_LABEL[user?.role] || ''}{specialtyName ? ` · ${specialtyName}` : ''}
              </p>
            </div>
          </div>
        </button>
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-rose-500/15 text-xs font-bold transition-all border border-transparent hover:border-rose-400/20"
        >
          <RiLogoutBoxRLine className="text-base text-slate-500" />
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </aside>
  );
}
