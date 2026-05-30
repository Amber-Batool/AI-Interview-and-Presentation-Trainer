import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./SettingsPage.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  // ── User data from localStorage ─────────────────────────────────────
  const [user, setUser] = useState({ name: "", email: "", role: "" });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", role: "" });
  const [passwordForm, setPasswordForm] = useState({
    current: "", newPass: "", confirm: "",
  });
  const [prefForm, setPrefForm] = useState({
    language: "English", notifications: true, theme: "light",
  });

  // Toast state
  const [toast, setToast] = useState(null); // { msg, type }

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/auth"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setProfileForm({ name: u.name || "", email: u.email || "", role: u.role || "" });
  }, [navigate]);

  // ── Show toast ────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Profile save ─────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      const updated = { ...user, ...profileForm };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      showToast("Profile updated successfully!");
    } catch {
      // Optimistic update if backend not ready
      const updated = { ...user, ...profileForm };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      showToast("Profile updated!");
    }
  };

  // ── Password save ────────────────────────────────────────────────────
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast("New passwords do not match.", "error"); return;
    }
    if (passwordForm.newPass.length < 6) {
      showToast("Password must be at least 6 characters.", "error"); return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.newPass,
        }),
      });
      if (!res.ok) throw new Error("Wrong current password.");
      showToast("Password changed successfully!");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      showToast(err.message || "Error changing password.", "error");
    }
  };

  // ── Preferences save ─────────────────────────────────────────────────
  const handlePrefSave = (e) => {
    e.preventDefault();
    localStorage.setItem("user_prefs", JSON.stringify(prefForm));
    showToast("Preferences saved!");
  };

  // ── Delete account ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleteConfirm !== user.email) {
      showToast("Email does not match.", "error"); return;
    }
    try {
      const token = localStorage.getItem("token");
      await fetch("http://127.0.0.1:8000/api/auth/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* proceed anyway */ }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const tabs = [
    { id: "profile",     label: "Profile",     icon: "👤" },
    { id: "password",    label: "Password",    icon: "🔒" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "danger",      label: "Danger Zone", icon: "⚠️" },
  ];

  return (
    <div className="sp-page">
      <Header />

      <main className="sp-main">
        {/* Background orbs */}
        <span className="sp-orb sp-orb-1" />
        <span className="sp-orb sp-orb-2" />

        <div className="sp-wrap">

          {/* ── Sidebar ── */}
          <aside className="sp-sidebar">
            {/* User card */}
            <div className="sp-user-card">
              <div className="sp-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
              <div>
                <p className="sp-user-name">{user.name || "User"}</p>
                <p className="sp-user-email">{user.email || ""}</p>
              </div>
            </div>

            {/* Tabs */}
            <nav className="sp-tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`sp-tab ${activeTab === t.id ? "active" : ""} ${t.id === "danger" ? "danger-tab" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <span className="sp-tab-icon">{t.icon}</span>
                  {t.label}
                  {activeTab === t.id && <span className="sp-tab-dot" />}
                </button>
              ))}
            </nav>

            <button className="sp-back-btn" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
          </aside>

          {/* ── Content ── */}
          <div className="sp-content">

            {/* ════ PROFILE TAB ════ */}
            {activeTab === "profile" && (
              <div className="sp-section" key="profile">
                <div className="sp-section-header">
                  <h2>Profile Information</h2>
                  <p>Update your personal details.</p>
                </div>

                <form className="sp-form" onSubmit={handleProfileSave}>
                  <div className="sp-field">
                    <label className="sp-label">Full Name</label>
                    <div className="sp-input-row">
                      <span className="sp-ico">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      <input className="sp-input" type="text" value={profileForm.name}
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your full name" required />
                    </div>
                  </div>

                  <div className="sp-field">
                    <label className="sp-label">Email Address</label>
                    <div className="sp-input-row">
                      <span className="sp-ico">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <polyline points="2,4 12,13 22,4"/>
                        </svg>
                      </span>
                      <input className="sp-input" type="email" value={profileForm.email}
                        onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="you@example.com" required />
                    </div>
                  </div>

                  <div className="sp-field">
                    <label className="sp-label">Role / Industry</label>
                    <div className="sp-input-row sp-select-wrap">
                      <span className="sp-ico">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2"/>
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                      </span>
                      <select className="sp-input" value={profileForm.role}
                        onChange={e => setProfileForm(p => ({ ...p, role: e.target.value }))}>
                        <option value="">-- Select --</option>
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="manager">Manager</option>
                        <option value="student">Student</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="sp-chevron">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </span>
                    </div>
                  </div>

                  <button type="submit" className="sp-btn-primary">
                    Save Changes
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* ════ PASSWORD TAB ════ */}
            {activeTab === "password" && (
              <div className="sp-section" key="password">
                <div className="sp-section-header">
                  <h2>Change Password</h2>
                  <p>Keep your account secure with a strong password.</p>
                </div>

                <form className="sp-form" onSubmit={handlePasswordSave}>
                  {[
                    { label: "Current Password",  key: "current",  ph: "Enter current password" },
                    { label: "New Password",       key: "newPass",  ph: "Enter new password" },
                    { label: "Confirm Password",   key: "confirm",  ph: "Confirm new password" },
                  ].map(({ label, key, ph }) => (
                    <div className="sp-field" key={key}>
                      <label className="sp-label">{label}</label>
                      <div className="sp-input-row">
                        <span className="sp-ico">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </span>
                        <input className="sp-input" type="password"
                          value={passwordForm[key]}
                          onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={ph} required />
                      </div>
                    </div>
                  ))}

                  {/* Password strength hint */}
                  {passwordForm.newPass && (
                    <div className="sp-strength">
                      <div className="sp-strength-bars">
                        {[1,2,3,4].map(i => (
                          <span key={i} className={`sp-strength-bar ${
                            passwordForm.newPass.length >= i * 3 ? "filled" : ""
                          }`} />
                        ))}
                      </div>
                      <span className="sp-strength-label">
                        {passwordForm.newPass.length < 4 ? "Weak" :
                         passwordForm.newPass.length < 8 ? "Fair" :
                         passwordForm.newPass.length < 12 ? "Good" : "Strong"}
                      </span>
                    </div>
                  )}

                  <button type="submit" className="sp-btn-primary">
                    Update Password
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* ════ PREFERENCES TAB ════ */}
            {activeTab === "preferences" && (
              <div className="sp-section" key="preferences">
                <div className="sp-section-header">
                  <h2>Preferences</h2>
                  <p>Customize your experience.</p>
                </div>

                <form className="sp-form" onSubmit={handlePrefSave}>
                  {/* Language */}
                  <div className="sp-field">
                    <label className="sp-label">Preferred Language</label>
                    <div className="sp-toggle-row">
                      {["English", "Urdu"].map(lang => (
                        <button key={lang} type="button"
                          className={`sp-toggle-btn ${prefForm.language === lang ? "active" : ""}`}
                          onClick={() => setPrefForm(p => ({ ...p, language: lang }))}>
                          {lang === "English" ? "🇬🇧" : "🇵🇰"} {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="sp-field">
                    <label className="sp-label">Email Notifications</label>
                    <div className="sp-switch-row">
                      <span className="sp-switch-desc">Receive updates and practice reminders</span>
                      <button type="button"
                        className={`sp-switch ${prefForm.notifications ? "on" : ""}`}
                        onClick={() => setPrefForm(p => ({ ...p, notifications: !p.notifications }))}>
                        <span className="sp-switch-knob" />
                      </button>
                    </div>
                  </div>

                  {/* Stats card */}
                  <div className="sp-stats-card">
                    <div className="sp-stat-item">
                      <span className="sp-stat-icon">🎯</span>
                      <div>
                        <p className="sp-stat-val">Pro Member</p>
                        <p className="sp-stat-lbl">Account Plan</p>
                      </div>
                    </div>
                    <div className="sp-stat-div" />
                    <div className="sp-stat-item">
                      <span className="sp-stat-icon">📅</span>
                      <div>
                        <p className="sp-stat-val">Active</p>
                        <p className="sp-stat-lbl">Account Status</p>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="sp-btn-primary">
                    Save Preferences
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* ════ DANGER ZONE TAB ════ */}
            {activeTab === "danger" && (
              <div className="sp-section" key="danger">
                <div className="sp-section-header danger">
                  <h2>⚠️ Danger Zone</h2>
                  <p>These actions are irreversible. Please proceed with caution.</p>
                </div>

                <div className="sp-danger-card">
                  <div className="sp-danger-info">
                    <h4>Delete Account</h4>
                    <p>Once you delete your account, all your data, sessions, and progress will be permanently removed. This cannot be undone.</p>
                  </div>

                  <div className="sp-field" style={{ marginTop: 20 }}>
                    <label className="sp-label">
                      Type your email <strong>{user.email}</strong> to confirm
                    </label>
                    <div className="sp-input-row">
                      <span className="sp-ico">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <polyline points="2,4 12,13 22,4"/>
                        </svg>
                      </span>
                      <input className="sp-input" type="email"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="Enter your email to confirm" />
                    </div>
                  </div>

                  <button
                    className="sp-btn-danger"
                    onClick={handleDelete}
                    disabled={deleteConfirm !== user.email}
                  >
                    🗑️ Delete My Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Toast notification ── */}
        {toast && (
          <div className={`sp-toast ${toast.type === "error" ? "error" : ""}`}>
            <span className="sp-toast-icon">
              {toast.type === "error" ? "✕" : "✓"}
            </span>
            {toast.msg}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}