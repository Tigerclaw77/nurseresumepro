import React from "react";
import ContactInfo from "./ContactInfo";
import { SIGNOFF_MAP, SIGNOFF_TOOLTIPS } from "./signoffToneOptions";
// import "../../styles/UserInfoForm.css";

const CoverLetterTab = ({
  formData,
  setFormData,
  signoffTone,
  setSignoffTone,
}) => {
  console.log("CoverLetterTab mounted");

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      localStorage.setItem("formData", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  const handleSignoffChange = (tone) => {
    console.log("Updating signoff tone:", tone); // ✅ Now should log

    setSignoffTone(tone);
    localStorage.setItem("signoffTone", tone);

    setFormData((prev) => {
      const updatedData = { ...prev, signoffTone: tone };
      localStorage.setItem("formData_cover", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  return (
    <div className="cover-letter-tab">
      <ContactInfo
        formData={formData}
        handleChange={handleFieldChange}
        setFormData={setFormData}
      />

      <div className="form-group">
        <label>Recipient Name</label>
        <input
          type="text"
          name="recipientName"
          placeholder="e.g., Dr. Jones, Hiring Manager"
          value={formData.recipientName || ""}
          onChange={handleFieldChange}
          style={{ marginBottom: 8 }}
        />
      </div>

      <div className="form-group">
        <label>Company Name</label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName || ""}
          onChange={handleFieldChange}
          style={{ marginBottom: 8 }}
        />
      </div>

      <div className="form-group">
        <label>Company Location (City, State)</label>
        <input
          type="text"
          name="companyLocation"
          value={formData.companyLocation || ""}
          onChange={handleFieldChange}
          style={{ marginBottom: 8 }}
        />
      </div>

      <div className="form-group">
        <label>Target Job Title</label>
        <input
          type="text"
          name="job_title"
          value={formData.job_title || ""}
          onChange={handleFieldChange}
          style={{ marginBottom: 18 }}
        />
      </div>

      <div className="form-group">
        <label>Work Experience Summary</label>
        <textarea
          name="experience"
          value={formData.experience || ""}
          onChange={handleFieldChange}
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Job Description</label>
        <textarea
          name="job_description"
          placeholder="Suggestion: Paste from job ad"
          value={formData.job_description || ""}
          onChange={handleFieldChange}
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Is there anything else you want the letter to mention?</label>
        <textarea
          name="additional_comments"
          placeholder="(Optional) Mention any personal motivation, values, or specific skill not listed above."
          value={formData.additional_comments || ""}
          onChange={handleFieldChange}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Sign-off tone:
        </label>
        <div style={{ display: "grid", gap: "5px" }}>
          {Object.keys(SIGNOFF_MAP).map((tone) => {
            const isSelected = signoffTone === tone;
            return (
              <div
                key={tone}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 100px 1fr",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.4rem",
                }}
              >
                <input
                  type="radio"
                  id={`tone-${tone}`}
                  name="signoffTone"
                  value={tone}
                  checked={isSelected}
                  onChange={(e) => handleSignoffChange(e.target.value)}
                  style={{ margin: 0 }}
                />
                <label
                  htmlFor={`tone-${tone}`}
                  style={{
                    margin: 0,
                    whiteSpace: "nowrap",
                    fontWeight: isSelected ? "bold" : "normal",
                  }}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </label>
                <span
                  style={{
                    fontStyle: "italic",
                    color: "#777",
                    fontSize: "0.85rem",
                  }}
                >
                  {isSelected 
                    ? SIGNOFF_MAP[tone]
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CoverLetterTab;
