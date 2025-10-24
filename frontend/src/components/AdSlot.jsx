import React from "react";

/**
 * A single display ad frame. Works for Google tags or house creatives.
 * - Labels the unit (policy-safe) without making the whole page look like an ad.
 * - Fixed size to avoid layout shift.
 */
export default function AdSlot({
  width = 300,
  height = 250,
  children,          // pass your ad tag or house creative
  className = "",
  label = "Ad",      // "Ad" for display units
  id,
}) {
  return (
    <section
      id={id}
      className={className}
      aria-label="advertisement"
      role="complementary"
      style={{
        width,
        minWidth: width,
        height,
        minHeight: height,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fafafa",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        position: "relative",
      }}
    >
      {/* local label */}
      <span
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 999,
          color: "#475569",
        }}
      >
        {label}
      </span>

      {/* ad content */}
      <div style={{ width: "100%", height: "100%" }}>
        {children /* e.g., <ins class="adsbygoogle" .../> or a house creative */}
      </div>
    </section>
  );
}
