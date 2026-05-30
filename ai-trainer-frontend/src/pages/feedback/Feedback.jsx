
import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./Feedback.css";

export default function Feedback() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      console.log("Saved:", data);
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 3500);
    } catch (err) {
      console.error("Error:", err);
      alert("Backend not running ya connection issue hai ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fb-page">
      <Header username="Amber" />

      <main className="fb-main">
        {/* Background orbs */}
        <span className="fb-orb fb-orb-1" />
        <span className="fb-orb fb-orb-2" />
        <span className="fb-orb fb-orb-3" />

        {/* Floating particles */}
        <span className="fb-particle fb-p1">✦</span>
        <span className="fb-particle fb-p2">◈</span>
        <span className="fb-particle fb-p3">✦</span>

        <div className="fb-card">
          {/* Gold top line */}
          <div className="fb-card-topline" />

          {/* Header */}
          <div className="fb-header">
            <div className="fb-header-icon">💬</div>
            <h1>Share Your Feedback</h1>
            <p>We'd love to hear from you. Your thoughts help us grow better every day.</p>
          </div>

          {/* Form */}
          <form className="fb-form" onSubmit={handleSubmit}>

            {/* Name */}
            <div className="fb-field">
              <label className="fb-label">Full Name</label>
              <div className="fb-input-row">
                <span className="fb-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  className="fb-input"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="fb-field">
              <label className="fb-label">Email Address</label>
              <div className="fb-input-row">
                <span className="fb-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <polyline points="2,4 12,13 22,4"/>
                  </svg>
                </span>
                <input
                  className="fb-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Message */}
            <div className="fb-field">
              <label className="fb-label">Your Message</label>
              <div className="fb-input-row fb-textarea-row">
                <span className="fb-ico fb-ico-top">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </span>
                <textarea
                  className="fb-input fb-textarea"
                  name="message"
                  placeholder="Write your message here..."
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="fb-btn" disabled={loading}>
              {loading ? (
                <span className="fb-btn-loading">
                  <span className="fb-dot" /><span className="fb-dot" /><span className="fb-dot" />
                </span>
              ) : (
                <>
                  <span>Submit Feedback</span>
                  <svg className="fb-btn-arrow" width="17" height="17" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

            {/* ── Success message — BELOW button ── */}
            {submitted && (
              <div className="fb-success">
                <span className="fb-success-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Thank you! Your feedback has been received.</span>
              </div>
            )}

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}