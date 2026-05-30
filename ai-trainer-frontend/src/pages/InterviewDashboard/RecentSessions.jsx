
import React from "react";
import "./InterviewDashboard.css";

const LABELS = {
  English: {
    title:   "🕘 Recent Sessions",
    empty:   "No sessions yet. Generate a question to begin!",
    q:       "Q:",
    a:       "A:",
    score:   "Score",
    delete:  "✕",
  },
  Urdu: {
    title:   "🕘 حالیہ سیشن",
    empty:   "ابھی تک کوئی سیشن نہیں۔ سوال بنائیں!",
    q:       "سوال:",
    a:       "جواب:",
    score:   "اسکور",
    delete:  "✕",
  },
};

export default function RecentSessions({ recentSessions, setRecentSessions, language = "English" }) {
  const L  = LABELS[language] || LABELS.English;
  const ur = language === "Urdu";

  const handleDelete = (index) => {
    setRecentSessions(recentSessions.filter((_, i) => i !== index));
  };

  return (
    <div className="recent-sessions">
      <h3 style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}>{L.title}</h3>

      {recentSessions.length === 0 ? (
        <p style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}>{L.empty}</p>
      ) : (
        <div className="rs-scroll-track">
          {recentSessions.map((sess, idx) => (
            <div key={idx} className="session-card">
              <button
                className="delete-btn"
                onClick={() => handleDelete(idx)}
                title="Remove"
              >
                {L.delete}
              </button>

              <div className="sc-q" dir={ur ? "rtl" : "ltr"}
                style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}>
                <span style={{ opacity: 0.55, marginRight: 4 }}>{L.q}</span>
                {sess.question}
              </div>

              {sess.answer && (
                <div className="sc-a" dir={ur ? "rtl" : "ltr"}
                  style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}>
                  <span style={{ opacity: 0.55, marginRight: 4 }}>{L.a}</span>
                  {sess.answer}
                </div>
              )}

              {sess.score != null && (
                <div className="sc-score">
                  {L.score}: {sess.score}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}