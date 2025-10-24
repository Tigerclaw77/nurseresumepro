// lib/aiFormalize.js
import OpenAI from "openai";

/**
 * General-purpose AI formalizer for resume data.
 * Expands abbreviated or shorthand lines using AI contextually.
 * Supports type = "education", "experience", "skills", "certifications", "hobbies", "summary", etc.
 */
export async function aiFormalizeList(
  items = [],
  { user_city = "", user_state = "", type = "generic" } = {},
  openai
) {
  console.log("aiFormalizeList invoked with:", {
    count: items.length,
    hasAI: !!openai,
    type,
  });

  const cleaned = (items || []).map((s) => String(s).trim()).filter(Boolean);
  if (!cleaned.length) return [];

  // Minimal deterministic cleanup in case AI is unavailable
  const locallyCleaned = cleaned.map(localCleanup);

  if (openai) {
    try {
      const system = buildSystemPrompt(type);

      const user = {
        items: locallyCleaned,
        user_city,
        user_state,
        type,
      };

      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
      });

      // Safer parse: never let odd model output crash the server
      const raw = (r.choices?.[0]?.message?.content || "")
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();

      let arr = null;
      try {
        arr = JSON.parse(raw);
      } catch (e) {
        console.warn(
          "aiFormalizeList JSON parse error:",
          e?.message || e,
          "\n--- RAW ---\n",
          raw
        );
      }

      if (Array.isArray(arr) && arr.length === cleaned.length) {
        return postProcessLines(arr, type);
      } else {
        console.warn(
          "aiFormalizeList: falling back (shape mismatch). expected:",
          cleaned.length,
          "got:",
          Array.isArray(arr) ? arr.length : typeof arr
        );
      }
    } catch (err) {
      console.warn("AI formalizer fallback:", err?.message || err);
    }
  }

  // Fallback: minimally cleaned + light post-processing
  // Small extra: title-case hobbies/skills *only if AI unavailable* (no vocab lists)
  const base = postProcessLines(locallyCleaned, type);
  if (type === "hobbies" || type === "skills") {
    return base.map(toTitleCaseLite);
  }
  return base;
}

/* -------------------------------------------------------------------------- */
/**
 * Style-guide driven system prompt (ATS-friendly).
 * Keeps ubiquitous acronyms primary; avoids degree tautologies; uses en dashes.
 * Avoids guessing ambiguous location abbreviations.
 */
function buildSystemPrompt(type = "generic") {
  const STYLE_GUIDE = `
You are an ATS-oriented resume normalizer. Rewrite each input item for clarity and consistency WITHOUT inventing facts.
Return ONLY a JSON array of strings, same length and order as input. No commentary, no code fences.

Global Rules:
1) Degrees: expand common degree abbreviations to their canonical long form ONCE per item, and avoid tautologies.
   - Examples:
     • "OD" → "Doctor of Optometry" (NOT "Doctor of Optometry in Optometry")
     • "BS, Microbiology" → "Bachelor of Science — Microbiology"
     • If both a degree and a field are present, join with an en dash "—" (not "in"): "Doctor of Medicine — Cardiology".
   - If the degree already contains the field, do NOT repeat the field.

2) Ubiquitous acronyms: KEEP the acronym primary for universally recognized items; long form optional in parentheses.
   - Examples: CPR, BLS, ACLS, PALS, HIPAA, OSHA, PMP, CISSP, CompTIA A+/Network+/Security+, AWS exam codes (e.g., SAA-C03).

3) Institutions: expand school names to their proper full names when unambiguous.

4) Experience headers: produce a clean, human-readable line. If dates/locations exist, preserve them and use an en dash (–) for ranges.

5) Bullets/Skills: action-led where applicable; concise; never first-person; do NOT fabricate numbers; keep existing numerals.

6) Casing & punctuation: sentence case for bullets; no trailing periods on short bullets; standard ASCII except en dashes as noted.

7) Never output duplicates like "Doctor of Optometry in Optometry".

8) Ambiguous abbreviations: do NOT guess expansions for location or org abbreviations unless context makes it obvious. Keep as-is if uncertain.
`;

  const TYPE_HINTS = {
    education: `
For EDUCATION items:
- Expand degrees (BS→Bachelor of Science, MS→Master of Science, OD→Doctor of Optometry, MD→Doctor of Medicine).
- Expand majors (Micro→Microbiology) when clear.
- If degree and field both appear, join with " — " and avoid repeating the embedded field.
- Expand institution names when unambiguous.
`,
    experience: `
For EXPERIENCE items:
- Expand job titles (Mgr→Manager; Sr→Senior; Eng→Engineer) and departments when helpful.
- Preserve existing dates/locations; use "–" for ranges if shown.
`,
    skills: `
For SKILLS items:
- Standardize names; concise noun phrases (Title Case when appropriate).
- Expand obvious shorthand when unambiguous; do not add proficiency or invent details.
- Keep well-known acronyms as-is (AWS, CI/CD, SQL, HTML, CSS).
Examples:
  "js" → "JavaScript"
  "excel" → "Microsoft Excel"
  "photoshop" → "Adobe Photoshop"
  "jp" → "Japanese"
`,
    certifications: `
For CERTIFICATIONS items:
- KEEP ubiquitous cert acronyms primary (PMP, CISSP, CPR, BLS, etc.); long form optional in parentheses.
- Do not expand to long-form-only if the acronym is widely recognized.
`,
    hobbies: `
For HOBBIES items:
- Normalize to a clean noun phrase in Title Case.
- Expand common shorthand when unambiguous (do not invent details).
- Keep each item short (1–4 words), no first-person.
Examples:
  "sax" → "Saxophone"
  "gtr" → "Guitar"
  "mtb" → "Mountain Biking"
  "bjj" → "Brazilian Jiu-Jitsu"
  "3d print" → "3D Printing"
  "pc build" → "PC Building"
  "road cycling" → "Road Cycling"
`,
    summary: `
For SUMMARY items:
- 1–3 concise sentences, third-person implied (no "I"), role-aligned, no fluff, no invented metrics.
- Keep nouns and proper names correctly capitalized; no emojis or special symbols.
`,
    generic: `
For generic items:
- Apply the global rules; improve clarity and consistency without inventing new content.
`,
  };

  const hint = TYPE_HINTS[type] || TYPE_HINTS.generic;
  return `${STYLE_GUIDE}\n${hint}\nReturn a JSON array of strings only.`;
}

