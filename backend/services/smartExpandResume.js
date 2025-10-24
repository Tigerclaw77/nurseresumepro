// backend/services/smartExpandResume.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Smart, AI-only expansion for resume items.
 * - No whitelist/blacklist.
 * - Uses model judgements about ubiquity and readability.
 * - Avoids tautologies like "Doctor of Optometry in Optometry".
 * - Keeps ubiquitous acronyms (e.g., CPR) unless clarity requires expansion.
 */
export async function smartExpandResume(rawText) {
  // === 1) STRUCTURE & TYPE EXTRACTION ===========================
  const parse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a resume normalizer. Parse the input into items with a best-guess type. Return JSON only." },
      {
        role: "user",
        content: [
          "Parse this resume content into a list of atomic items.",
          "Each item should have:",
          "- text: the original line or bullet",
          "- section: one of EDUCATION | EXPERIENCE | SKILLS | CERTIFICATIONS | OTHER",
          "- type: one of degree | institution | job_title | date_range | location | responsibility | certification | skill | unknown",
          "- extra: any helpful structured fields you can infer (degree_name, field, org, city, start, end, acronym, etc.)",
          "",
          "Input:\n" + rawText
        ].join("\n")
      }
    ]
  });

  const parsed = JSON.parse(parse.choices?.[0]?.message?.content || "{}");
  const items = Array.isArray(parsed.items) ? parsed.items : [];

  // === 2) CONTEXTUAL EXPANSION DECISIONS ========================
  const expand = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You rewrite resume items for clarity and ATS.",
          "Rules (expressed generally; avoid fixed whitelists):",
          "1) Expand uncommon abbreviations; keep ubiquitous ones as acronyms.",
          "   Ubiquitous means a typical US hiring manager recognizes it instantly in context.",
          "   If uncertain, prefer 'ACRONYM (Long Form)' on first mention in its section.",
          "2) Degrees: normalize to canonical form once. Avoid tautologies like 'Doctor of Optometry in Optometry'.",
          "   Examples:",
          "   - 'O.D.' → 'Doctor of Optometry' (or 'O.D. (Doctor of Optometry)' once).",
          "   - 'MD, Cardiology' → 'Doctor of Medicine — Cardiology'.",
          "3) Certifications: If an acronym is widely recognized in resumes (e.g., CPR, BLS, ACLS, CompTIA A+), keep acronym primary; long form optional in parentheses.",
          "4) Institutions: expand to full proper name (e.g., 'LSU' → 'Louisiana State University').",
          "5) Keep tone concise and natural; prefer en dashes for ranges and em dashes sparingly.",
          "6) Never fabricate facts; if genuinely uncertain, leave as-is but improve punctuation/casing.",
          "Return JSON with fields: items: [{original, section, type, proposal, keep_acronym, reason, confidence}]"
        ].join("\n")
      },
      { role: "user", content: JSON.stringify({ items }, null, 2) }
    ]
  });

  const expanded = JSON.parse(expand.choices?.[0]?.message?.content || "{}");
  const decided = Array.isArray(expanded.items) ? expanded.items : [];

  // === 3) QA / REDUNDANCY SWEEP =================================
  const qa = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are a strict resume QA checker.",
          "Remove tautologies and awkward phrasing.",
          "Fix 'Degree in same-field' redundancies.",
          "Prefer: 'Doctor of Optometry — Nova Southeastern University'.",
          "Ensure ubiquitous acronyms like 'CPR' remain acronyms unless clarity truly requires expansion.",
          "Return JSON with: { rewritten_text: string, notes: string[], audit: [{original, final, notes}] }"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify(
          { original_text: rawText, proposed_items: decided },
          null,
          2
        )
      }
    ]
  });

  const qaOut = JSON.parse(qa.choices?.[0]?.message?.content || "{}");
  return {
    rewrittenText: qaOut.rewritten_text || rawText,
    notes: qaOut.notes || [],
    audit: qaOut.audit || decided
  };
}
