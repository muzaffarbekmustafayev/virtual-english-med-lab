import { useLanguage } from '../contexts/LanguageContext';
import { RiTranslate2, RiCheckLine, RiArrowDownSLine } from 'react-icons/ri';
import { useState, useRef, useEffect } from 'react';
import { FlagUZ, FlagRU, FlagGB, LANGUAGES } from './LanguageSelector';

export default function LanguageSwitcher({ variant = 'pill', className = '' }) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const CurrentFlag = currentLang.Flag;

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-inner ${className}`}>
        {LANGUAGES.map((l) => {
          const isActive = l.code === language;
          const FlagIcon = l.Flag;
          return (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title={l.label}
            >
              <FlagIcon className="w-4 h-2.5" />
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10 ${className}`}>
        <div className="flex items-center gap-2 text-white/70 text-xs font-semibold px-1">
          <RiTranslate2 className="text-sm text-indigo-400" />
          <span>{t('select_language') || 'Language'}:</span>
        </div>
        <div className="flex items-center gap-1">
          {LANGUAGES.map((l) => {
            const isActive = l.code === language;
            const FlagIcon = l.Flag;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={l.label}
              >
                <FlagIcon className="w-3.5 h-2.5" />
                <span>{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Dropdown style
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-extrabold shadow-xs transition-all hover:bg-slate-50 cursor-pointer"
      >
        <CurrentFlag className="w-4 h-2.5" />
        <span>{currentLang.label}</span>
        <RiArrowDownSLine className={`text-slate-400 text-sm transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
          {LANGUAGES.map((l) => {
            const FlagIcon = l.Flag;
            const isActive = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 text-xs font-extrabold rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-200/90' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FlagIcon className="w-4.5 h-3" />
                  <span>{l.label}</span>
                </div>
                {isActive && <RiCheckLine className="text-indigo-600 text-sm font-black" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
