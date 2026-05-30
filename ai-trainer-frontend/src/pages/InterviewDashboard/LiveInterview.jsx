
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Waveform from "./Waveform";

const LABELS = {
  English: {
    question:    "🧠 Current Question",
    noQ:         "Click 'Generate Question' to begin.",
    timeLeft:    "⏱ Time Left",
    startMic:    "🎤 Start Mic",
    stopMic:     "🛑 Stop Mic",
    answerPH:    "Write or speak your answer here...",
    getFeedback: "💬 Get Feedback",
    evaluating:  "Evaluating...",
    voiceOn:     "🔊",
    voiceOff:    "🔇",
    listening:   "🎙 Listening...",
  },
  Urdu: {
    question:    "🧠 موجودہ سوال",
    noQ:         "'سوال بنائیں' پر کلک کریں۔",
    timeLeft:    "⏱ وقت باقی",
    startMic:    "🎤 مائیک شروع کریں",
    stopMic:     "🛑 مائیک بند کریں",
    answerPH:    "اپنا جواب یہاں لکھیں یا بولیں...",
    getFeedback: "💬 فیڈبیک حاصل کریں",
    evaluating:  "تشخیص ہو رہی ہے...",
    voiceOn:     "🔊",
    voiceOff:    "🔇",
    listening:   "🎙 سن رہا ہوں...",
  },
};

function speakText(text, isUrdu, enabled, cancelRef = null) {
  if (!enabled || !text) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const doSpeak = () => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (isUrdu) {
      const voices = window.speechSynthesis.getVoices();
      const urduVoice =
        voices.find(v => v.lang === "ur-PK") ||
        voices.find(v => v.lang === "ur")    ||
        voices.find(v => v.lang.startsWith("ur"));
      if (urduVoice) { utt.voice = urduVoice; utt.lang = urduVoice.lang; utt.rate = 0.85; }
      else { utt.lang = "en-US"; utt.rate = 0.85; }
    } else {
      utt.lang = "en-US"; utt.rate = 0.95;
    }
    if (cancelRef) cancelRef.current = utt;
    window.speechSynthesis.speak(utt);
  };
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) doSpeak();
  else window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
}

