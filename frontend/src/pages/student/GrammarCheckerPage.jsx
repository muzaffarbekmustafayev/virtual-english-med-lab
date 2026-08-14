import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import {
  RiQuillPenLine,
  RiSearchLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiVolumeUpLine,
  RiMicLine,
  RiMicFill,
  RiPrinterLine,
  RiHistoryLine,
  RiSparklingLine,
  RiMedicineBottleLine,
  RiCheckDoubleLine,
  RiFileTextLine,
  RiLightbulbLine,
  RiCloseLine,
  RiArrowRightLine,
} from "react-icons/ri";

const TEMPLATES = [
  {
    id: "soap",
    title: "SOAP Note",
    description: "Subjective, Objective, Assessment, Plan",
    text: "S: Patient complains of sharp dental pain in upper right quadrant for 3 days, worsened by cold liquids.\nO: Examination shows localized caries on tooth #14 with sensitivity to percussion. No swelling.\nA: Acute reversible pulpitis tooth #14.\nP: Planned composite restoration. Advised analgesic as needed and scheduled follow-up."
  },
  {
    id: "referral",
    title: "Patient Referral",
    description: "Referral to specialist",
    text: "Dear Dr. Smith,\nI am referring Mr. John Doe (age 42) for endodontic evaluation of tooth #19. The patient presents with persistent nocturnal throbbing pain and periapical radiolucency. Please evaluate for root canal therapy."
  },
  {
    id: "intake",
    title: "Dental History",
    description: "Initial consultation notes",
    text: "Chief Complaint: 35-year-old female presents for routine dental examination and complaints of gingival bleeding during brushing. Medical history is unremarkable with no known drug allergies."
  },
  {
    id: "discharge",
    title: "Discharge Instructions",
    description: "Post-operative advice",
    text: "Post-extraction instructions: Bite gently on the gauze pad for 45 minutes. Avoid hot beverages, spitting, and smoking for 24 hours. Take prescribed ibuprofen 400mg every 6 hours for discomfort."
  }
];

const STYLES = [
  { id: "clinical", label: "Doctor-to-Doctor (Clinical)", desc: "Formal case notes & medical terminology" },
  { id: "patient", label: "Doctor-to-Patient (Consultation)", desc: "Clear, empathetic & plain language" },
  { id: "academic", label: "Academic / Research", desc: "Scientific precision & formal English" },
  { id: "general", label: "General Medical English", desc: "Standard grammar & spelling" },
];

