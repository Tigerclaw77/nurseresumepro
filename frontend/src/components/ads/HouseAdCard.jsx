// components/ads/HouseAdCard.jsx
export default function HouseAdCard({
  label = "Ad",
  title = "Ad placeholder",
  body = "Your ad could be here. Start promoting today.",
  ctaText = "Learn More",
  href = "/advertise",            // your landing page
}) {
  return (
    <section
      aria-label="advertisement"
      role="complementary"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fafafa",
        overflow: "hidden",
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
        }}
      >
        {label}
      </span>

      <a
        href={href}
        rel="nofollow sponsored"
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
          minHeight: 250,
          textDecoration: "none",
          color: "#0f172a",
        }}
      >
        <div style={{ textAlign: "center", padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{body}</div>
          <div
            style={{
              marginTop: 10,
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 8,
              background: "#e2e8f0",
              color: "#0f172a",
              fontWeight: 600,
            }}
          >
            {ctaText}
          </div>
        </div>
      </a>
    </section>
  );
}
