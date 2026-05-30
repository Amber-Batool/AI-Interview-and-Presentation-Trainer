
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./AuthPage.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const url = isLogin
      ? "http://127.0.0.1:8000/api/auth/login"
      : "http://127.0.0.1:8000/api/auth/register";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.detail || "Something went wrong"); return; }
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      alert(data.message || "Success");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  }

  return (
    <div className="auth-page">
      <Header />

      <main className="auth-split">

        {/* ══════════════════════════════════
            LEFT — Dark form panel
        ══════════════════════════════════ */}
        <div className="auth-left">
          <div className="auth-left-grid" />
          <div className="auth-orb auth-orb-tl" />
          <div className="auth-orb auth-orb-br" />

          <div className="auth-form-wrap">

            {/* Brand */}
            <div className="auth-brand">
              <span className="auth-brand-icon">✦</span>
              <span className="auth-brand-name">Prep AI</span>
            </div>

            {/* Heading */}
            <h2 className="auth-heading">
              {isLogin ? "Welcome back" : "Get started"}
            </h2>
            <p className="auth-sub">
              {isLogin
                ? "Sign in to continue your practice journey."
                : "Create your account and start improving today."}
            </p>

            {/* Toggle */}
            <div className="auth-toggle">
              <button
                className={`toggle-pill ${isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(true)}
              >Login</button>
              <button
                className={`toggle-pill ${!isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(false)}
              >Sign Up</button>
            </div>

            {/* Form */}
            <form className="auth-form" onSubmit={onSubmit}>

              {!isLogin && (
                <>
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <div className="input-wrap">
                      <span className="input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      <input className="field-input" name="name" value={form.name}
                        onChange={onChange} placeholder="Your full name" required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Role / Industry</label>
                    <div className="input-wrap select-wrap">
                      <span className="input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2"/>
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                      </span>
                      <select className="field-input" name="role" value={form.role}
                        onChange={onChange} required>
                        <option value="">-- Select --</option>
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="manager">Manager</option>
                        <option value="student">Student</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="select-chevron">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="field-group">
                <label className="field-label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <polyline points="2,4 12,13 22,4"/>
                    </svg>
                  </span>
                  <input className="field-input" name="email" type="email"
                    value={form.email} onChange={onChange}
                    placeholder="you@example.com" required />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input className="field-input" name="password" type="password"
                    value={form.password} onChange={onChange}
                    placeholder="••••••••" required />
                </div>
              </div>

              <button type="submit" className="btn-submit">
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                <span className="btn-arrow">→</span>
              </button>
            </form>

            {/* Switch */}
            <p className="auth-switch">
              {isLogin ? "No account? " : "Have an account? "}
              <button className="auth-switch-link" onClick={() => setIsLogin(v => !v)}>
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>

            {/* Back */}
            <button className="btn-back" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════
            RIGHT — Cream panel with Cute Robot
        ══════════════════════════════════ */}
        <div className="auth-right">
          <div className="auth-right-inner">

            {/* Headline */}
            <div className="ar-headline">
              <span className="ar-badge">AI Powered</span>
              <h3>Practice smarter.<br />Speak with confidence.</h3>
              <p>Real-time AI feedback on your interviews, presentations, and communication skills.</p>
            </div>

            {/* ── Cute Robot SVG ── */}
            <div className="robot-wrap">
              <div className="robot-glow" />

              <svg className="robot-svg" viewBox="0 0 260 360" fill="none" xmlns="http://www.w3.org/2000/svg">

                {/* Sparkles */}
                <text x="30"  y="90"  fontSize="11" fill="#c9a84c" opacity="0.5" className="robot-sparkle-l">✦</text>
                <text x="216" y="100" fontSize="9"  fill="#c9a84c" opacity="0.4" className="robot-sparkle-r">✦</text>
                <text x="48"  y="210" fontSize="7"  fill="#c9a84c" opacity="0.3" className="robot-sparkle-l">✦</text>
                <text x="204" y="220" fontSize="8"  fill="#c9a84c" opacity="0.3" className="robot-sparkle-r">✦</text>

                {/* ── Antenna ── */}
                <line x1="130" y1="28" x2="130" y2="52" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="130" cy="19" r="12" fill="#c9a84c"/>
                <circle cx="130" cy="19" r="7"  fill="#1a1a2e"/>
                {/* tiny heart */}
                <path d="M127.5 18.5 C127.5 17 129.2 16 130 17.5 C130.8 16 132.5 17 132.5 18.5 C132.5 20.2 130 22 130 22 C130 22 127.5 20.2 127.5 18.5Z" fill="#c9a84c"/>
                <circle className="robot-antenna-pulse" cx="130" cy="19" r="12" fill="none" stroke="#c9a84c" strokeWidth="2"/>

                {/* ── Head — very round / cute ── */}
                <rect x="66" y="52" width="128" height="98" rx="34" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                {/* blush */}
                <ellipse cx="86"  cy="124" rx="11" ry="6.5" fill="rgba(255,100,100,0.20)"/>
                <ellipse cx="174" cy="124" rx="11" ry="6.5" fill="rgba(255,100,100,0.20)"/>
                {/* head shine */}
                <rect x="80" y="61" width="44" height="8" rx="4" fill="rgba(201,168,76,0.13)"/>

                {/* ── Eyes ── */}
                <rect x="82" y="74" width="40" height="36" rx="13" fill="#0d0d1a" stroke="#c9a84c" strokeWidth="1.5"/>
                <circle className="robot-eye-l" cx="102" cy="92" r="12" fill="#c9a84c"/>
                <circle cx="102" cy="92" r="6.5" fill="#1a1a2e"/>
                <circle cx="107" cy="87" r="3"   fill="rgba(255,255,255,0.80)"/>
                <circle cx="99"  cy="97" r="1.4" fill="rgba(255,255,255,0.45)"/>

                <rect x="138" y="74" width="40" height="36" rx="13" fill="#0d0d1a" stroke="#c9a84c" strokeWidth="1.5"/>
                <circle className="robot-eye-r" cx="158" cy="92" r="12" fill="#c9a84c"/>
                <circle cx="158" cy="92" r="6.5" fill="#1a1a2e"/>
                <circle cx="163" cy="87" r="3"   fill="rgba(255,255,255,0.80)"/>
                <circle cx="155" cy="97" r="1.4" fill="rgba(255,255,255,0.45)"/>

                {/* ── Cute smile ── */}
                <path d="M106 122 Q130 136 154 122" stroke="#c9a84c" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
                <circle cx="104" cy="121" r="2.2" fill="#c9a84c" opacity="0.55"/>
                <circle cx="156" cy="121" r="2.2" fill="#c9a84c" opacity="0.55"/>

                {/* ── Neck ── */}
                <rect x="116" y="150" width="28" height="17" rx="7" fill="#c9a84c" opacity="0.45"/>
                <circle cx="124" cy="158" r="2.2" fill="rgba(255,255,255,0.18)"/>
                <circle cx="136" cy="158" r="2.2" fill="rgba(255,255,255,0.18)"/>

                {/* ── Body ── */}
                <rect x="52" y="167" width="156" height="116" rx="30" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                <rect x="63" y="176" width="52" height="7" rx="3.5" fill="rgba(201,168,76,0.10)"/>

                {/* Chest panel */}
                <rect x="82" y="182" width="96" height="62" rx="17" fill="#0d0d1a" stroke="rgba(201,168,76,0.35)" strokeWidth="1.5"/>

                {/* Waveform bars */}
                <rect className="robot-bar-1" x="93"  y="197" width="8" height="28" rx="4" fill="#c9a84c"/>
                <rect className="robot-bar-2" x="107" y="191" width="8" height="40" rx="4" fill="#c9a84c" opacity="0.8"/>
                <rect className="robot-bar-3" x="121" y="199" width="8" height="24" rx="4" fill="#c9a84c" opacity="0.6"/>
                <rect className="robot-bar-4" x="135" y="193" width="8" height="36" rx="4" fill="#c9a84c" opacity="0.8"/>
                <rect className="robot-bar-5" x="149" y="200" width="8" height="22" rx="4" fill="#c9a84c" opacity="0.5"/>
                <rect className="robot-bar-6" x="163" y="196" width="8" height="30" rx="4" fill="#c9a84c" opacity="0.7"/>

                {/* bolts */}
                <circle cx="70"  cy="184" r="5.5" fill="#c9a84c" opacity="0.30"/>
                <circle cx="190" cy="184" r="5.5" fill="#c9a84c" opacity="0.30"/>
                <circle cx="70"  cy="272" r="5.5" fill="#c9a84c" opacity="0.30"/>
                <circle cx="190" cy="272" r="5.5" fill="#c9a84c" opacity="0.30"/>

                {/* ── Arms — chubby ── */}
                <rect x="14" y="172" width="40" height="82" rx="20" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                {/* left mitten */}
                <circle cx="34" cy="263" r="18" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                <path d="M20 258 Q27 250 34 260 Q41 250 48 258" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55"/>

                <rect x="206" y="172" width="40" height="82" rx="20" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                {/* right mitten */}
                <circle cx="226" cy="263" r="18" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                <path d="M212 258 Q219 250 226 260 Q233 250 240 258" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55"/>

                {/* ── Legs — chubby ── */}
                <rect x="84"  y="283" width="40" height="60" rx="20" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                <rect x="136" y="283" width="40" height="60" rx="20" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>

                {/* Feet */}
                <rect x="73"  y="332" width="60" height="23" rx="11.5" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
                <rect x="127" y="332" width="60" height="23" rx="11.5" fill="#1a1a2e" stroke="#c9a84c" strokeWidth="2"/>
              </svg>

              <div className="robot-shadow" />
            </div>

            {/* Stats row */}
            <div className="ar-stats">
              <div className="ar-stat">
                <span className="ar-stat-val">98%</span>
                <span className="ar-stat-label">Accuracy</span>
              </div>
              <div className="ar-stat-div" />
              <div className="ar-stat">
                <span className="ar-stat-val">10k+</span>
                <span className="ar-stat-label">Users</span>
              </div>
              <div className="ar-stat-div" />
              <div className="ar-stat">
                <span className="ar-stat-val">Real‑time</span>
                <span className="ar-stat-label">Feedback</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}