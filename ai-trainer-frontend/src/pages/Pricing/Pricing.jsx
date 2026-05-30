
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Pricing.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const STATIC_TESTIMONIALS = [
  { name: "Sarah K.", role: "Software Engineer", text: "AI Interview Trainer improved my confidence tremendously!" },
  { name: "John D.", role: "Marketing Specialist", text: "Presentation feedback helped me refine my slides and delivery." },
  { name: "Emma L.", role: "Project Manager", text: "Love the progress tracking! I can see my improvements clearly." }
];

// Avatar helpers
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
const AVATAR_COLORS = [
  "#c9a84c", "#4c7ec9", "#4cc98a", "#c94c7e",
  "#7e4cc9", "#c96b4c", "#4cc9c9", "#8ac94c",
];
function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const Pricing = () => {
  const [billing, setBilling]                   = useState("monthly");
  const [showComparison, setShowComparison]     = useState(false);
  const [visible, setVisible]                   = useState(false);
  const [testimonials, setTestimonials]         = useState(STATIC_TESTIMONIALS);
  const navigate        = useNavigate();
  const testimonialsRef = useRef(null);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);

  // Page load animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Intersection observer for testimonials section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTestimonialsVisible(true); },
      { threshold: 0.15 }
    );
    if (testimonialsRef.current) observer.observe(testimonialsRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch real feedback from MongoDB
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/feedback")
      .then((r) => r.json())
      .then((data) => {
        if (data.feedbacks && data.feedbacks.length > 0) {
          const mapped = data.feedbacks.map((f) => ({
            name: f.name,
            role: f.email,
            text: f.message,
          }));
          setTestimonials(mapped);
        }
      })
      .catch((err) => {
        console.error("Feedback fetch failed:", err);
        // Static fallback already set as default state
      });
  }, []);

  const handleUpgrade = (plan) => {
    navigate("/checkout", { state: { plan, billing } });
  };

  const handleGetStarted = () => {
    const isLoggedIn = localStorage.getItem("token") || localStorage.getItem("user");
    navigate(isLoggedIn ? "/dashboard" : "/auth");
  };

  return (
    <div className={`pricing-page${visible ? " page-visible" : ""}`}>
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="pricing-hero">
          <div className="hero-glow" />
          <div className="hero-grain" />
          <h1 className="hero-title">
            Simple &amp; Transparent <span className="hero-accent">Pricing</span>
          </h1>
          <p className="hero-sub">Choose a plan that fits your career growth</p>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </section>

        {/* ── Billing Toggle ── */}
        <div className="billing-toggle-wrap">
          <div className="billing-toggle">
            <button
              className={billing === "monthly" ? "active" : ""}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
            <button
              className={billing === "yearly" ? "active" : ""}
              onClick={() => setBilling("yearly")}
            >
              Yearly <span>Save 20%</span>
            </button>
          </div>
        </div>

        {/* ── Pricing Cards ── */}
        <section className="pricing-cards">

          {/* Free Card */}
          <div className="pricing-card animate-card" style={{ animationDelay: "0.1s" }}>
            <div className="card-inner">
              <h3>Free</h3>
              <div className="price-row">
                <h2>$0</h2>
              </div>
              <p className="price-duration">Forever</p>
              <ul>
                <li><span className="check yes">✔</span> 2 AI Mock Interviews / month</li>
                <li><span className="check yes">✔</span> Basic Presentation Feedback</li>
                <li><span className="check yes">✔</span> Limited Question Bank</li>
                <li><span className="check no">✖</span> Advanced Analytics</li>
              </ul>
              <div className="btn-wrapper">
                <button className="btn-outline" onClick={handleGetStarted}>
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* Premium Card */}
          <div className="pricing-card premium animate-card" style={{ animationDelay: "0.22s" }}>
            <div className="premium-glow" />
            <span className="badge">Most Popular</span>
            <div className="card-inner">
              <h3>Premium</h3>
              <div className="price-row">
                <h2>
                  <span className="price-animate" key={billing}>
                    {billing === "monthly" ? "$19" : "$180"}
                  </span>
                </h2>
              </div>
              <p className="price-duration">
                {billing === "monthly" ? "per month" : "per year"}
              </p>
              <ul>
                <li><span className="check yes">✔</span> Unlimited AI Interviews</li>
                <li><span className="check yes">✔</span> Advanced Presentation Coaching</li>
                <li><span className="check yes">✔</span> Smart Feedback &amp; Scoring</li>
                <li><span className="check yes">✔</span> Full Question Bank Access</li>
                <li><span className="check yes">✔</span> Progress Tracking</li>
              </ul>
              <div className="btn-wrapper">
                <button className="btn-primary" onClick={() => handleUpgrade("premium")}>
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>

        </section>

        {/* ── Comparison ── */}
        <section className="comparison">
          <h2>Compare Plans</h2>
          <div className="btn-wrapper">
            <button
              className="btn-outline"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? "Hide Details" : "View Details"}
            </button>
          </div>

          {showComparison && (
            <div className="comparison-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Features</th>
                    <th>Free</th>
                    <th>Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["AI Interviews",          "Limited",  "Unlimited"],
                    ["Presentation Feedback",  "Basic",    "Advanced"],
                    ["Performance Analytics",  "✖",        "✔"],
                    ["Career Reports",         "✖",        "✔"],
                  ].map(([feature, free, premium], i) => (
                    <tr
                      key={i}
                      style={{ animationDelay: `${i * 0.07}s` }}
                      className="table-row-in"
                    >
                      <td>{feature}</td>
                      <td className={free === "✖" ? "cell-no" : ""}>{free}</td>
                      <td className={premium === "✔" ? "cell-yes" : ""}>{premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Testimonials — Dynamic from MongoDB ── */}
        <section
          className={`testimonials${testimonialsVisible ? " testi-visible" : ""}`}
          ref={testimonialsRef}
        >
          <h2>What Our Users Say</h2>
          <div className="testimonial-cards">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="testimonial-card"
                style={{ animationDelay: `${0.1 + i * 0.12}s` }}
              >
                <div className="quote-mark">"</div>

                {/* Avatar circle */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: getAvatarColor(t.name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 auto 10px",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(t.name)}
                </div>

                <p>{t.text}</p>
                <div className="testi-footer">
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="pricing-cta">
          <div className="cta-glow" />
          <span className="hero-eyebrow">Ready?</span>
          <h2>Ready to crack your next interview?</h2>
          <p>Upgrade to Premium and level up your skills</p>
          <div className="btn-wrapper">
            <button
              className="btn-primary btn-cta-pulse"
              onClick={() => handleUpgrade("premium")}
            >
              Start Premium
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;