import React from "react";

export default function Footer({ openPolicy }) {
  const year = new Date().getFullYear();

  const handleTermsClick = (e) => {
    if (typeof openPolicy === "function") {
      e.preventDefault();
      openPolicy("terms");
    }
  };

  const handlePrivacyClick = (e) => {
    if (typeof openPolicy === "function") {
      e.preventDefault();
      openPolicy("privacy");
    }
  };

  return (
    <footer className="site-footer site-footer is-centered" role="contentinfo" aria-label="Footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand">NurseResumePro</span>
          <p className="tagline">
            AI resumes & cover letters for nurses and clinical staff.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer Navigation">
          <a href="/terms" className="footer-link" onClick={handleTermsClick}>
            Terms
          </a>
          <a
            href="/privacy"
            className="footer-link"
            onClick={handlePrivacyClick}
          >
            Privacy Policy
          </a>
          <a
            href="mailto:support@nurseresumepro.com"
            className="footer-link"
          >
            Contact
          </a>
        </nav>

        <div className="footer-copy">
          © {year} NurseResumePro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
