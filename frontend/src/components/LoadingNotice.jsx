import React from "react";

export default function LoadingNotice({
  visible,
  title = "Generating…",
  subtitle = "This usually takes a few seconds.",
  onCancel,
}) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "10px 0",
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        backdropFilter: "blur(6px)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.35)",
          borderTopColor: "#fff",
          animation: "spin 1s linear infinite",
        }}
      />
      <div style={{ flex: 1, lineHeight: 1.2 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ opacity: 0.9, fontSize: 13 }}>{subtitle}</div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.8)",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
