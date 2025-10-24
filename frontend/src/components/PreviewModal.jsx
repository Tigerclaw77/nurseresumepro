// --- PreviewModal.jsx ---
import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import ATSScore from "./ATSScore";
import useCart from "./hooks/useCart";
import axios from "axios";
import "../styles/PreviewModal.css";

// Vite envs
const ENV = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || "").trim(),
  // publishable key not strictly required because we redirect to session.url
  STRIPE_PUBLISHABLE_KEY: (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim(),
  DEV_EXPORT_BYPASS: (import.meta.env.VITE_DEV_EXPORT_BYPASS || "false").trim().toLowerCase(),
  PRICE_USD: Number(import.meta.env.VITE_PUBLIC_PRICE_USD || 10), // $10 default
};

function assertApiBase() {
  const base = ENV.API_BASE_URL;
  if (!base) throw new Error("Missing VITE_API_BASE_URL in .env");
  let u;
  try { u = new URL(base); } catch {
    throw new Error(`VITE_API_BASE_URL must be absolute (e.g. "https://api.example.com"). Current: "${base}"`);
  }
  if (u.pathname && u.pathname !== "/") {
    throw new Error(`VITE_API_BASE_URL must be origin-only. Use "${u.origin}" not "${base}"`);
  }
  return u.origin;
}

function getSessionIdFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    return id && id.startsWith("cs_") ? id : "";
  } catch { return ""; }
}

