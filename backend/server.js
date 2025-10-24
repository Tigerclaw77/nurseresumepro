// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import htmlToDocx from "html-to-docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { aiFormalizeList } from "./lib/aiFormalize.js";

// prompt builders
import { buildCoverMessages, parseCoverJson } from "./prompts/cover.js";
import {
  buildRewriteMessages,
  parseRewriteResponse,
} from "./prompts/rewrite.js";
import { buildResumeMessages, parseResumeJson } from "./prompts/resume.js";

// layout helpers (kept for backward compatibility/fallback)
import {
  buildResumeContact,
  buildCoverContact,
  formatResumeHtmlPlain,
  formatResumeHtml,
  formatCoverHtmlPlain,
  formatCoverHtml,
} from "./helpers/layout.js";

/* ----------------------------------------------------------------------- */

const app = express();

/* --------------------------------- CORS ---------------------------------- */
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      // add production origins if needed, e.g.:
      // "https://nurseresumepro.com",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

/* ------------------------------- JSON body ------------------------------- */
app.use(express.json({ limit: "1mb" }));

/* ----------------------------- OpenAI client ----------------------------- */
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/* ------------------------------ Supabase RPC ----------------------------- */
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const SUPA_RPC = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1/rpc/log_lead` : "";

/* ------------------------------ Small utils ------------------------------ */
const strip = (s = "") => String(s || "").trim();
const normalize = (t = "") =>
  String(t || "")
    .replace(/[^\w@.]+/g, "")
    .toLowerCase();

function formatPhoneNumber(raw = "") {
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

// Month name → "Month, YYYY"
function addCommaMonthYear(s = "") {
  return String(s).replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/g,
    "$1, $2"
  );
}

// --- Safe AI wrapper: if OpenAI is missing or errors, passthrough -----------
async function safeFormalizeList(list, opts, openaiClient) {
  try {
    const arr = Array.isArray(list) ? list.filter(Boolean) : [];
    if (!arr.length) return [];
    if (!openaiClient) return arr;
    return await aiFormalizeList(arr, opts, openaiClient);
  } catch (err) {
    console.warn("safeFormalizeList fallback:", err?.message || err);
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }
}

/* ------------------------- Template rendering shim ----------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV = process.env.NODE_ENV !== "production";
const TEMPLATE_DIR = path.resolve(__dirname, "templates");
const RESUME_TEMPLATE_PATH = path.join(TEMPLATE_DIR, "resume.html");
const COVER_TEMPLATE_PATH = path.join(TEMPLATE_DIR, "cover.html");

let resumeTpl = fs.existsSync(RESUME_TEMPLATE_PATH)
  ? fs.readFileSync(RESUME_TEMPLATE_PATH, "utf8")
  : null;

let coverTpl = fs.existsSync(COVER_TEMPLATE_PATH)
  ? fs.readFileSync(COVER_TEMPLATE_PATH, "utf8")
  : null;

// minimal placeholder engine supporting {{key}} and {{#if key}}...{{/if}}
function applyIfBlocks(tpl, data) {
  return tpl.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, k, inner) =>
    data[k] ? inner : ""
  );
}
function renderPlaceholders(tpl, data) {
  const withIf = applyIfBlocks(tpl, data);
  return withIf.replace(/{{\s*(\w+)\s*}}/g, (_, k) => data[k] ?? "");
}
function escHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* -------------------------- Text → HTML conversion ----------------------- */
function convertBulletsToHtml(text = "") {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${strip(line.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) {
      out.push(`<strong>${line}</strong>`);
    } else {
      out.push(`<p>${line}</p>`);
    }
  }

  if (inList) out.push("</ul>");
  return out.join("\n");
}

/* ----------------------------- ATS scoring ------------------------------ */
const ACTION_VERBS = [
  "Led",
  "Managed",
  "Developed",
  "Created",
  "Delivered",
  "Assisted",
  "Collaborated",
  "Supported",
  "Trained",
  "Performed",
  "Implemented",
  "Built",
  "Designed",
  "Resolved",
  "Launched",
  "Achieved",
  "Increased",
  "Decreased",
  "Optimized",
  "Streamlined",
  "Facilitated",
  "Presented",
  "Organized",
  "Monitored",
  "Analyzed",
  "Recommended",
  "Improved",
  "Communicated",
  "Prepared",
  "Evaluated",
  "Planned",
  "Negotiated",
  "Operated",
  "Maintained",
  "Initiated",
  "Directed",
  "Documented",
  "Tested",
  "Inspected",
  "Supervised",
  "Configured",
  "Updated",
  "Reviewed",
];
const startsWithActionVerb = (t = "") =>
  ACTION_VERBS.some((v) => t.trim().startsWith(v));

function calculateAtsScore(bulletsArr, sectionFlags, dates) {
  const verbCount = bulletsArr.reduce(
    (n, b) => n + (startsWithActionVerb(b) ? 1 : 0),
    0
  );
  const total = bulletsArr.length || 1;
  const actionScore = Math.round((verbCount / total) * 30);

  const sectionScore =
    10 * !!sectionFlags.skills +
    10 * !!sectionFlags.certifications +
    10 * !!sectionFlags.education +
    10 * !!sectionFlags.experience +
    5 * !!sectionFlags.summary +
    2 * !!sectionFlags.hobbies;

  const dateScore = dates.every((d) => /\b[A-Za-z]+,\s+\d{4}\b/.test(d))
    ? 5
    : 0; // Month, YYYY
  const lengthScore = bulletsArr.length >= 4 ? 5 : 0;

  return Math.min(actionScore + sectionScore + dateScore + lengthScore, 100);
}

/* ---------------------------- Sanitizers/HTML ---------------------------- */
function stripCodeFences(s = "") {
  return String(s)
    .replace(/^```(?:\s*html)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}
