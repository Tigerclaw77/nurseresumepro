export default function HouseAdA() {
  return (
    <a
      href="https://your-affiliate.example/a"
      target="_blank"
      rel="nofollow sponsored"
      style={{
        display: "grid",
        placeItems: "center",
        width: "100%", height: "100%",
        textDecoration: "none", background: "#f1f5f9", color: "#0f172a"
      }}
    >
      <div style={{ textAlign: "center", padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Advertise here</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Start promoting today.</div>
        <div
          style={{
            marginTop: 10, display: "inline-block",
            padding: "6px 10px", borderRadius: 8,
            background: "#e2e8f0", color: "#0f172a", fontWeight: 600
          }}
        >
          Learn more
        </div>
      </div>
    </a>
  );
}