/* -------------------------------------------------------------------------- */
/**
 * Local minimal cleanup fallback (AI unavailable).
 * A light touch; we do NOT expand well-known acronyms here.
 */
function localCleanup(s = "") {
  return String(s)
    .replace(/\bBS\b/g, "B.S.")
    .replace(/\bBA\b/g, "B.A.")
    .replace(/\bMS\b/g, "M.S.")
    .replace(/\bMA\b/g, "M.A.")
    .replace(/\bPhD\b/gi, "Ph.D.")
    .replace(/\bMicro\b/g, "Microbiology")
    .replace(/\bBio\b/g, "Biology")
    .replace(/\bCS\b/g, "Computer Science")
    .replace(/\bIT\b/g, "Information Technology")
    .replace(/\bMgr\b/g, "Manager")
    .replace(/\bSr\b/g, "Senior")
    .trim();
}

/* -------------------------------------------------------------------------- */
/** Month YYYY -> Month, YYYY anywhere in a string (case-insensitive). */
function commafyMonthYear(s = "") {
  const months =
    "(January|February|March|April|May|June|July|August|September|October|November|December|" +
    "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";
  const re = new RegExp(`\\b${months}\\s+(\\d{4})\\b`, "gi");
  return String(s).replace(re, (_, m, y) => `${m}, ${y}`);
}

/** Minimal Title Case used only for fallback on hobbies/skills when AI is unavailable. */
function toTitleCaseLite(s = "") {
  return String(s).replace(/\b([a-z])([a-z'0-9]*)\b/gi, (_, a, b) => a.toUpperCase() + b.toLowerCase());
}

/* -------------------------------------------------------------------------- */
/**
 * Post-processing:
 * 1) Kill degree tautologies: "Doctor of X in X" → "Doctor of X".
 * 2) Convert "Degree in Field" → "Degree — Field".
 * 3) Add commas to Month Year → Month, Year (education/experience headers, etc.).
 */
function postProcessLines(arr = [], type = "generic") {
  if (!Array.isArray(arr) || !arr.length) return arr;

  return arr.map((line) => {
    let out = String(line || "").trim();

    if (type === "education") {
      out = out
        .replace(/Doctor of ([A-Za-z][A-Za-z ]*?)\s+in\s+\1\b/i, "Doctor of $1")
        .replace(/Bachelor of ([A-Za-z][A-Za-z ]*?)\s+in\s+\1\b/i, "Bachelor of $1")
        .replace(/Master of ([A-Za-z][A-Za-z ]*?)\s+in\s+\1\b/i, "Master of $1")
        .replace(
          /\b(Doctor|Bachelor|Master) of [A-Za-z][A-Za-z ]*\s+in\s+([A-Za-z][A-Za-z ]+)\b/i,
          (m) => m.replace(/\s+in\s+/i, " — ")
        );
    }

    // Month YYYY -> Month, YYYY anywhere
    out = commafyMonthYear(out);

    return out;
  });
}
