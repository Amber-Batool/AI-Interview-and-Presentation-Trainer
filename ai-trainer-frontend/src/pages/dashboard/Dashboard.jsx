
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./Dashboard.css";

// ===== Animated Counter Hook =====
function useCountUp(target, duration = 1200, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

// ===== Scroll Reveal Hook =====
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".d-reveal, .d-reveal-left, .d-reveal-right, .d-reveal-scale")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [scoreVisible, setScoreVisible] = useState(false);
  const scoreRef = useRef(null);

  // ── Dynamic data state ───────────────────────────────────────────────────
  const [stats, setStats] = useState({
    sessionsDone: 0,
    avgScore:     0,
    streak:       0,
    improvement:  0,
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [progressData, setProgressData] = useState([
    { name: "Mon", score: null },
    { name: "Tue", score: null },
    { name: "Wed", score: null },
    { name: "Thu", score: null },
    { name: "Fri", score: null },
    { name: "Sat", score: null },
    { name: "Sun", score: null },
  ]);

  const overallScore  = stats.avgScore;
  const animatedScore = useCountUp(overallScore, 1400, scoreVisible);

  useScrollReveal();

  // ── Fetch dashboard stats from backend ──────────────────────────────────
  useEffect(() => {
    const user = localStorage.getItem("user");
    const uname = user ? JSON.parse(user).name : null;
    const query = uname ? `?username=${encodeURIComponent(uname)}` : "";

    fetch(`http://127.0.0.1:8000/api/dashboard-stats${query}`)
      .then((r) => r.json())
      .then((data) => {
        setStats({
          sessionsDone: data.sessions_done  ?? 0,
          avgScore:     data.avg_score      ?? 0,
          streak:       data.streak         ?? 0,
          improvement:  data.improvement    ?? 0,
        });
        if (data.recent_sessions?.length) {
          setRecentSessions(data.recent_sessions);
        }
        if (data.progress_data?.length) {
          setProgressData(data.progress_data);
        }
      })
      .catch((err) => console.error("Dashboard stats fetch failed:", err));
  }, []);

  // ── Stat mini cards (reads from state) ──────────────────────────────────
  const statCards = [
    { label: "Sessions Done", value: stats.sessionsDone, suffix: "",  icon: "🎯" },
    { label: "Avg Score",     value: stats.avgScore,     suffix: "%", icon: "📊" },
    { label: "Streak",        value: stats.streak,       suffix: "d", icon: "🔥" },
    { label: "Improvement",   value: stats.improvement,  suffix: "%", icon: "📈" },
  ];

  // Trigger score counter when circle is visible
  useEffect(() => {
    if (!scoreRef.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setScoreVisible(true); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(scoreRef.current);
    return () => io.disconnect();
  }, []);

  // Login check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (!token) { alert("Please login first"); navigate("/auth"); return; }
    if (user) setUsername(JSON.parse(user).name);
  }, [navigate]);

  // Scroll spy
  useEffect(() => {
    const sections = [
      { id: "dashboard",       name: "dashboard" },
      { id: "practice-mode",   name: "practice"  },
      { id: "performance",     name: "history"   },
      { id: "recent-sessions", name: "history"   },
      { id: "progress",        name: "progress"  },
    ];
    const handleScroll = () => {
      for (let sec of sections) {
        const el = document.getElementById(sec.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom > 150) {
          setActiveSection((prev) => prev !== sec.name ? sec.name : prev);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id, name) => {
    if (id === "feedback") { navigate("/feedback"); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(name);
  };

  const navItems = [
    { id: "dashboard",       name: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "practice-mode",   name: "practice",  label: "Practice",  icon: "🎤" },
    { id: "recent-sessions", name: "history",   label: "History",   icon: "🕒" },
    { id: "progress",        name: "progress",  label: "Progress",  icon: "📈" },
    { id: "feedback",        name: "feedback",  label: "Feedback",  icon: "💬" },
  ];

  return (
    <div className="dashboard-page">
      <Header username={username} />

      <div className="dashboard-layout">
        {/* ===== SIDEBAR ===== */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <span className="sidebar-logo-icon">✦</span>
              <h3>Menu</h3>
            </div>
          </div>
          <nav>
            {navItems.map((item) => (
              <p
                key={item.id}
                className={`nav-item ${activeSection === item.name ? "active" : ""}`}
                onClick={() => scrollToSection(item.id, item.name)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                {activeSection === item.name && <span className="nav-indicator" />}
              </p>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{username.charAt(0)}</div>
              <div>
                <p className="sidebar-user-name">{username}</p>
                <p className="sidebar-user-role">Pro Member</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="dashboard-content">

          {/* WELCOME BANNER */}
          <section id="dashboard" className="welcome-banner d-reveal">
            <div className="welcome-text">
              <h2>Welcome back, <span>{username}</span> 👋</h2>
              <p>Track your progress and continue practicing to ace your goals.</p>
            </div>
            <div className="welcome-badge">
              <span className="badge-icon">🏆</span>
              <span className="badge-text">Top Performer</span>
            </div>
          </section>

          {/* STAT MINI CARDS */}
          <div className="mini-stats d-reveal">
            {statCards.map((s, i) => (
              <div className="mini-stat-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="mini-stat-icon">{s.icon}</span>
                <div className="mini-stat-value">{s.value}{s.suffix}</div>
                <div className="mini-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* PRACTICE MODE */}
          <section id="practice-mode" className="mode-select-hero d-reveal">
            <h2 className="section-title">Choose a Practice Mode</h2>
            <p className="section-subtitle">Pick a mode and start improving today</p>

            <div className="mode-cards">
              <div className="mode-card interview-card" onClick={() => navigate("/interview")}>
                <div className="mode-card-bg" />
                <span className="mode-card-emoji">💼</span>
                <h3>Interview Mode</h3>
                <p>Mock interviews, AI feedback &amp; scoring.</p>
                <button className="btn-primary">Start Interview</button>
              </div>

              <div className="mode-card presentation-card" onClick={() => navigate("/presentation")}>
                <div className="mode-card-bg" />
                <span className="mode-card-emoji">🖥️</span>
                <h3>Presentation Mode</h3>
                <p>Practice slides, timing &amp; confidence.</p>
                <button className="btn-primary">Start Presentation</button>
              </div>
            </div>
          </section>

          {/* STATS GRID */}
          <div className="stats-grid">

            {/* PERFORMANCE CIRCLE */}
            <section id="performance" className="performance-section d-reveal-scale" ref={scoreRef}>
              <h3>Overall Performance</h3>
              <div className="performance-circle-wrap">
                <svg className="progress-ring" viewBox="0 0 120 120">
                  <circle className="ring-bg"   cx="60" cy="60" r="50" />
                  <circle
                    className="ring-fill"
                    cx="60" cy="60" r="50"
                    style={{ strokeDashoffset: scoreVisible ? 314 - (314 * overallScore) / 100 : 314 }}
                  />
                </svg>
                <div className="circle-inner">
                  <div className="score-value">{animatedScore}%</div>
                  <div className="score-label">Avg Score</div>
                </div>
              </div>
              <div className="perf-tags">
                <span className="perf-tag good">Clarity ✓</span>
                <span className="perf-tag good">Pace ✓</span>
                <span className="perf-tag warn">Eye Contact</span>
              </div>
            </section>

            {/* RECENT SESSIONS */}
            <section id="recent-sessions" className="recent-sessions d-reveal-right">
              <h3>Recent Sessions</h3>
              {recentSessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <p>No sessions yet.</p>
                  <p style={{ marginTop: 6, fontSize: "0.8rem" }}>Complete a practice session to see your history here.</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {recentSessions.map((session, index) => (
                    <div
                      key={index}
                      className="session-card-dashboard"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="session-header">
                        <div className="session-type-icon">
                          {session.type === "Camera" ? "📷" : session.type === "Interview" ? "💼" : "🖥️"}
                        </div>
                        <div className="session-info">
                          <h4>{session.type}</h4>
                          <p>{session.date}</p>
                        </div>
                        <div className={`session-score-badge ${session.score >= 80 ? "high" : session.score >= 60 ? "mid" : "low"}`}>
                          {session.score}%
                        </div>
                      </div>
                      <div className="session-bar">
                        <div className="session-bar-fill" style={{ width: `${session.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* PROGRESS GRAPH */}
          <section id="progress" className="progress-graphs d-reveal">
            <div className="graph-header">
              <h3>Progress Over Time</h3>
              <span className="graph-badge">This Week</span>
            </div>
            <div className="graph-placeholder">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,46,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#9999a8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#9999a8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid rgba(26,26,46,0.1)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    formatter={(value) => value !== null ? [`${value}%`, "Score"] : ["No data", "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#c9a84c"
                    strokeWidth={3}
                    connectNulls={false}
                    dot={{ r: 5, fill: "#c9a84c", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}