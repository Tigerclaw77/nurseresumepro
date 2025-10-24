import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE from "../apiConfig"; // <-- NEW

const Success = () => {
  const [content, setContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [docType, setDocType] = useState("resume");
  const navigate = useNavigate();
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    const storedText = localStorage.getItem("generatedContent");
    const storedHtml = localStorage.getItem("generatedContentHtml");
    const storedEmail = localStorage.getItem("email");
    const storedType = localStorage.getItem("generatedType");

    if (!storedText && !storedHtml) {
      alert("No content available. Please generate a resume first.");
      window.location.href = "/";
    }

    if (storedText) setContent(storedText);
    if (storedHtml) setHtmlContent(storedHtml);
    if (storedEmail) setEmail(storedEmail);
    if (storedType) setDocType(storedType);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!downloaded && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        e.preventDefault();
        e.returnValue =
          "You may lose your resume if you leave without downloading.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [downloaded]);

  const handleExport = async () => {
    const endpoint = `${API_BASE}/api/export/word/`;
    const html = htmlContent?.includes('class="resume"')
      ? htmlContent
      : `<div class="resume"><p>${content.replace(/\n/g, "</p><p>")}</p></div>`;

    console.log("Exporting HTML:", html);

    try {
      const response = await axios.post(
        endpoint,
        { html, type: docType },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${docType === "resume" ? "resume" : "cover_letter"}.docx`;
      link.click();

      setDownloaded(true);

      // === Handle Email Send (optional) ===
      if (sendEmail) {
        if (!email.trim()) {
          console.warn("❌ Email sending skipped: email is empty.");
          alert("Please enter your email before sending.");
          return;
        }

        console.log("📤 Sending email to:", email);
        try {
          await axios.post(`${API_BASE}/api/send-email/`, {
            email,
            content: html,
            format: "word",
            type: docType,
          });
          console.log("✅ Email successfully sent");
        } catch (err) {
          console.error("❌ Failed to send email:", err);
          alert("Email delivery failed. Please check your address and try again.");
        }
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed.");
    }
  };

  const handleAnother = () => {
    const confirmLeave = window.confirm(
      "Are you sure? If you haven’t downloaded your document, you may lose it."
    );
    if (!confirmLeave) return;

    localStorage.removeItem("resumeContent");
    localStorage.removeItem("generatedContent");
    localStorage.removeItem("generatedContentHtml");
    localStorage.removeItem("generatedType");
    localStorage.removeItem("email");
    navigate("/");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>Payment Successful!</h2>
      <p>You may now copy or export your {docType}.</p>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          marginTop: "1rem",
          backgroundColor: "#f9f9f9",
          whiteSpace: "pre-wrap",
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent || content }}
      />

      <div style={{ marginTop: "1.5rem" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={() => setSendEmail(!sendEmail)}
            style={{ marginRight: "0.5rem" }}
          />
          Send to my email
        </label>

        {sendEmail && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="form-control"
            style={{
              maxWidth: "400px",
              marginBottom: "1rem",
              padding: "0.5rem",
            }}
          />
        )}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleExport}>
          Download {docType === "resume" ? "Resume" : "Cover Letter"} (.docx)
        </button>
      </div>

      <div
        style={{
          marginTop: "3rem",
          padding: "1.5rem",
          backgroundColor: "#eef5ff",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h4>Need another document?</h4>
        <p>
          You can generate another resume or cover letter tailored to a
          different job.
        </p>
        <button className="btn btn-outline-primary" onClick={handleAnother}>
          Create A New Document
        </button>
      </div>
    </div>
  );
};

export default Success;
