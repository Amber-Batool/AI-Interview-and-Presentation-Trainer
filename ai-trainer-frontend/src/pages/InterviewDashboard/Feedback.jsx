
import React from "react";

const LABELS = {
  English: {
    title:      "📊 AI Feedback",
    clarity:    "Clarity",
    conf:       "Confidence",
    depth:      "Technical Depth",
    overall:    "Overall Feedback",
    ideal:      "Ideal Answer",
    tips:       "💡 Improvement Tips",
    dismiss:    "Dismiss",
    liveScores: "📹 Camera Scores",
    engagement: "Engagement",
    eye:        "Eye Contact",
    posture:    "Posture",
    emotion:    "Emotion",
    fluency:    "Fluency",
    confidence2:"Confidence",
    transcript: "🗣 Your Answer",
  },
  Urdu: {
    title:      "📊 AI فیڈبیک",
    clarity:    "وضاحت",
    conf:       "اعتماد",
    depth:      "تکنیکی گہرائی",
    overall:    "مجموعی فیڈبیک",
    ideal:      "مثالی جواب",
    tips:       "💡 بہتری کی تجاویز",
    dismiss:    "بند کریں",
    liveScores: "📹 کیمرہ اسکور",
    engagement: "انگیجمنٹ",
    eye:        "نظر",
    posture:    "کرنسی",
    emotion:    "جذبہ",
    fluency:    "روانی",
    confidence2:"اعتماد",
    transcript: "🗣 آپ کا جواب",
  },
};

const scoreColor = v => {
  if (v === null || v === undefined || v === "—") return "#9999a8";
  const n = parseFloat(v);
  if (isNaN(n)) return "#9999a8";
  if (n >= 70 || n >= 7) return "#27ae60";
  if (n >= 40 || n >= 4) return "#c9a84c";
  return "#e74c3c";
};

export default function Feedback({ feedback, setFeedback, language = "English" }) {
  if (!feedback || typeof feedback !== "object") return null;

  const L  = LABELS[language] || LABELS.English;
  const ur = language === "Urdu";

  const urStyle  = ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {};
  const rtlStyle = ur ? { ...urStyle, direction: "rtl", textAlign: "right" } : {};

  // Camera / live scores (set by CameraInterview)
  const hasLive  = feedback._liveEngagement !== undefined;
  const hasTx    = !!feedback._transcript;

  return (
    <div className="feedback-section" dir={ur ? "rtl" : "ltr"}>
      <h3 style={urStyle}>
        {L.title}
        {setFeedback && (
          <button className="feedback-dismiss" onClick={() => setFeedback(null)}>
            {L.dismiss} ✕
          </button>
        )}
      </h3>

      {/* ── AI text scores (3 chips) ── */}
      <div className="feedback-cards">
        {[
          { label: L.clarity, value: feedback.clarity },
          { label: L.conf,    value: feedback.confidence },
          { label: L.depth,   value: feedback.technical_depth },
        ].filter(x => x.value).map((item, i) => (
          <div key={i} className="feedback-card-item">
            <div className="fci-label" style={urStyle}>{item.label}</div>
            <div className="fci-value" style={rtlStyle}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── Camera / Live scores — only when from camera mode ── */}
      {hasLive && (
        <div className="live-scores-section">
          <div className="ls-title" style={urStyle}>{L.liveScores}</div>
          <div className="ls-grid">
            {[
              { label: L.engagement,  val: `${feedback._liveEngagement}%`,  suffix: "" },
              { label: L.eye,         val: `${feedback._liveEyeScore}%`,     suffix: "" },
              { label: L.posture,     val: `${feedback._livePosture}%`,      suffix: "" },
              { label: L.fluency,     val: `${feedback._liveFluency}/10`,    suffix: "" },
              { label: L.confidence2, val: `${feedback._liveConfidence}/10`, suffix: "" },
              { label: L.emotion,     val: feedback._liveEmotion || "—",     suffix: "" },
            ].map((s, i) => (
              <div key={i} className="ls-chip">
                <div className="ls-val" style={{ color: scoreColor(parseFloat(s.val)) }}>{s.val}</div>
                <div className="ls-label" style={urStyle}>{s.label}</div>
                {/* mini bar for numeric values */}
                {!isNaN(parseFloat(s.val)) && s.val.includes("%") && (
                  <div className="ls-bar">
                    <div className="ls-bar-fill" style={{ width: s.val, background: scoreColor(parseFloat(s.val)) }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transcript ── */}
      {hasTx && (
        <div className="feedback-block full">
          <div className="fb-label" style={urStyle}>{L.transcript}</div>
          <div className="fb-value" style={{ ...rtlStyle, maxHeight: 80, overflowY: "auto", fontStyle: "italic" }}>
            {feedback._transcript}
          </div>
        </div>
      )}

      {/* ── Long blocks ── */}
      <div className="feedback-blocks">
        {feedback.overall_feedback && (
          <div className="feedback-block full">
            <div className="fb-label" style={urStyle}>{L.overall}</div>
            <div className="fb-value" style={rtlStyle}>{feedback.overall_feedback}</div>
          </div>
        )}
        {feedback.ideal_answer && (
          <div className="feedback-block">
            <div className="fb-label" style={urStyle}>{L.ideal}</div>
            <div className="fb-value" style={rtlStyle}>{feedback.ideal_answer}</div>
          </div>
        )}
        {feedback.improvement_tips && (
          <div className="feedback-block">
            <div className="fb-label" style={urStyle}>{L.tips}</div>
            <div className="fb-value" style={rtlStyle}>{feedback.improvement_tips}</div>
          </div>
        )}
      </div>
    </div>
  );
}