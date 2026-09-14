import { useEffect, useMemo, useState } from 'react';
import {
  RiBrainLine, RiLightbulbLine, RiSpeakLine, RiAlertLine, RiVolumeUpLine,
  RiArrowRightLine, RiArrowLeftLine, RiCheckLine, RiCheckDoubleLine, RiBookOpenLine, RiFlashlightLine,
} from 'react-icons/ri';
import { useLanguage, looksEnglish } from '../contexts/LanguageContext';

/**
 * Language-aware field picker.
 *   uz → *_uz → base
 *   ru → *_ru → *_uz → base
 *   en → *_en → base (base is written in Uzbek by the seeder, so it is the last resort only)
 * Returns '' when nothing usable exists so the caller can hide the block.
 */
export function pickLang(obj, field, lang) {
  if (!obj) return '';
  const v = (k) => {
    const x = obj[k];
    return typeof x === 'string' && x.trim() ? x.trim() : '';
  };
  if (lang === 'en') {
    // English interface: only English text may be shown — never an Uzbek/Russian fallback
    for (const k of [`${field}_en`, field, `${field}_uz`]) { const r = v(k); if (r && looksEnglish(r)) return r; }
    return '';
  }
  const chain = lang === 'ru'
    ? [`${field}_ru`, `${field}_uz`, field, `${field}_en`]
    : [`${field}_uz`, field, `${field}_en`, `${field}_ru`];
  for (const k of chain) { const r = v(k); if (r) return r; }
  return '';
}

/** Translation of an example: only the requested language (ru falls back to uz); never shows English twice. */
function exampleTranslation(ex, lang) {
  if (lang === 'en') return ex.translation_en || '';
  if (lang === 'ru') return ex.translation_ru || ex.translation_uz || ex.translation || '';
  return ex.translation_uz || ex.translation || '';
}

