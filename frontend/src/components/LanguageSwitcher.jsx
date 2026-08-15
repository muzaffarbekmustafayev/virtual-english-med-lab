import { useLanguage } from '../contexts/LanguageContext';
import { RiTranslate2, RiCheckLine } from 'react-icons/ri';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿', full: "O'zbekcha" },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', full: 'Русский' },
  { code: 'en', label: 'English', flag: '🇬🇧', full: 'English' },
];

export default function LanguageSwitcher({ variant = 'pill', className = '' }) {
  const { language, setLanguage } = useLanguage();
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

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200 shadow-xs ${className}`}>
        {LANGUAGES.map((l) => {
          const isActive = l.code === language;
          return (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm border border-gray-200/80 scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
              title={l.full}
            >
              <span className="text-xs">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 ${className}`}>
        <div className="flex items-center gap-2 text-white/70 text-xs font-semibold px-1">
          <RiTranslate2 className="text-sm text-blue-400" />
          <span>Language:</span>
        </div>
        <div className="flex items-center gap-1">
          {LANGUAGES.map((l) => {
            const isActive = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={l.full}
              >
                <span>{l.flag}</span> {l.code.toUpperCase()}
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-bold shadow-xs transition-all hover:bg-gray-50"
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <RiTranslate2 className="text-gray-400 text-sm ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-gray-200 shadow-xl py-1.5 z-50 animate-scale-in">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                l.code === language ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{l.flag}</span>
                <span>{l.full}</span>
              </div>
              {l.code === language && <RiCheckLine className="text-blue-600 text-sm" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
