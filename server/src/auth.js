import jwt from "jsonwebtoken";
import { config } from "./config.js";

export const sign = (user) => jwt.sign({ sub: String(user._id) }, config.jwt, { expiresIn: "7d" });

// Protects routes: expects "Authorization: Bearer <token>"
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in." });
  try {
    req.userId = jwt.verify(token, config.jwt).sub;
    next();
  } catch {
    res.status(401).json({ error: "Your session expired. Please log in again." });
  }
}

export const validEmail = (e) => typeof e === "string" && /^\S+@\S+\.\S+$/.test(e);
export const validPassword = (p) => typeof p === "string" && p.length >= 6 && p.length <= 100;

const KEEP = ["goal", "exam", "examDate", "tasks", "sessions", "mastery", "doubts", "chat", "customSubjects"];
const CAPS = { tasks: 2000, sessions: 5000, doubts: 2000, chat: 100 };
// Only known fields are stored, and arrays are capped, so a client cannot write arbitrary junk.
export function cleanState(input) {
  const out = {};
  if (!input || typeof input !== "object") return out;
  for (const k of KEEP) if (input[k] !== undefined) out[k] = input[k];
  for (const [k, n] of Object.entries(CAPS)) if (Array.isArray(out[k])) out[k] = out[k].slice(0, n);
  for (const k of ["goal", "exam", "examDate"]) if (out[k] !== undefined && typeof out[k] !== "string") delete out[k];
  for (const k of ["mastery", "customSubjects"]) if (out[k] && (typeof out[k] !== "object" || Array.isArray(out[k]))) delete out[k];
  return out;
}
