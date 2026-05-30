import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan = "premium", billing = "monthly" } = location.state || {};

  const price = billing === "monthly" ? "$19" : "$180";
  const period = billing === "monthly" ? "/month" : "/year";

  const [form, setForm] = useState({
    name: "", email: "",
    card: "", expiry: "", cvv: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "card") {
      value = value.replace(/\D/g, "").slice(0, 16)
        .replace(/(.{4})/g, "$1 ").trim();
    }
    if (name === "expiry") {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (name === "cvv") value = value.replace(/\D/g, "").slice(0, 3);

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.includes("@")) errs.email = "Valid email required";
    if (form.card.replace(/\s/g, "").length < 16) errs.card = "Enter a valid 16-digit card number";
    if (form.expiry.length < 5) errs.expiry = "Enter MM/YY";
    if (form.cvv.length < 3) errs.cvv = "Enter 3-digit CVV";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2200);
  };

  if (success) {
    return (
      <div className="checkout-page page-visible">
        <Header />
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p>Welcome to <span>Premium</span>! Your account has been upgraded.</p>
          <button className="btn-primary" onClick={() => navigate("/dashboard")}>
            Go to Dashboard →
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`checkout-page${visible ? " page-visible" : ""}`}>
      <Header />

      <main className="checkout-main">

        {/* LEFT — Order Summary */}
        <div className="checkout-summary animate-left">
          <div className="summary-eyebrow">Your Plan</div>

          <div className="summary-plan">
            <div className="plan-name">
              <span className="plan-icon">👑</span>
              Premium
            </div>
            <div className="plan-badge">{billing === "monthly" ? "Monthly" : "Yearly"}</div>
          </div>

          <div className="summary-price">
            <span className="price-big">{price}</span>
            <span className="price-per">{period}</span>
          </div>

          {billing === "yearly" && (
            <div className="savings-pill">🎉 You save $48/year</div>
          )}

          <ul className="summary-features">
            {[
              "Unlimited AI Mock Interviews",
              "Advanced Presentation Coaching",
              "Smart Feedback & Scoring",
              "Full Question Bank Access",
              "Progress Tracking & Reports",
            ].map((f, i) => (
              <li key={i} style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                <span className="feat-check">✔</span> {f}
              </li>
            ))}
          </ul>

          <div className="secure-badge">
            <span>🔒</span>
            <p>Secured by 256-bit SSL encryption. Cancel anytime.</p>
          </div>
        </div>

        {/* RIGHT — Payment Form */}
        <div className="checkout-form-wrap animate-right">
          <div className="form-header">
            <h2>Payment Details</h2>
            <p>Fill in your details to complete the upgrade</p>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit} noValidate>

            {/* Personal Info */}
            <div className="form-section-label">Personal Information</div>

            <div className="field-group">
              <div className={`field${errors.name ? " field-error" : ""}`}>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>

              <div className={`field${errors.email ? " field-error" : ""}`}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>
            </div>

            {/* Card Info */}
            <div className="form-section-label" style={{ marginTop: "24px" }}>Card Information</div>

            <div className={`field field-full${errors.card ? " field-error" : ""}`}>
              <label>Card Number</label>
              <div className="input-icon-wrap">
                <input
                  type="text"
                  name="card"
                  placeholder="1234 5678 9012 3456"
                  value={form.card}
                  onChange={handleChange}
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
                <span className="card-icons">💳</span>
              </div>
              {errors.card && <span className="error-msg">{errors.card}</span>}
            </div>

            <div className="field-group">
              <div className={`field${errors.expiry ? " field-error" : ""}`}>
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiry"
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={handleChange}
                  autoComplete="cc-exp"
                  inputMode="numeric"
                />
                {errors.expiry && <span className="error-msg">{errors.expiry}</span>}
              </div>

              <div className={`field${errors.cvv ? " field-error" : ""}`}>
                <label>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  placeholder="123"
                  value={form.cvv}
                  onChange={handleChange}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                />
                {errors.cvv && <span className="error-msg">{errors.cvv}</span>}
              </div>
            </div>

            <button
              type="submit"
              className={`btn-pay${loading ? " btn-loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="pay-loader">
                  <span /><span /><span />
                </span>
              ) : (
                <>Pay {price} {period} →</>
              )}
            </button>

            <p className="form-footer-note">
              By completing payment you agree to our{" "}
              <span>Terms of Service</span> and <span>Privacy Policy</span>.
            </p>

          </form>
        </div>

      </main>

      <Footer />
    </div>
  );
}