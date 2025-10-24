// ContactInfo.jsx (Vite + React 19 safe)
import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { FormControlLabel, Checkbox } from "@mui/material";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/* phone helpers */
const stripPhone = (v = "") => {
  let digits = String(v).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.slice(0, 10);
};
const formatPhone = (digits = "") => {
  const d = stripPhone(digits);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

/* error helper - never uses empty catch */
async function extractErrorDetail(res) {
  try {
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const j = await res.json();
      return typeof j === "string" ? j : JSON.stringify(j);
    }
    const txt = await res.text();
    return txt || "(no response body)";
  } catch (err) {
    // Log parse failure explicitly; return generic detail
    // eslint-disable-next-line no-console
    console.warn("Failed to parse error response:", err);
    return "(failed to parse error body)";
  }
}

export default function ContactInfo({ formData, setFormData, handleChange, openPolicy }) {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [leadForm, setLeadForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    targetJob: "",
    preferredLocation: "",
    consent: true,
  });

  // show error only after user tries to submit without consent
  const [showConsentError, setShowConsentError] = useState(false);

  useEffect(() => {
    if (formData.email) localStorage.setItem("email", formData.email);
  }, [formData.email]);

  useEffect(() => {
    if (showLeadModal) {
      setLeadForm({
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        email: formData.email || "",
        phone: formData.phone || "",
        targetJob: formData.targetJob || "",
        preferredLocation: formData.preferredLocation || "",
        consent: false,
      });
      setShowConsentError(false); // reset any previous error when opening
    }
  }, [showLeadModal]); // eslint-disable-line

  const handleZipChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 5);
    handleChange({ target: { name: "zip", value: digitsOnly } });
  };
  const handleStateChange = (e) => {
    const letters = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
    handleChange({ target: { name: "state", value: letters } });
  };
  const handlePhoneChange = (e) => {
    const digits = stripPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: digits }));
  };
  const handleLeadChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handlePrivacyClick = (e) => {
    if (typeof openPolicy === "function") {
      e.preventDefault();
      openPolicy("privacy");
    }
  };

  const postLeadTo = async (url) => {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadForm),
    });
  };

  const handleLeadSubmit = async () => {
    if (submitting) return;

    // show error only when user actually tries to submit without consent
    if (!leadForm.consent) {
      setShowConsentError(true);
      return;
    }

    setSubmitting(true);
    try {
      if (!API_BASE_URL) throw new Error("Missing VITE_API_BASE_URL");

      // Try primary endpoint
      let res = await postLeadTo(`${API_BASE_URL}/api/lead`);
      if (!res.ok) {
        // Fallback to legacy endpoint
        res = await postLeadTo(`${API_BASE_URL}/leads/email/`);
      }
      if (!res.ok) {
        const detail = await extractErrorDetail(res);
        const msg = `Lead submit failed (${res.status}) ${detail ? `- ${detail}` : ""}`;
        // eslint-disable-next-line no-console
        console.error(msg);
        return;
      }

      // success → sync to main form and close
      setFormData((prev) => ({
        ...prev,
        firstName: leadForm.firstName,
        lastName: leadForm.lastName,
        email: leadForm.email,
        phone: stripPhone(leadForm.phone),
        targetJob: leadForm.targetJob,
        preferredLocation: leadForm.preferredLocation,
      }));
      setShowLeadModal(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Lead submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const joinDisabled =
    submitting ||
    /* allow clicking even if consent is unchecked; validation happens in submit */
    !leadForm.firstName?.trim() ||
    !leadForm.lastName?.trim() ||
    !leadForm.email?.trim() ||
    !stripPhone(leadForm.phone) ||
    !leadForm.targetJob?.trim();

  return (
    <>
      {/* NAME ROW (two labels aligned via grid) */}
      <div className="form-group name-group">
        <div className="name-grid">
          <label className="label-left">Name *</label>
          <span />
          <span />
          <label className="label-right">Credentials</label>

          <input
            type="text"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            placeholder="First, Middle (optional)"
            required
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            placeholder="Last"
            required
          />
          <select name="suffix" value={formData.suffix || ""} onChange={handleChange}>
            <option value="">Suffix</option>
            <option value="Jr.">Jr.</option>
            <option value="Sr.">Sr.</option>
            <option value="II">II</option>
            <option value="III">III</option>
          </select>
          <input
            type="text"
            name="credentials"
            value={formData.credentials || ""}
            onChange={handleChange}
            placeholder="e.g., RN, MBA"
          />
        </div>
      </div>

      {/* EMAIL + PHONE */}
      <div className="contact-layout">
        <div className="contact-form">
          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: 8 }}
          >
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email || ""} onChange={handleChange} autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formatPhone(formData.phone)}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* ADDRESS */}
          <div className="form-group">
            <label>Address *</label>
            <input type="text" name="address" value={formData.address || ""} onChange={handleChange} autoComplete="street-address" style={{ marginBottom: 8 }} />
            <input
              type="text"
              name="address2"
              value={formData.address2 || ""
              }
              onChange={handleChange}
              autoComplete="address-line2"
              placeholder="Apt, Suite, Unit, etc. (optional)"
              style={{ marginBottom: 8 }}
            />
          </div>

          {/* CITY / STATE / ZIP */}
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px", gap: "12px" }}>
            <div className="form-group city-field">
              <label>City *</label>
              <input type="text" name="city" value={formData.city || ""} onChange={handleChange} />
            </div>
            <div className="form-group state-field">
              <label>State *</label>
              <input type="text" name="state" value={formData.state || ""} onChange={handleStateChange} maxLength={2} />
            </div>
            <div className="form-group zip-field">
              <label>ZIP *</label>
              <input type="text" name="zip" inputMode="numeric" value={formData.zip || ""} onChange={handleZipChange} autoComplete="postal-code" />
            </div>
          </div>

          {/* CTA */}
          <div className="bg-primary bg-opacity-10 rounded px-4 py-3 text-center my-4 shadow-sm">
            <div className="fw-semibold mb-2">
              <i className="bi bi-people-fill me-2"></i>
              Get in touch with verified recruiters — <span className="text-primary">100% free!</span>
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setShowLeadModal(true)}>
              Show Me How
            </button>
          </div>
        </div>
      </div>

      <hr />

      {/* LEAD MODAL */}
      <Modal show={showLeadModal} onHide={() => setShowLeadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Connect with Recruiters — It’s Free!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="d-flex gap-2">
              <Form.Group className="mb-3 flex-fill">
                <Form.Label>First Name *</Form.Label>
                <Form.Control type="text" name="firstName" value={leadForm.firstName} onChange={handleLeadChange} />
              </Form.Group>
              <Form.Group className="mb-3 flex-fill">
                <Form.Label>Last Name *</Form.Label>
                <Form.Control type="text" name="lastName" value={leadForm.lastName} onChange={handleLeadChange} />
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control type="email" name="email" value={leadForm.email} onChange={handleLeadChange} autoComplete="email" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={formatPhone(leadForm.phone)}
                onChange={(e) => setLeadForm((p) => ({ ...p, phone: stripPhone(e.target.value) }))}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Target Job *</Form.Label>
              <Form.Control type="text" name="targetJob" value={leadForm.targetJob} onChange={handleLeadChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Preferred Location</Form.Label>
              <Form.Control type="text" name="preferredLocation" value={leadForm.preferredLocation} onChange={handleLeadChange} />
            </Form.Group>

            <FormControlLabel
              control={
                <Checkbox
                  name="consent"
                  checked={leadForm.consent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLeadForm((p) => ({ ...p, consent: checked }));
                    if (checked) setShowConsentError(false); // clear error once consent is checked
                  }}
                  color="primary"
                />
              }
              label={
                <>
                  I agree to be contacted about jobs and accept the{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={handlePrivacyClick}>
                    Privacy&nbsp;Policy
                  </a>
                  .
                </>
              }
            />
            {showConsentError && !leadForm.consent && (
              <div className="form-text" style={{ color: "#d93025", marginTop: "-4px" }}>
                Please check the box to continue.
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeadModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleLeadSubmit} disabled={joinDisabled}>
            {submitting ? "Submitting…" : "Join the List"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
