import express from "express";
import fs from "fs";
import path from "path";
import { sendPreviewEmail } from "../lib/email.js";

const router = express.Router();

// Minimal CSV logging for MVP; replace with Supabase later.
const CSV_PATH = path.join(process.cwd(), "data", "leads.csv");
fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
if (!fs.existsSync(CSV_PATH)) fs.writeFileSync(CSV_PATH, "timestamp,email,docType,role,experienceLevel,previewId,consent,utm\n");

router.post("/", async (req, res) => {
  try {
    const { email, docType, role, experienceLevel, previewId, marketingConsent, utm, shareUrl } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const line = [
      new Date().toISOString(),
      `"${(email || "").replace(/"/g, '""')}"`,
      docType || "",
      (role || "").replace(/,/g, " "),
      (experienceLevel || ""),
      previewId || "",
      marketingConsent ? "yes" : "no",
      (utm || "").replace(/,/g, " "),
    ].join(",") + "\n";

    fs.appendFileSync(CSV_PATH, line);

    if (shareUrl) {
      await sendPreviewEmail({ to: email, previewUrl: shareUrl });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lead logging failed" });
  }
});

export default router;
