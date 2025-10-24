export const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  // surface this early if env isn't set
  console.warn("VITE_API_BASE_URL is not set; API calls will fail.");
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  // choose .json() or .blob() based on path
  return res;
}

// convenience wrappers
export async function generatePreview(payload) {
  const res = await apiPost("/generate/", payload);
  return res.json(); // -> { html, text }
}
export async function exportWord(payload) {
  const res = await apiPost("/export/word/", payload);
  return res.blob(); // -> docx blob
}
export async function sendLead(payload) {
  const res = await apiPost("/leads/email/", payload);
  return res.json(); // -> { ok: true }
}
