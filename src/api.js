// Optional backend. Set VITE_API_URL (e.g. http://localhost:5000) to enable real auth, database sync and server-side AI memory.
export const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const hasApi = !!API;
const TOKEN = "memoai_token";
export const getToken = () => { try { return localStorage.getItem(TOKEN); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN); } catch { /* ignore */ } };

async function call(path, { method = "GET", body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
export const api = {
  signup: (b) => call("/api/auth/signup", { method: "POST", body: b }),
  login: (b) => call("/api/auth/login", { method: "POST", body: b }),
  me: () => call("/api/me"),
  saveState: (state) => call("/api/state", { method: "PUT", body: { state } }),
  ask: (b) => call("/api/ask", { method: "POST", body: b }),
  forget: (id) => call(`/api/memory/${id}`, { method: "DELETE" }),
};
