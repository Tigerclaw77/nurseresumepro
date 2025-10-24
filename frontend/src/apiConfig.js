const RAW = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

let u;
try {
  u = new URL(RAW);
} catch {
  throw new Error(
    `VITE_API_BASE must be an absolute origin (e.g. "http://127.0.0.1:8000"). Current: "${RAW}"`
  );
}
if (u.pathname && u.pathname !== "/") {
  throw new Error(
    `VITE_API_BASE must NOT include a path. Remove "${u.pathname}" from "${RAW}". Use "${u.origin}" instead.`
  );
}

const API_BASE = u.origin;
export default API_BASE;
