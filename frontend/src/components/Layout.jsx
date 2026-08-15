import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { RiMenu4Line, RiUser3Line, RiShieldCheckLine, RiHeartPulseLine } from 'react-icons/ri';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const specialtyName = user?.specialty?.name || "Stomatologiya";
  const isDental = specialtyName.toLowerCase().includes('stom') || specialtyName.toLowerCase().includes('dent');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Standard Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen w-full flex flex-col md:pl-[260px] transition-all overflow-x-hidden">
        {/* Standard Top Navbar Header */}
        <header className="sticky top-0 left-0 right-0 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 z-30 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
          {/* Left section: Mobile menu trigger + Specialty tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-lg transition-colors cursor-pointer focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <RiMenu4Line />
            </button>

            {/* Medical Department / Specialty Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                <span>{isDental ? '🦷' : '🩺'}</span>
                <span className="truncate max-w-[180px] sm:max-w-none">{specialtyName}</span>
              </span>
              <span className="hidden md:inline-block text-xs font-semibold text-slate-400">
                · {t('app_title')}
              </span>
            </div>
          </div>

          {/* Right section: Language Dropdown & Quick User Profile */}
          <div className="flex items-center gap-3">
            <LanguageSelector variant="navbar" />

            {/* User Quick Chip */}
            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shadow-xs flex-shrink-0">
                  {user.full_name?.[0]?.toUpperCase() || <RiUser3Line />}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-tight truncate max-w-[130px]">
                    {user.full_name?.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {user.role}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="flex-1 w-full px-4 py-6 sm:px-6 md:px-8 max-w-[1400px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
