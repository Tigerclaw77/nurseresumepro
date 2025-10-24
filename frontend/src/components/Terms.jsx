import React from "react";
import "../styles/PrivacyPolicy.css";

const Terms = () => {
  return (
    <div className="policy-container"
    // style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}
    >
      <h1>Terms</h1>
      <p><strong>Last updated:</strong> July 16, 2025</p>

      <p>
        By using NurseResumePro.com, you agree to the following terms. These terms apply to all visitors, users, and others who access or use the service.
      </p>

      <h2>1. Use of the Service</h2>
      <p>
        This site offers AI-generated resumes and cover letters for healthcare professionals. You agree to use this site lawfully and not misuse or exploit the tools provided.
      </p>

      <h2>2. User Data & Content</h2>
      <p>
        You provide personal information solely for the purpose of generating documents. You retain rights to your information. We do not claim ownership of your content.
      </p>

      <h2>3. Payments & Access</h2>
      <p>
        Paid features (e.g., downloads) are available after checkout. All purchases are final unless otherwise stated. We do not guarantee specific employment outcomes.
      </p>

      <h2>4. Privacy</h2>
      <p>
        Use of this site is also governed by our{" "}
        <a href="/privacy" style={{ color: "#007bff" }}>
          Privacy Policy
        </a>
        . Your data will not be sold or shared without consent.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        All branding, tools, and code used on this site are the property of NurseResumePro and may not be copied or reused without permission.
      </p>

      <h2>6. No Warranties</h2>
      <p>
        This service is provided “as is.” We do not make any guarantees about hiring results, AI accuracy, or uptime.
      </p>

      <h2>7. Liability Limitations</h2>
      <p>
        NurseResumePro is not responsible for damages arising from use of the site, including lost opportunities or data.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the site means you accept any changes.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions? Reach out to{" "}
        <a href="mailto:support@nurseresumepro.com" style={{ color: "#007bff" }}>
          support@nurseresumepro.com
        </a>.
      </p>
    </div>
  );
};

export default Terms;
