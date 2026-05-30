
import React from "react";

const LABELS = {
  English: {
    title:       "📊 AI Feedback",
    clear:       "✕ Clear",
    confidence:  "Confidence",
    clarity:     "Clarity",
    fluency:     "Fluency",
    engagement:  "Engagement",
    camera:      "📷 Camera Analysis",
    avgEng:      "Avg Engagement",
    eyeContact:  "Eye Contact",
    posture:     "Posture",
    emotion:     "Emotion",
    tips:        "💡 Improvement Tips",
    noTips:      "No tips generated",
    fillers:     "🗣 Filler Words",
    total:       "Total count:",
    noFillers:   "No filler words detected 🎉",
    summary:     "📝 Summary",
    empty:       "No feedback yet",
    emptySub:    "Complete a practice session to see your AI analysis here.",
  },
  Urdu: {
    title:       "📊 AI فیڈبیک",
    clear:       "✕ صاف کریں",
    confidence:  "اعتماد",
    clarity:     "وضاحت",
    fluency:     "روانی",
    engagement:  "انگیجمنٹ",
    camera:      "📷 کیمرہ تجزیہ",
    avgEng:      "اوسط انگیجمنٹ",
    eyeContact:  "نظر کا رابطہ",
    posture:     "کرنسی",
    emotion:     "جذبات",
    tips:        "💡 بہتری کی تجاویز",
    noTips:      "کوئی تجویز نہیں",
    fillers:     "🗣 بھرنے والے الفاظ",
    total:       "کل تعداد:",
    noFillers:   "کوئی فلر الفاظ نہیں 🎉",
    summary:     "📝 خلاصہ",
    empty:       "ابھی تک کوئی فیڈبیک نہیں",
    emptySub:    "پریکٹس سیشن مکمل کریں تاکہ تجزیہ یہاں نظر آئے۔",
  },
};

const getColor = (v) => v >= 8 ? "#27ae60" : v >= 5 ? "#c9a84c" : "#e74c3c";

export default function Feedback({ feedback, setFeedback, language="English" }) {
  const L  = LABELS[language] || LABELS.English;
  const ur = language === "Urdu";

  if (!feedback) return (
    <div className="feedback-empty">
      <span className="feedback-empty-icon">📊</span>
      <p style={ur?{fontFamily:"'Noto Nastaliq Urdu',serif"}:{}}>{L.empty}</p>
      <p style={{ fontSize:"0.78rem", ...(ur?{fontFamily:"'Noto Nastaliq Urdu',serif"}:{}) }}>{L.emptySub}</p>
    </div>
  );

  const scores  = feedback.scores       || {};
  const tips    = feedback.tips         || [];
  const summary = feedback.summary      || "";
  const filler  = feedback.filler_words || { total_count:0, breakdown:{} };
  const cam     = feedback.camera_metrics || null;

  const handleClear = () => { setFeedback(null); localStorage.removeItem("p_feedback"); };

  const urduStyle = ur ? { fontFamily:"'Noto Nastaliq Urdu',serif", direction:"rtl", textAlign:"right" } : {};

  const scoreItems = [
    { label:L.confidence, value:scores.confidence??0, icon:"💪" },
    { label:L.clarity,    value:scores.clarity??0,    icon:"🔍" },
    { label:L.fluency,    value:scores.fluency??0,    icon:"🌊" },
    { label:L.engagement, value:scores.engagement??0, icon:"⚡" },
  ];

  return (
    <div className="feedback-stage" dir={ur?"rtl":"ltr"}>

      <div className="feedback-header">
        <h2 style={urduStyle}>{L.title}</h2>
        <button className="clear-btn" onClick={handleClear}>{L.clear}</button>
      </div>

      {/* SCORES */}
      <div className="score-grid">
        {scoreItems.map((s,i) => (
          <div className="score-card" key={i} style={{ animationDelay:`${i*0.07}s` }}>
            <div className="score-icon">{s.icon}</div>
            <strong style={{ color:getColor(s.value) }}>
              {s.value}<span style={{ fontSize:"0.65rem", fontWeight:500 }}>/10</span>
            </strong>
            <span style={ur?{fontFamily:"'Noto Nastaliq Urdu',serif",fontSize:"0.7rem"}:{}}>{s.label}</span>
            <div className="score-mini-bar">
              <div className="score-mini-fill" style={{ width:`${s.value*10}%`, background:getColor(s.value) }} />
            </div>
          </div>
        ))}
      </div>

      {/* CAMERA METRICS */}
      {cam && (
        <div className="feedback-item">
          <h3 style={urduStyle}>{L.camera}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            {[
              { label:L.avgEng,    val:`${cam.avg_engagement??0}%`,   icon:"⚡" },
              { label:L.eyeContact,val:`${cam.avg_eye_contact??0}%`,  icon:"👁️" },
              { label:L.posture,   val:`${cam.avg_posture??0}%`,      icon:"🧍" },
              { label:L.emotion,   val:cam.dominant_emotion||"—",      icon:"😊" },
            ].map((m,i) => (
              <div key={i} style={{ background:"#fff", border:"1px solid rgba(0,0,0,0.07)", borderRadius:8, padding:"8px 10px" }}>
                <span style={{ fontSize:"0.95rem" }}>{m.icon} </span>
                <strong style={{ color:"#1a1a2e", fontSize:"0.82rem" }}>{m.val}</strong>
                <div style={{ color:"#6b6b7b", fontSize:"0.7rem", marginTop:2, ...(ur?{fontFamily:"'Noto Nastaliq Urdu',serif"}:{}) }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIPS */}
      <div className="feedback-item">
        <h3 style={urduStyle}>{L.tips}</h3>
        <ul style={ur?{paddingRight:16,paddingLeft:0}:{}}>
          {tips.length > 0
            ? tips.map((t,i) => <li key={i} style={ur?{fontFamily:"'Noto Nastaliq Urdu',serif",direction:"rtl"}:{}}>{t}</li>)
            : <li style={ur?{fontFamily:"'Noto Nastaliq Urdu',serif"}:{}}>{L.noTips}</li>}
        </ul>
      </div>

      {/* FILLER WORDS */}
      <div className="feedback-item">
        <h3 style={urduStyle}>{L.fillers}</h3>
        <p style={urduStyle}><b>{L.total}</b> {filler.total_count}</p>
        {Object.keys(filler.breakdown).length > 0 ? (
          <ul style={ur?{paddingRight:16,paddingLeft:0}:{}}>
            {Object.entries(filler.breakdown).map(([word,count]) => (
              <li key={word}>
                <span className="filler-word">"{word}"</span> — {count}x
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop:6, ...(ur?{fontFamily:"'Noto Nastaliq Urdu',serif"}:{}) }}>{L.noFillers}</p>
        )}
      </div>

      {/* SUMMARY */}
      {summary && (
        <div className="feedback-item">
          <h3 style={urduStyle}>{L.summary}</h3>
          <p style={ur?{fontFamily:"'Noto Nastaliq Urdu',serif",direction:"rtl",textAlign:"right",lineHeight:2}:{}}>{summary}</p>
        </div>
      )}
    </div>
  );
}