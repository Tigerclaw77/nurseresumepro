import React from "react";
import ContactInfo from "./ContactInfo";
import LoadingNotice from "../LoadingNotice";
import "../../styles/UserInfoForm.css";

const ResumeTab = ({
  formData,
  setFormData,
  handleChange,
  // Optional, controlled by the parent where you call your API:
  processing = false,
  onCancelProcessing = null,
}) => {

  const handleStructuredChange = (field, index, key, value) => {
    const updated = [...(formData[field] || [])];
    updated[index] = { ...updated[index], [key]: value };
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: updated };
      localStorage.setItem("formData", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  const addStructuredEntry = (field, blankEntry) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), blankEntry],
    }));
  };

  const removeStructuredEntry = (field, index) => {
    const updated = [...(formData[field] || [])];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const btnStyle = {
    width: "28px",
    height: "28px",
    padding: 0,
    fontSize: "18px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "green",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  };

  const handleListChange = (field, index, value) => {
    const updated = [...(formData[field] || [])];
    updated[index] = value;
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: updated };
      localStorage.setItem("formData", JSON.stringify(updatedData)); // Save to localStorage
      return updatedData;
    });
  };

  const addListEntry = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  };

  const removeListEntry = (field, index) => {
    const updated = [...(formData[field] || [])];
    updated.splice(index, 1);
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: updated };
      localStorage.setItem("formData", JSON.stringify(updatedData)); // Save to localStorage
      return updatedData;
    });
  };

  return (
    <div className="resume-tab">
      <ContactInfo
        formData={formData}
        handleChange={handleChange}
        setFormData={setFormData}
      />

      {/* Processing banner — does not affect your existing layout */}
      <LoadingNotice
        visible={processing}
        title="Generating…"
        subtitle="This usually takes a few seconds."
        onCancel={onCancelProcessing}
      />

      <div className="form-group">
        <label>Target Job Title (Optional)</label>
        <input
          type="text"
          name="job_title"
          value={formData.job_title || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, job_title: e.target.value }))
          }
          style={{ marginBottom: 8 }}
        />
      </div>

      {/* #Education---------------------------------------------------------------------------- */}
      <div className="form-group">
        <label>Education</label>
      </div>
      {(formData.education || [{}]).map((entry, index) => (
        <React.Fragment key={index}>
          {index > 0 && <hr style={{ margin: "1rem 0" }} />}
          <div style={{ marginBottom: "1rem" }}>
            {/* Row: School Name + Add/Remove Button, X-aligned */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                maxWidth: "700px",
                width: "100%",
              }}
            >
              <input
                placeholder="School Name"
                value={entry.school || ""}
                onChange={(e) =>
                  handleStructuredChange(
                    "education",
                    index,
                    "school",
                    e.target.value
                  )
                }
                style={{ flex: 1 }}
              />

              {/* Right-aligned button */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexShrink: 0,
                  marginLeft: "auto",
                }}
              >
                {(formData.education?.length || 0) > 1 &&
                  index !== formData.education.length - 1 && (
                    <button
                      onClick={() => removeStructuredEntry("education", index)}
                      title="Remove item"
                      tabIndex={-1}
                      style={{
                        ...btnStyle,
                        position: "relative",
                        backgroundColor: "crimson",
                      }}
                    >
                      ×
                    </button>
                  )}
                {index === (formData.education?.length || 1) - 1 && (
                  <button
                    onClick={() =>
                      addStructuredEntry("education", {
                        school: "",
                        degree: "",
                        major: "",
                        graduation: "",
                      })
                    }
                    title="Add item"
                    tabIndex={-1}
                    style={{ ...btnStyle, position: "relative" }}
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* Row: Degree + Major + Graduation Year */}
            <div
              className="form-row"
              style={{
                gap: "1rem",
                marginTop: "0.75rem",
                maxWidth: "600px",
                width: "83%",
              }}
            >
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  placeholder="Degree"
                  value={entry.degree || ""}
                  onChange={(e) =>
                    handleStructuredChange(
                      "education",
                      index,
                      "degree",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group" style={{ flex: 2 }}>
                <input
                  placeholder="Major"
                  value={entry.major || ""}
                  onChange={(e) =>
                    handleStructuredChange(
                      "education",
                      index,
                      "major",
                      e.target.value
                    )
                  }
                />
              </div>

              <div
                className="form-group short-field"
                style={{ width: "100px" }}
              >
                <input
                  name="grad"
                  placeholder="Grad Year"
                  value={entry.graduation || ""}
                  onChange={(e) =>
                    handleStructuredChange(
                      "education",
                      index,
                      "graduation",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}

      <div
        className="form-group"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #888",
            margin: "2rem 0",
            width: "100%",
            display: "block",
          }}
        />

        <div className="form-group">
          <label>Work Experience</label>
        </div>
      </div>

      {(formData.experienceList || [{}])
        .map((entry) => ({
          ...entry,
          bullets: Array.isArray(entry.bullets) ? entry.bullets : [""],
        }))
        .map((entry, index) => (
          <div key={index} style={{ marginBottom: "2rem" }}>
            {index > 0 && (
              <hr
                style={{
                  border: "none",
                  borderTop: "2px solid #888",
                  margin: "2rem 0",
                  width: "100%",
                }}
              />
            )}

            {/* Company, Buttons, and Position */}
            <div
              className="form-row"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxWidth: "700px",
                width: "100%",
              }}
            >
              {/* Company Name + Buttons (1st row) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  width: "100%",
                }}
              >
                <input
                  placeholder="Company Name"
                  value={entry.company || ""}
                  onChange={(e) =>
                    handleStructuredChange(
                      "experienceList",
                      index,
                      "company",
                      e.target.value
                    )
                  }
                  style={{ flex: 1 }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(formData.experienceList?.length || 0) > 1 &&
                    index !== formData.experienceList.length - 1 && (
                      <button
                        onClick={() =>
                          removeStructuredEntry("experienceList", index)
                        }
                        title="Remove entry"
                        tabIndex={-1}
                        style={{
                          ...btnStyle,
                          backgroundColor: "crimson",
                          position: "relative",
                          top: "2px",
                        }}
                      >
                        ×
                      </button>
                    )}
                  {index === (formData.experienceList?.length || 1) - 1 && (
                    <button
                      onClick={() =>
                        addStructuredEntry("experienceList", {
                          company: "",
                          position: "",
                          start: "",
                          end: "",
                          location: "",
                          bullets: [""],
                        })
                      }
                      title="Add entry"
                      tabIndex={-1}
                      style={{
                        ...btnStyle,
                        position: "relative",
                        top: "2px",
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Position (stacked on mobile) */}
              <input
                placeholder="Position"
                value={entry.position || ""}
                onChange={(e) =>
                  handleStructuredChange(
                    "experienceList",
                    index,
                    "position",
                    e.target.value
                  )
                }
              />
            </div>

            {/* Start + End Dates */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <input
                placeholder="Start MM/YY"
                value={entry.start || ""}
                onChange={(e) =>
                  handleStructuredChange(
                    "experienceList",
                    index,
                    "start",
                    e.target.value
                  )
                }
                style={{ width: "120px" }}
              />
              <input
                placeholder="End MM/YY"
                value={entry.end || ""}
                onChange={(e) =>
                  handleStructuredChange(
                    "experienceList",
                    index,
                    "end",
                    e.target.value
                  )
                }
                style={{ width: "120px" }}
              />
            </div>

            {/* Location */}
            <div style={{ marginTop: "0.75rem" }}>
              <input
                placeholder="Location"
                value={entry.location || ""}
                onChange={(e) =>
                  handleStructuredChange(
                    "experienceList",
                    index,
                    "location",
                    e.target.value
                  )
                }
                style={{ width: "100%" }}
              />
            </div>

            {/* Responsibilities (bullets) */}
            <div style={{ marginTop: "1rem" }}>
              {(entry.bullets || [""]).map((bullet, bIndex) => (
                <div
                  key={bIndex}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    maxWidth: "700px",
                    width: "100%",
                    gap: "1rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Job Description"
                    value={bullet}
                    onChange={(e) => {
                      const updatedBullets = [...entry.bullets];
                      updatedBullets[bIndex] = e.target.value;
                      handleStructuredChange(
                        "experienceList",
                        index,
                        "bullets",
                        updatedBullets
                      );
                    }}
                    style={{ flex: 1 }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {entry.bullets.length > 1 &&
                      bIndex !== entry.bullets.length - 1 && (
                        <button
                          onClick={() => {
                            const updatedBullets = [...entry.bullets];
                            updatedBullets.splice(bIndex, 1);
                            handleStructuredChange(
                              "experienceList",
                              index,
                              "bullets",
                              updatedBullets
                            );
                          }}
                          tabIndex={-1}
                          style={{
                            ...btnStyle,
                            backgroundColor: "crimson",
                          }}
                        >
                          ×
                        </button>
                      )}
                    {bIndex === entry.bullets.length - 1 && (
                      <button
                        onClick={() => {
                          const updatedBullets = [...entry.bullets];
                          updatedBullets.push("");
                          handleStructuredChange(
                            "experienceList",
                            index,
                            "bullets",
                            updatedBullets
                          );
                        }}
                        tabIndex={-1}
                        style={{ ...btnStyle }}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #888",
          margin: "2rem 0",
          width: "100%",
          display: "block",
        }}
      />

      {/* #Skills-------------------------------------------------------------------------------- */}
      <div className="form-group">
        <label>Skills</label>
      </div>

      {(formData.skills || [""]).map((skill, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            maxWidth: "700px",
            width: "100%",
            marginBottom: "0.5rem",
          }}
        >
          <input
            value={skill}
            onChange={(e) => handleListChange("skills", index, e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                index === formData.skills.length - 1 &&
                window.innerWidth >= 768
              ) {
                e.preventDefault();
                addListEntry("skills");
              }
            }}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {(formData.skills?.length || 0) > 1 &&
              index !== formData.skills.length - 1 && (
                <button
                  onClick={() => removeListEntry("skills", index)}
                  style={{ ...btnStyle, backgroundColor: "crimson" }}
                  tabIndex={-1}
                >
                  ×
                </button>
              )}
            {index === (formData.skills?.length || 1) - 1 && (
              <button
                onClick={() => addListEntry("skills")}
                style={btnStyle}
                tabIndex={-1}
              >
                +
              </button>
            )}
          </div>
        </div>
      ))}

      {/* #Certifications--------------------------------------------------------------------------- */}
      <div className="form-group">
        <label>Certifications</label>
      </div>

      {(formData.certifications || [""]).map((cert, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            maxWidth: "700px",
            width: "100%",
            marginBottom: "0.5rem",
          }}
        >
          <input
            value={cert}
            onChange={(e) =>
              handleListChange("certifications", index, e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                index === (formData.certifications?.length || 0) - 1 &&
                window.innerWidth >= 768
              ) {
                e.preventDefault();
                addListEntry("certifications");
              }
            }}
            style={{ flex: 1, marginBottom: 0 }}
          />

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {(formData.certifications?.length || 0) > 1 &&
              index !== formData.certifications.length - 1 && (
                <button
                  onClick={() => removeListEntry("certifications", index)}
                  style={{ ...btnStyle, backgroundColor: "crimson" }}
                  tabIndex={-1}
                >
                  ×
                </button>
              )}
            {index === (formData.certifications?.length || 1) - 1 && (
              <button
                onClick={() => addListEntry("certifications")}
                style={btnStyle}
                tabIndex={-1}
              >
                +
              </button>
            )}
          </div>
        </div>
      ))}

      {/* #Hobbies-------------------------------------------------------------------------------- */}
      <div className="form-group">
        <label>Hobbies</label>
      </div>

      {(formData.hobbies || [""]).map((hobby, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            maxWidth: "700px",
            width: "100%",
            marginBottom: "0.5rem",
          }}
        >
          <input
            value={hobby}
            onChange={(e) => handleListChange("hobbies", index, e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                index === (formData.hobbies?.length || 0) - 1 &&
                window.innerWidth >= 768
              ) {
                e.preventDefault();
                addListEntry("hobbies");
              }
            }}
            style={{ flex: 1, marginBottom: 0 }}
          />

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {(formData.hobbies?.length || 0) > 1 &&
              index !== formData.hobbies.length - 1 && (
                <button
                  onClick={() => removeListEntry("hobbies", index)}
                  tabIndex={-1}
                  style={{ ...btnStyle, backgroundColor: "crimson" }}
                >
                  ×
                </button>
              )}
            {index === (formData.hobbies?.length || 1) - 1 && (
              <button
                onClick={() => addListEntry("hobbies")}
                tabIndex={-1}
                style={btnStyle}
              >
                +
              </button>
            )}
          </div>
        </div>
      ))}
      <hr />
    </div>
  );
};

export default ResumeTab;
