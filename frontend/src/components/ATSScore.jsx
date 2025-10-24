import React from "react";
import "../styles/ATSScore.css"; // You can rename this if needed

const ATSScore = ({ atsScore }) => {
  return (
    <div className="ats-score-container">
      <div className="ats-label">ATS Score</div>
      <div className="ats-score-number">{atsScore}%</div>
      {atsScore === 0 && (
        <div className="ats-help-message">
          <p>
            This resume appears to be empty. Add sections like <strong>Summary</strong>,{" "}
            <strong>Education</strong>, <strong>Experience</strong>, and <strong>Skills</strong> to improve your ATS score.
          </p>
        </div>
      )}
    </div>
  );
};

export default ATSScore;
