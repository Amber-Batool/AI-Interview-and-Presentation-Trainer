import React from "react";
import "./Footer.css";

const Footer = () => {
  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">

        {/* Logo & Description */}
        <div className="footer-col">
          <h2>PrepAI</h2>
          <p>Practice interviews & presentations with AI to boost your career.</p>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a onClick={() => handleScroll("home")}>Home</a></li>
            <li><a onClick={() => handleScroll("features")}>Features</a></li>
            <li><a onClick={() => handleScroll("pricing")}>Pricing</a></li>
            
            <li><a href="/dashboard">Dashboard</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a onClick={() => handleScroll("faq")}>FAQ</a></li>
            <li><a onClick={() => handleScroll("contact")}>Contact</a></li>
            <li><a onClick={() => handleScroll("blog")}>Blog</a></li>
          </ul>
        </div>

        {/* Social & Newsletter */}
        <div className="footer-col">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>
          <div className="newsletter">
            <input type="email" placeholder="Subscribe for updates" />
            <button>Subscribe</button>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 Prep AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