function stripOuterWrappers(s = "") {
  return String(s)
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\/?(?:html|head|body|style|title|meta|script|link)[^>]*>/gi, "")
    .trim();
}
function sanitizeAllowedTags(html = "") {
  const allowed = /^(div|h2|h3|p|ul|ol|li|strong|em|br)$/i;
  return String(html).replace(/<\s*\/?\s*([a-z0-9:-]+)([^>]*)>/gi, (m, tag) =>
    allowed.test(tag) ? m.replace(/\s+[^>]*?(?=>)/g, "") : ""
  );
}
function coerceToCleanHtml(raw = "", type = "resume") {
  let s = stripCodeFences(raw);
  s = stripOuterWrappers(s);
  const hasTag = /<\w+[^>]*>/.test(s);
  if (!hasTag) return convertBulletsToHtml(s);
  s = sanitizeAllowedTags(s);
  if (!/<div[^>]*>/.test(s)) s = `<div>${s}</div>`;
  if (!/class="/.test(s))
    s = s.replace(
      /<div/,
      `<div class="${type === "cover" ? "cover" : "resume"}"`
    );
  s = s.replace(/<p>\s*(?:name|contact)\s*:[\s\S]*?<\/p>/gi, "");
  return s.trim();
}

/* --------------------------- Rate limiting (IP) -------------------------- */
const rateMap = new Map();
function getClientIp(req) {
  const xf = (req.headers["x-forwarded-for"] || "")
    .toString()
    .split(",")[0]
    .trim();
  return xf || req.socket.remoteAddress || "unknown";
}
function hasExceededLimit(ip, action, limit = 3, windowMs = 60 * 60 * 1000) {
  const key = `${ip}|${action}`;
  const now = Date.now();
  const rec = rateMap.get(key);
  if (!rec || rec.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (rec.count >= limit) return true;
  rec.count += 1;
  return false;
}

/* ------------------------ Number hallucination guard --------------------- */
const numberTokens = (s = "") =>
  Array.from(String(s).matchAll(/\d[\d,]*\.?\d*(?:%|k|K|M|m)?/g)).map(
    (m) => m[0]
  );
const normalizeNum = (t = "") => t.replace(/[^\d.]/g, "");

const normalizeYear4 = (y) => {
  const s = String(y || "").trim();
  if (/^\d{4}$/.test(s)) return s;
  if (/^\d{2}$/.test(s)) {
    const n = parseInt(s, 10);
    const cur2 = new Date().getFullYear() % 100;
    return String(n <= cur2 ? 2000 + n : 1900 + n);
  }
  return s;
};

/* -------------------------- Sign-off tone mapping ------------------------ */
const SIGNOFF_MAP = {
  default: "Sincerely",
  professional: "Sincerely",
  formal: "Respectfully",
  friendly: "Best regards",
  warm: "Kind regards",
  thanks: "Thank you",
  appreciative: "With appreciation",
};
function resolveSignoff(fd = {}, options = {}) {
  const raw = String(
    options.signoff || fd.signoff || fd.signoffTone || ""
  ).trim();
  if (!raw) return "Sincerely";
  const key = raw.toLowerCase();
  if (SIGNOFF_MAP[key]) return SIGNOFF_MAP[key];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/* -------------------------- Supabase helpers ----------------------------- */
function truncateIp(ip = "") {
  if (!ip) return "unknown";
  if (ip.includes(".")) {
    const o = ip.split(".");
    return o.length === 4 ? `${o[0]}.${o[1]}.${o[2]}.0/24` : ip;
  }
  if (ip.includes(":")) {
    const p = ip.split(":");
    return `${p.slice(0, 4).join(":")}::/64`;
  }
  return ip;
}

/* -------------------------------- Health --------------------------------- */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    openai: Boolean(openai),
    supabaseRpc: Boolean(SUPA_RPC),
  });
});

/* --------------------------- Supabase: /api/lead -------------------------- */
app.post("/api/lead", async (req, res) => {
  try {
    if (!SUPA_RPC || !SUPABASE_SERVICE_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "supabase_not_configured" });
    }
    const h = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const payload = req.body || {};

    const body = {
      p_email: String(payload.email || "").toLowerCase(),
      p_first_name: payload.first_name || "",
      p_last_name: payload.last_name || "",
      p_city: payload.city || "",
      p_state: payload.state || "",
      p_zip: payload.zip || "",
      p_product_type: payload.product_type || "resume", // "resume" | "cover"
      p_ats_score:
        typeof payload.ats_score === "number" ? payload.ats_score : null,
      p_consent_scopes:
        Array.isArray(payload.consent_scopes) && payload.consent_scopes.length
          ? payload.consent_scopes
          : ["service"],
      p_consent_version: payload.consent_version || "pp-v1.0",
      p_gpc: !!payload.gpc,
      p_utm: payload.utm || {},
      p_referrer: payload.referrer || "",
      p_ip_trunc: payload.ip_trunc || truncateIp(String(h)),
      p_ua: payload.ua || String(req.headers["user-agent"] || "").slice(0, 200),
    };

    const r = await fetch(SUPA_RPC, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return res
        .status(502)
        .json({
          ok: false,
          error: "lead_write_failed",
          status: r.status,
          detail: t.slice(0, 200),
        });
    }

    const uuid = await r.json();
    return res.json({ ok: true, id: String(uuid) });
  } catch {
    return res.status(500).json({ ok: false, error: "lead_write_failed" });
  }
});

