import { NavLink, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  RiDashboardLine, RiBookOpenLine, RiQuillPenLine,
  RiChatSmile2Line, RiUser3Line, RiLogoutBoxLine,
  RiGroupLine, RiBarChartLine, RiSettings4Line,
  RiFileListLine, RiTeamLine, RiUserStarLine,
  RiShieldCheckLine, RiHeartPulseLine, RiCloseLine,
  RiBrainLine, RiBookLine, RiLightbulbLine, RiQuestionLine, RiHospitalLine
} from "react-icons/ri";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const STUDENT_NAV = [
    { to: "/student/dashboard", icon: RiDashboardLine, label: t('nav_dashboard') },
    { to: "/student/modules", icon: RiBookOpenLine, label: t('nav_modules') },
    { to: "/student/grammar", icon: RiQuillPenLine, label: t('nav_grammar') },
    { to: "/student/forum", icon: RiChatSmile2Line, label: t('nav_forum') },
    { to: "/student/profile", icon: RiUser3Line, label: t('nav_profile') },
  ];

  const TEACHER_NAV = [
    { to: "/teacher/dashboard", icon: RiDashboardLine, label: t('nav_dashboard') },
    { to: "/teacher/groups", icon: RiGroupLine, label: t('nav_groups') },
    { to: "/teacher/reports", icon: RiBarChartLine, label: t('nav_reports') },
    { to: "/teacher/forum", icon: RiChatSmile2Line, label: t('nav_forum') },
  ];

  const ADMIN_NAV = [
    { to: "/admin/overview", icon: RiDashboardLine, label: "Umumiy Holat" },
    { isDivider: true, label: "FOYDALANUVCHILAR" },
    { to: "/admin/users", icon: RiTeamLine, label: "Foydalanuvchilar" },
    { isDivider: true, label: "TUZILMA VA GURUHLAR" },
    { to: "/admin/groups", icon: RiGroupLine, label: "Tuzilma (Yo'nalish va Guruh)" },
    { isDivider: true, label: "KONTENT BOSHQARUVI" },
    { to: "/admin/content/grammar", icon: RiBrainLine, label: "Grammatika" },
    { to: "/admin/content/vocabulary", icon: RiBookLine, label: "Lug'at" },
    { to: "/admin/content/phrasebook", icon: RiLightbulbLine, label: "Iboralar" },
    { to: "/admin/content/quizzes", icon: RiQuestionLine, label: "Testlar" },
    { to: "/admin/content/scenarios", icon: RiFileListLine, label: "Modullar" },
  ];

  const NAV_MAP = { student: STUDENT_NAV, teacher: TEACHER_NAV, admin: ADMIN_NAV };
  const navItems = NAV_MAP[user?.role] || [];

  const ROLE_CONFIG = {
    student: { icon: RiUser3Line, label: 'Talaba / Student', bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-200' },
    teacher: { icon: RiUserStarLine, label: "O'qituvchi / Teacher", bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-200' },
    admin: { icon: RiShieldCheckLine, label: 'Administrator', bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-200' },
  };
  const role = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;

  const handleLogout = () => {
    logout();
    toast.success(t('sign_out') + " muvaffaqiyatli!");
    if (onClose) onClose();
    navigate("/login");
  };

  return (
    <aside
      id="main-sidebar"
      className={`fixed top-0 left-0 h-screen w-[260px] flex flex-col z-50 bg-white border-r border-slate-200/90 shadow-xs transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0">
            <RiHeartPulseLine className="text-xl" />
          </div>
          <div>
            <p className="text-slate-900 text-sm font-extrabold tracking-tight leading-tight">{t('app_title')}</p>
            <p className="text-blue-600 text-[10px] font-bold tracking-wider uppercase mt-0.5">{t('app_subtitle')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close Sidebar"
        >
          <RiCloseLine className="text-xl" />
        </button>
      </div>



      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
        <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase px-2 pb-1 pt-1">
          {t('navigation')}
        </p>
        <div className="flex flex-col gap-1">
          {navItems.map((item, idx) => {
            if (item.isDivider) {
              return (
                <div key={`divider-${idx}`} className="mt-4 mb-1 px-2">
                  <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                    {item.label}
                  </p>
                </div>
              );
            }
            const Icon = item.icon;
            const isExactActive = (item.to.includes('?')) 
              ? location.pathname + location.search === item.to
              : location.pathname === item.to && !location.search;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={"nav-" + item.to.replace(/\//g, '-').replace(/\?/g, '-').replace(/&/g, '-').replace(/=/g, '-')}
                onClick={() => onClose && onClose()}
                className={() =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isExactActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`
                }
              >
                {() => (
                  <>
                    <Icon className={`text-base flex-shrink-0 transition-colors ${isExactActive ? "text-blue-600 font-black" : "text-slate-400"}`} />
                    <span className="truncate flex-1">{item.label}</span>
                    {isExactActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Information Card */}
      <div className="p-3 mt-auto">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
          <div
            className={`w-9 h-9 rounded-xl ${role.bg} text-white font-black text-xs flex items-center justify-center shadow-2xs flex-shrink-0`}
          >
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-slate-900 text-xs font-bold truncate">{user?.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <p className="text-slate-500 text-[10.5px] font-semibold truncate">
                {role.label}{user?.specialty?.name ? ` · ${user.specialty.name}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all border border-transparent hover:border-rose-100 cursor-pointer"
        >
          <RiLogoutBoxLine className="text-base text-slate-400" />
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </aside>
  );
}
