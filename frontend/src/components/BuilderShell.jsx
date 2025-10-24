// components/BuilderShell.jsx
import AdSlot from "../components/AdSlot";
import PartnerCard from "../components/PartnerCard";
import HouseAdA from "../components/HouseAdA";
import HouseAdB from "../components/HouseAdB";

export default function BuilderShell({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
      <section>{children}</section>

      <aside style={{ display: "grid", gap: 16 }}>
        <AdSlot id="ad-slot-a" width={300} height={250}><HouseAdA /></AdSlot>
        <AdSlot id="ad-slot-b" width={300} height={250}><HouseAdB /></AdSlot>
        <PartnerCard
          title="Featured Recruiter"
          body="Get in touch with verified recruiters — 100% free."
          href="https://your-partner.example/?utm_source=resumeai"
        />
      </aside>
    </div>
  );
}