function PreviewModal({
  show,
  onClose,
  content,
  type,
  paid = false,                 // external gate (legacy)
  initialEmail = "",
  formData = {},
  selectedSignoff = "Sincerely",
}) {
  const [localContent, setLocalContent] = useState("");
  const [atsScore, setAtsScore] = useState(null);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [email, setEmail] = useState(() => initialEmail || localStorage.getItem("email") || "");
  const [sessionToken, setSessionToken] = useState(""); // cs_... from success redirect
  const isResume = type === "resume";
  const { add: addItem } = useCart();

  // Dev bypass flag (only active in vite dev mode AND env says true)
  const DEV_BYPASS = import.meta.env.DEV && ENV.DEV_EXPORT_BYPASS === "true";
  const HAS_CHECKOUT_TOKEN = Boolean(sessionToken);
  const CAN_EXPORT = DEV_BYPASS || HAS_CHECKOUT_TOKEN;

  const normalized = useMemo(() => {
    if (!content) return { html: "", text: "" };
    if (typeof content === "string") {
      return { html: content, text: content.replace(/<[^>]+>/g, "") };
    }
    const html = content.html || content.text || "";
    const text = content.text || (typeof html === "string" ? html.replace(/<[^>]+>/g, "") : "");
    return { html: html || "", text: text || "" };
  }, [content]);

  // read session_id from URL if present (after Stripe success redirect)
  useEffect(() => { setSessionToken(getSessionIdFromUrl()); }, []);

  useEffect(() => {
    const cleaned = (normalized.html || "").trim();
    setLocalContent(cleaned);

    if (isResume) {
      const plain = (normalized.text || "").trim();
      const sections = ["education", "experience", "skills", "summary"];
      const verbs = [
        "led","managed","created","resolved","trained",
        "developed","designed","optimized","improved",
        "launched","achieved","analyzed",
      ];
      const bullets = plain.match(/(?:\u2022|–|\n-\s|\n\*)/g) || [];
      const verbHits = plain.match(new RegExp(`\\b(${verbs.join("|")})\\b`, "gi")) || [];
      let score = bullets.length * 3 + verbHits.length * 2;
      sections.forEach((s) => { if (plain.toLowerCase().includes(s)) score += 10; });
      setAtsScore(Math.max(0, Math.min(score, 100)));
    } else {
      setAtsScore(null);
    }
  }, [normalized, isResume]);

  useEffect(() => {
    if (sendEmail && email?.trim()) {
      localStorage.setItem("email", email.trim());
    }
  }, [sendEmail, email]);

  const buildExportPayload = () => {
    const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
    let htmlToExport = normalized.html || localContent || "";

    // Ensure cover letters export with a wrapper + contact block + signoff
    if (type === "cover" && !/class=["']cover["']/.test(htmlToExport)) {
      const contactBlock = `
        ${(formData.firstName || "") + " " + (formData.lastName || "")}<br/>
        ${formData.address || ""}${formData.address2 ? ", " + formData.address2 : ""}<br/>
        ${(formData.city || "")}${formData.state || formData.zip ? ", " : ""}${formData.state || ""} ${formData.zip || ""}<br/>
        ${formData.email ? `Email: ${formData.email}<br/>` : "" }
        ${formData.phone ? `Phone: ${formData.phone}` : "" }
      `.replace(/\n\s+/g, "\n").trim();

      let cleanBody = (normalized.html || localContent || "")
        .replace(/<\/?div[^>]*>/g, "")
        .replace(/(<p[^>]*>)\s*<p[^>]*>/g, "$1")
        .replace(/<\/p>\s*<\/p>/g, "</p>")
        .trim();

      if (!cleanBody.toLowerCase().includes(selectedSignoff.toLowerCase())) {
        const signoffBlock = `<p style="margin-bottom: 1em">${selectedSignoff},<br/>${fullName}</p>`;
        cleanBody += signoffBlock;
      }

      htmlToExport = `
        <div class="cover">
          <div class="contact" style="margin-bottom:1rem">${contactBlock}</div>
          <div class="body">${cleanBody}</div>
        </div>
      `.trim();
    }

    return {
      html: htmlToExport,
      text: normalized.text || "",
      type,
      signoff: selectedSignoff,
      fullName,
      paid: DEV_BYPASS || paid,             // legacy flag
      token: sessionToken || undefined,      // prefer verified session_id
    };
  };

  // ---- Stripe: start checkout (server creates session and returns url) ----
  async function startCheckout(productType, emailForReceipt) {
    setError("");
    try {
      const base = assertApiBase();
      const r = await fetch(new URL("/api/create-checkout-session", base).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          customer_email: (emailForReceipt || "").trim() || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.url) throw new Error(data?.error || "Failed to start checkout");
      window.location.href = data.url; // Stripe-hosted page
    } catch (e) {
      setError(e?.message || "Unable to start checkout.");
    }
  }

  const handleExport = async () => {
    setIsExporting(true);
    setError("");

    try {
      if (!CAN_EXPORT) {
        // no token yet — take user to checkout first
        await startCheckout(type === "cover" ? "cover" : "resume", email);
        return;
      }

      const base = assertApiBase();
      const url = new URL("/api/export/docx", base).toString();

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildExportPayload()),
      });

      if (res.status === 402) {
        setError("Please complete checkout to export.");
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Export failed");
      }

      const blob = await res.blob();
      const filenameBase = type === "resume" ? "resume" : type === "cover" ? "cover_letter" : "document";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filenameBase}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Optional email send (best effort, only when export happens)
      if (sendEmail && email.trim()) {
        try {
          await axios.post(new URL("/api/send-email/", base).toString(), {
            email: email.trim(),
            content: normalized.text || "",
            format: "word",
            type,
          });
        } catch (e) {
          console.warn("Email send failed:", e);
        }
      }

      addItem({ type, content: normalized.text || "", format: "word", timestamp: Date.now() });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Something went wrong while exporting.");
    } finally {
      setIsExporting(false);
    }
  };

  const priceLabel = `$${ENV.PRICE_USD.toFixed(2)}`;

  return (
    <Modal show={show} onHide={onClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isResume ? "Resume Preview" : "Cover Letter Preview"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {isResume && atsScore !== null && (
          <ATSScore atsScore={atsScore} showTips={false} setShowTips={() => {}} />
        )}

        <div
          className="rendered-output"
          style={{
            whiteSpace: "normal",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #ddd",
            padding: "1rem",
          }}
          dangerouslySetInnerHTML={{ __html: localContent }}
        />

        {error && <p className="text-danger mt-2">{error}</p>}
      </Modal.Body>

      <Modal.Footer>
        <div className="me-auto" style={{ maxWidth: 340 }}>
          {(CAN_EXPORT) && (
            <>
              <Form.Check
                type="checkbox"
                label="Send to my email"
                checked={sendEmail}
                onChange={() => setSendEmail((v) => !v)}
              />
              {sendEmail && (
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                  autoComplete="email"
                  inputMode="email"
                />
              )}
            </>
          )}
          {!CAN_EXPORT && (
            <div className="small text-muted">
              You’ll be redirected to a secure Stripe checkout. Price: <strong>{priceLabel}</strong>.
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap justify-content-end">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Cancel
          </Button>

          {/* If we already have payment or a session token -> export. Otherwise -> start checkout */}
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
            title={CAN_EXPORT ? "Download Word File" : `Buy & Export — ${priceLabel}`}
          >
            {isExporting
              ? "Working..."
              : CAN_EXPORT
              ? "Download Word File"
              : `Buy & Export — ${priceLabel}`}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default PreviewModal;