export default function GrammarCheckerPage() {
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
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("grammar_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

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

  useEffect(() => {
    localStorage.setItem("grammar_history", JSON.stringify(history));
  }, [history]);

  // Speech Recognition (Dictation)
  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Brauzeringizda ovozli diktovka qo'llab-quvvatlanmaydi");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.success("Ovozli kiritish faollashdi (Inglizcha gapiring)");
  };

  // Text to Speech
  const speakText = (content) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Check Grammar
  const check = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/student/grammar-check", { text, mode });
      setResult(res.data);

      // Add to history
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString("uz-UZ"),
        time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        mode,
        preview: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
        text,
        result: res.data,
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
      toast.success("Tahlil yakunlandi!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Tekshirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Apply Corrected Text to Editor
  const applyCorrection = () => {
    if (!result?.corrected_text) return;
    setText(result.corrected_text);
    toast.success("To'g'rilangan matn muharrirga joylandi!");
  };

  // Copy to clipboard
  const copyText = (content, label = "Matn") => {
    navigator.clipboard.writeText(content);
    toast.success(`${label} nusxalandi!`);
  };

  // Word count & stats
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readingTime = Math.ceil(wordCount / 180);

  return (
    <Layout>
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              AI Medical Writing Assistant
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiQuillPenLine className="text-emerald-500" /> Grammar & Clinical Style Checker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tibbiy inglizcha matnlaringizni grammatika, uslub, klinik atamalar va ravonlik bo'yicha tahlil qiling
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition shadow-sm"
          >
            <RiHistoryLine /> Tarix ({history.length})
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            <RiPrinterLine /> PDF / Chop etish
          </button>
        </div>
      </div>

      {/* ── Clinical Templates Bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <RiFileTextLine className="text-emerald-500" /> Klinik Shablonlar (Tezkor Qoliplar):
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                setText(tmpl.text);
                setResult(null);
                toast.success(`${tmpl.title} shabloni kiritildi!`);
              }}
              className="text-left p-3 rounded-xl border border-gray-100 bg-gray-50/80 hover:bg-emerald-50/60 hover:border-emerald-200 transition group"
            >
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">{tmpl.title}</p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">{tmpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Dual Editor Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Input & Editor */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Klinik Uslub & Maqsad (Tone):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setMode(s.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    mode === s.id
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm"
                      : "bg-gray-50/60 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Header */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs font-bold uppercase text-gray-500">Matningiz (Inglizcha)</span>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{wordCount} so'z</span>
              <span>•</span>
              <span>{charCount} belgi</span>
              <span>•</span>
              <span>~{readingTime} daq o'qish</span>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Inglizcha klinik matn, epikriz, yoki bemor bilan muloqot jumlalarini bu yerga yozing..."
              rows={12}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none font-normal"
            />
          </div>

          {/* Editor Controls */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                title="Ovozli diktovka"
              >
                {isListening ? <RiMicFill className="text-sm" /> : <RiMicLine className="text-sm" />}
                {isListening ? "Tinglanmoqda..." : "Diktovka"}
              </button>

              {text && (
                <button
                  onClick={() => speakText(text)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition"
                  title="Ovozli eshitish"
                >
                  <RiVolumeUpLine />
                </button>
              )}

              <button
                onClick={() => {
                  setText("");
                  setResult(null);
                }}
                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition"
                title="Tozalash"
              >
                <RiDeleteBinLine />
              </button>
            </div>

            <button
              onClick={check}
              disabled={loading || !text.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Tahlil qilinmoqda...
                </>
              ) : (
                <>
                  <RiSparklingLine className="text-base" /> Tekshirish & Yaxshilash
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Results & Analysis */}
        <div className="space-y-4">
          {!result ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
                <RiQuillPenLine />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Natijalar Kutilyapti</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Matningizni chap oynaga kiriting va <b>Tekshirish</b> tugmasini bosing. AI grammatika, uslub va tibbiy terminologiyani tekshirib beradi.
              </p>
            </div>
          ) : (
            <>
              {/* Overall Quality Banner */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                        result.quality_score >= 85
                          ? "bg-emerald-100 text-emerald-800"
                          : result.quality_score >= 70
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {result.quality_score}%
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {result.has_errors
                          ? `${result.errors?.length || 0} ta tuzatish taklifi topildi`
                          : "Matn ajoyib va xatolarsiz!"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        O'qilishi: <b>{result.readability || "Moderate"}</b> • Uslub: <b>{mode}</b>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={applyCorrection}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                      title="Muharrirga qo'llash"
                    >
                      <RiCheckDoubleLine /> Qo'llash
                    </button>
                    <button
                      onClick={() => copyText(result.corrected_text, "To'g'rilangan matn")}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                      title="Nusxalash"
                    >
                      <RiFileCopyLine />
                    </button>
                  </div>
                </div>

                {/* 4 Metrics Bars */}
                {result.metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Grammatika</span>
                        <span className="font-bold">{result.metrics.grammar}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${result.metrics.grammar}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Tibbiy Lug'at</span>
                        <span className="font-bold">{result.metrics.vocabulary}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full"
                          style={{ width: `${result.metrics.vocabulary}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Ravonlik (Clarity)</span>
                        <span className="font-bold">{result.metrics.clarity}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${result.metrics.clarity}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Klinik Aniqlik</span>
                        <span className="font-bold">{result.metrics.medical_accuracy}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${result.metrics.medical_accuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Corrected Text Box */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <RiSparklingLine /> To'g'rilangan & Sayqallangan Matn:
                  </span>
                  <button
                    onClick={() => speakText(result.corrected_text)}
                    className="text-xs text-gray-500 hover:text-emerald-600 flex items-center gap-1"
                  >
                    <RiVolumeUpLine /> Tinglash
                  </button>
                </div>
                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl text-sm text-gray-900 leading-relaxed">
                  {result.corrected_text}
                </div>
              </div>

              {/* Medical Terminology Upgrades */}
              {result.medical_enhancements?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-1.5 mb-3">
                    <RiMedicineBottleLine /> Professional Tibbiy Terminlar Taklifi:
                  </h4>
                  <div className="space-y-2">
                    {result.medical_enhancements.map((m, i) => (
                      <div
                        key={i}
                        className="p-3 bg-cyan-50/40 border border-cyan-100 rounded-xl flex items-start gap-3"
                      >
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 line-through">
                          {m.original}
                        </span>
                        <RiArrowRightLine className="text-cyan-500 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded">
                            {m.suggested}
                          </span>
                          {m.reason && <p className="text-[11px] text-gray-600 mt-1">{m.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors & Explanations List */}
              {result.errors?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5 mb-3">
                    <RiAlertLine /> Aniqlangan Xatoliklar va Izohlar:
                  </h4>
                  <div className="space-y-3">
                    {result.errors.map((err, i) => (
                      <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">#{i + 1}</span>
                          {err.category && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                              {err.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-rose-600 line-through font-medium">{err.original}</span>
                          <span className="text-gray-400">➔</span>
                          <span className="text-emerald-700 font-bold">{err.corrected}</span>
                        </div>
                        {err.explanation && <p className="text-gray-600 text-[11px]">{err.explanation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Advice */}
              {result.clinical_tone_advice && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-900 flex items-start gap-2.5">
                  <RiLightbulbLine className="text-base text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Klinik Yozish Bo'yicha Maslahat: </span>
                    {result.clinical_tone_advice}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── History Modal / Drawer ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <RiHistoryLine className="text-emerald-500" /> Tekshiruvlar Tarixi
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">Tarix hozircha bo'sh</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setText(h.text);
                      setResult(h.result);
                      setMode(h.mode || "clinical");
                      setShowHistory(false);
                      toast.success("Tarixdan yuklandi!");
                    }}
                    className="p-3 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-200 rounded-xl cursor-pointer transition text-xs space-y-1"
                  >
                    <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                      <span>{h.date} {h.time}</span>
                      <span className="uppercase text-emerald-700">{h.mode}</span>
                    </div>
                    <p className="font-medium text-gray-800 line-clamp-2">{h.preview}</p>
                    <div className="text-[10px] text-gray-500">
                      Sifat bali: <b>{h.result?.quality_score}%</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
