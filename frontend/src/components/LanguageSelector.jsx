import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { RiTranslate2, RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

// High-definition Vector Country Flags
export const FlagUZ = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 500 250" className={`rounded-[2px] shadow-2xs overflow-hidden shrink-0 ${className}`}>
    <rect width="500" height="250" fill="#1eb53a" />
    <rect width="500" height="166.6" fill="#0099b5" />
    <rect width="500" height="83.3" fill="#ffffff" y="83.3" />
    <rect width="500" height="5" fill="#ce1126" y="80.8" />
    <rect width="500" height="5" fill="#ce1126" y="164.1" />
    <circle cx="70" cy="41.6" r="28" fill="#ffffff" />
    <circle cx="80" cy="41.6" r="24" fill="#0099b5" />
    <g fill="#ffffff" transform="scale(0.8) translate(30, 2)">
      <circle cx="115" cy="22" r="3.5" /><circle cx="130" cy="22" r="3.5" /><circle cx="145" cy="22" r="3.5" />
      <circle cx="100" cy="37" r="3.5" /><circle cx="115" cy="37" r="3.5" /><circle cx="130" cy="37" r="3.5" /><circle cx="145" cy="37" r="3.5" />
      <circle cx="85" cy="52" r="3.5" /><circle cx="100" cy="52" r="3.5" /><circle cx="115" cy="52" r="3.5" /><circle cx="130" cy="52" r="3.5" /><circle cx="145" cy="52" r="3.5" />
    </g>
  </svg>
);

export const FlagRU = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 600 400" className={`rounded-[2px] shadow-2xs overflow-hidden shrink-0 ${className}`}>
    <rect width="600" height="400" fill="#d52b1e" />
    <rect width="600" height="266.6" fill="#0039a6" />
    <rect width="600" height="133.3" fill="#ffffff" />
  </svg>
);

export const FlagGB = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 60 30" className={`rounded-[2px] shadow-2xs overflow-hidden shrink-0 ${className}`}>
    <clipPath id="gb-s">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <clipPath id="gb-t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
    </clipPath>
    <g clipPath="url(#gb-s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

export const LANGUAGES = [
  {
    code: 'uz',
    label: "O'zbekcha",
    short: 'UZ',
    Flag: FlagUZ,
  },
  {
    code: 'ru',
    label: 'Русский',
    short: 'RU',
    Flag: FlagRU,
  },
  {
    code: 'en',
    label: 'English',
    short: 'EN',
    Flag: FlagGB,
  },
];

export default function LanguageSelector({ variant = 'navbar', className = '' }) {
  const { lang, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const CurrentFlag = currentLang.Flag;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Clean Top Navbar Dropdown
  if (variant === 'navbar') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
            isOpen
              ? 'border-indigo-400 ring-2 ring-indigo-500/15 bg-indigo-50/20'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          id="language-selector-btn"
        >
          <div className="flex items-center justify-center p-0.5 rounded-md bg-slate-100 border border-slate-200/70 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <CurrentFlag className="w-4.5 h-3" />
          </div>

          <span className="font-extrabold text-xs text-slate-800 tracking-tight">
            {currentLang.label}
          </span>

          <RiArrowDownSLine
            className={`text-slate-400 text-sm transition-transform duration-200 group-hover:text-indigo-600 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-2.5 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 mb-1">
              <RiTranslate2 className="text-indigo-600 text-xs" />
              <span>{t('select_language') || 'Tilni tanlang'}</span>
            </div>

            {/* Language Options */}
            <div className="space-y-0.5">
              {LANGUAGES.map((item) => {
                const isActive = lang === item.code;
                const ItemFlag = item.Flag;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      changeLanguage(item.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-200/90 text-indigo-950 shadow-2xs font-extrabold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-0.5 rounded-md flex items-center justify-center border shadow-2xs transition-transform ${
                          isActive
                            ? 'bg-white border-indigo-200 scale-105'
                            : 'bg-slate-100 border-slate-200/70'
                        }`}
                      >
                        <ItemFlag className="w-4.5 h-3" />
                      </div>
                      <span className="text-xs tracking-tight">
                        {item.label}
                      </span>
                    </div>

                    {isActive && (
                      <div className="w-4.5 h-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <RiCheckLine className="text-xs font-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Compact Segmented Control (for Auth, Modals, Footers)
  return (
    <div
      className={`inline-flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-inner ${className}`}
    >
      {LANGUAGES.map((item) => {
        const isActive = lang === item.code;
        const ItemFlag = item.Flag;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => changeLanguage(item.code)}
            className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title={item.label}
          >
            <ItemFlag className="w-4 h-2.5" />
            <span className="tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
