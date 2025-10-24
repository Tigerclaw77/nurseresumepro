// UserInfoTabs.jsx (right rail only, sticky; no partner card; modern spacing)
import React, { useState, useCallback, useEffect } from "react";
import ResumeTab from "./ResumeTab";
import CoverLetterTab from "./CoverLetterTab";
import PreviewModal from "../PreviewModal";
import ConsentBlock from "../ConsentBlock";
import AdSenseSlot from "../ads/AdSenseSlot";
import HouseAdCard from "../ads/HouseAdCard";
import { SIGNOFF_MAP } from "./signoffToneOptions";
import "../../styles/UserInfoTabs.css";
import API_BASE from "../../apiConfig"; // e.g. "http://127.0.0.1:8000" in dev

/* ----------------------------- helpers ---------------------------------- */
function assertApiBase() {
  const base = String(API_BASE || "");
  let u;
  try {
    u = new URL(base);
  } catch (error) {
    void error;
    throw new Error(
      `API_BASE must be an absolute origin (e.g. "http://127.0.0.1:8000"). ` +
        `Current: "${base}". Set frontend/.env.local: VITE_API_BASE=http://127.0.0.1:8000`
    );
  }
  if (u.pathname && u.pathname !== "/") {
    throw new Error(
      `API_BASE must be the ORIGIN only (no path). Current path "${u.pathname}". ` +
        `Fix .env: VITE_API_BASE=${u.origin}`
    );
  }
  try {
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      u.protocol === "http:"
    ) {
      console.warn(
        `API_BASE is http but page is https; browser will block mixed content. ` +
          `Use an https API origin during https testing. Current API_BASE: "${base}"`
      );
    }
  } catch (error) {
    void error;
  }
  return u.origin;
}

async function fetchJson(url, payload, { timeoutMs = 20000 } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: ac.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

function readUtmOnce() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
      referrer: document.referrer || "",
    };
    const key = "utm_cached";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem("utm_values", JSON.stringify(utm));
      sessionStorage.setItem(key, "true");
    }
    const cached = sessionStorage.getItem("utm_values");
    return cached ? JSON.parse(cached) : utm;
  } catch (error) {
    void error;
    return {};
  }
}

