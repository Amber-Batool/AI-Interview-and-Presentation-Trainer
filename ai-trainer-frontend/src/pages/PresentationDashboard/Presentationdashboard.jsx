
import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Practice from "./Practice";
import Feedback from "./Feedback";
import CameraPractice from "./CameraPractice";
import { useNavigate } from "react-router-dom";
import "./presentationdashboard.css";

export default function PresentationDashboard() {
  const navigate = useNavigate();

  const [mode,       setMode]      = useState(localStorage.getItem("p_mode")     || "slides");
  const [duration,   setDuration]  = useState(Number(localStorage.getItem("p_duration")) || 5);
  const [topic,      setTopic]     = useState(localStorage.getItem("p_topic")    || "");
  const [transcript, setTranscript]= useState("");
  const [feedback,   setFeedback]  = useState(null);
  const [slides,     setSlides]    = useState(JSON.parse(localStorage.getItem("p_slides")) || []);
  const [file,       setFile]      = useState(null);
  const [inputMode,  setInputMode] = useState("voice");
  const [language,   setLanguage]  = useState(localStorage.getItem("p_language") || "English");

  useEffect(() => localStorage.setItem("p_mode",     mode),                   [mode]);
  useEffect(() => localStorage.setItem("p_duration", duration),               [duration]);
  useEffect(() => localStorage.setItem("p_topic",    topic),                  [topic]);
  useEffect(() => localStorage.setItem("p_language", language),               [language]);
  useEffect(() => localStorage.setItem("p_slides",   JSON.stringify(slides)), [slides]);
  useEffect(() => { setFeedback(null); localStorage.removeItem("p_feedback"); }, []);
  useEffect(() => { setFeedback(null); localStorage.removeItem("p_feedback"); }, [inputMode]);

  const ur = language === "Urdu";

  return (
    <>
      <Header />
      <div className="presentation-dashboard">

        <div className="pd-hero">
          <div className="pd-hero-badge">AI Powered</div>
          <h1 style={ur ? { fontFamily:"'Noto Nastaliq Urdu',serif", direction:"rtl" } : {}}>
            {ur ? "پریزنٹیشن ٹرینر" : "Presentation Trainer"}
          </h1>
          <p className="pd-hero-sub" style={ur ? { direction:"rtl", fontFamily:"'Noto Nastaliq Urdu',serif" } : {}}>
            {ur ? "AI کے ساتھ پریکٹس کریں اور فوری فیڈبیک حاصل کریں"
                : "Practice, record, and get instant AI feedback on your delivery"}
          </p>
        </div>

        <div className="dashboard-grid">

          {/* LEFT PANEL */}
          <div className="left-panel panel">
            <div className="panel-header">
              <span className="panel-icon">⚙️</span>
              <h3>{ur ? "سیٹ اپ" : "Setup"}</h3>
            </div>

            {/* Language */}
            <div className="form-group">
              <label className="form-label">{ur ? "زبان / Language" : "Language"}</label>
              <div className="input-mode-toggle">
                <button className={`toggle-btn ${language==="English"?"active":""}`} onClick={()=>setLanguage("English")}>
                  🇬🇧 English
                </button>
                <button className={`toggle-btn ${language==="Urdu"?"active":""}`} onClick={()=>setLanguage("Urdu")}>
                  🇵🇰 اردو
                </button>
              </div>
            </div>

            {/* Practice Mode */}
            <div className="form-group">
              <label className="form-label">{ur ? "پریکٹس موڈ" : "Practice Mode"}</label>
              <div className="select-wrapper">
                <select value={mode} onChange={(e)=>setMode(e.target.value)}>
                  <option value="slides">{ur ? "سلائیڈز موڈ" : "Slides Mode"}</option>
                  <option value="no-slides">{ur ? "بغیر سلائیڈز" : "No Slides"}</option>
                </select>
              </div>
            </div>

            {/* Input Type */}
            <div className="form-group">
              <label className="form-label">{ur ? "موڈ" : "Input Type"}</label>
              <div className="input-mode-toggle">
                <button className={`toggle-btn ${inputMode==="voice"?"active":""}`} onClick={()=>setInputMode("voice")}>
                  🎤 {ur ? "آواز" : "Voice"}
                </button>
                <button className={`toggle-btn ${inputMode==="camera"?"active":""}`} onClick={()=>setInputMode("camera")}>
                  📷 {ur ? "کیمرہ" : "Camera"}
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">{ur ? "مدت" : "Duration"}</label>
              <div className="duration-chips">
                {[5,10,15,30].map((d)=>(
                  <button key={d} className={`chip ${duration===d?"active":""}`} onClick={()=>setDuration(d)}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {mode==="slides" && (
              <div className="form-group">
                <label className="form-label">{ur ? "سلائیڈز اپلوڈ" : "Upload Slides"}</label>
                <label className="file-upload-label">
                  <input type="file" onChange={(e)=>setFile(e.target.files[0])} />
                  <span className="file-upload-inner">
                    <span className="file-icon">📎</span>
                    <span>{file ? file.name : (ur ? "فائل منتخب کریں..." : "Choose a file...")}</span>
                  </span>
                </label>
              </div>
            )}

            <div className="setup-tip">
              <span className="tip-icon">💡</span>
              <p style={ur?{direction:"rtl",textAlign:"right"}:{}}>
                {ur ? "زبان اور موڈ منتخب کریں، پھر پریکٹس شروع کریں۔"
                    : "Select language and mode, then start practicing."}
              </p>
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="center-panel panel">
            {inputMode==="voice" ? (
              <Practice
                slides={slides} duration={duration} mode={mode}
                language={language}
                setTranscript={setTranscript} setFeedback={setFeedback}
              />
            ) : (
              <CameraPractice
                language={language}
                setFeedback={setFeedback} setTranscript={setTranscript}
              />
            )}
          </div>

          {/* RIGHT PANEL — Voice */}
          {inputMode==="voice" && (
            <div className="right-panel panel">
              <Feedback feedback={feedback} setFeedback={setFeedback} language={language} />
            </div>
          )}

          {/* FEEDBACK — Camera */}
          {inputMode==="camera" && feedback && (
            <div className="right-panel panel">
              <Feedback feedback={feedback} setFeedback={setFeedback} language={language} />
            </div>
          )}

        </div>

        <button className="back-btn" onClick={()=>navigate("/dashboard")}>
          {ur ? "← ڈیش بورڈ پر واپس" : "← Back to Dashboard"}
        </button>
      </div>
      <Footer />
    </>
  );
}