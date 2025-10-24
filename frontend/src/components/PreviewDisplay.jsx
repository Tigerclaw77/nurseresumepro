import React from "react";

const PreviewDisplay = ({ content, paymentComplete }) => (
  <div className="rendered-output" dangerouslySetInnerHTML={{ __html: content }} style={{
    background: "white",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    lineHeight: "1.6",
    whiteSpace: "pre-line",
  }} />
);

export default PreviewDisplay;