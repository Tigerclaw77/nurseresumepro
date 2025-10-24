import React from "react";

/**
 * A native partner placement (NOT a standard display ad).
 * Labeled inside the card only—doesn't brand the whole page as sponsored.
 */
export default function PartnerCard({ title, body, href, cta = "Learn more" }) {
  return (
    <article
      aria-label="sponsored content"
      style={{
        position: "relative",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 999,
          color: "#475569",
        }}
      >
        Sponsored
      </span>

      <div style={{ fontWeight: 700, marginTop: 8 }}>{title}</div>
      <p style={{ margin: "6px 0 10px", color: "#374151" }}>{body}</p>
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored"
        style={{ fontWeight: 700, color: "#0ea5e9" }}
      >
        {cta} →
      </a>
    </article>
  );
}
