
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Lottie from "lottie-react";
import robotAnimation from "../../assets/Robot-Modern-cute-chatbot.json";

import "./Homepage.css";

// ===== Scroll Reveal Hook =====
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    document
      .querySelectorAll(".reveal, .reveal-left, .reveal-right")
      .forEach((el) => io.observe(el));

    const handleScroll = () => {
      document
        .querySelector(".navbar")
        ?.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}

// Avatar initials generator
function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Random soft background colors for avatars
const AVATAR_COLORS = [
  "#c9a84c", "#4c7ec9", "#4cc98a", "#c94c7e",
  "#7e4cc9", "#c96b4c", "#4cc9c9", "#8ac94c",
];
function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function HomePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // ── Real testimonials from MongoDB ──────────────────────────────────────
  const [testimonials, setTestimonials] = useState([
    {
      name: "Ayesha",
      role: "Software Engineer",
      text: "This AI trainer helped me crack my interview with confidence! The feedback was spot on.",
    },
    {
      name: "Ali",
      role: "Product Manager",
      text: "Best tool for practicing presentations before meetings. Highly recommended.",
    },
    {
      name: "Sara",
      role: "Data Analyst",
      text: "The AI feedback is precise and very helpful. It improved my speaking pace significantly.",
    },
    {
      name: "Omar",
      role: "Student",
      text: "My presentation skills improved drastically. I feel much more confident now.",
    },
  ]);

  useScrollReveal();

  // Fetch real feedback from backend
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/feedback")
      .then((res) => {
        const fetched = res.data.feedbacks;
        if (fetched && fetched.length > 0) {
          // Map MongoDB feedback to testimonial shape
          const mapped = fetched.map((f) => ({
            name:    f.name,
            role:    f.email,   // email as subtitle since no role field
            text:    f.message,
            isReal:  true,
          }));
          setTestimonials(mapped);
        }
      })
      .catch((err) => {
        console.error("Feedback fetch failed:", err);
        // Falls back to static testimonials silently
      });
  }, []);

  const handleStartPractice = () => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
    else navigate("/auth");
  };

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Scroll to section from route state
  useEffect(() => {
    if (location.state?.scrollTo) {
      document
        .getElementById(location.state.scrollTo)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  // ===== Contact Form State =====
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [success, setSuccess]   = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/contact", formData);
      console.log("Backend response:", res.data);
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error sending contact form:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  const current = testimonials[currentTestimonial] || testimonials[0];

  return (
    <div className="homepage">
      <Header onGetStarted={() => navigate("/auth")} />

      {/* ================= HERO ================= */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-text animate-fade-in-up">
            <h1>
              Ace Your <span>Interviews</span> &{" "}
              <span>Presentations</span> with AI
            </h1>
            <p>
              Practice interviews and presentations with AI and get instant
              feedback to improve your confidence.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary btn-pulse" onClick={handleStartPractice}>
                Start Practice
              </button>
            </div>
          </div>

          <div className="hero-animation animate-float">
            <Lottie animationData={robotAnimation} loop autoplay />
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features container" id="features">
        <h2 className="reveal">Key Features</h2>
        <div className="feature-grid stagger-children">
          <div className="feature-card reveal">
            <div className="icon-wrapper">
              <img src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png" alt="AI Feedback" />
            </div>
            <h3>AI Feedback</h3>
            <p>Instant feedback on tone, clarity, and confidence.</p>
          </div>
          <div className="feature-card reveal">
            <div className="icon-wrapper">
              <img src="https://cdn-icons-png.flaticon.com/512/3275/3275570.png" alt="Mock Interviews" />
            </div>
            <h3>Mock Interviews</h3>
            <p>Real interview simulations with smart evaluation.</p>
          </div>
          <div className="feature-card reveal">
            <div className="icon-wrapper">
              <img src="https://cdn-icons-png.flaticon.com/512/9632/9632258.png" alt="Presentation Practice" />
            </div>
            <h3>Presentation Practice</h3>
            <p>Improve delivery, pace, and confidence.</p>
          </div>
 
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="howitworks" id="howitworks">
        <div className="container">
          <h2 className="reveal">How It Works</h2>
          <div className="steps stagger-children">
            <div className="step reveal">
              <div className="step-number">1</div>
              <h4>Sign Up</h4>
              <p>Create your account to begin your AI-powered practice.</p>
            </div>
            <div className="step reveal">
              <div className="step-number">2</div>
              <h4>Choose Mode</h4>
              <p>Select interview or presentation practice mode.</p>
            </div>
            <div className="step reveal">
              <div className="step-number">3</div>
              <h4>Get Feedback</h4>
              <p>Receive instant AI feedback to improve fast.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS — Real MongoDB Feedback ================= */}
      <section className="testimonials-section">
        <div className="testimonials-grid">

          {/* Left info panel */}
          <div className="testimonials-info reveal-left">
            <h2>What Our Users Say</h2>
            <p>
              Real feedback from students and professionals who improved their
              performance using our AI trainer.
            </p>
            <div className="controls">
              <button
                onClick={() =>
                  setCurrentTestimonial((prev) =>
                    prev === 0 ? testimonials.length - 1 : prev - 1
                  )
                }
              >
                ←
              </button>
              <button
                onClick={() =>
                  setCurrentTestimonial((prev) =>
                    prev === testimonials.length - 1 ? 0 : prev + 1
                  )
                }
              >
                →
              </button>
            </div>
          </div>

          {/* Main testimonial card */}
          <div className="testimonial-main reveal">
            <div className="testimonial-card active">
              {/* Avatar — initials circle instead of image */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: getAvatarColor(current.name),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "#fff",
                  margin: "0 auto 12px",
                  flexShrink: 0,
                }}
              >
                {getInitials(current.name)}
              </div>
              <p>"{current.text}"</p>
              <h4>{current.name}</h4>
              <span>{current.role}</span>
            </div>
          </div>

          {/* Sidebar stack */}
          <div className="testimonial-stack reveal-right">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`stack-card ${i === currentTestimonial ? "active" : ""}`}
                onClick={() => setCurrentTestimonial(i)}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: getAvatarColor(t.name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(t.name)}
                </div>
                <div>
                  <h5>{t.name}</h5>
                  <span>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRUST SECTION ================= */}
      <section className="trust-section">
        <div className="container">
          <h2 className="reveal">Trusted by Learners Worldwide</h2>
          <div className="trust-logos reveal">
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" />
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="faq-section" id="faq">
        <div className="container">
          <h2 className="reveal">Frequently Asked Questions</h2>
          <div className="faq-list stagger-children">
            <details className="faq-item reveal">
              <summary>Is it free to start?</summary>
              <p>Yes! You can start practicing for free. Advanced AI feedback is available in the Pro plan.</p>
            </details>
            <details className="faq-item reveal">
              <summary>Do you need prior interview experience?</summary>
              <p>No experience required. This platform is designed for beginners and professionals.</p>
            </details>
            <details className="faq-item reveal">
              <summary>Is my data safe?</summary>
              <p>Yes. Your data is secure and never shared with third parties.</p>
            </details>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="start-practice">
        <div className="container">
          <h2>Ready to Start Practicing?</h2>
          <p>Improve your skills with AI-powered feedback.</p>
          <button className="btn-primary btn-white" onClick={handleStartPractice}>
            Start Practice
          </button>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-info reveal-left">
              <h2>Get In Touch</h2>
              <p>
                Have questions? We'd love to hear from you. Send us a message
                and we'll respond as soon as possible.
              </p>
              <div className="info-item">
                <span className="icon">📧</span> support@interviewai.com
              </div>
            </div>

            <div className="contact-card reveal-right">
              <form className="contact-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <textarea
                  name="message"
                  placeholder="Your Message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
                <button type="submit" className="btn-primary">
                  Send Message
                </button>
              </form>
              {success && (
                <div className="success-toast">Message sent successfully!</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}