function parseJsonList(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

/** "Formula: X | Y" banners: strip legacy prefixes and split alternatives onto separate lines. */
function formulaLines(raw) {
  if (!raw) return [];
  return raw
    .replace(/^(formula\s*\/\s*формула\s*:\s*|formula\s*:\s*|формула\s*:\s*|pattern\s*:\s*|struktura\s*:\s*)/i, '')
    .split(/\s*\|\s*/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function GrammarStep({ module, grammar = [], speakText, onComplete, storageKey }) {
  const { t, lang } = useLanguage();
  const rules = useMemo(() => grammar.map((g, i) => ({
    ...g,
    _idx: i,
    examples: parseJsonList(g.examples),
    common_mistakes: parseJsonList(g.common_mistakes),
  })), [grammar]);

  const [active, setActive] = useState(0);
  const [read, setRead] = useState(() => {
    try { const raw = localStorage.getItem(`${storageKey}_grammar_read`); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { setActive(0); }, [module?.id]);
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}_grammar_read`, JSON.stringify(read)); } catch { /* ignore */ }
  }, [read, storageKey]);

  const markRead = (idx) => setRead(prev => (prev.includes(idx) ? prev : [...prev, idx]));
  const goTo = (idx) => { setActive(Math.max(0, Math.min(rules.length - 1, idx))); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => { markRead(active); if (active < rules.length - 1) goTo(active + 1); else onComplete(); };

  const allRead = rules.length > 0 && rules.every(r => read.includes(r._idx));
  const focus = module?.grammar_focus;

  // ── empty state ────────────────────────────────────────────────────────────
  if (!rules.length) {
    return (
      <div className="animate-fade-in space-y-6">
        <Header t={t} focus={focus} />
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
          <RiLightbulbLine className="text-4xl text-amber-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">{t('grammar_no_rules_title')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{t('grammar_no_rules_desc')}</p>
        </div>
        <div className="flex justify-end pt-2">
          <PrimaryButton onClick={onComplete} label={t('grammar_all_learned')} />
        </div>
      </div>
    );
  }

  const visible = showAll ? rules : [rules[active]];

  return (
    <div className="animate-fade-in space-y-5">
      <Header t={t} focus={focus} />

      {/* ── topic navigator ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <RiBookOpenLine className="text-indigo-500" /> {t('grammar_topics')} · {read.length}/{rules.length}
          </span>
          <button
            onClick={() => setShowAll(v => !v)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${showAll ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
          >
            {t('grammar_show_all')}
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {rules.map((r, i) => {
            const isActive = !showAll && i === active;
            const isRead = read.includes(i);
            return (
              <button
                key={r.id || i}
                onClick={() => { setShowAll(false); goTo(i); }}
                title={pickLang(r, 'title', lang)}
                className={`flex-shrink-0 max-w-[220px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : isRead
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-white/20' : isRead ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200'}`}>
                  {isRead && !isActive ? <RiCheckLine /> : i + 1}
                </span>
                <span className="truncate">{pickLang(r, 'title', lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── rule cards ── */}
      {visible.map((g) => (
        <RuleCard key={g.id || g._idx} g={g} idx={g._idx} total={rules.length} lang={lang} t={t} speakText={speakText} isRead={read.includes(g._idx)} />
      ))}

      {/* ── navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={() => goTo(active - 1)}
          disabled={showAll || active === 0}
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RiArrowLeftLine /> {t('grammar_prev_topic')}
        </button>

        <div className="flex items-center gap-2">
          {allRead && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <RiCheckDoubleLine /> {t('grammar_all_topics_done')}
            </span>
          )}
          {showAll || active === rules.length - 1 || allRead ? (
            <PrimaryButton onClick={() => { rules.forEach(r => markRead(r._idx)); onComplete(); }} label={t('grammar_all_learned')} />
          ) : (
            <PrimaryButton onClick={next} label={t('grammar_mark_read')} />
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ t, focus }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div className="min-w-0">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <RiBrainLine className="text-indigo-600" /> {t('grammar_title')}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{t('grammar_subtitle')}</p>
        {focus && (
          <p className="text-xs mt-2 flex items-start gap-1.5 text-indigo-800">
            <RiFlashlightLine className="mt-0.5 shrink-0 text-indigo-500" />
            <span><span className="font-extrabold">{t('grammar_focus_label')}:</span> <span className="font-semibold">{focus}</span></span>
          </p>
        )}
      </div>
      <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-200 shrink-0">
        {t('step_badge_1')}
      </span>
    </div>
  );
}

function PrimaryButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
    >
      <span>{label}</span>
      <RiArrowRightLine className="text-base" />
    </button>
  );
}

function RuleCard({ g, idx, total, lang, t, speakText, isRead }) {
  const title = pickLang(g, 'title', lang);
  const rule = pickLang(g, 'rule_explanation', lang);
  const formula = formulaLines(pickLang(g, 'structure_pattern', lang));
  const examples = g.examples.filter(e => e && e.sentence);
  const mistakes = g.common_mistakes.filter(m => m && m.incorrect && m.correct);

  return (
    <div className="space-y-4">
      {/* rule */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200">
              §{idx + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                  {t('grammar_rule')}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{t('grammar_topic_n_of', { n: idx + 1, total })}</span>
                {isRead && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">✓ {t('grammar_read_badge')}</span>}
              </div>
              <h3 className="text-base md:text-lg font-extrabold text-slate-900 mt-1 leading-snug">{title}</h3>
            </div>
          </div>
        </div>

        {rule && (
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">{rule}</p>
          </div>
        )}

        {formula.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-teal-500/10 border border-indigo-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider">
              <RiLightbulbLine /> <span>{t('grammar_structure')}</span>
            </div>
            <div className="space-y-1.5">
              {formula.map((f, i) => (
                <code key={i} className="text-xs md:text-sm font-black text-indigo-950 font-mono tracking-tight block bg-white/60 rounded-lg px-3 py-1.5 border border-indigo-100">
                  {f}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* examples */}
      {examples.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <RiSpeakLine className="text-indigo-600 text-lg" />
            <h4 className="text-sm font-extrabold text-slate-900">{t('grammar_examples_from_dialogue')} ({examples.length})</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {examples.map((ex, i) => {
              const trans = exampleTranslation(ex, lang);
              const note = pickLang(ex, 'note', lang);
              return (
                <div key={i} className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs md:text-[13px] font-black text-indigo-900 leading-snug">“{ex.sentence}”</span>
                      <button
                        onClick={() => speakText(ex.sentence)}
                        title={t('grammar_listen')}
                        className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-colors shrink-0 shadow-2xs"
                      >
                        <RiVolumeUpLine size={15} />
                      </button>
                    </div>
                    {trans
                      ? <p className="text-xs text-slate-600 font-medium">{trans}</p>
                      : lang !== 'en' && <p className="text-[10px] text-slate-400 italic">{t('grammar_translation_missing')}</p>}
                  </div>
                  {note && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-slate-500 tracking-wide">
                      📌 {note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* mistakes */}
      {mistakes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <RiAlertLine className="text-amber-500 text-lg" />
            <h4 className="text-sm font-extrabold text-slate-900">{t('grammar_mistakes_title')}</h4>
          </div>
          <div className="space-y-3">
            {mistakes.map((m, i) => {
              const exp = pickLang(m, 'explanation', lang);
              return (
                <div key={i} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                      <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block mb-0.5">{t('grammar_incorrect')}</span>
                      <span className="font-semibold text-rose-800 line-through">“{m.incorrect}”</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block mb-0.5">{t('grammar_correct')}</span>
                      <span className="font-bold text-emerald-800">“{m.correct}”</span>
                    </div>
                  </div>
                  {exp && (
                    <p className="text-xs text-slate-500 font-medium pt-1">
                      💡 <b>{t('grammar_explanation_label')}</b> {exp}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
