// backend/helpers/layout.js

const esc = (s = "") =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

// collapse whitespace between tags and trim
const collapse = (html = "") =>
  String(html).replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();

/* ----------------------------- Resume (center) ---------------------------- */
export function buildResumeContact({ fullName, addressLine, cityStateZip, phone, email }) {
  const html = `
<div class="resume-head" style="text-align:center;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <div style="font-weight:700;font-size:18px;line-height:1.25;margin:0;">${esc(fullName)}</div>
  <div style="margin-top:4px;display:inline-flex;gap:10px;flex-wrap:wrap;justify-content:center;font-size:13.5px;line-height:1.35;">
    ${addressLine ? `<span>${esc(addressLine)}</span>` : ""}
    ${cityStateZip ? `<span>${esc(cityStateZip)}</span>` : ""}
    ${phone ? `<span>${esc(phone)}</span>` : ""}
    ${email ? `<span>${esc(email)}</span>` : ""}
  </div>
</div>`;
  return collapse(html);
}

export function formatResumeHtmlPlain(contactHtml = "", bodyHtml = "") {
  return collapse(`
<div class="resume-doc" style="white-space:normal !important;">
  <div class="contact">${contactHtml}</div>
  <div class="body">${bodyHtml}</div>
</div>`);
}

export function formatResumeHtml(contactHtml = "", bodyHtml = "") {
  return collapse(`
<div class="resume-doc" style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.45;white-space:normal !important;">
  <div class="contact" style="margin:0 0 12px 0;">${contactHtml}</div>
  <div class="body" style="font-size:13.5px;">
    ${bodyHtml}
  </div>
</div>`);
}

/* ----------------------------- Cover (left) ------------------------------- */
export function buildCoverContact({ fullName, addressLine, cityStateZip, phone, email }) {
  // Tight, left-aligned letterhead; minimal, consistent spacing
  const html = `
<div class="letterhead" style="font-family:Arial,Helvetica,sans-serif;color:#111;">
  <div style="font-weight:700;font-size:18px;line-height:1.25;margin:0;">${esc(fullName)}</div>
  <div style="margin-top:6px;display:flex;flex-direction:column;row-gap:2px;font-size:14px;line-height:1.35;">
    ${addressLine ? `<div>${esc(addressLine)}</div>` : ""}
    ${cityStateZip ? `<div>${esc(cityStateZip)}</div>` : ""}
    ${phone ? `<div>Phone: ${esc(phone)}</div>` : ""}
    ${email ? `<div>Email: ${esc(email)}</div>` : ""}
  </div>
</div>`;
  return collapse(html);
}

export function formatCoverHtmlPlain(contactHtml = "", bodyHtml = "") {
  return collapse(`
<div class="cover-doc" style="white-space:normal !important;">
  <div class="contact">${contactHtml}</div>
  <div class="body">${bodyHtml}</div>
</div>`);
}

export function formatCoverHtml(contactHtml = "", bodyHtml = "") {
  // Keep a single, modest gap between letterhead and body
  return collapse(`
<div class="cover-doc" style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.45;white-space:normal !important;">
  <div class="contact" style="margin:0 0 10px 0;">${contactHtml}</div>
  <div class="body" style="font-size:14px;">
    ${bodyHtml}
  </div>
</div>`);
}
