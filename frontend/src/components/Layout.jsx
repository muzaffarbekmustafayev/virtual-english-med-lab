import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { RiMenu4Line, RiUser3Line, RiShieldCheckLine, RiHeartPulseLine, RiSparklingFill } from 'react-icons/ri';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const specialtyName = user?.specialty?.name || "Stomatologiya";
  const isDental = specialtyName.toLowerCase().includes('stom') || specialtyName.toLowerCase().includes('dent');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Standard Sidebar Navigation */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex-1 min-h-screen w-full flex flex-col md:pl-[260px] transition-all overflow-x-hidden">
        {/* Sticky Top Header */}
        <header className="sticky top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 z-30 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
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
              <span className="hidden lg:inline-block text-xs font-bold text-slate-400">
                · {t('app_title')}
              </span>
            </div>
          </div>

          {/* Right section: Language Dropdown & Quick User Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-[11px] font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[120px]">{user?.full_name?.split(' ')[0] || 'User'}</span>
            </div>
            <LanguageSelector variant="navbar" />
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 w-full px-4 py-6 sm:px-6 md:px-8 max-w-[1440px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