/* ----------------------------- component -------------------------------- */
const UserInfoTabs = ({
  formData,
  setFormData,
  signoffTone,
  setSignoffTone,
  setPreviewText,
}) => {
  // --- policy modal: global opener only ---
  const openPolicy = (which) => {
    if (which === "terms" || which === "privacy") {
      window.dispatchEvent(new CustomEvent("open-policy", { detail: which }));
    }
  };

  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem("activeTab");
    return stored === "cover" ? "cover" : "resume";
  });

  const [showModal, setShowModal] = useState(false);
  const [previewOutput, setPreviewOutput] = useState("");
  const [selectedSignoff, setSelectedSignoff] = useState("Sincerely");
  const [restoreClicked, setRestoreClicked] = useState(false);
  const [wasPaid, setWasPaid] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Consent scopes from ConsentBlock
  const [consentScopes, setConsentScopes] = useState(() => {
    try {
      const m = localStorage.getItem("consent_marketing") === "true";
      const a = localStorage.getItem("consent_analytics") === "true";
      const sc = ["service"];
      if (m) sc.push("marketing");
      if (a) sc.push("analytics");
      return sc;
    } catch (error) {
      void error;
      return ["service"];
    }
  });

  const [utm] = useState(readUtmOnce);

  /* ------------------------------ hydration ------------------------------ */
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
    const stored = localStorage.getItem(`formData_${activeTab}`);
    try {
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setFormData({ ...parsed, type: activeTab });
          if (parsed.signoffTone) setSignoffTone(parsed.signoffTone);
        } else {
          setFormData({ type: activeTab });
        }
      } else {
        setFormData({ type: activeTab });
      }
    } catch (error) {
      void error;
      setFormData({ type: activeTab });
    }
  }, [activeTab, setFormData, setSignoffTone]);

  useEffect(() => {
    const savedTone = localStorage.getItem("signoffTone");
    if (savedTone) setSignoffTone(savedTone);
  }, [setSignoffTone]);

  // Footer/anywhere integration: listen to event and expose global function
  useEffect(() => {
    const handler = (ev) => {
      const d = ev?.detail;
      const section =
        typeof d === "string"
          ? d
          : d && typeof d === "object"
          ? d.section
          : undefined;

      if (section === "terms" || section === "privacy") {
        openPolicy(section);
      }
    };

    // window.addEventListener("open-policy", handler);

    // (optional) keep this helper if you actually use it somewhere
    window.__openPolicy = (s) =>
      window.dispatchEvent(new CustomEvent("open-policy", { detail: s }));

    return () => {
      window.removeEventListener("open-policy", handler);

      if (
        typeof window !== "undefined" &&
        Object.prototype.hasOwnProperty.call(window, "__openPolicy")
      ) {
        try {
          delete window.__openPolicy;
        } catch {
          // Fallback for environments that disallow deleting window props
          window.__openPolicy = undefined;
        }
      }
    };
  }, []);

  useEffect(() => {
    const onDocClickCapture = (e) => {
      const anchor = e.target.closest?.("a");
      if (!anchor) return;

      const href = (anchor.getAttribute("href") || "").toLowerCase();
      const dataPolicy = anchor.getAttribute("data-policy");

      // Accept either data-policy="terms|privacy" or hrefs containing terms/privacy
      const section =
        dataPolicy === "terms" || dataPolicy === "privacy"
          ? dataPolicy
          : href.includes("privacy")
          ? "privacy"
          : href.includes("terms")
          ? "terms"
          : null;

      if (!section) return;

      // Stop the browser from navigating
      e.preventDefault();

      // Open the local modal
      openPolicy(section);

      // (Optional) also broadcast the event for any listeners elsewhere
      try {
        window.dispatchEvent(
          new CustomEvent("open-policy", { detail: section })
        );
      } catch {
        /* no-op */
      }
    };

    // Use capture to beat default navigation
    document.addEventListener("click", onDocClickCapture, true);
    return () => {
      document.removeEventListener("click", onDocClickCapture, true);
    };
  }, []);

  /* ------------------------------- handlers ------------------------------ */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const updatedValue = type === "checkbox" ? checked : value;
      setFormData((prev) => {
        const updated = { ...prev, [name]: updatedValue, type: activeTab };
        try {
          localStorage.setItem(
            `formData_${activeTab}`,
            JSON.stringify(updated)
          );
        } catch (err) {
          console.warn("localStorage setItem failed:", err);
        }
        return updated;
      });
    },
    [setFormData, activeTab]
  );

  /* -------------------------------- validate ----------------------------- */
  const validateForm = (data, type) => {
    const errors = [];
    const warnings = [];

    if (!data.firstName?.trim()) errors.push("First name is required.");
    if (!data.lastName?.trim()) errors.push("Last name is required.");
    if (!data.email?.includes("@"))
      errors.push("A valid email address is required.");
    if (!data.phone?.replace(/\D/g, "").match(/^\d{10}$/))
      errors.push("A valid 10-digit phone number is required.");
    if (!data.city?.trim()) errors.push("City is required.");
    if (!data.state?.trim()) errors.push("State is required.");
    if (!data.zip?.match(/^\d{5}$/))
      errors.push("A 5-digit ZIP code is required.");

    if (type === "cover") {
      if (!data.job_title?.trim())
        errors.push("Target job title is required for a cover letter.");
      if (!data.companyName?.trim())
        errors.push("Company name is required for a cover letter.");
    }

    if (type === "resume") {
      const hasValidEducation =
        Array.isArray(data.education) &&
        data.education.some(
          (entry) =>
            entry.school?.trim() ||
            entry.degree?.trim() ||
            entry.major?.trim() ||
            entry.gradYear?.trim()
        );
      if (!hasValidEducation) {
        errors.push("At least one education entry is required.");
      }
    }

    if (!data.experience || data.experience.length === 0) {
      warnings.push("No experience listed.");
    }
    if (!data.skills || data.skills.length === 0) {
      warnings.push("Consider adding some skills.");
    }
    if (
      type === "cover" &&
      data.companyName &&
      data.companyName.trim().length < 3
    ) {
      warnings.push("Company name looks too short.");
    }

    if (warnings.length > 0) {
      console.warn("Soft warnings:", warnings);
    }
    return { errors, warnings };
  };

  /* ------------------------- preview (JSON-only) ------------------------- */
  async function fetchPreview(payload) {
    const baseOrigin = assertApiBase();
    const url = new URL("/api/generate/", baseOrigin).toString();

    let res;
    try {
      res = await fetchJson(url, payload, { timeoutMs: 20000 });
    } catch (error) {
      void error;
      throw new Error(
        `Network error reaching ${url}. Ensure backend is running on 8000 and CORS allows your frontend origin.`
      );
    }

    if (!res.ok) {
      const t = await res.text().catch((e) => {
        void e;
        return "";
      });
      throw new Error(
        `Server ${res.status} ${res.statusText}: ${t.slice(0, 400)}`
      );
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const cd = (res.headers.get("content-disposition") || "").toLowerCase();

    const isDocx =
      ct.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) || cd.includes("attachment");
    if (isDocx) {
      throw new Error(
        "This action returned a file unexpectedly. Use the paid export flow."
      );
    }

    if (ct.includes("application/json")) {
      const j = await res.json();
      const html = j.html ?? "";
      const text = j.text ?? j.plain_text ?? j.output ?? "";
      const output = j.output ?? html ?? text ?? "";
      const ats = typeof j.ats_score === "number" ? j.ats_score : 0;
      return { output, html, plain: text, ats };
    }

    const text = await res.text();
    return { output: text, html: "", plain: text, ats: 0 };
  }

  /* ----------------------------- lead capture ---------------------------- */
  async function postLead({ payload, atsScore, productType, scopes }) {
    try {
      const baseOrigin = assertApiBase();
      const url = new URL("/api/lead", baseOrigin).toString();
      const leadBody = {
        email: payload.email || "",
        first_name: payload.firstName || "",
        last_name: payload.lastName || "",
        city: payload.city || "",
        state: payload.state || "",
        zip: payload.zip || "",
        product_type: productType, // "resume" | "cover"
        ats_score: typeof atsScore === "number" ? atsScore : null,
        consent_scopes:
          Array.isArray(scopes) && scopes.length ? scopes : ["service"],
        consent_version: "pp-v1.0",
        gpc: localStorage.getItem("gpc") === "true",
        utm_source: utm.utm_source || "",
        utm_medium: utm.utm_medium || "",
        utm_campaign: utm.utm_campaign || "",
        utm_term: utm.utm_term || "",
        utm_content: utm.utm_content || "",
        referrer: utm.referrer || "",
        timestamp: new Date().toISOString(),
      };
      const res = await fetchJson(url, leadBody, { timeoutMs: 10000 });
      if (!res.ok) {
        console.warn("Lead capture failed:", res.status, res.statusText);
      }
    } catch (error) {
      void error; // never block UX on lead errors
    }
  }

  /* -------------------------------- submit ------------------------------- */
  const handleSubmit = async () => {
    const updated = {
      ...formData,
      type: activeTab,
      signoffTone:
        signoffTone || localStorage.getItem("signoffTone") || "default",
    };

    setSelectedSignoff(SIGNOFF_MAP[updated.signoffTone] ?? "Sincerely");

    const { errors } = validateForm(updated, activeTab);
    if (errors.length > 0) {
      alert("Please fix the following:\n" + errors.join("\n"));
      return;
    }

    setProcessing(true);
    try {
      const { output, html, plain, ats } = await fetchPreview(updated);

      // Persist for Success.jsx (which handles DOCX after pay)
      localStorage.setItem("generatedContent", plain || output || "");
      localStorage.setItem("generatedContentHtml", html || output || "");
      localStorage.setItem("generatedType", activeTab);
      if (updated.email) localStorage.setItem("email", updated.email);
      if (typeof ats === "number")
        localStorage.setItem("atsScore", String(ats));

      const chosen = output || html || plain || "";
      setPreviewText(chosen);
      setPreviewOutput(chosen);
      setWasPaid(false);
      setShowModal(true);

      // fire-and-forget lead capture
      postLead({
        payload: updated,
        atsScore: ats,
        productType: activeTab,
        scopes: consentScopes,
      });
    } catch (error) {
      void error;
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* ----------------------------- restoration ----------------------------- */
  const handleRestore = () => {
    const restored = localStorage.getItem("lastPaidHtml");
    if (restored) {
      setPreviewText(restored);
      setPreviewOutput(restored);
      setWasPaid(true);
      setRestoreClicked(true);
      setShowModal(true);
    } else {
      alert("No previous paid document found.");
    }
  };

  const lastPaid = localStorage.getItem("lastPaidHtml");
  const shouldShowRestore =
    lastPaid && previewOutput !== lastPaid && !restoreClicked;

  /* ---------------------------------- view -------------------------------- */
  // Choose your slots (one per container). Replace with real slot IDs.
  const ADS_SLOT_A = import.meta.env.VITE_ADS_SLOT_A || "1202654653";
  const ADS_SLOT_B = import.meta.env.VITE_ADS_SLOT_B || "4950327972";

  const ENABLE_ADSENSE =
    Boolean(import.meta.env.PROD) &&
    String(import.meta.env.VITE_ENABLE_ADSENSE).toLowerCase() === "true";

  return (
    <div
      className="tabs-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(680px, 1fr) 300px",
        gap: 20,
        alignItems: "start",
        padding: "12px 16px", // edge breathing room
      }}
    >
      {/* LEFT: Tabs + forms + actions */}
      <div className="tabs-container" style={{ borderRadius: 12 }}>
        <div className="tab-buttons">
          <div className="tab-group">
            <button
              className={`tab ${activeTab === "resume" ? "active" : ""}`}
              onClick={() => setActiveTab("resume")}
            >
              Resume
            </button>
            <button
              className={`tab ${activeTab === "cover" ? "active" : ""}`}
              onClick={() => setActiveTab("cover")}
            >
              Cover Letter
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === "resume" ? (
            <ResumeTab
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              processing={processing}
            />
          ) : (
            <CoverLetterTab
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              signoffTone={signoffTone}
              setSignoffTone={setSignoffTone}
              processing={processing}
            />
          )}

          {/* Consent (mobile-first) */}
          <div style={{ marginTop: "1rem" }}>
            <ConsentBlock onChange={setConsentScopes} openPolicy={openPolicy} />
          </div>

          {/* Actions + inline processing banner */}
          <div
            className="actions"
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              className="actions-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <button className="btn btn-primary" onClick={handleSubmit}>
                {activeTab === "resume"
                  ? "Generate Resume"
                  : "Generate Cover Letter"}
              </button>
              {processing && (
                <div
                  role="status"
                  aria-live="polite"
                  className="generating-hint"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "rgba(0,0,0,.6)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "3px solid rgba(255,255,255,.35)",
                      borderTopColor: "#fff",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Generating… this usually takes a few seconds.
                </div>
              )}
            </div>

            {shouldShowRestore && (
              <button
                className="btn btn-outline-secondary"
                onClick={handleRestore}
                style={{ alignSelf: "flex-start" }}
              >
                Restore Last Paid Doc
              </button>
            )}
          </div>
        </div>

        <PreviewModal
          show={showModal}
          onClose={() => setShowModal(false)}
          content={previewOutput}
          type={activeTab}
          paid={wasPaid}
          initialEmail={formData.email || ""}
          formData={formData}
          selectedSignoff={selectedSignoff}
        />

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>

      <aside
        className="aside-ads" aria-label="Advertisement rail"
        style={{
          display: "grid",
          gap: 16,
          position: "sticky",
          top: 16,
          alignSelf: "start",
        }}
      >
        {ENABLE_ADSENSE ? (
          <>
            <AdSenseSlot slot={ADS_SLOT_A} />
            <AdSenseSlot slot={ADS_SLOT_B} />
          </>
        ) : (
          <>
            <HouseAdCard />
            <HouseAdCard />
          </>
        )}
      </aside>

      {/* Mobile: hide the rail entirely (no bottom ads) */}
      <style>
        {`
          @media (max-width: 1024px) {
            .tabs-shell { display: block; padding: 12px 12px; }
            .aside-ads { display: none; }
          }
        `}
      </style>
    </div>
  );
};

export default UserInfoTabs;
