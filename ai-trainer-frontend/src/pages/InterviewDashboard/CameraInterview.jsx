
import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const FACEAPI_CDN = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODEL_URL   = "https://justadudewhohacks.github.io/face-api.js/models";

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

const FILLERS_EN = ["um","uh","like","you know","basically","actually","so","i mean","right","okay","well","just"];
const FILLERS_UR = ["یعنی","مطلب","بس","اور","پھر","تو","واقعی","اصل میں","ٹھیک ہے"];

function countFillers(text, language) {
  const list  = language === "Urdu" ? FILLERS_UR : FILLERS_EN;
  const lower = text.toLowerCase();
  let total = 0; const breakdown = {};
  for (const w of list) {
    const n = (lower.match(new RegExp(`\\b${w}\\b`, "g")) || []).length;
    if (n) { breakdown[w] = n; total += n; }
  }
  return { total, breakdown };
}

function liveFluency(text, language) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return 0;
  const { total } = countFillers(text, language);
  const ratio = total / words.length;
  let score = 8;
  if (ratio > 0.15) score -= 3; else if (ratio > 0.08) score -= 2; else if (ratio > 0.03) score -= 1;
  if (words.length < 10) score = Math.min(score, 4);
  return Math.max(0, Math.min(10, score));
}

function liveConfidence(text) {
  if (text.length < 10) return 0;
  const lower = text.toLowerCase();
  const hedges    = (lower.match(/\b(maybe|perhaps|i think|i guess|kind of|not sure|probably)\b/g) || []).length;
  const assertive = (lower.match(/\b(definitely|clearly|certainly|absolutely|i believe|we should)\b/g) || []).length;
  let score = 5;
  score -= Math.min(3, hedges); score += Math.min(3, assertive);
  return Math.max(0, Math.min(10, score));
}

// Pace: words per minute, ideal interview range is 120-160 wpm
function livePace(text, startTime) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 5 || !startTime) return 0;
  const minutes = (Date.now() - startTime) / 60000;
  if (minutes < 0.05) return 0;
  return Math.round(words / minutes);
}

function paceLabel(wpm, ur) {
  if (wpm === 0) return "—";
  if (wpm < 90)  return ur ? "بہت آہستہ 🐢" : "Too slow 🐢";
  if (wpm < 120) return ur ? "آہستہ" : "Slow";
  if (wpm <= 160) return ur ? "بہترین ✓" : "Good ✓";
  if (wpm <= 190) return ur ? "تیز" : "Fast";
  return ur ? "بہت تیز ⚡" : "Too fast ⚡";
}

function paceColor(wpm) {
  if (wpm === 0) return "#9999a8";
  if (wpm >= 120 && wpm <= 160) return "#27ae60";
  if ((wpm >= 90 && wpm < 120) || (wpm > 160 && wpm <= 190)) return "#c9a84c";
  return "#e74c3c";
}

function estimatePosture(pts) {
  if (!pts || pts.length < 68) return { upright: false, score: 50 };
  const tilt  = Math.abs(pts[0].y - pts[16].y);
  const faceH = Math.abs(pts[30].y - pts[8].y) * 2 || 1;
  let score   = 65 - Math.round(tilt / faceH * 60);
  if ((pts[0].y + pts[16].y) / 2 - pts[30].y < faceH * 0.3) score -= 15;
  return { upright: score > 50, score: Math.max(0, Math.min(100, score)) };
}

const eColor = v => v >= 70 ? "#27ae60" : v >= 40 ? "#c9a84c" : "#e74c3c";
const sColor = v => v >= 7  ? "#27ae60" : v >= 4  ? "#c9a84c" : "#e74c3c";