/* ----------------------------- Generate route ---------------------------- */
app.post("/api/generate/", async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (hasExceededLimit(ip, "generate", 3)) {
      return res
        .status(429)
        .json({ output: "", error: "Generation limit reached." });
    }

    const body = req.body || {};
    const type = String(body.type || "")
      .trim()
      .toLowerCase();

    if (type === "cover") return handleCover(body, res);
    if (type === "resume") return handleResume(body, res);

    return res.status(400).json({ error: "Invalid type" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ output: "", error: e?.message || "Server error" });
  }
});

/* ----------------------------- Export (DOCX) ----------------------------- */
app.post("/api/export/docx", async (req, res) => {
  try {
    const { html, type = "resume", paid, token } = req.body || {};
    const isPaid =
      Boolean(paid) || (typeof token === "string" && token.length > 10);
    if (!isPaid) {
      return res
        .status(402)
        .json({
          error: "PAYMENT_REQUIRED",
          message: "Please complete checkout to export.",
        });
    }
    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "INVALID_HTML" });
    }
    const buffer = await htmlToDocx(html, {
      orientation: "portrait",
      margins: { top: 720, right: 720, bottom: 720, left: 720 },
    });
    const filename = type === "cover" ? "cover-letter.docx" : "resume.docx";
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Export error:", err?.message || err);
    return res.status(500).json({ error: "EXPORT_FAILED" });
  }
});

