// PrivacyPolicy.jsx
// Plain-language, nurse-centric policy for MVP. No contact form (mailto only).
// Drop this file wherever you import it from (you previously used: "../PrivacyPolicy").
// Usage: <PrivacyPolicy />

import React from "react";

const BRAND = "NurseResumePro";
const CONTACT_EMAIL = "privacy@nurseresumepro.com"; // edit anytime
const EFFECTIVE_DATE = "October 23, 2025";

export default function PrivacyPolicy() {
  return (
    <main className="page-content">
      <h1 style={{ marginTop: 0 }}>{BRAND} Privacy Policy</h1>
      <p><strong>Effective:</strong> {EFFECTIVE_DATE}</p>

      <p>
        This Privacy Policy explains how {BRAND} (“we,” “us,” “our”) collects, uses, and shares information when you
        use our website and services to create resumes and cover letters for nursing and clinical roles.
      </p>

      <hr />

      <h2 id="quick-summary">Quick Summary</h2>
      <ul>
        <li><strong>We never sell your personal data.</strong></li>
        <li>We only share data with recruiters <strong>with your consent</strong>, and only what’s needed for job outreach.</li>
        <li>You can access, correct, or delete your data by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <hr />

      <h2 id="what-we-collect">1) What We Collect</h2>
      <p>We collect only what we need to deliver the service:</p>
      <ul>
        <li><strong>Account/Contact Info:</strong> name, email, phone, city/state/ZIP, role/target job, preferred location.</li>
        <li><strong>Resume/Cover Inputs:</strong> professional history, skills, credentials, and content you enter or upload.</li>
        <li><strong>Device/Usage Data:</strong> basic analytics (pages viewed, timestamps, browser type, IP-derived region).</li>
        <li><strong>Cookies & Similar Tech:</strong> to keep you signed in, remember preferences, and measure usage.</li>
      </ul>

      <h3 id="sensitive">Sensitive data</h3>
      <p>
        Please avoid entering PHI or patient-identifiable information. Do not upload content that includes Social Security
        numbers or other highly sensitive identifiers.
      </p>

      <hr />

      <h2 id="sharing">2) Data Sharing & Disclosure</h2>
      <p><strong>We do not sell personal data.</strong></p>
      <ul>
        <li>
          <strong>Recruiters (with consent):</strong> If you opt in, we may share your name, contact information, and role
          preferences with verified recruiters for job outreach.
        </li>
        <li>
          <strong>Service Providers:</strong> We use trusted vendors (e.g., cloud hosting, error monitoring, analytics)
          who can only process data on our instructions and must protect it.
        </li>
        <li>
          <strong>Legal/Compliance:</strong> We may disclose data if required by law, regulation, or to protect rights,
          safety, and security.
        </li>
      </ul>

      <hr />

      <h2 id="how-we-use">3) How We Use Your Data</h2>
      <ul>
        <li>Provide and improve resume/cover letter creation and related features.</li>
        <li>Communicate about your account, product updates, and (if opted in) job opportunities.</li>
        <li>Detect, prevent, and address fraud, abuse, or technical issues.</li>
        <li>Measure performance and improve user experience via aggregate analytics.</li>
      </ul>

      <hr />

      <h2 id="ads-cookies">4) Cookies, Analytics & Ads</h2>
      <ul>
        <li>
          <strong>Essential cookies</strong> keep you logged in and remember preferences.
        </li>
        <li>
          <strong>Analytics</strong> (e.g., privacy-respecting tools or mainstream analytics) help us understand traffic patterns.
        </li>
        <li>
          <strong>Ads (if/when shown):</strong> We may display ads. Ad partners may set cookies to measure views and prevent fraud. We do not sell personal data.
        </li>
      </ul>
      <p>
        You can control cookies in your browser settings. Blocking some cookies may affect site functionality.
      </p>

      <hr />

      <h2 id="retention">5) Data Retention</h2>
      <p>
        We keep personal data only as long as needed to provide the service and for legitimate business, legal, or
        security purposes. If you request deletion, we’ll remove or anonymize data unless we must retain certain records.
      </p>

      <hr />

      <h2 id="security">6) Security</h2>
      <p>
        We use technical and organizational measures appropriate for a modern SaaS (encryption in transit, access controls,
        limited personnel access). No method is 100% secure; please use strong, unique passwords and avoid sharing
        sensitive identifiers in free-text fields.
      </p>

      <hr />

      <h2 id="your-rights">7) Your Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or port your data; to object to or
        restrict certain processing; and to withdraw consent where processing is based on consent.
      </p>
      <p>
        To exercise any rights or make a privacy request, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may need to verify your identity before fulfilling a request.
      </p>

      <h3 id="us-state-rights">US State Disclosures (e.g., CA/VA/CO/CT/UT)</h3>
      <ul>
        <li><strong>No sale:</strong> We do not sell personal data.</li>
        <li><strong>Targeted ads:</strong> If we engage in cross-context behavioral advertising in the future, we will provide a clear opt-out.</li>
        <li>
          <strong>Request/Appeal:</strong> You can submit a request at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If we deny a request, you may appeal by replying to our decision.
        </li>
      </ul>

      <h3 id="gdpr">EU/UK GDPR Notices</h3>
      <ul>
        <li><strong>Controller:</strong> {BRAND}.</li>
        <li>
          <strong>Legal bases:</strong> contract (to provide the service), legitimate interests (security, improvement),
          consent (marketing/recruiter sharing when opted in), and legal obligations.
        </li>
        <li>
          <strong>Transfers:</strong> If data is transferred outside your region, we use appropriate safeguards (e.g., SCCs) where required.
        </li>
        <li>
          <strong>Supervisory authority:</strong> You may lodge a complaint with your local authority in addition to contacting us.
        </li>
      </ul>

      <hr />

      <h2 id="children">8) Children’s Privacy</h2>
      <p>
        {BRAND} is for adults seeking employment. We do not knowingly collect personal information from children under 16.
        If you believe a child provided us data, contact{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will take appropriate action.
      </p>

      <hr />

      <h2 id="changes">9) Changes to This Policy</h2>
      <p>
        We may update this policy to reflect changes to our practices or for legal, technical, or business reasons. We will
        post the updated version with a new effective date and, where required, provide additional notice.
      </p>

      <hr />

      <h2 id="contact">10) Contact</h2>
      <p>
        Questions or privacy requests:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <p style={{ fontSize: "0.92rem", color: "#6b7280", marginTop: "18px" }}>
        This summary is provided for clarity and does not override any mandatory legal rights in your jurisdiction.
      </p>
    </main>
  );
}
