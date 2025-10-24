// backend/prompts/cover.js (ESM)
const s = (v) => String(v ?? "").trim();

function only(v) {
  return s(v) || "";
}

// Build messages for a JSON-only cover-letter body.
// We will add the contact/letterhead and salutation/signoff in server.js.
export function buildCoverMessages(fd = {}, { signoff = "Sincerely" } = {}) {
  const first = only(fd.firstName);
  const last = only(fd.lastName);
  const fullName = [first, last].filter(Boolean).join(" ");

  const role = only(fd.job_title);
  const company = only(fd.companyName);

  // Only include company location if explicitly provided
  const companyCity = only(fd.company_city);
  const companyState = only(fd.company_state);
  const companyLocation =
    [companyCity, companyState].filter(Boolean).join(", ");

  const yourHighlights = only(fd.summary);
  const jobDescription = only(fd.job_description);

  // Recipient is handled by the server (we always enforce our salutation),
  // but we still give it to the model for context.
  const recipient =
    only(fd.recipient) ||
    only(fd.recipientName) ||
    only(fd.hiringManager) ||
    only(fd.contactName);

  const constraints = [
    "Return STRICT JSON with keys: opening (string), body (array of 2–3 strings), closing (string).",
    "NO Markdown, NO code fences, NO HTML tags.",
    "Use ONLY the information provided; do NOT invent locations, titles, companies, metrics, or names.",
    "Mention the company name exactly as provided, if any.",
    "Do not include a salutation like “Dear …,” (server will inject it).",
    `Do not include a sign-off like “${signoff}” or the candidate’s name (server will inject it).`,
    "Tone: professional, concise, tailored.",
    "Target length: ~220–350 words total.",
    "If you need location phrasing (e.g., “in …”), only use it when company_city or company_state is provided; never infer from the candidate’s home address.",
  ].join("\n- ");

  const data = {
    candidate_name: fullName,
    target_role: role,
    company,
    company_location: companyLocation, // may be empty
    recipient, // may be empty
    candidate_highlights: yourHighlights,
    job_description: jobDescription,
  };

  return [
    {
      role: "system",
      content:
        "You are a precise cover-letter writing assistant. Follow instructions exactly and avoid fabrication.",
    },
    {
      role: "user",
      content: [
        "Write a tailored cover-letter BODY (no header, no salutation, no sign-off).",
        `Constraints:\n- ${constraints}`,
        "Input JSON (context):",
        JSON.stringify(data, null, 2),
        "Your output must be a single JSON object with this shape:",
        `{
  "opening": "string - one paragraph that connects the candidate to the role/company without a salutation",
  "body": ["string", "string", "string"],  // 2–3 body paragraphs
  "closing": "string - short wrap-up call-to-action, no sign-off"
}`,
      ].join("\n\n"),
    },
  ];
}

// Be forgiving about the model returning JSON with/without fences, or with extra text.
export function parseCoverJson(raw = "") {
  const text = String(raw || "");

  // 1) strip code fences if any
  const unfenced = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // 2) try direct parse
  try {
    const obj = JSON.parse(unfenced);
    return normalizeCoverObject(obj);
  } catch {}

  // 3) find first {...} block
  const i = unfenced.indexOf("{");
  const j = unfenced.lastIndexOf("}");
  if (i !== -1 && j !== -1 && j > i) {
    const candidate = unfenced.slice(i, j + 1);
    try {
      const obj = JSON.parse(candidate);
      return normalizeCoverObject(obj);
    } catch {}
  }

  // 4) fallback: split paragraphs from plain text
  const parts = unfenced
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    opening: parts[0] || "",
    body: parts.slice(1, Math.min(parts.length - 1, 3)),
    closing: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}

function normalizeCoverObject(obj) {
  const opening = typeof obj.opening === "string" ? obj.opening.trim() : "";
  const body =
    Array.isArray(obj.body)
      ? obj.body.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 3)
      : [];
  const closing = typeof obj.closing === "string" ? obj.closing.trim() : "";
  return { opening, body, closing };
}

export default {
  buildCoverMessages,
  parseCoverJson,
};
