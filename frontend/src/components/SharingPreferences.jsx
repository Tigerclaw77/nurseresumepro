import React from "react";
import { Form } from "react-bootstrap";
import "../styles/SharingPreferences.css";

const SharingPreferences = ({
  shareWithRecruiters,
  setShareWithRecruiters,
  sendToEmail,
  setSendToEmail,
  addToCart,
  setAddToCart,
  email,
  setEmail,
}) => (
  <div className="sharing-preferences">
    <Form.Check
      type="checkbox"
      id="shareWithRecruiters"
      label={
        <strong>
          I agree to share my profile/resume with verified recruiters – <span style={{ color: "green" }}>FREE</span>
        </strong>
      }
      checked={shareWithRecruiters}
      onChange={(e) => setShareWithRecruiters(e.target.checked)}
      className="form-check-sm mb-2"
    />

    <Form.Check
      type="checkbox"
      id="addToCart"
      label="Add resume to cart – $10"
      checked={addToCart}
      onChange={(e) => setAddToCart(e.target.checked)}
      className="form-check-sm mb-2"
    />

    <Form.Check
      type="checkbox"
      id="sendToEmail"
      label="Send me a copy to this email address – included with purchase"
      checked={sendToEmail}
      onChange={(e) => setSendToEmail(e.target.checked)}
      className="form-check-sm mb-1"
    />

    {sendToEmail && (
      <Form.Control
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1"
      />
    )}
  </div>
);

export default SharingPreferences;
