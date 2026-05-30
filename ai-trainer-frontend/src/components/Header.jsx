
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  // Detect logged in user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Click outside → close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileOpen]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
        document.body.style.overflow = "auto";
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleScrollTo = (id) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
    setMobileOpen(false);
  };

  return (
    <header className={`header${isScrolled ? " scrolled" : ""}`}>
      <div className="header-inner">

        {/* Logo */}
        <div className="logo">
          <Link to="/">PrepAI</Link>
        </div>

        {/* Desktop Nav */}
        <nav className="nav-links desktop-nav">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link>
          <button onClick={() => handleScrollTo("features")}>Features</button>
          <button onClick={() => handleScrollTo("howitworks")}>How It Works</button>
          <Link to="/pricing" className={location.pathname === "/pricing" ? "active" : ""}>Pricing</Link>
          <button onClick={() => handleScrollTo("contact")}>Contact</button>
        </nav>

        {/* Desktop CTA */}
        <div className="header-cta desktop-nav">
          {!user ? (
            <>
              <button
                onClick={() => navigate("/auth", { state: { mode: "login" } })}
                className="login-btn"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/auth", { state: { mode: "signup" } })}
                className="btn-primary"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="user-area">
              <div className="profile-menu" ref={profileRef}>
                <button
                  className="profile-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <hr />
                    <p onClick={() => { navigate("/dashboard"); setProfileOpen(false); }}>
                      📊 Dashboard
                    </p>
                    <p onClick={() => { navigate("/notifications"); setProfileOpen(false); }}>
                      🔔 Notifications
                    </p>
                    <p onClick={() => { navigate("/settings"); setProfileOpen(false); }}>
                      ⚙️ Settings
                    </p>
                    <hr />
                    <p className="logout" onClick={handleLogout}>🚪 Logout</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
          <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
          <button onClick={() => handleScrollTo("features")}>Features</button>
          <button onClick={() => handleScrollTo("howitworks")}>How It Works</button>
          <Link to="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <button onClick={() => handleScrollTo("contact")}>Contact</button>

          <div className="mobile-cta">
            {!user ? (
              <>
                <button
                  onClick={() => { navigate("/auth", { state: { mode: "login" } }); setMobileOpen(false); }}
                  className="login-btn"
                >
                  Login
                </button>
                <button
                  onClick={() => { navigate("/auth", { state: { mode: "signup" } }); setMobileOpen(false); }}
                  className="btn-primary"
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button className="mobilebtn"
                  onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>
                  Dashboard
                </button>
                <button className="mobilebtn"
                  onClick={() => { navigate("/notifications"); setMobileOpen(false); }}>
                  Notifications
                </button>
                <button className="mobilebtn"
                  onClick={() => { navigate("/settings"); setMobileOpen(false); }}>
                  Settings
                </button>
                <button className="mobilebtn" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}