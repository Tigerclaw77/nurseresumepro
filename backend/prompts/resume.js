// backend/prompts/resume.js

// Build JSON-only messages for full resume body generation (no contact info).
// Safe rules: don't invent dates/companies; no fake metrics; neutral bullets
// are allowed only when experience bullets are missing, and must be non-fabricated.

export function buildResumeMessages(fd = {}, { maxBulletsPerRole = 4 } = {}) {
  const strip = (s) => String(s || "").trim();

  const first = strip(fd.firstName);
  const last = strip(fd.lastName);
  const fullName = [first, last].filter(Boolean).join(" ");

  const role = strip(fd.job_title);
  const company = strip(fd.companyName);
  const jobDescription = strip(fd.job_description);

  const summary = strip(fd.summary) || strip(fd.experience);

  const skills = Array.isArray(fd.skills) ? fd.skills.map(strip).filter(Boolean) : [];
  const certifications = Array.isArray(fd.certifications) ? fd.certifications.map(strip).filter(Boolean) : [];
  const hobbies = Array.isArray(fd.hobbies) ? fd.hobbies.map(strip).filter(Boolean) : [];

  const education = Array.isArray(fd.education)
    ? fd.education
        .filter((e) => e && Object.values(e).some((v) => strip(v)))
        .map((e) => ({
          degree: strip(e.degree),
          major: strip(e.major),
          school: strip(e.school),
          graduationMonth: strip(e.graduationMonth),
          graduationYear: strip(e.graduationYear) || strip(e.gradYear),
        }))
    : [];

  const experienceList = Array.isArray(fd.experienceList)
    ? fd.experienceList
        .filter((e) => e && Object.values(e).some((v) => strip(v)))
        .map((e) => ({
          position: strip(e.position),
          company: strip(e.company),
          location: strip(e.location),
          start: strip(e.start),
          end: strip(e.end),
          bullets: Array.isArray(e.bullets) ? e.bullets.map(strip).filter(Boolean) : [],
        }))
    : [];

  const rules = [
    "Return JSON only. No markdown, no code fences, no HTML.",
    "Do not include contact info (name, email, phone, address) in any field.",
    "Do not invent employers, job titles, dates, or numbers that were not provided.",
    "If a number/metric is not provided by the user input, do not add one.",
    "If bullets are missing for a role, you may add up to 2 neutral, responsibility-style bullets with no metrics.",
    `Limit bullets per role to at most ${maxBulletsPerRole}.`,
    "Keep the summary concise (~40–60 words).",
    "If a field is unknown, leave it empty or omit it.",
  ].join(" ");

  const schema = {
    summary: "<string, optional>",
    experience: [
      {
        header: "<string, required; e.g. 'Title at Company — Location (Dates)'>",
        bullets: ["<string bullet>", "..."],
      },
    ],
    skills: ["<string>", "..."],
    certifications: ["<string>", "..."],
    education: ["<string>", "..."], // formatted lines
    hobbies: ["<string>", "..."],
  };

  // Build normalized education lines for the model to refine/format.
  const eduSeed = education.map((e) => {
    const parts = [];
    if (e.degree || e.major) parts.push([e.degree, e.major].filter(Boolean).join(" in ").trim());
    if (e.school) parts.push(e.school);
    const date = [e.graduationMonth, e.graduationYear].filter(Boolean).join(" ");
    if (date) parts.push(date);
    return parts.filter(Boolean).join(" — ");
  });

  // Build normalized experience headers to guide the model for header formatting.
  const exSeed = experienceList.map((e) => {
    const head = [e.position, e.company].filter(Boolean).join(" at ");
    const loc = e.location ? ` — ${e.location}` : "";
    const dates = e.start || e.end ? ` (${[e.start, e.end || "Present"].filter(Boolean).join(" – ")})` : "";
    return `${head}${loc}${dates}`.trim();
  });

  const userPayload = {
    candidate_role: role || "",
    target_company: company || "",
    job_description: jobDescription || "",
    provided_summary: summary || "",
    provided_skills: skills,
    provided_certifications: certifications,
    provided_hobbies: hobbies,
    provided_education_lines: eduSeed,
    provided_experience_headers: exSeed,
    provided_experience_bullets: experienceList.map((e) => e.bullets),
    rules,
    output_schema_example: schema,
  };

  return [
    {
      role: "system",
      content:
        "You are a resume builder. Output strictly JSON in UTF-8, no markdown, no code fences, no HTML. Never fabricate metrics, dates, or employers. If information is missing, leave fields empty or omit them.",
    },
    {
      role: "user",
      content:
        "Using the user payload below, create a concise resume BODY (no contact info) in JSON. " +
        "Respect the rules and the output schema example.\n\n" +
        JSON.stringify(userPayload, null, 2),
    },
  ];
}

export function parseResumeJson(text = "") {
  const s = String(text || "").trim();
  // Try direct JSON
  try {
    const obj = JSON.parse(s);
    return obj && typeof obj === "object" ? obj : null;
  } catch (_) {}

  // Try to pull the first {...} block
  const m = s.match(/\{[\s\S]*\}$/);
  if (m) {
    try {
      const obj = JSON.parse(m[0]);
      return obj && typeof obj === "object" ? obj : null;
    } catch (_) {}
  }
  return null;
}