export default function CameraInterview({
  question, language = "English", setFeedback, feedback,
  field, experienceLevel, interviewType,
  recentSessions, setRecentSessions,
  username = "anonymous",
}) {
  const videoRef     = useRef(null);
  const overlayRef   = useRef(null);
  const streamRef    = useRef(null);
  const recRef       = useRef(null);
  const finalRef     = useRef("");
  const faRef        = useRef(null);
  const busyRef      = useRef(false);
  const metricsRef   = useRef({ engagement: 0, eyeScore: 50, postureScore: 50, emotion: "neutral" });
  const recordingRef = useRef(false);
  const snapshotRef  = useRef(null);
  const utteranceRef = useRef(null);
  const startTimeRef = useRef(null);

  const [aiStatus,     setAiStatus]     = useState("Loading AI...");
  const [aiReady,      setAiReady]      = useState(false);
  const [recording,    setRecording]    = useState(false);
  const [sending,      setSending]      = useState(false);
  const [localTx,      setLocalTx]      = useState("");
  const [showGetFb,    setShowGetFb]    = useState(false);
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [liveMetrics, setLiveMetrics] = useState({
    engagement: 0, eyeScore: 0, eyeContact: false,
    postureScore: 0, posture: false, emotion: "—", faceDetected: false,
    message: "Position yourself in front of camera",
  });
  const [liveSpeech, setLiveSpeech] = useState({
    fluency: 0, confidence: 0, pace: 0,
  });

  const ur = language === "Urdu";

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (!question) return;
    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(question);
    utt.lang = ur ? "ur-PK" : "en-US";
    utt.rate = 0.95;
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [question]);

  const toggleVoice = () => {
    if (voiceEnabled) window.speechSynthesis?.cancel();
    setVoiceEnabled(v => !v);
  };

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const vid = videoRef.current;
      vid.srcObject = stream;
      await new Promise(r => { vid.onloadedmetadata = () => vid.play().then(r).catch(r); });
    } catch (e) { setAiStatus("Camera: " + e.message); }
  }

  async function loadFaceApi() {
    setAiStatus("Loading models...");
    try {
      await loadScript(FACEAPI_CDN);
      const fa = window.faceapi;
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        fa.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      faRef.current = fa;
      setAiReady(true); setAiStatus("✓ AI Ready");
    } catch (e) { setAiStatus("AI failed"); }
  }

  function drawLandmarks(ctx, pts) {
    ctx.fillStyle = "rgba(255,210,60,0.85)";
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill(); });
    const line = (idxs, close = false) => {
      ctx.beginPath(); ctx.moveTo(pts[idxs[0]].x, pts[idxs[0]].y);
      idxs.slice(1).forEach(i => ctx.lineTo(pts[i].x, pts[i].y));
      if (close) ctx.closePath(); ctx.stroke();
    };
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "rgba(255,210,60,0.45)"; line([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
    ctx.strokeStyle = "rgba(255,210,60,0.6)";  line([17,18,19,20,21]); line([22,23,24,25,26]);
    ctx.strokeStyle = "rgba(255,210,60,0.45)"; line([27,28,29,30]); line([30,31,32,33,34,35,30]);
    ctx.strokeStyle = "rgba(255,210,60,0.7)";  line([36,37,38,39,40,41], true); line([42,43,44,45,46,47], true);
    ctx.strokeStyle = "rgba(255,210,60,0.55)"; line([48,49,50,51,52,53,54,55,56,57,58,59], true);
  }

  async function runDetection() {
    const fa = faRef.current, video = videoRef.current, canvas = overlayRef.current;
    if (!fa || !video || !canvas || video.readyState < 2 || busyRef.current) return;
    busyRef.current = true;
    try {
      const opts   = new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });
      const result = await fa.detectSingleFace(video, opts).withFaceLandmarks().withFaceExpressions();

      const vW = video.videoWidth || 640, vH = video.videoHeight || 480;
      canvas.width = vW; canvas.height = vH;
      const ctx = canvas.getContext("2d"); ctx.clearRect(0, 0, vW, vH);

      if (!result) {
        const m = { engagement: 0, eyeScore: 0, eyeContact: false, postureScore: 0, posture: false, emotion: "—", faceDetected: false, message: ur ? "چہرہ نہیں ملا ❌" : "No face detected ❌" };
        setLiveMetrics(m); metricsRef.current = m; return;
      }

      const dims    = { width: vW, height: vH };
      const resized = fa.resizeResults(result, dims);
      const pts     = resized.landmarks.positions;

      ctx.strokeStyle = "rgba(255,210,60,0.8)"; ctx.lineWidth = 2;
      const box = resized.detection.box; ctx.strokeRect(box.x, box.y, box.width, box.height);
      drawLandmarks(ctx, pts);

      const lEye = pts.slice(36, 42), rEye = pts.slice(42, 48);
      const eyeMidX = (lEye.reduce((s, p) => s + p.x, 0) / 6 + rEye.reduce((s, p) => s + p.x, 0) / 6) / 2;
      const eyeMidY = (lEye.reduce((s, p) => s + p.y, 0) / 6 + rEye.reduce((s, p) => s + p.y, 0) / 6) / 2;
      const allX = pts.map(p => p.x), faceCx = (Math.min(...allX) + Math.max(...allX)) / 2, faceW = Math.max(...allX) - Math.min(...allX);
      const eyeScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(eyeMidX - faceCx) / (faceW / 2 + 1) * 80)));

      ctx.beginPath(); ctx.strokeStyle = eyeScore > 55 ? "rgba(255,210,60,0.4)" : "rgba(231,76,60,0.4)";
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.moveTo(eyeMidX, eyeMidY); ctx.lineTo(vW / 2, 0); ctx.stroke(); ctx.setLineDash([]);

      const postureRes = estimatePosture(result.landmarks.positions);
      const emotion    = Object.entries(result.expressions).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
      const rawBox     = result.detection.box;
      const centered   = Math.abs((rawBox.x + rawBox.width / 2) - vW / 2) < vW * 0.3 && Math.abs((rawBox.y + rawBox.height / 2) - vH / 2) < vH * 0.4;
      const sizeOk     = (rawBox.width * rawBox.height) / (vW * vH) > 0.025;

      let eng = 18;
      if (centered) eng += 25; if (sizeOk) eng += 15; if (eyeScore > 60) eng += 22;
      if (postureRes.upright) eng += 10; if (["happy", "surprised"].includes(emotion)) eng += 10;
      eng = Math.max(0, Math.min(100, eng));

      const parts = [];
      if      (eng > 75) parts.push(ur ? "بہترین حاضری 🔥" : "Excellent presence 🔥");
      else if (eng > 50) parts.push(ur ? "اچھا، جاری رکھیں 👍" : "Good — keep it up 👍");
      else               parts.push(ur ? "زیادہ متحرک ہوں 👀" : "Try to engage more 👀");
      if (!centered)           parts.push(ur ? "درمیان میں آئیں 🎯" : "Center yourself 🎯");
      if (!sizeOk)             parts.push(ur ? "قریب آئیں 📏" : "Move closer 📏");
      if (eyeScore < 45)       parts.push(ur ? "کیمرے کو دیکھیں 👁️" : "Look at camera 👁️");
      if (!postureRes.upright) parts.push(ur ? "سیدھے بیٹھیں 🧍" : "Sit upright 🧍");
      if (emotion && emotion !== "neutral") parts.push(`${emotion} 😊`);

      const updated = { engagement: eng, eyeScore, eyeContact: eyeScore > 55, postureScore: postureRes.score, posture: postureRes.upright, emotion, faceDetected: true, message: parts.join(" · ") };
      setLiveMetrics(updated); metricsRef.current = updated;

    } catch (e) { console.error("Detection:", e); }
    finally { busyRef.current = false; }
  }

  function setupSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true;
    rec.lang = ur ? "ur-PK" : "en-US";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          if (!finalRef.current.trimEnd().endsWith(t.trim())) {
            finalRef.current += t + " ";
          }
        } else {
          interim += t;
        }
      }
      const full = finalRef.current + interim;
      setLocalTx(full);
      const pace = livePace(full, startTimeRef.current);
      setLiveSpeech({
        fluency:    liveFluency(full, language),
        confidence: liveConfidence(full),
        pace,
      });
    };

    rec.onend = () => {
      setRecording(false);
      if (recordingRef.current) { try { rec.start(); setRecording(true); } catch (_) {} }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        alert(ur ? "مائیکروفون کی اجازت نہیں۔" : "Microphone denied.");
        recordingRef.current = false; setRecording(false);
      }
    };
    recRef.current = rec; return true;
  }

  const toggleRecording = () => {
    if (sending) return;
    if (!recording) {
      finalRef.current = ""; setLocalTx("");
      startTimeRef.current = Date.now();
      setLiveSpeech({ fluency: 0, confidence: 0, pace: 0 });
      setShowGetFb(false);
      if (setFeedback) setFeedback(null);
      if (!recRef.current) { const ok = setupSpeech(); if (!ok) return; }
      recordingRef.current = true; setRecording(true);
      try { recRef.current.start(); }
      catch (e) { if (e.name === "InvalidStateError") { recRef.current.stop(); setTimeout(() => { try { recRef.current.start(); } catch (_) {} }, 400); } }
    } else {
      recordingRef.current = false;
      snapshotRef.current  = { ...metricsRef.current };
      try { recRef.current?.stop(); } catch (_) {}
      setRecording(false);
      const finalText = (finalRef.current || localTx).trim();
      if (finalText.length > 2) {
        finalRef.current = finalText;
        setShowGetFb(true);
      }
    }
  };

  const handleGetFeedback = async () => {
    const text = finalRef.current.trim();
    if (!text) { alert(ur ? "پہلے بولیں۔" : "Please speak first."); return; }
    setSending(true); setShowGetFb(false);
    try {
      const m = snapshotRef.current || metricsRef.current;
      const res = await axios.post("http://localhost:8000/api/generate-question", {
        field:           field || "General",
        experienceLevel: experienceLevel || "Mid",
        interviewType:   interviewType || "General",
        answer:          text,
        question:        question || "",
        language,
        mode:            "adaptive",
        username:        username || "anonymous",
        camera_metrics: {
          avg_engagement:   m.engagement,
          avg_eye_contact:  m.eyeScore,
          avg_posture:      m.postureScore,
          dominant_emotion: m.emotion,
        },
      });
      const fb = {
        ...res.data.feedback,
        _transcript:     text,
        _liveEngagement: m.engagement,
        _liveEyeScore:   m.eyeScore,
        _livePosture:    m.postureScore,
        _liveEmotion:    m.emotion,
        _liveFluency:    liveSpeech.fluency,
        _liveConfidence: liveSpeech.confidence,
        _livePace:       liveSpeech.pace,
      };
      if (setFeedback) setFeedback(fb);
      if (setRecentSessions) {
        setRecentSessions(prev => {
          const updated = [...prev];
          if (updated.length > 0) updated[0] = { ...updated[0], answer: text, score: m.engagement, feedback: fb };
          return updated;
        });
      }
      finalRef.current = ""; setLocalTx(""); setLiveSpeech({ fluency: 0, confidence: 0, pace: 0 });
    } catch (e) { console.error(e); alert(ur ? "خرابی آئی۔" : "Backend error."); }
    finally { setSending(false); }
  };

  useEffect(() => {
    let interval;
    (async () => { await startCamera(); await loadFaceApi(); interval = setInterval(runDetection, 800); })();
    setupSpeech();
    return () => {
      clearInterval(interval);
      streamRef.current?.getTracks().forEach(t => t.stop());
      try { recRef.current?.stop(); } catch (_) {}
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line
  }, []);

  const ec = eColor(liveMetrics.engagement);

  return (
    <div className="camera-interview-wrap">

      <div className="ci-question-bar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span className="ci-q-label">🧠 {ur ? "سوال" : "Question"}</span>
          <button
            onClick={toggleVoice}
            style={{
              background:   voiceEnabled ? "rgba(201,168,76,0.15)" : "rgba(231,76,60,0.12)",
              border:       voiceEnabled ? "1px solid rgba(201,168,76,0.35)" : "1px solid rgba(231,76,60,0.25)",
              color:        voiceEnabled ? "var(--accent)" : "#e74c3c",
              borderRadius: 20, padding: "4px 12px",
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
        </div>
        <p dir={ur ? "rtl" : "ltr"} style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif", lineHeight: 2 } : {}}>
          {question || (ur ? "'سوال بنائیں' پر کلک کریں۔" : "Generate a question from the setup panel.")}
        </p>
      </div>

      <div className="ci-body" style={{ gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr" }}>

        <div className="ci-camera-box">
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <canvas ref={overlayRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

          {/* LIVE badge */}
          <div className="ci-badge-live">
            <span style={{
              width: 7, height: 7, borderRadius: "50%", display: "inline-block",
              background: recording ? "#e74c3c" : "#888",
              boxShadow:  recording ? "0 0 8px #e74c3c" : "none",
              animation:  recording ? "ciPulse 1.4s ease-in-out infinite" : "none",
            }} />
            <span>{recording ? "REC · LIVE" : "LIVE"}</span>
          </div>

          {/* AI status */}
          <div className="ci-badge-ai" style={{ color: aiReady ? "#2ecc71" : "#c9a84c" }}>
            {aiStatus}
          </div>

          {/* Live speech overlay — 3 metrics only */}
          {recording && (
            <div className="ci-speech-overlay">
              {[
                { label: ur ? "روانی"  : "Fluency",    val: liveSpeech.fluency,    max: 10,   color: sColor(liveSpeech.fluency) },
                { label: ur ? "اعتماد" : "Confidence", val: liveSpeech.confidence, max: 10,   color: sColor(liveSpeech.confidence) },
                { label: ur ? "رفتار" : "Pace",        val: liveSpeech.pace > 0 ? `${liveSpeech.pace}` : "—", max: null, color: paceColor(liveSpeech.pace) },
              ].map((m, i) => (
                <div key={i} className="ci-speech-item">
                  <div style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1, color: m.color }}>
                    {m.val}{m.max ? `/${m.max}` : (liveSpeech.pace > 0 && i === 2 ? " wpm" : "")}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                    {m.label}
                  </div>
                  {m.max && (
                    <div style={{ height: 2, background: "rgba(255,255,255,0.15)", borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: m.color, width: `${(liveSpeech[i === 0 ? "fluency" : "confidence"] / 10) * 100}%`, transition: "width 0.4s" }} />
                    </div>
                  )}
                  {i === 2 && liveSpeech.pace > 0 && (
                    <div style={{ fontSize: "0.55rem", color: paceColor(liveSpeech.pace), marginTop: 2 }}>
                      {paceLabel(liveSpeech.pace, ur)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="ci-controls">
            <button
              onClick={toggleRecording}
              disabled={sending}
              className={`ci-mic-btn ${recording ? "stop" : ""}`}
            >
              {sending
                ? `⏳ ${ur ? "بھیج رہے ہیں..." : "Sending..."}`
                : recording
                  ? `🛑 ${ur ? "روکیں" : "Stop"}`
                  : `🎤 ${ur ? "بولنا شروع کریں" : "Start Speaking"}`}
            </button>
            {showGetFb && !recording && !sending && (
              <button onClick={handleGetFeedback} className="ci-feedback-btn">
                📤 {ur ? "فیڈبیک حاصل کریں" : "Get Feedback"}
              </button>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="ci-live-panel">
          <div className="ci-panel-title">📊 {ur ? "لائیو تجزیہ" : "Live Analysis"}</div>

          <div className="ci-eng-box">
            <div style={{ fontSize: "2rem", fontWeight: 700, color: ec, fontFamily: "'Playfair Display',serif", lineHeight: 1, transition: "color 0.4s", textAlign: "center" }}>
              {liveMetrics.engagement}%
            </div>
            <div style={{ fontSize: "0.68rem", color: "#9999a8", marginTop: 3, textAlign: "center" }}>
              {ur ? "انگیجمنٹ" : "Engagement"}
            </div>
            <div style={{ height: 4, background: "#eee", borderRadius: 4, marginTop: 7, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: ec, width: `${liveMetrics.engagement}%`, transition: "width 0.7s ease" }} />
            </div>
          </div>

          <div className="ci-metrics-grid">
            {[
              { label: ur ? "نظر"   : "Eye",     icon: "👁️", val: liveMetrics.faceDetected ? `${liveMetrics.eyeScore}%`    : "—", ok: liveMetrics.eyeContact },
              { label: ur ? "کرنسی" : "Posture", icon: "🧍", val: liveMetrics.faceDetected ? `${liveMetrics.postureScore}%` : "—", ok: liveMetrics.posture },
              { label: ur ? "جذبہ"  : "Emotion", icon: "😊", val: liveMetrics.faceDetected ? (liveMetrics.emotion || "neutral") : "—", ok: true },
              { label: ur ? "چہرہ"  : "Face",    icon: "🎯", val: liveMetrics.faceDetected ? (ur ? "ملا ✓" : "Found ✓") : (ur ? "نہیں ✗" : "Not found ✗"), ok: liveMetrics.faceDetected },
            ].map((m, i) => (
              <div key={i} className="ci-metric-chip" style={{ borderColor: m.ok ? "rgba(39,174,96,0.2)" : "rgba(231,76,60,0.18)" }}>
                <div style={{ fontSize: "0.9rem", marginBottom: 2 }}>{m.icon}</div>
                <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: "0.78rem" }}>{m.val}</div>
                <div style={{ color: "#9999a8", fontSize: "0.65rem", marginTop: 1 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className="ci-message">💡 {liveMetrics.message}</div>

          {localTx && (
            <div className="ci-transcript">
              <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: "0.73rem", marginBottom: 3 }}>
                🗣 {ur ? "تقریر" : "Speech"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6b6b7b", lineHeight: 1.5, direction: ur ? "rtl" : "ltr", fontFamily: ur ? "'Noto Nastaliq Urdu',serif" : "inherit" }}>
                {localTx}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes ciPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </div>
  );
}