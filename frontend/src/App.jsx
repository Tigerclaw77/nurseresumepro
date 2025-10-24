// App.jsx
import { useState, useEffect, useCallback } from "react";
import UserInfoTabs from "./components/UserForm/UserInfoTabs";
import PolicyModal from "./components/PolicyModal";
import Footer from "./components/Footer";
import "./styles/site.css";

export default function App() {
  const [formData, setFormData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("resume_form") || "{}");
    } catch {
      return {};
    }
  });
  const [signoffTone, setSignoffTone] = useState("Sincerely");
  const [, setPreviewText] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("resume_form", JSON.stringify(formData));
    } catch {
      /* ignore */
    }
  }, [formData]);

  // Single global opener: dispatch an event the modal listens for
  const openPolicy = useCallback((type) => {
    const section = type === "terms" ? "terms" : "privacy";
    window.dispatchEvent(new CustomEvent("open-policy", { detail: section }));
  }, []);

  return (
    <div className="site">
      <header className="site-header" role="banner">
        <div className="site-header-inner">
          <div className="brand hero--center">NurseResumePro</div>

          <nav
            className="header-nav"
            aria-label="Legal"
            style={{ display: "flex", gap: 16 }}
          >
          </nav>
        </div>
      </header>

      <main className="site-main" role="main">
        <div className="page-hero hero--center">
          <h1 className="hero-heading">Get Hired Faster</h1>
          <ul className="hero-bullets">
            <li>Create ATS-friendly resumes & cover letters in minutes</li>
            <li>Optimized for hospital and clinic ATS systems</li>
            <li>No registration necessary</li>
          </ul>
        </div>

        <section className="page-content">
          <UserInfoTabs
            formData={formData}
            setFormData={setFormData}
            signoffTone={signoffTone}
            setSignoffTone={setSignoffTone}
            setPreviewText={setPreviewText}
            openPolicy={openPolicy} // pass through if you use it inside
          />
        </section>
      </main>

      <Footer openPolicy={openPolicy} />

      {/* Mount ONE global modal. No props. It listens for "open-policy". */}
      <PolicyModal />
    </div>
  );
}
