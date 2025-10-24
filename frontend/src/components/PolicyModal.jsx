import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Terms from "./Terms";
import PrivacyPolicy from "./PrivacyPolicy";

export default function PolicyModal() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState("privacy");
  const [portalEl, setPortalEl] = useState(null);

  // create/reuse one portal root
  useEffect(() => {
    let el = document.getElementById("policy-modal-portal");
    if (!el) {
      el = document.createElement("div");
      el.id = "policy-modal-portal";
      document.body.appendChild(el);
    }
    setPortalEl(el);
  }, []);

  // open via event: detail can be "terms" | "privacy" or { section }
  useEffect(() => {
    const onOpen = (e) => {
      const d = e?.detail;
      const s = typeof d === "string" ? d : d?.section;
      if (s === "terms" || s === "privacy") {
        setSection(s);
        setOpen(true);
      }
    };
    window.addEventListener("open-policy", onOpen);
    return () => window.removeEventListener("open-policy", onOpen);
  }, []);

  // close helpers
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!portalEl || !open) return null;

  // minimal, clean styles
  const S = {
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },
    sheet: {
      width: "min(800px, 92vw)",
      maxHeight: "90vh",
      background: "#ffffff",
      color: "#111827",
      borderRadius: 12,
      boxShadow: "0 24px 60px rgba(0,0,0,.45)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#0e2144",         // simple, nice header
      color: "#fff",
    },
    title: { margin: 0, fontSize: 18, fontWeight: 700 },
    closeBtn: {
      background: "transparent",
      border: 0,
      color: "#cbd5e1",
      fontSize: 20,
      lineHeight: 1,
      cursor: "pointer",
    },
    content: {
      padding: 18,
      overflow: "auto",
      maxHeight: "calc(90vh - 52px)", // header height
    },
    a: { color: "#1d4ed8", textDecoration: "underline" },
    h3: { color: "#111827", marginTop: 0, marginBottom: 8, fontWeight: 700 },
    h4: { color: "#111827", marginTop: 18, marginBottom: 8 },
    p: { color: "#1f2937", margin: "6px 0" },
  };

  return createPortal(
    <div style={S.backdrop} role="dialog" aria-modal="true" onClick={close}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()} role="document"
           aria-label={section === "terms" ? "Terms of Service" : "Privacy Policy"}>
        <header style={S.header}>
          <h2 style={S.title}>{section === "terms" ? "Terms of Service" : "Privacy Policy"}</h2>
          <button style={S.closeBtn} aria-label="Close" onClick={close}>×</button>
        </header>
        <div style={S.content}>
          {section === "terms" ? (
            <Terms components={{ h3: (p) => <h3 style={S.h3} {...p} />,
                                 h4: (p) => <h4 style={S.h4} {...p} />,
                                 p:  (p) => <p  style={S.p}  {...p} />,
                                 a:  (p) => <a  style={S.a}  {...p} /> }} />
          ) : (
            <PrivacyPolicy components={{ h3: (p) => <h3 style={S.h3} {...p} />,
                                        h4: (p) => <h4 style={S.h4} {...p} />,
                                        p:  (p) => <p  style={S.p}  {...p} />,
                                        a:  (p) => <a  style={S.a}  {...p} /> }} />
          )}
        </div>
      </div>
    </div>,
    portalEl
  );
}
