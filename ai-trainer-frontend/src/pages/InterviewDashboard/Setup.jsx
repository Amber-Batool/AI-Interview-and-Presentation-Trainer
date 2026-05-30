
import React, { useState, useRef } from "react";
import axios from "axios";

const LABELS = {
  English: {
    title:       "⚙️ Interview Setup",
    lang:        "Language",
    mode:        "Practice Mode",
    voice:       "🎤 Voice",
    camera:      "📷 Camera",
    role:        "Role / Field",
    rolePH:      "e.g. React Developer, Data Analyst...",
    exp:         "Experience Level",
    expOpts:     ["Select Level", "Internship", "Junior", "Mid", "Senior", "Lead"],
    type:        "Interview Type",
    typeOpts:    ["Select Type", "HR", "Technical", "Behavioral", "System Design"],
    skills:      "Skills / Experience / Job Description",
    skillsPH:    "e.g. 3 years React, built e-commerce app, Next.js, Tailwind...",
    genResume:   "✨ Generate Resume Summary",
    generating:  "Generating...",
    resumeTitle: "📄 AI Resume Summary",
    genQ:        "Generate Question",
    nextQ:       "Next Question",
    genQing:     "Generating...",
    tip:         "Fill your details and generate your first question.",
  },
  Urdu: {
    title:       "⚙️ انٹرویو سیٹ اپ",
    lang:        "زبان",
    mode:        "پریکٹس موڈ",
    voice:       "🎤 آواز",
    camera:      "📷 کیمرہ",
    role:        "کردار / شعبہ",
    rolePH:      "مثلاً ری ایکٹ ڈویلپر، ڈیٹا تجزیہ کار...",
    exp:         "تجربہ کی سطح",
    expOpts:     ["سطح منتخب کریں", "انٹرن شپ", "جونیئر", "مِڈ", "سینیئر", "لیڈ"],
    type:        "انٹرویو کی قسم",
    typeOpts:    ["قسم منتخب کریں", "HR", "ٹیکنیکل", "طرز عمل", "سسٹم ڈیزائن"],
    skills:      "مہارتیں / تجربہ / جاب تفصیل",
    skillsPH:    "مثلاً 3 سال ری ایکٹ، ای کامرس ایپ بنائی...",
    genResume:   "✨ AI خلاصہ بنائیں",
    generating:  "بن رہا ہے...",
    resumeTitle: "📄 AI ریزومے خلاصہ",
    genQ:        "سوال بنائیں",
    nextQ:       "اگلا سوال",
    genQing:     "بن رہا ہے...",
    tip:         "اپنی تفصیلات بھریں اور پہلا سوال بنائیں۔",
  },
};

