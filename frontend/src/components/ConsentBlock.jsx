import React, { useEffect, useState } from "react";

/**
 * ConsentBlock (minimal)
 * - REQUIRED disclosure line (no checkbox)
 * - Detects GPC client-side and stores it for downstream use
 * - Emits a single scope ["service"] via onChange (once)
 *
 * Props:
 * - onChange?: (scopes: string[]) => void
 * - className?: string
 * - policyLinks?: { terms: string; privacy: string }
 */
export default function ConsentBlock({
  onChange,
  className = "",
  policyLinks = { terms: "/terms", privacy: "/privacy" },
}) {
  // Set after mount to avoid SSR/CSR mismatch
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    try {
      const supported =
        typeof navigator !== "undefined" && !!navigator.globalPrivacyControl;
      setGpc(!!supported);
      localStorage.setItem("gpc", supported ? "true" : "false");
    } catch {
      // ignore storage errors
    }
  }, []);

  // Notify parent once: we only process data to generate documents
  useEffect(() => {
    if (typeof onChange === "function") onChange(["service"]);
  }, [onChange]);

  return (
    <section className={`consent-block ${className}`.trim()}>
      <p className="terms-line">
        By continuing, you agree to our{" "}
        <a href={policyLinks.terms} target="_blank" rel="noopener noreferrer">
          Terms
        </a>{" "}
        and{" "}
        <a
          href={policyLinks.privacy}
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        , and allow us to process your info to generate your documents.
        {gpc && (
          <span aria-live="polite" style={{ opacity: 0.8 }}>
            {" "}
            GPC detected — any future “sell/share” features will be disabled.
          </span>
        )}
      </p>
    </section>
  );
}
