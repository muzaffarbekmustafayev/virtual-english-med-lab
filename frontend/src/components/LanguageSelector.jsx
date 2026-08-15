import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { RiTranslate2, RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

export default function LanguageSelector({ variant = 'navbar' }) {
  const { lang, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'uz', label: "O'zbekcha", short: 'UZ', flag: '🇺🇿' },
    { code: 'ru', label: 'Русский',   short: 'RU', flag: '🇷🇺' },
    { code: 'en', label: 'English',   short: 'EN', flag: '🇬🇧' },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

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

  // 1. Standard Top Navbar Dropdown (Standard Web Placement)
  if (variant === 'navbar') {
    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 text-slate-800 font-bold text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-sm leading-none">{currentLang.flag}</span>
          <span className="hidden sm:inline font-bold text-slate-700">{currentLang.label}</span>
          <span className="sm:hidden font-extrabold text-slate-700">{currentLang.short}</span>
          <RiArrowDownSLine
            className={`text-slate-400 text-sm transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center gap-1.5">
              <RiTranslate2 className="text-indigo-600" />
              <span>Tilni tanlang / Select</span>
            </div>

            <div className="p-1 space-y-0.5">
              {languages.map((item) => {
                const isActive = lang === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      changeLanguage(item.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{item.flag}</span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <RiCheckLine className="text-indigo-600 font-black text-sm" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Compact Segmented Pill (e.g. for Auth or modal forms)
  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => changeLanguage(item.code)}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            lang === item.code
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title={item.label}
        >
          <span>{item.flag}</span>
          <span className="text-[11px]">{item.short}</span>
        </button>
      ))}
    </div>
  );
}
