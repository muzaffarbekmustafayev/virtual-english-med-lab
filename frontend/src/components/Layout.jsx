import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { Avatar } from './ui';
import {
  RiMenu4Line, RiUser3Line, RiLogoutBoxRLine, RiArrowDownSLine,
  RiShieldCheckLine, RiUserStarLine, RiStethoscopeLine
} from 'react-icons/ri';

const SPECIALTY_EMOJI = { STOM: '🦷', GEN_MED: '🩺', PED: '👶', NURSING: '💉', FIRST_AID: '🚑' };

export default function Layout({ children, contentClass = '' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const { t, getLocalized } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Sahifa o'zgarganda mobil menyuni yopish
  useEffect(() => { setIsMobileMenuOpen(false); setMenuOpen(false); }, [location.pathname]);

  // Mobil menyu ochiq bo'lsa body scroll'ni bloklash
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); setIsMobileMenuOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  const role = user?.role || 'student';
  const specialtyName = getLocalized(user?.specialty, 'name') || user?.specialty?.name || '';
  const specialtyEmoji = user?.specialty?.icon || SPECIALTY_EMOJI[user?.specialty?.code] || '🩺';

  const PORTAL = {
    student: { label: t('header_student_portal'), icon: RiStethoscopeLine, cls: 'bg-blue-50 text-blue-700 border-blue-200/80' },
    teacher: { label: t('header_teacher_portal'), icon: RiUserStarLine, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
    admin:   { label: t('header_admin_portal'),   icon: RiShieldCheckLine, cls: 'bg-purple-50 text-purple-700 border-purple-200/80' },
  }[role];
  const PortalIcon = PORTAL.icon;
  const ROLE_LABEL = { student: t('role_student'), teacher: t('role_teacher'), admin: t('role_admin') }[role];
  // "Dr. John Watson" → "Dr. John"; "Ali Valiyev" → "Ali"
  const shortName = (() => {
    const parts = (user?.full_name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return t('ui_user');
    return parts[0].endsWith('.') && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
  })();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast.success(t('ui_sign_out_success'));
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-bg min-h-screen text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main column */}
      <div className="min-h-screen flex flex-col md:pl-[264px]">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden btn-icon bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label={t('ui_open_menu')}
            >
              <RiMenu4Line className="text-lg" />
            </button>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold border ${PORTAL.cls}`}>
              <PortalIcon className="text-sm" />
              <span className="truncate max-w-[140px] sm:max-w-none">{PORTAL.label}</span>
            </span>

            {role === 'student' && specialtyName && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-[220px]">
                <span>{specialtyEmoji}</span>
                <span className="truncate">{specialtyName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="navbar" />

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                id="header-user-menu-btn"
                className={`flex items-center gap-2 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-2xl border transition-all ${
                  menuOpen ? 'border-blue-300 bg-blue-50/40 ring-2 ring-blue-500/10' : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={user?.full_name} seed={user?.id} size="w-8 h-8 text-[11px]" className="rounded-xl" />
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-[12px] font-extrabold text-slate-900 max-w-[130px] truncate">{shortName}</span>
                  <span className="block text-[10px] font-bold text-slate-400">{ROLE_LABEL}</span>
                </span>
                <RiArrowDownSLine className={`hidden sm:block text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 p-1.5 z-[100] animate-scale-in origin-top-right">
                  <div className="px-3 py-2.5 border-b border-slate-100 mb-1 flex items-center gap-3">
                    <Avatar name={user?.full_name} seed={user?.id} size="w-10 h-10 text-sm" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('header_signed_in_as')}</p>
                      <p className="text-xs font-extrabold text-slate-900 truncate">{user?.full_name}</p>
                      <p className="text-[11px] font-medium text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); navigate(`/${role}/profile`); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <RiUser3Line className="text-base text-blue-600" />
                    <span>{t('ui_my_profile')}</span>
                  </button>
                  <button
                    role="menuitem"
                    id="header-logout-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <RiLogoutBoxRLine className="text-base" />
                    <span>{t('sign_out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 w-full px-3 py-5 sm:px-6 sm:py-6 lg:px-8 max-w-[1440px] mx-auto animate-fade-in ${contentClass}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
