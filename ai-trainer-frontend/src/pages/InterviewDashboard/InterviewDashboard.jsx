
import React, { useState, useEffect } from "react";
import "./InterviewDashboard.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import Setup from "./Setup";
import LiveInterview from "./LiveInterview";
import CameraInterview from "./CameraInterview";
import Feedback from "./Feedback";
import RecentSessions from "./RecentSessions";

export default function InterviewDashboard() {
  const navigate = useNavigate();

  const [field,           setField]           = useState(localStorage.getItem("i_field")    || "");
  const [experienceLevel, setExperienceLevel] = useState(localStorage.getItem("i_exp")      || "");
  const [interviewType,   setInterviewType]   = useState(localStorage.getItem("i_type")     || "");
  const [language,        setLanguage]        = useState(localStorage.getItem("i_lang")     || "English");
  const [question,        setQuestion]        = useState(localStorage.getItem("i_question") || "");
  const [answer,          setAnswer]          = useState(localStorage.getItem("i_answer")   || "");
  const [generatedResume, setGeneratedResume] = useState(localStorage.getItem("i_resume")   || "");
  const [recentSessions,  setRecentSessions]  = useState(JSON.parse(localStorage.getItem("i_sessions") || "[]"));
  const [feedback,        setFeedback]        = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [inputMode,       setInputMode]       = useState("voice");
  const [username,        setUsername]        = useState("anonymous");

  useEffect(() => localStorage.setItem("i_field",    field),                          [field]);
  useEffect(() => localStorage.setItem("i_exp",      experienceLevel),                [experienceLevel]);
  useEffect(() => localStorage.setItem("i_type",     interviewType),                  [interviewType]);
  useEffect(() => localStorage.setItem("i_lang",     language),                       [language]);
  useEffect(() => localStorage.setItem("i_question", question),                       [question]);
  useEffect(() => localStorage.setItem("i_answer",   answer),                         [answer]);
  useEffect(() => localStorage.setItem("i_resume",   generatedResume),                [generatedResume]);
  useEffect(() => localStorage.setItem("i_sessions", JSON.stringify(recentSessions)), [recentSessions]);

  // Login check + username set
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (!token) { alert("Please login first"); navigate("/auth"); return; }
    if (user) {
      const parsed = JSON.parse(user);
      setUsername(parsed.name || parsed.username || "anonymous");
    }
  }, [navigate]);

  const handleSetInputMode = (mode) => {
    if (mode !== inputMode) setFeedback(null);
    setInputMode(mode);
  };

  const ur = language === "Urdu";

  return (
    <>
      <Header />
      <div className="interview-dashboard">

        {/* HERO */}
        <div className="id-hero">
          <div className="id-hero-badge">AI Powered</div>
          <h1 style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}>
            {ur ? "انٹرویو ٹرینر" : "Interview Trainer"}
          </h1>
          <p className="id-hero-sub" style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}>
            {ur
              ? "AI کے ساتھ انٹرویو کی پریکٹس کریں اور فوری فیڈبیک حاصل کریں"
              : "Practice real interview questions and get instant AI feedback"}
          </p>
        </div>

        {/* VOICE MODE */}
        {inputMode === "voice" && (
          <>
            <div className="id-voice-grid">
              <div className="id-left">
                <Setup
                  field={field}                     setField={setField}
                  experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
                  interviewType={interviewType}     setInterviewType={setInterviewType}
                  language={language}               setLanguage={setLanguage}
                  question={question}               setQuestion={setQuestion}
                  setAnswer={setAnswer}
                  setFeedback={setFeedback}
                  generatedResume={generatedResume} setGeneratedResume={setGeneratedResume}
                  recentSessions={recentSessions}   setRecentSessions={setRecentSessions}
                  loadingQuestion={loadingQuestion} setLoadingQuestion={setLoadingQuestion}
                  inputMode={inputMode}             setInputMode={handleSetInputMode}
                />
              </div>
              <div className="id-right">
                <LiveInterview
                  question={question}               setQuestion={setQuestion}
                  answer={answer}                   setAnswer={setAnswer}
                  feedback={feedback}               setFeedback={setFeedback}
                  field={field}
                  experienceLevel={experienceLevel}
                  interviewType={interviewType}
                  language={language}
                  loadingFeedback={loadingFeedback} setLoadingFeedback={setLoadingFeedback}
                  recentSessions={recentSessions}   setRecentSessions={setRecentSessions}
                  username={username}
                />
              </div>
            </div>

            {feedback && (
              <div className="id-feedback-row">
                <Feedback feedback={feedback} setFeedback={setFeedback} language={language} />
              </div>
            )}

            <div className="id-recent-wrap">
              <RecentSessions
                recentSessions={recentSessions}
                setRecentSessions={setRecentSessions}
                language={language}
              />
            </div>
          </>
        )}

        {/* CAMERA MODE */}
        {inputMode === "camera" && (
          <>
            <div className="id-camera-grid">
              <div className="id-left">
                <Setup
                  field={field}                     setField={setField}
                  experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
                  interviewType={interviewType}     setInterviewType={setInterviewType}
                  language={language}               setLanguage={setLanguage}
                  question={question}               setQuestion={setQuestion}
                  setAnswer={setAnswer}
                  setFeedback={setFeedback}
                  generatedResume={generatedResume} setGeneratedResume={setGeneratedResume}
                  recentSessions={recentSessions}   setRecentSessions={setRecentSessions}
                  loadingQuestion={loadingQuestion} setLoadingQuestion={setLoadingQuestion}
                  inputMode={inputMode}             setInputMode={handleSetInputMode}
                />
              </div>
              <div className="id-camera-main">
                <CameraInterview
                  question={question}
                  language={language}
                  setFeedback={setFeedback}
                  feedback={feedback}
                  field={field}
                  experienceLevel={experienceLevel}
                  interviewType={interviewType}
                  recentSessions={recentSessions}
                  setRecentSessions={setRecentSessions}
                  username={username}
                />
              </div>
            </div>

            {feedback && (
              <div className="id-feedback-row">
                <Feedback feedback={feedback} setFeedback={setFeedback} language={language} />
              </div>
            )}

            <div className="id-recent-wrap">
              <RecentSessions
                recentSessions={recentSessions}
                setRecentSessions={setRecentSessions}
                language={language}
              />
            </div>
          </>
        )}

        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          {ur ? "← ڈیش بورڈ پر واپس" : "← Back to Dashboard"}
        </button>
      </div>
      <Footer />
    </>
  );
}