
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Waveform from "./Waveform";

export default function Practice({ slides, duration, mode, language = "English", setTranscript, setFeedback }) {
  const [text,      setText]      = useState("");
  const [recording, setRecording] = useState(false);
  const [time,      setTime]      = useState(duration * 60);
  const [loading,   setLoading]   = useState(false);

  const recognitionRef = useRef(null);
  const finalTextRef   = useRef("");
  const recordingRef   = useRef(false);

  const ur       = language === "Urdu";
  const langCode = ur ? "ur-PK" : "en-US";

  // Keep recordingRef in sync with recording state
  useEffect(() => { recordingRef.current = recording; }, [recording]);

  useEffect(() => { setTime(duration * 60); }, [duration]);

  // Timer countdown
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) { stopRecording(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recording]);

  // Build recognition — only once (not on every recording change)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec          = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = langCode;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTextRef.current += t + " ";
        else interim += t;
      }
      setText(finalTextRef.current + interim);
    };

    // Auto-restart on silence/timeout
    rec.onend = () => {
      if (recordingRef.current) {
        try { rec.start(); } catch (_) {}
      }
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        alert(ur ? "مائیکروفون کی اجازت نہیں ملی۔" : "Microphone permission denied.");
        recordingRef.current = false;
        setRecording(false);
      }
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch (_) {}
    };
  }, [langCode]);

  const startRecording = () => {
    finalTextRef.current = "";
    setFeedback(null);
    setTranscript("");
    setText("");
    recordingRef.current = true;
    setRecording(true);
    try { recognitionRef.current?.start(); } catch (_) {}
  };

  const stopRecording = () => {
    recordingRef.current = false;
    setRecording(false);
    try { recognitionRef.current?.stop(); } catch (_) {}
  };

  const sendForFeedback = async () => {
    if (!text.trim()) return;
    stopRecording();
    setLoading(true);
    try {
      // ── Get username from localStorage ──────────────────────────────
      const userRaw  = localStorage.getItem("user");
      const username = userRaw ? JSON.parse(userRaw).name || "anonymous" : "anonymous";

      const res = await axios.post("http://127.0.0.1:8000/api/presentation-feedback", {
        transcript: text,
        duration,
        language,
        username,           // ← sends username so session is saved per user
      });
      setTranscript(text);
      setFeedback(res.data);
      setText("");
      finalTextRef.current = "";
    } catch (err) {
      console.error(err);
      alert(ur ? "فیڈبیک حاصل کرنے میں خرابی۔" : "Error getting feedback.");
    } finally {
      setLoading(false);
    }
  };

  const format = () => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = ((duration * 60 - time) / (duration * 60)) * 100;

  return (
    <div className="practice-stage">

      <div className="practice-title-row">
        <h2>🎤 {ur ? "لائیو پریکٹس" : "Live Practice"}</h2>
        <span className={`rec-badge ${recording ? "active" : ""}`}>
          {recording ? (ur ? "● ریکارڈنگ" : "● REC") : (ur ? "● تیار" : "● IDLE")}
        </span>
      </div>

      <div className="practice-header">
        <span className="timer">{format()}</span>
        <div className="timer-bar-wrap">
          <div className="timer-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="mode-tag">
          {mode === "slides" ? "📊 Slides" : "🎙 Free"}
        </span>
      </div>

      <div className="recording-controls">
        {!recording ? (
          <button className="start-btn" onClick={startRecording}>
            🎤 {ur ? "ریکارڈنگ شروع کریں" : "Start Recording"}
          </button>
        ) : (
          <button className="stop-btn" onClick={stopRecording}>
            🛑 {ur ? "ریکارڈنگ روکیں" : "Stop Recording"}
          </button>
        )}
      </div>

      <Waveform recording={recording} />

      <textarea
        className="live-input"
        value={text}
        placeholder={ur ? "آپ کی تقریر یہاں ظاہر ہوگی..." : "Your speech will appear here as you speak..."}
        onChange={(e) => setText(e.target.value)}
        dir={ur ? "rtl" : "ltr"}
        style={ur ? { textAlign: "right", fontFamily: "'Noto Nastaliq Urdu',serif", fontSize: "1rem", lineHeight: 2 } : {}}
      />

      <button
        className="send-btn"
        onClick={sendForFeedback}
        disabled={loading || !text.trim()}
      >
        {loading
          ? <span className="loading-dots">{ur ? "تجزیہ" : "Analyzing"}<span>.</span><span>.</span><span>.</span></span>
          : `📤 ${ur ? "فیڈبیک حاصل کریں" : "Send for Feedback"}`
        }
      </button>

      {mode === "slides" && slides.length > 0 && (
        <div className="slides-preview">
          {slides.map((s, i) => (
            <div key={i} className="clean-slide">
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}