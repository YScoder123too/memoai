import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { User } from "./models.js";
import { sign, requireAuth, validEmail, validPassword, cleanState } from "./auth.js";
import * as ai from "./ai.js";
import * as qd from "./qdrant.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || config.origins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) }));
  app.use(express.json({ limit: "2mb" }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false });
  const askLimiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
  const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

  app.get("/api/health", (_req, res) => res.json({ ok: true, vectorMemory: qd.enabled(), ai: !!config.groq }));

  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Name is required." });
    if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!validPassword(password)) return res.status(400).json({ error: "Password needs at least 6 characters." });
    try {
      if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: "An account with this email already exists." });
      const user = await User.create({ name: name.trim(), email, passwordHash: await bcrypt.hash(password, 10) });
      res.status(201).json({ token: sign(user), user: publicUser(user), state: {} });
    } catch (e) { console.error(e); res.status(500).json({ error: "Could not create the account." }); }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== "string") return res.status(400).json({ error: "Enter your email and password." });
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      // same message for unknown email and wrong password, so accounts cannot be probed
      if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
      res.json({ token: sign(user), user: publicUser(user), state: user.state || {} });
    } catch (e) { console.error(e); res.status(500).json({ error: "Could not log in." }); }
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Account not found." });
    res.json({ user: publicUser(user), state: user.state || {} });
  });

  app.put("/api/state", requireAuth, async (req, res) => {
    try {
      const state = cleanState(req.body?.state);
      await User.updateOne({ _id: req.userId }, { $set: { state } });
      res.json({ ok: true });
    } catch (e) { console.error("state save failed:", e); res.status(500).json({ error: "Could not save your data." }); }
  });

  // The core flow: retrieve similar past doubts -> answer with that context -> store this doubt as new memory.
  app.post("/api/ask", requireAuth, askLimiter, async (req, res) => {
    const { id, subject, question } = req.body || {};
    if (typeof question !== "string" || !question.trim() || question.length > 1500) return res.status(400).json({ error: "Type a question under 1500 characters." });
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "Invalid doubt id." });
    const subj = typeof subject === "string" ? subject.slice(0, 80) : "";
    let related = [];
    let vector = null;
    let warning = null;
    try {
      // Memory is a bonus layer: if embeddings or Qdrant fail, the student still gets an answer and a clear note.
      if (qd.enabled()) {
        try {
          const why = (who) => (e) => { throw new Error(`${who}: ${e.message}${e.cause ? ` (${e.cause.code || e.cause.message})` : ""}`); };
          vector = await ai.embed(question).catch(why("Gemini"));
          related = await qd.search(req.userId, vector, 3).catch(why("Qdrant"));
        } catch (e) { console.error("[ask] memory lookup failed:", e.message); warning = `Memory lookup failed: ${e.message}`; vector = null; }
      } else warning = "Semantic memory is off (set QDRANT_URL and GEMINI_API_KEY on the server).";
      const text = await ai.answer(subj, question, related);
      if (vector) {
        try { await qd.upsert(id, vector, { userId: String(req.userId), subject: subj, question, answer: text, at: Date.now() }); }
        catch (e) { console.error("[ask] memory save failed:", e.message); warning = `Answer not saved to vector memory: ${e.message}`; }
      }
      res.json({ answer: text, related: related.map((r) => ({ id: r.id, question: r.question, subject: r.subject, score: r.score })), semanticMemory: !!vector && !warning, warning });
    } catch (e) { console.error("[ask] answer failed:", e); res.status(502).json({ error: `${e.message} Run "npm run check" in the server folder.` }); }
  });

  app.delete("/api/memory/:id", requireAuth, async (req, res) => {
    try { if (qd.enabled()) await qd.remove(req.userId, req.params.id); res.json({ ok: true }); }
    catch (e) { console.error(e); res.status(502).json({ error: "Could not remove the memory." }); }
  });

  // anything unexpected: log it, answer with JSON instead of a stack trace
  app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: "Something went wrong on the server." }); });

  return app;
}
