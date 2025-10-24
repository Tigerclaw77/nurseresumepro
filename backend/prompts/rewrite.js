// backend/prompts/rewrite.js (ESM)
const clean = (v) => String(v ?? "").trim();

// Build messages to tighten a summary or a list of bullets without inventing facts.
// - Preserve numbers, dates, and counts.
// - Keep the number of bullets identical.
export function buildRewriteMessages(summary = "", bullets = []) {
  const hasSummary = !!clean(summary);
  const hasBullets = Array.isArray(bullets) && bullets.length > 0;

  const rules = [
    "Do not invent facts, companies, titles, dates, or numbers.",
    "Preserve ALL existing numbers, units, and date ranges exactly.",
    "Bullets: keep the same count; begin with strong action verbs; concise, results-oriented.",
    "Tone: professional and specific; no fluff; no first-person pronouns.",
    "Output JSON only; no Markdown, no code fences, no HTML.",
  ].join("\n- ");

  const payload = {
    summary: hasSummary ? clean(summary) : "",
    bullets: hasBullets ? bullets.map((b) => clean(b)) : [],
  };

  return [
    {
      role: "system",
      content:
        "You edit resume content conservatively. Tighten phrasing but never fabricate.",
    },
    {
      role: "user",
      content: [
        "Rewrite the provided content under these rules:",
        `- ${rules}`,
        "Return JSON with these keys:",
        `{
  "summary": "string (optional; omit or empty if no summary provided)",
  "bullets": ["string", "..."]  // same length as input if bullets were provided
}`,
        "Content to rewrite:",
        JSON.stringify(payload, null, 2),
      ].join("\n\n"),
    },
  ];
}

export function parseRewriteResponse(raw = "") {
  const text = String(raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // Try parse whole string
  try {
    const obj = JSON.parse(text);
    return normalizeRewriteObject(obj);
  } catch {}

  // Try parse first {...}
  const i = text.indexOf("{");
  const j = text.lastIndexOf("}");
  if (i !== -1 && j !== -1 && j > i) {
    try {
      const obj = JSON.parse(text.slice(i, j + 1));
      return normalizeRewriteObject(obj);
    } catch {}
  }

  // Fallback: return empty/identity
  return { summary: "", bullets: [] };
}

function normalizeRewriteObject(obj) {
  const summary =
    typeof obj.summary === "string" ? obj.summary.trim() : "";
  const bullets = Array.isArray(obj.bullets)
    ? obj.bullets.map((b) => String(b || "").trim())
    : [];
  return { summary, bullets };
}

export default {
  buildRewriteMessages,
  parseRewriteResponse,
};