/* ----------------------------- Cover handler ----------------------------- */
async function handleCover(data, res) {
  const form = data || {};
  const fd = form.formData || form;

  const fullName =
    [strip(fd.firstName), strip(fd.lastName)].filter(Boolean).join(" ") ||
    "Your Name";
  const email = strip(fd.email);
  const phoneDigits = String(fd.phone || "").replace(/\D/g, "");
  const phone =
    phoneDigits.length === 10
      ? `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(
          3,
          6
        )}-${phoneDigits.slice(6)}`
      : strip(fd.phone);
  const addressLine = strip(fd.address2)
    ? `${strip(fd.address)}, ${strip(fd.address2)}`
    : strip(fd.address);
  const cityStateZip = [strip(fd.city), strip(fd.state), strip(fd.zip)]
    .filter(Boolean)
    .join(", ");

  const recipient =
    strip(fd.recipient) ||
    strip(fd.recipientName) ||
    strip(fd.hiringManager) ||
    strip(fd.contactName);
  const company = strip(fd.companyName);
  const role = strip(fd.job_title);

  const companyCity = strip(fd.company_city);
  const companyState = strip(fd.company_state);
  const COMPANY_LOCATION = [companyCity, companyState]
    .filter(Boolean)
    .join(", ");

  const SIGNOFF = resolveSignoff(fd, form.options || {});
  const SALUTATION_TEXT = recipient
    ? `Dear ${recipient},`
    : "Dear Hiring Manager,";

  const contactHtml = buildCoverContact({
    fullName,
    addressLine,
    cityStateZip,
    phone,
    email,
  });

  const removeHomeLocationMentions = (html) => {
    if (COMPANY_LOCATION) return html;
    const homeLoc = [strip(fd.city), strip(fd.state)]
      .filter(Boolean)
      .join(", ");
    return homeLoc
      ? html.replace(
          new RegExp(
            `\\s+in\\s+${homeLoc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
            "gi"
          ),
          ""
        )
      : html;
  };
  const stripCoverTitle = (html) =>
    String(html).replace(/<h[12][^>]*>[\s\S]*?<\/h[12]>/gi, "");

  if (!openai) {
    const body = `
<div class="cover">
  <p>${SALUTATION_TEXT}</p>
  <p>I’m writing to express interest in ${role || "the role"}${
      company ? ` at ${company}` : ""
    }${COMPANY_LOCATION ? ` in ${COMPANY_LOCATION}` : ""}.</p>
  <p>Thank you for your time and consideration.</p>
  <p>${SIGNOFF},<br/>${fullName}</p>
</div>`.trim();

    const cleaned = removeHomeLocationMentions(body);

    const templated = renderCoverWithTemplate({
      fullName,
      addressLine,
      cityStateZip,
      phone,
      email,
      bodyHtml: cleaned,
    });

    const exportHtml = templated
      ? templated
      : formatCoverHtmlPlain(contactHtml, cleaned);
    const fullHtml = templated
      ? templated
      : formatCoverHtml(contactHtml, cleaned);

    return res.json({
      output: fullHtml,
      html: exportHtml,
      text: fullHtml.replace(/<[^>]+>/g, ""),
      ats_score: 0,
    });
  }

  try {
    const messages = buildCoverMessages(fd, { signoff: SIGNOFF });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.25,
    });

    const obj = parseCoverJson(completion.choices?.[0]?.message?.content ?? "");

    const paras = [SALUTATION_TEXT];
    if (obj.opening) paras.push(obj.opening);
    if (Array.isArray(obj.body)) paras.push(...obj.body.filter(Boolean));
    if (obj.closing) paras.push(obj.closing);
    paras.push(`${SIGNOFF},<br/>${fullName}`);

    const P = (t) => `<p style="margin:0 0 10px 0;">${String(t).trim()}</p>`;
    let bodyHtml = `<div class="cover">${paras.map(P).join("")}</div>`;
    bodyHtml = stripCoverTitle(bodyHtml);
    bodyHtml = removeHomeLocationMentions(bodyHtml);

    const templated = renderCoverWithTemplate({
      fullName,
      addressLine,
      cityStateZip,
      phone,
      email,
      bodyHtml,
    });

    const exportHtml = templated
      ? templated
      : formatCoverHtmlPlain(contactHtml, bodyHtml);
    const fullHtml = templated
      ? templated
      : formatCoverHtml(contactHtml, bodyHtml);

    const text = fullHtml.replace(/<[^>]+>/g, "");

    return res.json({ output: fullHtml, html: exportHtml, text, ats_score: 0 });
  } catch (err) {
    console.error(
      "OpenAI cover error:",
      err?.response?.data || err?.message || err
    );
    return res.status(500).json({ error: "AI generation failed" });
  }
}

/* ----------------------------- Resume handler ---------------------------- */
async function handleResume(data, res) {
  try {
    const d = data || {};
    const fd = d.formData || d;
    const mode = String(d.mode || fd.mode || "auto").toLowerCase(); // "auto" | "generate" | "rewrite"

    // Contact
    const first = strip(fd.firstName);
    const last = strip(fd.lastName);
    const fullName = [first, last].filter(Boolean).join(" ");
    const email = strip(fd.email);
    const phone = formatPhoneNumber(strip(fd.phone));
    const address = strip(fd.address);
    const address2 = strip(fd.address2);
    const city = strip(fd.city);
    const state = strip(fd.state);
    const zip = strip(fd.zip);

    const addressLine = address2 ? `${address}, ${address2}` : address;
    const cityStateZip = [city, state, zip].filter(Boolean).join(", ");

    // Sections
    const summaryIn = strip(fd.summary) || strip(fd.experience);
    const jobDescription = strip(fd.job_description);
    const skills = Array.isArray(fd.skills)
      ? fd.skills.map((s) => strip(s)).filter(Boolean)
      : [];
    const certifications = Array.isArray(fd.certifications)
      ? fd.certifications.map((c) => strip(c)).filter(Boolean)
      : [];
    const hobbies = Array.isArray(fd.hobbies)
      ? fd.hobbies.map((h) => strip(h)).filter(Boolean)
      : [];

    const education = Array.isArray(fd.education)
      ? fd.education.filter((e) => e && Object.values(e).some((v) => strip(v)))
      : [];
    const experienceList = Array.isArray(fd.experienceList)
      ? fd.experienceList.filter(
          (e) => e && Object.values(e).some((v) => strip(v))
        )
      : [];

    // Sort newest first
    const toYear = (v) =>
      Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0;
    education.sort(
      (a, b) =>
        toYear(b.graduationYear || b.gradYear) -
        toYear(a.graduationYear || a.gradYear)
    );
    experienceList.sort(
      (a, b) => toYear(b.end || b.start) - toYear(a.end || a.start)
    );

    // ====== Build seed lines (Education) ======
    const eduLines = [];
    for (const e of education) {
      let line = `${strip(e.degree) || ""} in ${strip(e.major) || ""}`.trim();
      if (e.school) line += ` — ${strip(e.school)}`;
      const gradMonth = strip(e.graduationMonth || e.gradMonth || e.month);
      const gradYearRaw = strip(
        e.graduationYear || e.gradYear || e.year || e.y
      );
      const gradYear = normalizeYear4(gradYearRaw);

      let gradStr =
        gradMonth && gradYear
          ? `${gradMonth}, ${gradYear}`
          : [gradMonth, gradYear].filter(Boolean).join(" ");
      const nowYear = new Date().getFullYear();
      if (gradYear && parseInt(gradYear, 10) >= nowYear)
        gradStr = `Anticipated Graduation: ${gradStr}`;
      if (gradStr) line += `, ${gradStr}`;
      eduLines.push(line);
    }

    const eduLinesFormal = await safeFormalizeList(
      eduLines,
      { user_city: fd.city, user_state: fd.state, type: "education" },
      openai
    );

    // ====== Build seed lines (Experience headers) ======
    const expHeaders = [];
    const expMeta = [];
    const formattedDates = [];

    for (const e of experienceList) {
      let line = `${strip(e.position)} at ${strip(e.company)}`.trim();
      if (e.location) line += ` — ${strip(e.location)}`;
      if (e.start || e.end) {
        const dateStrRaw = `${strip(e.start)} – ${strip(e.end) || "Present"}`;
        const dateStr = addCommaMonthYear(dateStrRaw);
        line += ` (${dateStr})`;
        formattedDates.push(dateStr);
      }
      expHeaders.push(line);
      expMeta.push(e);
    }

    const expHeadersFormal = await safeFormalizeList(
      expHeaders,
      { user_city: fd.city, user_state: fd.state, type: "experience" },
      openai
    );

    const expBlocks = [];
    const bulletList = [];
    for (let i = 0; i < expMeta.length; i++) {
      const e = expMeta[i];
      const header = expHeadersFormal[i] || expHeaders[i];
      const headerHtml = `<strong>${escHtml(header)}</strong>`;
      const bulletsArr = Array.isArray(e.bullets)
        ? e.bullets.map((b) => strip(b)).filter(Boolean)
        : [];
      bulletsArr.forEach((b) => bulletList.push(b));
      expBlocks.push({ headerHtml, bullets: bulletsArr, raw: e });
    }

    // ====== Skills / Certifications / Hobbies / Summary ======
    const skillsFormal = await safeFormalizeList(
      skills,
      { user_city: fd.city, user_state: fd.state, type: "skills" },
      openai
    );
    const certsFormal = await safeFormalizeList(
      certifications,
      { user_city: fd.city, user_state: fd.state, type: "certifications" },
      openai
    );
    const hobbiesFormal = await safeFormalizeList(
      hobbies,
      { user_city: fd.city, user_state: fd.state, type: "hobbies" },
      openai
    );

    let summaryOut = summaryIn;
    if (summaryIn) {
      try {
        const arr = await safeFormalizeList(
          [summaryIn],
          { user_city: fd.city, user_state: fd.state, type: "summary" },
          openai
        );
        if (Array.isArray(arr) && arr[0]) summaryOut = arr[0];
      } catch (e) {
        console.warn("Summary polish skipped:", e.message);
      }
    }

    /* ------------------------------ FALLBACK ------------------------------ */
    if (!openai) {
      const parts = [];
      if (summaryOut)
        parts.push("<strong>SUMMARY</strong>", `<p>${escHtml(summaryOut)}</p>`);
      if (eduLinesFormal.length)
        parts.push(
          "<strong>EDUCATION</strong>",
          "<ul>" +
            eduLinesFormal.map((l) => `<li>${escHtml(l)}</li>`).join("") +
            "</ul>"
        );
      if (expBlocks.length) {
        parts.push("<strong>WORK EXPERIENCE</strong>");
        for (const block of expBlocks) {
          parts.push(block.headerHtml);
          if (block.bullets.length)
            parts.push(
              "<ul>" +
                block.bullets.map((b) => `<li>${escHtml(b)}</li>`).join("") +
                "</ul>"
            );
        }
      }
      if (skillsFormal.length)
        parts.push(
          "<strong>SKILLS</strong>",
          "<ul>" +
            skillsFormal.map((s) => `<li>${escHtml(s)}</li>`).join("") +
            "</ul>"
        );
      if (certsFormal.length)
        parts.push(
          "<strong>CERTIFICATIONS</strong>",
          "<ul>" +
            certsFormal.map((c) => `<li>${escHtml(c)}</li>`).join("") +
            "</ul>"
        );
      if (hobbiesFormal.length)
        parts.push(
          "<strong>HOBBIES</strong>",
          "<ul>" +
            hobbiesFormal.map((h) => `<li>${escHtml(h)}</li>`).join("") +
            "</ul>"
        );

      const bodyHtml = parts.join("\n");
      const contactHtml = buildResumeContact({
        fullName,
        addressLine,
        cityStateZip,
        phone,
        email,
      });

      const templated = renderResumeWithTemplate({
        fullName,
        addressLine,
        city,
        state,
        zip,
        phone,
        email,
        summary: summaryOut,
        sectionsHtml: {
          educationList: eduLinesFormal
            .map((l) => `<li>${escHtml(l)}</li>`)
            .join(""),
          skillsList: skillsFormal
            .map((s) => `<li>${escHtml(s)}</li>`)
            .join(""),
          certsList: certsFormal.map((c) => `<li>${escHtml(c)}</li>`).join(""),
          experience: expBlocks
            .map(
              (b) =>
                `<div style="margin:0 0 10px 0;">${b.headerHtml}${
                  b.bullets.length
                    ? `<ul>${b.bullets
                        .map((x) => `<li>${escHtml(x)}</li>`)
                        .join("")}</ul>`
                    : ""
                }</div>`
            )
            .join(""),
          hobbiesList: hobbiesFormal
            .map((h) => `<li>${escHtml(h)}</li>`)
            .join(""),
        },
      });

      const exportHtml =
        templated || formatResumeHtmlPlain(contactHtml, bodyHtml);
      const fullHtml = templated || formatResumeHtml(contactHtml, bodyHtml);

      const atsScore = calculateAtsScore(
        bulletList,
        {
          skills: !!skillsFormal.length,
          certifications: !!certsFormal.length,
          education: !!education.length,
          experience: !!experienceList.length,
          summary: !!summaryOut,
          hobbies: !!hobbiesFormal.length,
        },
        formattedDates
      );

      return res.json({
        output: fullHtml,
        html: exportHtml,
        plain_text: "",
        ats_score: atsScore,
        error: null,
      });
    }
    /* ---------------------------- /FALLBACK ------------------------------- */

    // Decide mode
    const hasAnyBullets = expBlocks.some((b) => b.bullets.length > 0);
    const shouldGenerate =
      mode === "generate" || (mode === "auto" && !hasAnyBullets && !summaryIn);

    if (shouldGenerate) {
      // ------------------------ GENERATE MODE ------------------------
      const messages = buildResumeMessages(fd, { maxBulletsPerRole: 4 });
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.2,
      });
      const obj = parseResumeJson(r.choices?.[0]?.message?.content || "") || {};

      const eduOutRaw = Array.isArray(obj.education)
        ? obj.education.map(String).filter(Boolean)
        : eduLinesFormal;
      const eduOut = await safeFormalizeList(
        eduOutRaw,
        { user_city: fd.city, user_state: fd.state, type: "education" },
        openai
      );

      const skillsOutRaw = Array.isArray(obj.skills)
        ? obj.skills.map(String).filter(Boolean)
        : skillsFormal;
      const skillsOut = await safeFormalizeList(
        skillsOutRaw,
        { user_city: fd.city, user_state: fd.state, type: "skills" },
        openai
      );

      const certsOutRaw = Array.isArray(obj.certifications)
        ? obj.certifications.map(String).filter(Boolean)
        : certsFormal;
      const certsOut = await safeFormalizeList(
        certsOutRaw,
        { user_city: fd.city, user_state: fd.state, type: "certifications" },
        openai
      );

      const expOutRaw = Array.isArray(obj.experience) ? obj.experience : [];
      const expHeadersAi = expOutRaw.map((row) =>
        String(row.header || "").trim()
      );
      const expHeadersAiFormal = await safeFormalizeList(
        expHeadersAi,
        { user_city: fd.city, user_state: fd.state, type: "experience" },
        openai
      );

      const hobbiesOut = await safeFormalizeList(
        hobbies,
        { user_city: fd.city, user_state: fd.state, type: "hobbies" },
        openai
      );

      const parts = [];

      const summaryGen = String(obj.summary || summaryOut || "").trim();
      let summaryGenOut = summaryGen;
      if (summaryGen) {
        try {
          const arr = await safeFormalizeList(
            [summaryGen],
            { user_city: fd.city, user_state: fd.state, type: "summary" },
            openai
          );
          if (arr[0]) summaryGenOut = arr[0];
        } catch {}
      }
      if (summaryGenOut) {
        parts.push(
          "<strong>SUMMARY</strong>",
          `<p>${escHtml(summaryGenOut)}</p>`
        );
      }

      if (eduOut.length) {
        parts.push(
          "<strong>EDUCATION</strong>",
          "<ul>" +
            eduOut.map((l) => `<li>${escHtml(l)}</li>`).join("") +
            "</ul>"
        );
      }

      const expAtsBullets = [];
      if (expOutRaw.length) {
        parts.push("<strong>WORK EXPERIENCE</strong>");
        for (let i = 0; i < expOutRaw.length; i++) {
          const header = escHtml(
            expHeadersAiFormal[i] || expHeadersAi[i] || ""
          );
          const bulletsArr = Array.isArray(expOutRaw[i].bullets)
            ? expOutRaw[i].bullets
                .map((b) => String(b || "").trim())
                .filter(Boolean)
            : [];
          if (header) parts.push(`<strong>${header}</strong>`);
          if (bulletsArr.length) {
            expAtsBullets.push(...bulletsArr);
            parts.push(
              "<ul>" +
                bulletsArr.map((b) => `<li>${escHtml(b)}</li>`).join("") +
                "</ul>"
            );
          }
        }
      } else if (expBlocks.length) {
        parts.push("<strong>WORK EXPERIENCE</strong>");
        for (const block of expBlocks) {
          parts.push(block.headerHtml);
          if (block.bullets.length)
            parts.push(
              "<ul>" +
                block.bullets.map((b) => `<li>${escHtml(b)}</li>`).join("") +
                "</ul>"
            );
        }
      }

      if (skillsOut.length)
        parts.push(
          "<strong>SKILLS</strong>",
          "<ul>" +
            skillsOut.map((s) => `<li>${escHtml(s)}</li>`).join("") +
            "</ul>"
        );

      if (certsOut.length)
        parts.push(
          "<strong>CERTIFICATIONS</strong>",
          "<ul>" +
            certsOut.map((c) => `<li>${escHtml(c)}</li>`).join("") +
            "</ul>"
        );

      if (hobbiesOut.length)
        parts.push(
          "<strong>HOBBIES</strong>",
          "<ul>" +
            hobbiesOut.map((h) => `<li>${escHtml(h)}</li>`).join("") +
            "</ul>"
        );

      const bodyHtml = parts.join("\n");
      const contactHtml = buildResumeContact({
        fullName,
        addressLine,
        cityStateZip,
        phone,
        email,
      });

      const templated = renderResumeWithTemplate({
        fullName,
        addressLine,
        city,
        state,
        zip,
        phone,
        email,
        summary: summaryGenOut,
        sectionsHtml: {
          educationList: (eduOut || [])
            .map((l) => `<li>${escHtml(l)}</li>`)
            .join(""),
          skillsList: (skillsOut || [])
            .map((s) => `<li>${escHtml(s)}</li>`)
            .join(""),
          certsList: (certsOut || [])
            .map((c) => `<li>${escHtml(c)}</li>`)
            .join(""),
          experience: expOutRaw.length
            ? expOutRaw
                .map((row, idx) => {
                  const header = escHtml(
                    String(expHeadersAiFormal[idx] || "").trim()
                  );
                  const blts = (row.bullets || [])
                    .map((b) => `<li>${escHtml(String(b || "").trim())}</li>`)
                    .join("");
                  return `<div style="margin:0 0 10px 0;">${
                    header
                      ? `<div style="font-weight:700; font-size:14px;">${header}</div>`
                      : ""
                  }${blts ? `<ul>${blts}</ul>` : ""}</div>`;
                })
                .join("")
            : expBlocks
                .map(
                  (b) =>
                    `<div style="margin:0 0 10px 0;">${b.headerHtml}${
                      b.bullets.length
                        ? `<ul>${b.bullets
                            .map((x) => `<li>${escHtml(x)}</li>`)
                            .join("")}</ul>`
                        : ""
                    }</div>`
                )
                .join(""),
          hobbiesList: (hobbiesOut || [])
            .map((h) => `<li>${escHtml(h)}</li>`)
            .join(""),
        },
      });

      const exportHtml =
        templated || formatResumeHtmlPlain(contactHtml, bodyHtml);
      const fullHtml = templated || formatResumeHtml(contactHtml, bodyHtml);

      const atsScore = calculateAtsScore(
        expAtsBullets.length ? expAtsBullets : bulletList,
        {
          skills: !!(skillsOut && skillsOut.length),
          certifications: !!(certsOut && certsOut.length),
          education: !!(eduOut && eduOut.length),
          experience:
            !!(expOutRaw && expOutRaw.length) || !!experienceList.length,
          summary: !!summaryGenOut,
          hobbies: !!(hobbiesOut && hobbiesOut.length),
        },
        formattedDates
      );

      return res.json({
        output: fullHtml,
        html: exportHtml,
        plain_text: "",
        ats_score: atsScore,
        error: null,
      });
    }

    // ------------------------ REWRITE MODE ------------------------
    let summaryOutRewrite = summaryOut;
    if (summaryOutRewrite && openai) {
      const msgs = buildRewriteMessages(summaryOutRewrite, []);
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: msgs,
        temperature: 0.2,
      });
      const parsed = parseRewriteResponse(
        r.choices?.[0]?.message?.content || ""
      );
      if (parsed?.summary) summaryOutRewrite = String(parsed.summary);
      try {
        const arr = await safeFormalizeList(
          [summaryOutRewrite],
          { user_city: fd.city, user_state: fd.state, type: "summary" },
          openai
        );
        if (arr[0]) summaryOutRewrite = arr[0];
      } catch {}
    }

    const expBlocksOut = [];
    const rewrittenBullets = [];
    for (const block of expBlocks) {
      const { headerHtml, bullets: bulletsArr } = block;
      if (!bulletsArr.length) {
        expBlocksOut.push({ headerHtml, bullets: [] });
        continue;
      }
      const msgs = buildRewriteMessages("", bulletsArr);
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: msgs,
        temperature: 0.2,
      });
      const parsed =
        parseRewriteResponse(r.choices?.[0]?.message?.content || "") || {};
      const outArr =
        Array.isArray(parsed.bullets) &&
        parsed.bullets.length === bulletsArr.length
          ? parsed.bullets
          : bulletsArr;

      const safeBullets = outArr.map((cand, i) => {
        const orig = bulletsArr[i];
        const newText = String(cand || "");
        const allowed = new Set(numberTokens(orig).map(normalizeNum));
        const cleaned = newText.replace(/\d[\d,]*\.?\d*(?:%|k|K|M|m)?/g, (m) =>
          allowed.has(normalizeNum(m)) ? m : ""
        );
        return cleaned.trim() || orig;
      });

      safeBullets.forEach((b) => rewrittenBullets.push(b));
      expBlocksOut.push({ headerHtml, bullets: safeBullets });
    }

    const parts = [];
    if (summaryOutRewrite)
      parts.push(
        "<strong>SUMMARY</strong>",
        `<p>${escHtml(summaryOutRewrite)}</p>`
      );
    if (eduLinesFormal.length)
      parts.push(
        "<strong>EDUCATION</strong>",
        "<ul>" +
          eduLinesFormal.map((l) => `<li>${escHtml(l)}</li>`).join("") +
          "</ul>"
      );
    if (expBlocksOut.length) {
      parts.push("<strong>WORK EXPERIENCE</strong>");
      for (const block of expBlocksOut) {
        parts.push(block.headerHtml);
        if (block.bullets.length)
          parts.push(
            "<ul>" +
              block.bullets.map((b) => `<li>${escHtml(b)}</li>`).join("") +
              "</ul>"
          );
      }
    }
    if (skillsFormal.length)
      parts.push(
        "<strong>SKILLS</strong>",
        "<ul>" +
          skillsFormal.map((s) => `<li>${escHtml(s)}</li>`).join("") +
          "</ul>"
      );
    if (certsFormal.length)
      parts.push(
        "<strong>CERTIFICATIONS</strong>",
        "<ul>" +
          certsFormal.map((c) => `<li>${escHtml(c)}</li>`).join("") +
          "</ul>"
      );
    if (hobbiesFormal.length)
      parts.push(
        "<strong>HOBBIES</strong>",
        "<ul>" +
          hobbiesFormal.map((h) => `<li>${escHtml(h)}</li>`).join("") +
          "</ul>"
      );

    const bodyHtml = parts.join("\n");
    const contactHtml = buildResumeContact({
      fullName,
      addressLine,
      cityStateZip,
      phone,
      email,
    });

    const templated = renderResumeWithTemplate({
      fullName,
      addressLine,
      city,
      state,
      zip,
      phone,
      email,
      summary: summaryOutRewrite,
      sectionsHtml: {
        educationList: eduLinesFormal
          .map((l) => `<li>${escHtml(l)}</li>`)
          .join(""),
        skillsList: skillsFormal.map((s) => `<li>${escHtml(s)}</li>`).join(""),
        certsList: certsFormal.map((c) => `<li>${escHtml(c)}</li>`).join(""),
        experience: expBlocksOut
          .map(
            (b) =>
              `<div style="margin:0 0 10px 0;">${b.headerHtml}${
                b.bullets.length
                  ? `<ul>${b.bullets
                      .map((x) => `<li>${escHtml(x)}</li>`)
                      .join("")}</ul>`
                  : ""
              }</div>`
          )
          .join(""),
        hobbiesList: hobbiesFormal
          .map((h) => `<li>${escHtml(h)}</li>`)
          .join(""),
      },
    });

    const exportHtml =
      templated || formatResumeHtmlPlain(contactHtml, bodyHtml);
    const fullHtml = templated || formatResumeHtml(contactHtml, bodyHtml);

    const atsScore = calculateAtsScore(
      rewrittenBullets.length ? rewrittenBullets : bulletList,
      {
        skills: !!skillsFormal.length,
        certifications: !!education.length, // minor nudge: your original had certifications here
        education: !!education.length,
        experience: !!experienceList.length,
        summary: !!summaryOutRewrite,
        hobbies: !!hobbiesFormal.length,
      },
      formattedDates
    );

    return res.json({
      output: fullHtml,
      html: exportHtml,
      plain_text: [
        summaryOutRewrite,
        ...(rewrittenBullets.length ? rewrittenBullets : bulletList),
      ]
        .join("\n")
        .trim(),
      ats_score: atsScore,
      error: null,
    });
  } catch (err) {
    console.error("Resume error:", err);
    return res
      .status(500)
      .json({ output: "", error: "Resume generation failed" });
  }
}

/* --------------------------------- Start -------------------------------- */
// const PORT = Number(process.env.PORT || 8000);
// app.listen(PORT, "127.0.0.1", () => {
//   console.log(`Backend running on http://127.0.0.1:${PORT}`);
//   if (resumeTpl) console.log("Resume template: enabled");
//   if (coverTpl) console.log("Cover template: enabled");
// });
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0"; // <-- important for Render

app.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
  if (resumeTpl) console.log("Resume template: enabled");
  if (coverTpl) console.log("Cover template: enabled");
});

// ---- Template renderer for resume.html ----
function renderResumeWithTemplate({
  fullName,
  addressLine,
  city,
  state,
  zip,
  phone,
  email,
  summary,
  sectionsHtml,
}) {
  if (DEV && resumeTpl && fs.existsSync(RESUME_TEMPLATE_PATH)) {
    try {
      resumeTpl = fs.readFileSync(RESUME_TEMPLATE_PATH, "utf8");
    } catch {}
  }
  if (!resumeTpl) return null;

  const model = {
    fullName: escHtml(fullName || ""),
    address1: escHtml((addressLine || "").replace(/\s*,\s*$/g, "")),
    city: escHtml((city || "").replace(/\s*,\s*$/g, "")),
    state: escHtml((state || "").replace(/\s*,\s*$/g, "")),
    zip: escHtml((zip || "").replace(/\s*,\s*$/g, "")),
    phone: escHtml(phone || ""),
    email: escHtml(email || ""),
    summary: escHtml(summary || ""),
    // Section fragments (already HTML – do NOT escape)
    experienceBlocks: sectionsHtml.experience || "",
    educationList: sectionsHtml.educationList || "",
    skillsList: sectionsHtml.skillsList || "",
    certsList: sectionsHtml.certsList || "",
    hobbiesList: sectionsHtml.hobbiesList || "",
  };

  return renderPlaceholders(resumeTpl, model);
}

// ---- Template renderer for cover.html ----
function renderCoverWithTemplate({
  fullName,
  addressLine,
  cityStateZip,
  phone,
  email,
  bodyHtml,
}) {
  if (DEV && coverTpl && fs.existsSync(COVER_TEMPLATE_PATH)) {
    try {
      coverTpl = fs.readFileSync(COVER_TEMPLATE_PATH, "utf8");
    } catch {}
  }
  if (!coverTpl) return null;

  const model = {
    fullName: escHtml(fullName || ""),
    address1: escHtml((addressLine || "").replace(/\s*,\s*$/g, "")),
    cityStateZip: escHtml((cityStateZip || "").replace(/\s*,\s*$/g, "")),
    phone: escHtml(phone || ""),
    email: escHtml(email || ""),
    // Already-HTML body
    bodyHtml: bodyHtml || "",
  };

  return renderPlaceholders(coverTpl, model);
}
