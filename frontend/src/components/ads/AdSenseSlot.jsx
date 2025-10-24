// components/ads/AdSenseSlot.jsx
import { useEffect } from "react";

export default function AdSenseSlot({
  client = import.meta.env.VITE_ADSENSE_CLIENT, // e.g., "ca-pub-123..."
  slot,                                         // required: your slot id
  style = { display: "block", minHeight: 250 }, // prevent layout shift
  format = "auto",
  fullWidth = true,
  className = "",
  testMode = import.meta.env.DEV,               // auto-on in dev
  label = "Ad",
}) {
  // ❗ Do NOT early-return before hooks — it can change hook order between renders.
  // Always call hooks; bail inside the effect instead.

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard
    if (!client || !slot) return;              // nothing to do without IDs

    // Load AdSense script once. Also check for an existing script tag to avoid duplicates.
    if (!window.__adsbygoogleLoaded) {
      const existing = document.querySelector(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      );
      if (!existing) {
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        s.setAttribute("data-ad-client", client);
        s.crossOrigin = "anonymous";
        document.head.appendChild(s);
      }
      window.__adsbygoogleLoaded = true;
    }

    let isCancelled = false;
    let retries = 0;
    const maxRetries = 10;

    const pushOnce = () => {
      if (typeof window === "undefined" || !("adsbygoogle" in window)) return false;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        return true;
      } catch (e) {
        if (retries === maxRetries) {
          // eslint-disable-next-line no-console
          console.warn("AdSense push failed for slot:", slot, e?.message || e);
        }
        return false;
      }
    };

    const schedule = () => {
      if (isCancelled) return;
      const ok = pushOnce();
      if (!ok && retries < maxRetries) {
        retries += 1;
        setTimeout(schedule, 200 + retries * 100); // 200ms, 300ms, ...
      }
    };

    schedule();
    return () => {
      isCancelled = true;
    };
  }, [client, slot]);

  // It’s safe to render nothing (or a reserved box) when IDs are missing.
  const hasIds = Boolean(client && slot);

  return (
    <section
      aria-label="advertisement"
      role="complementary"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        position: "relative",
      }}
    >
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
          zIndex: 1,
        }}
      >
        {label}
      </span>

      {hasIds ? (
        <ins
          className={`adsbygoogle ${className}`}
          style={style}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={fullWidth ? "true" : "false"}
          data-adtest={testMode ? "on" : undefined}
        />
      ) : (
        // Optional reserved space to avoid layout shift if env vars are missing
        <div style={{ ...style }} />
      )}
    </section>
  );
}
