// services/api.js
export async function generatePreview(payload) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/generate/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Preview failed");
  return res.json(); // { html, previewId, shareUrl }
}

export async function submitLead(payload) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Lead capture failed");
  return res.json(); // { ok: true }
}

export async function createCheckoutSession(meta) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  if (!res.ok) throw new Error("Stripe session failed");
  return res.json(); // { url }
}
