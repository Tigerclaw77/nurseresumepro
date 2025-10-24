import express from "express";
import crypto from "crypto";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import htmlToDocx from "html-to-docx";
import { wrapPreviewHtml } from "../lib/previewMarkup.js";
import { sendFullDocEmail } from "../lib/email.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory registry for preview data (OK for MVP; replace with DB later)
const PREVIEWS = new Map(); // previewId -> { email?, payload, html }

function id() { return crypto.randomBytes(8).toString("hex"); }

// Basic abuse limiter (MVP)
const WINDOW_MS = 24 * 60 * 60 * 1000;
const FREE_LIMIT = Number(process.env.FREE_PREVIEWS_PER_WINDOW || 1);
const windowHits = new Map(); // key = email|ip → {count, resetAt}

function allowFreeAttempt(key) {
  const now = Date.now();
  const rec = windowHits.get(key);
  if (!rec || now > rec.resetAt) {
    windowHits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count < FREE_LIMIT) {
    rec.count += 1;
    return true;
  }
  return false;
}

// Build your prompts however you already do; keep preview shorter/cheaper
async function aiGeneratePreview(payload) {
  const { docType, role, rawInputs } = payload;
  const sys = `You create concise ${docType} previews. Max ~350 words. Use bullet structure.`;
  const user = `Role: ${role}\nInputs:\n${rawInputs}`;
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_PREVIEW || "gpt-4o-mini",
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.3,
  });
  return res.choices[0]?.message?.content || "Preview unavailable.";
}

async function aiGenerateFullHtml(payload) {
  const { docType, role, rawInputs, signoffTone } = payload;
  const sys = `You create polished, ATS-friendly ${docType} documents. Use clear headers, strong bullet points, metrics where possible.`;
  const user = `Role: ${role}\nTone: ${signoffTone}\nInputs:\n${rawInputs}`;
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_FULL || "gpt-4o",
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.25,
  });
  return res.choices[0]?.message?.content || "<p>Generation failed.</p>";
}

// POST /api/generate/preview
router.post("/preview", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "ip";
    const emailKey = (req.body.email || "").trim().toLowerCase();
    const limitKey = emailKey || ip;

    if (!allowFreeAttempt(limitKey)) {
      return res.status(429).json({ error: "Daily free preview limit reached." });
    }

    const payload = req.body;
    const htmlRaw = await aiGeneratePreview(payload);
    const html = wrapPreviewHtml(htmlRaw);

    const previewId = id();
    PREVIEWS.set(previewId, { payload, html });

    // Optional: make this a real route that renders preview by ID
    const shareUrl = `${process.env.PUBLIC_BASE_URL || "http://localhost:5173"}/preview/${previewId}`;

    res.json({ html, previewId, shareUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Preview generation failed" });
  }
});

// GET /api/generate/preview/:id (for share links)
router.get("/preview/:id", (req, res) => {
  const rec = PREVIEWS.get(req.params.id);
  if (!rec) return res.status(404).send("Not found");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(rec.html);
});

// INTERNAL: called from webhook or success handler to produce full .docx and email it
router.post("/full", async (req, res) => {
  try {
    const { to, previewId } = req.body;
    const rec = PREVIEWS.get(previewId);
    if (!rec) return res.status(400).json({ error: "Unknown preview" });

    const fullHtml = await aiGenerateFullHtml(rec.payload);
    const docxBuffer = await htmlToDocx(fullHtml, {}, {
      table: { row: { cantSplit: true } },
      footer: true,
    });

    const fileName = `resumeai_${previewId}.docx`;
    const outPath = path.join(process.cwd(), "tmp", fileName);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, docxBuffer);

    await sendFullDocEmail({
      to,
      attachments: [{ filename: fileName, path: outPath, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }],
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Full generation failed" });
  }
});

export default router;
export { PREVIEWS };
