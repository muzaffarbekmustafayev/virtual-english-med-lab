import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../lib/api";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "react-hot-toast";
import {
  RiQuillPenLine, RiCheckboxCircleLine, RiFileCopyLine,
  RiSparklingLine, RiLightbulbLine, RiStethoscopeLine,
  RiCheckLine, RiCloseLine
} from "react-icons/ri";

export default function GrammarCheckerPage() {
  const { t } = useLanguage();
  const [text, setText] = useState(() => localStorage.getItem("grammar_text") || "");
  const [mode, setMode] = useState("clinical");
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem("grammar_result");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    localStorage.setItem("grammar_text", text);
  }, [text]);

  useEffect(() => {
    if (result) {
      localStorage.setItem("grammar_result", JSON.stringify(result));
    } else {
      localStorage.removeItem("grammar_result");
    }
  }, [result]);

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error(t('student.grammar.input_label'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/student/grammar/check", { text, mode });
      setResult(res.data);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    toast.success("Nusxa olindi!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleTexts = [
    "The patient have severe toothache in lower molar since 3 days and pain get worse with cold water.",
    "Patient is complaining from swollen gum and bleeding when he brush teeth.",
    "I prescribe patient amoxicillin 500mg because he have acute dental abscess.",
    "The caries have reached the dental pulp and causing severe sensitivity.",
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Page Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-blue">
                <RiStethoscopeLine /> AI Tibbiy Tahlil
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                <RiQuillPenLine />
              </span>
              {t('student.grammar.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
              {t('student.grammar.subtitle')}
            </p>
          </div>

          {/* Sample text picker & clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const rnd = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                setText(rnd);
              }}
              className="btn-secondary-soft text-xs"
            >
              {t('student.grammar.sample_btn')}
            </button>
            {text && (
              <button
                onClick={() => { setText(""); setResult(null); }}
                className="btn-secondary-soft text-xs text-rose-600 hover:bg-rose-50"
              >
                {t('student.grammar.clear_btn')}
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Editor & Mode Selector ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="card-standard p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {t('student.grammar.input_label')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">{text.length} belgi</span>
                </div>
              </div>

              <textarea
                rows={7}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('student.grammar.placeholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs md:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("clinical")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === "clinical"
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-extrabold"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🦷 Klinik Ingliz Tili
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("general")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === "general"
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-extrabold"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🩺 Umumiy Tibbiyot
                  </button>
                </div>

                <button
                  onClick={handleCheck}
                  disabled={loading || !text.trim()}
                  className="btn-primary-gradient"
                >
                  <RiSparklingLine className="text-base" />
                  <span>{loading ? t('student.grammar.checking') : t('student.grammar.check_btn')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. Analysis & Results Card ── */}
          <div className="lg:col-span-6 space-y-4">
            {result ? (
              <div className="card-standard p-6 space-y-5 animate-scale-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <RiCheckboxCircleLine className="text-emerald-600 text-lg" />
                    <span>{t('student.grammar.result_title')}</span>
                  </h2>
                  {result.score !== undefined && (
                    <span className="badge-standard badge-emerald">
                      {t('student.grammar.accuracy_score')}: {result.score}%
                    </span>
                  )}
                </div>

                {/* Corrected sentence block */}
                {result.corrected && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                        {t('student.grammar.corrected_version')}
                      </span>
                      <button
                        onClick={() => handleCopy(result.corrected)}
                        className="p-1.5 rounded-lg bg-white text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Nusxa olish"
                      >
                        {copied ? <RiCheckLine /> : <RiFileCopyLine />}
                        <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                      </button>
                    </div>
                    <p className="text-sm font-bold text-emerald-950 font-mono leading-relaxed">
                      {result.corrected}
                    </p>
                  </div>
                )}

                {/* Detailed fixes list */}
                {result.errors?.length > 0 ? (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {t('student.grammar.detailed_fixes')} ({result.errors.length})
                    </h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {result.errors.map((err, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center gap-2 text-rose-600 line-through font-semibold">
                            <span>❌</span> <span>{err.original || err.error}</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-700 font-bold">
                            <span>✓</span> <span>{err.suggested || err.correction}</span>
                          </div>
                          {err.explanation && (
                            <p className="text-slate-500 text-[11px] pl-4 font-medium">
                              💡 {err.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <RiCheckLine className="text-lg" />
                    <span>Jumlada grammatik xatolik topilmadi! A'lo natija.</span>
                  </div>
                )}

                {/* Medical vocab suggestions */}
                {result.suggestions?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                    <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <RiLightbulbLine /> {t('student.grammar.vocab_suggestions')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {result.suggestions.map((s, idx) => (
                        <span key={idx} className="badge-standard badge-blue bg-white">
                          {typeof s === 'string' ? s : s.term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card-standard p-12 text-center flex flex-col items-center justify-center text-slate-400 h-full min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl text-slate-400 mb-3 shadow-2xs">
                  <RiQuillPenLine />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Tahlil natijalari bu yerda chiqadi</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Chapdagi maydonga tibbiy matnni kiriting va "Tekshirish" tugmasini bosing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
