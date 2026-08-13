import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../lib/api";
import { RiQuillPenLine, RiSearchLine, RiCheckboxCircleLine, RiAlertLine, RiDeleteBinLine } from "react-icons/ri";

export default function GrammarCheckerPage() {
  const [text, setText] = useState(() => {
    return localStorage.getItem("grammar_text") || "";
  });
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem("grammar_result");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

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

  const check = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.post("/student/grammar-check", { text });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 4 }}>AI Writing Tool</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0d1b2a", letterSpacing: "-0.03em" }}>Grammar Checker</h1>
        <p style={{ fontSize: 13.5, color: "#6b7280", marginTop: 6 }}>Check your English medical texts for grammar, spelling, and style issues.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Input panel */}
        <div className="animate-fade-up card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280" }}>Your Text</label>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{text.length} chars</span>
          </div>
          <textarea
            id="grammar-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type or paste your English text here..."
            rows={12}
            style={{ width: "100%", background: "#f8fafc", border: "1px solid #dde3ea", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: "#0d1b2a", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.65, transition: "border-color 0.15s, box-shadow 0.15s" }}
            onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.10)"; }}
            onBlur={e => { e.target.style.borderColor = "#dde3ea"; e.target.style.boxShadow = "none"; }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <button onClick={() => { setText(""); setResult(null); }} className="btn-ghost" style={{ padding: "9px 14px", fontSize: 12.5, gap: 6 }}>
              <RiDeleteBinLine style={{ fontSize: 14 }} /> Clear
            </button>
            <button id="grammar-check-btn" onClick={check} disabled={loading || !text.trim()} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "10px 16px", fontSize: 13, gap: 6 }}>
              {loading
                ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} /> Analyzing...</>
                : <><RiSearchLine style={{ fontSize: 15 }} /> Check Grammar</>
              }
            </button>
          </div>
        </div>

        {/* Result panel */}
        <div className="animate-fade-up delay-100 card" style={{ padding: "22px 24px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 14 }}>Analysis Result</label>

          {!result && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, color: "#9ca3af", textAlign: "center", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RiQuillPenLine style={{ fontSize: 24, color: "#cbd5e1" }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#6b7280" }}>No analysis yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Enter text and click "Check Grammar"</p>
              </div>
            </div>
          )}

          {result && (
            <div>
              {/* Status banner */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                background: result.has_errors ? "#fffbeb" : "#ecfdf5",
                border: "1px solid " + (result.has_errors ? "#fde68a" : "#a7f3d0"),
              }}>
                {result.has_errors
                  ? <RiAlertLine style={{ fontSize: 18, color: "#d97706", flexShrink: 0 }} />
                  : <RiCheckboxCircleLine style={{ fontSize: 18, color: "#059669", flexShrink: 0 }} />
                }
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: result.has_errors ? "#92400e" : "#065f46" }}>
                    {result.has_errors ? "Issues found" : "Looks good!"}
                  </p>
                  {result.error_count > 0 && (
                    <p style={{ fontSize: 11.5, color: "#b45309", marginTop: 1 }}>{result.error_count} issue{result.error_count > 1 ? "s" : ""} detected</p>
                  )}
                </div>
              </div>

              {/* Corrected text */}
              {result.corrected_text && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Corrected Text</p>
                  <div style={{ background: "#f8fafc", border: "1px solid #dde3ea", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: "#0d1b2a", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                    {result.corrected_text}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Explanation</p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{result.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
