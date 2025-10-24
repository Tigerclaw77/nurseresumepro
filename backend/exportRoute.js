// backend/exportRoute.js
import htmlToDocx from "html-to-docx";

export function attachExportRoutes(app) {
  // DOCX export (with env-based dev bypass)
  app.post("/api/export/docx", async (req, res) => {
    try {
      const { html, type = "document", paid = false } = req.body || {};

      const DEV_EXPORT_BYPASS =
        process.env.NODE_ENV !== "production" &&
        String(process.env.DEV_EXPORT_BYPASS || "false").toLowerCase() === "true";

      const allowed = paid === true || DEV_EXPORT_BYPASS;
      if (!allowed) {
        return res.status(402).json({ message: "payment_required" });
      }

      if (!html || typeof html !== "string") {
        return res.status(400).json({ message: "html_required" });
      }

      const pageStyle = `
        body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11pt;line-height:1.35}
        .resume-head,.letterhead{margin-bottom:12pt}
        .contact{margin-bottom:12pt}
        .body p{margin:0 0 8pt 0}
        ul{margin:0 0 8pt 20pt}
      `;
      const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${pageStyle}</style></head><body>${html}</body></html>`;

      const buffer = await htmlToDocx(docHtml, null, {
        table: { row: { cantSplit: true } },
        margins: { top: 720, right: 720, bottom: 720, left: 720 },
      });

      const filename =
        type === "resume" ? "resume.docx" :
        type === "cover" ? "cover_letter.docx" :
        "document.docx";

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.status(200).send(Buffer.from(buffer));
    } catch (err) {
      console.error("Export error:", err);
      return res.status(500).json({ message: "export_failed" });
    }
  });

  // optional stub so front-end email step succeeds
  app.post("/api/send-email/", async (req, res) => {
    try {
      const { email, type, format } = req.body || {};
      console.log("Email stub:", { email, type, format });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });
}