export default function LiveInterview({
  question, setQuestion, answer, setAnswer,
  feedback, setFeedback,
  field, experienceLevel, interviewType, language = "English",
  loadingFeedback, setLoadingFeedback,
  recentSessions, setRecentSessions,
  username = "anonymous",
}) {
  const [timeLeft,     setTimeLeft]    = useState(120);
  const [isRecording,  setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled]= useState(true);
  const [micError,     setMicError]    = useState("");

  const timerRef       = useRef(null);
  const recognitionRef = useRef(null);
  const recordingRef   = useRef(false);
  const langCodeRef    = useRef("");
  const finalTextRef   = useRef("");
  const interimRef     = useRef("");
  const textareaRef    = useRef(null);
  const answerRef      = useRef(answer);
  const utteranceRef   = useRef(null);
  const lastSpokenQRef = useRef("");

  useEffect(() => { answerRef.current = answer; }, [answer]);

  const ur       = language === "Urdu";
  const L        = LABELS[language] || LABELS.English;
  const langCode = ur ? "ur-PK" : "en-US";

  useEffect(() => { langCodeRef.current = langCode; }, [langCode]);

  const handleManualEdit = (e) => {
    finalTextRef.current = e.target.value;
    interimRef.current   = "";
    setAnswer(e.target.value);
  };

  const toggleVoice = () => {
    if (voiceEnabled) window.speechSynthesis?.cancel();
    setVoiceEnabled(v => !v);
  };

  const flushToTextarea = () => {
    const base = finalTextRef.current;
    const sep  = base && !base.endsWith(" ") && interimRef.current ? " " : "";
    setAnswer(base + sep + interimRef.current);
  };

  const stopMic = useCallback(() => {
    recordingRef.current = false;
    interimRef.current   = "";
    finalTextRef.current = answerRef.current;
    try { recognitionRef.current?.stop(); } catch (_) {}
    setIsRecording(false);
  }, []);

  const toggleRecording = async () => {
    setMicError("");
    if (!isRecording) {
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch {
        setMicError(ur
          ? "مائیکروفون کی اجازت نہیں۔ Browser settings چیک کریں۔"
          : "Microphone access denied. Check browser settings.");
        return;
      }
      const rec = buildRecognition();
      if (!rec) return;
      recordingRef.current = true;
      try { rec.start(); }
      catch (e) { setMicError(`Could not start mic: ${e.message}`); recordingRef.current = false; }
    } else {
      stopMic();
    }
  };

  const buildRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMicError("Speech recognition not supported. Please use Chrome or Edge.");
      return null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = langCodeRef.current || langCode;
    rec.maxAlternatives = 1;

    rec.onstart  = () => { setIsRecording(true); setMicError(""); interimRef.current = ""; };

    rec.onresult = (e) => {
      let interimAccum = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          const base = finalTextRef.current;
          finalTextRef.current = base + (base && !base.endsWith(" ") ? " " : "") + t;
          interimRef.current   = "";
        } else {
          interimAccum += t;
          interimRef.current = interimAccum;
        }
      }
      flushToTextarea();
    };

    rec.onend = () => {
      if (interimRef.current) {
        const base = finalTextRef.current;
        finalTextRef.current = base + (base && !base.endsWith(" ") ? " " : "") + interimRef.current;
        interimRef.current   = "";
        setAnswer(finalTextRef.current);
      }
      setIsRecording(false);
      if (recordingRef.current) {
        setTimeout(() => {
          if (recordingRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (_) {}
          }
        }, 150);
      }
    };

    rec.onerror = (e) => {
      if (["not-allowed", "audio-capture"].includes(e.error)) {
        setMicError(ur
          ? "مائیکروفون کی اجازت نہیں — browser settings میں اجازت دیں۔"
          : "Microphone blocked — allow access in browser settings.");
        recordingRef.current = false;
        setIsRecording(false);
      } else if (e.error === "network") {
        setMicError(ur ? "نیٹ ورک خرابی۔" : "Network error — check your connection.");
      }
    };

    recognitionRef.current = rec;
    return rec;
  }, [langCode, ur]);

  useEffect(() => {
    if (!isRecording) buildRecognition();
    // eslint-disable-next-line
  }, [langCode]);

  useEffect(() => () => {
    recordingRef.current = false;
    try { recognitionRef.current?.abort(); } catch (_) {}
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!question) return;
    setTimeLeft(120);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
    }, 1000);
    if (question !== lastSpokenQRef.current) {
      lastSpokenQRef.current = question;
      speakText(question, ur, voiceEnabled, utteranceRef);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [question]);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
  }, [answer]);

  const evaluateAnswer = async () => {
    if (!answer.trim()) {
      alert(ur ? "پہلے جواب لکھیں یا بولیں۔" : "Write or speak your answer first!");
      return;
    }
    if (isRecording) {
      stopMic();
      await new Promise(r => setTimeout(r, 350));
    }

    setLoadingFeedback(true);
    try {
      const res = await axios.post("http://localhost:8000/api/generate-question", {
        field, experienceLevel, interviewType,
        answer:            answerRef.current || answer,
        question:          question || "",
        language,
        previousQuestions: recentSessions.map(s => s.question),
        mode:              "adaptive",
        username:          username || "anonymous",
      });
      const fb = res.data.feedback;
      setFeedback(fb);
      if (fb?.overall_feedback) speakText(fb.overall_feedback, ur, voiceEnabled, utteranceRef);

      const score = fb?.score ?? null;
      setRecentSessions(prev => {
        const updated = [...prev];
        if (updated.length > 0) updated[0] = { ...updated[0], answer, score, feedback: fb };
        return updated;
      });

      if (res.data.next_question) {
        setQuestion(res.data.next_question);
        setRecentSessions(prev => [{ question: res.data.next_question, answer: "", score: null }, ...prev]);
        finalTextRef.current = "";
        interimRef.current   = "";
        setAnswer("");
      }
    } catch (e) {
      console.error(e);
      alert(ur ? "فیڈبیک لینے میں خرابی۔" : "Error getting feedback!");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = timeLeft <= 30 ? "#e74c3c" : timeLeft <= 60 ? "#c9a84c" : "#27ae60";

  return (
    <div className="live-interview-wrap">
      <div className="question-box">
        <div className="question-header">
          <h3>{L.question}</h3>
          <button className="voice-toggle-btn" onClick={toggleVoice} title="Toggle AI voice">
            {voiceEnabled ? L.voiceOn : L.voiceOff}
          </button>
        </div>
        <p
          dir={ur ? "rtl" : "ltr"}
          style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif", lineHeight: 2, fontSize: "1.05rem" } : {}}
        >
          {question || L.noQ}
        </p>
      </div>

      {question && (
        <div className="timer-mic">
          <div className="timer-display" style={{ color: timerColor }}>
            {L.timeLeft}: {formatTime(timeLeft)}
            <div className="timer-track">
              <div
                className="timer-fill"
                style={{
                  width: `${(timeLeft / 120) * 100}%`,
                  background: timerColor,
                  transition: "width 1s linear, background 0.5s",
                }}
              />
            </div>
          </div>
          <button onClick={toggleRecording} className={`mic-btn ${isRecording ? "recording" : ""}`}>
            {isRecording ? L.stopMic : L.startMic}
          </button>
        </div>
      )}

      {micError && (
        <div style={{
          background: "#fff0f0", border: "1px solid rgba(231,76,60,0.3)",
          borderRadius: 9, padding: "8px 13px", fontSize: "0.8rem",
          color: "#e74c3c", lineHeight: 1.5,
        }}>
          ⚠️ {micError}
        </div>
      )}

      {question && <Waveform recording={isRecording} />}

      <div className="answer-section">
        {isRecording && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 13px",
            background: "rgba(201,168,76,0.10)",
            border: "1px solid rgba(201,168,76,0.30)",
            borderRadius: 50, width: "fit-content",
            fontSize: "0.73rem", fontWeight: 600, color: "var(--accent)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#e74c3c", display: "inline-block",
              animation: "recordPulse 1.5s ease-in-out infinite",
            }} />
            {L.listening}
          </div>
        )}

        <textarea
          ref={textareaRef}
          placeholder={L.answerPH}
          value={answer}
          onChange={handleManualEdit}
          dir={ur ? "rtl" : "ltr"}
          style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif", textAlign: "right", lineHeight: 2 } : {}}
        />

        <button
          onClick={evaluateAnswer}
          disabled={loadingFeedback || !answer.trim()}
          className="id-feedback-btn"
        >
          {loadingFeedback
            ? <><span className="id-dot-loader"><span /><span /><span /></span> {L.evaluating}</>
            : L.getFeedback}
        </button>
      </div>
    </div>
  );
}