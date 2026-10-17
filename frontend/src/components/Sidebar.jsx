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
      { to: "/admin/content/grammar",    icon: RiBrainLine,        label: t('nav_admin_grammar'),    lucideColor: 'text-amber-500',   activeBg: 'from-amber-500 to-orange-500' },
      { to: "/admin/content/vocabulary", icon: RiBookLine,         label: t('nav_admin_vocabulary'), lucideColor: 'text-indigo-500',  activeBg: 'from-indigo-500 to-violet-500' },
      { to: "/admin/content/phrasebook", icon: RiChatSmile2Line,   label: t('nav_admin_phrasebook'), lucideColor: 'text-cyan-500',    activeBg: 'from-cyan-500 to-teal-500' },
      { to: "/admin/content/quizzes",    icon: RiQuestionLine,     label: t('nav_admin_quizzes'),    lucideColor: 'text-purple-500',  activeBg: 'from-purple-500 to-pink-500' },
      { to: "/admin/content/scenarios",  icon: RiHospitalLine,     label: t('nav_admin_modules'),    lucideColor: 'text-emerald-500', activeBg: 'from-emerald-500 to-green-500' },
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
          const isLucide = item.lucideColor !== undefined;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              id={"nav-" + item.to.replace(/\//g, '-')}
              onClick={() => onClose && onClose()}
              className={`sb-link mb-0.5 ${active ? 'active' : ''}`}
            >
              {isLucide ? (
                <span
                  className={`
                    sb-icon flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200
                    ${active
                      ? `bg-gradient-to-br ${item.activeBg} shadow-md`
                      : 'bg-white/5'}
                  `}
                >
                  <Icon
                    size={14}
                    strokeWidth={active ? 2.5 : 2}
                    className={active ? 'text-white' : item.lucideColor}
                  />
                </span>
              ) : (
                <Icon className="sb-icon" />
              )}
              <span className="truncate flex-1">{item.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] shrink-0" />}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