export default function Setup({
  field, setField, experienceLevel, setExperienceLevel,
  interviewType, setInterviewType, language, setLanguage,
  question, setQuestion, setAnswer, setFeedback,
  generatedResume, setGeneratedResume,
  recentSessions, setRecentSessions,
  loadingQuestion, setLoadingQuestion,
  inputMode, setInputMode,
}) {
  const [userContext,    setUserContext]    = useState("");
  const [loadingResume,  setLoadingResume]  = useState(false);
  const [resumeVisible,  setResumeVisible]  = useState(false);

  // ── Dedicated ref to track ALL asked questions this session ──────────────
  // useRef instead of useState so it never causes re-render
  // and always holds the latest value inside async callbacks
  const askedQuestionsRef = useRef([]);

  const L  = LABELS[language] || LABELS.English;
  const ur = language === "Urdu";

  // Reset asked questions when field/type/level changes
  // so a fresh topic starts fresh
  const handleFieldChange = (val) => {
    setField(val);
    askedQuestionsRef.current = [];
  };
  const handleLevelChange = (val) => {
    setExperienceLevel(val);
    askedQuestionsRef.current = [];
  };
  const handleTypeChange = (val) => {
    setInterviewType(val);
    askedQuestionsRef.current = [];
  };

  // ── Generate AI Resume Summary ────────────────────────────────────────────
  const generateResume = async () => {
    if (!userContext.trim()) {
      alert(ur ? "پہلے مہارتیں لکھیں۔" : "Please enter your skills first.");
      return;
    }
    setLoadingResume(true);
    try {
      const res = await axios.post("http://localhost:8000/api/generate-resume", {
        skills: userContext,
        field,
        experienceLevel,
        language,
      });
      setGeneratedResume(res.data.resume || "");
      setResumeVisible(true);
    } catch (e) {
      console.error(e);
      alert(ur ? "خرابی آئی۔" : "Error generating resume.");
    } finally {
      setLoadingResume(false);
    }
  };

  // ── Generate Question ─────────────────────────────────────────────────────
  const generateQuestion = async () => {
    if (!field || !experienceLevel || !interviewType) {
      alert(ur
        ? "کردار، تجربہ اور انٹرویو کی قسم منتخب کریں۔"
        : "Please select role, experience level, and interview type.");
      return;
    }

    setLoadingQuestion(true);
    setFeedback(null);
    setAnswer("");

    try {
      // Send ALL previously asked questions so GPT never repeats them
      const res = await axios.post("http://localhost:8000/api/generate-question", {
        field,
        experienceLevel,
        interviewType,
        language,
        userContext: generatedResume || userContext,
        previousQuestions: askedQuestionsRef.current,   // ← full list, always fresh
      });

      const q = res.data.question || (ur ? "سوال نہیں بنا۔" : "No question generated.");

      // ── Save to ref immediately so next call has it ───────────────────
      askedQuestionsRef.current = [...askedQuestionsRef.current, q];

      setQuestion(q);
      setRecentSessions(prev => [
        { question: q, answer: "", score: null },
        ...prev.slice(0, 19),
      ]);
    } catch (e) {
      console.error(e);
      alert(ur ? "سوال بنانے میں خرابی۔" : "Error generating question.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  return (
    <div className="interview-setup">
      <h2>{L.title}</h2>

      {/* Language */}
      <label>{L.lang}</label>
      <div className="id-mode-toggle">
        <button
          className={`id-toggle-btn ${language === "English" ? "active" : ""}`}
          onClick={() => setLanguage("English")}
        >
          🇬🇧 English
        </button>
        <button
          className={`id-toggle-btn ${language === "Urdu" ? "active" : ""}`}
          onClick={() => setLanguage("Urdu")}
        >
          🇵🇰 اردو
        </button>
      </div>

      {/* Practice Mode */}
      <label>{L.mode}</label>
      <div className="id-mode-toggle">
        <button
          className={`id-toggle-btn ${inputMode === "voice" ? "active" : ""}`}
          onClick={() => setInputMode("voice")}
        >
          {L.voice}
        </button>
        <button
          className={`id-toggle-btn ${inputMode === "camera" ? "active" : ""}`}
          onClick={() => setInputMode("camera")}
        >
          {L.camera}
        </button>
      </div>

      {/* Role — typeable + suggestions */}
      <label>{L.role}</label>
      <input
        type="text"
        className="id-text-input"
        value={field}
        onChange={e => handleFieldChange(e.target.value)}
        placeholder={L.rolePH}
        dir={ur ? "rtl" : "ltr"}
        list="role-suggestions"
      />
      <datalist id="role-suggestions">
        {[
          "Web Developer", "Frontend Developer", "Backend Developer",
          "Full Stack Developer", "React Developer", "Data Scientist",
          "AI Engineer", "ML Engineer", "DevOps Engineer",
          "Product Manager", "UX Designer", "Graphic Designer",
          "Mobile Developer", "QA Engineer",
          "ویب ڈویلپر", "ڈیٹا سائنٹسٹ", "AI انجینیئر", "گرافک ڈیزائنر",
        ].map(r => <option key={r} value={r} />)}
      </datalist>

      {/* Experience */}
      <label>{L.exp}</label>
      <select
        value={experienceLevel}
        onChange={e => handleLevelChange(e.target.value)}
      >
        {L.expOpts.map((o, i) => (
          <option key={o} value={i === 0 ? "" : o}>{o}</option>
        ))}
      </select>

      {/* Interview Type */}
      <label>{L.type}</label>
      <select
        value={interviewType}
        onChange={e => handleTypeChange(e.target.value)}
      >
        {L.typeOpts.map((o, i) => (
          <option key={o} value={i === 0 ? "" : o}>{o}</option>
        ))}
      </select>

      {/* Skills / Context */}
      <label>{L.skills}</label>
      <textarea
        className="id-skills-textarea"
        value={userContext}
        onChange={e => setUserContext(e.target.value)}
        placeholder={L.skillsPH}
        dir={ur ? "rtl" : "ltr"}
        style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif", textAlign: "right" } : {}}
      />

      {/* Generate Resume Button */}
      <button
        className="id-resume-btn"
        onClick={generateResume}
        disabled={loadingResume || !userContext.trim()}
      >
        {loadingResume ? L.generating : L.genResume}
      </button>

      {/* Generated Resume Display */}
      {resumeVisible && generatedResume && (
        <div className="id-resume-box">
          <div className="id-resume-header">
            <span>{L.resumeTitle}</span>
            <button onClick={() => setResumeVisible(false)} className="id-resume-close">✕</button>
          </div>
          <p
            dir={ur ? "rtl" : "ltr"}
            style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif" } : {}}
          >
            {generatedResume}
          </p>
        </div>
      )}

      {/* Generate Question */}
      <button
        className="id-gen-btn"
        onClick={generateQuestion}
        disabled={loadingQuestion}
      >
        {loadingQuestion ? L.genQing : question ? L.nextQ : L.genQ}
      </button>

      <div className="id-setup-tip">
        <span>💡</span>
        <p style={ur ? { fontFamily: "'Noto Nastaliq Urdu',serif", direction: "rtl" } : {}}>
          {L.tip}
        </p>
      </div>
    </div>
  );
}