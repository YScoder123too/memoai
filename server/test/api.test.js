// Runs the real Express app with the database and external AI services mocked.
// Run: JWT_SECRET=test GROQ_API_KEY=g GEMINI_API_KEY=m QDRANT_URL=http://qd.test npm test
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { User } from "../src/models.js";

const users = [];
let nextId = 1;
User.findOne = async ({ email }) => users.find((u) => u.email === email) || null;
User.create = async (d) => { const u = { _id: String(nextId++), state: {}, ...d, email: d.email.toLowerCase() }; users.push(u); return u; };
User.findById = async (id) => users.find((u) => u._id === id) || null;
User.updateOne = async ({ _id }, { $set }) => { Object.assign(users.find((u) => u._id === _id), $set); };

const store = []; // fake Qdrant
const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  const body = opts.body ? JSON.parse(opts.body) : {};
  calls.push(String(url));
  const ok = (j, status = 200) => ({ ok: status < 400, status, json: async () => j });
  if (String(url).includes("generativelanguage")) return ok({ embedding: { values: new Array(768).fill(0.1) } });
  if (String(url).includes("groq.com")) return ok({ choices: [{ message: { content: "mock answer. " + body.messages[0].content.length } }] });
  if (String(url).endsWith("/collections/memoai_doubts") && !opts.method) return ok({}, 200);
  if (String(url).includes("/points/search")) {
    const uid = body.filter.must[0].match.value;
    return ok({ result: store.filter((p) => p.payload.userId === uid).map((p) => ({ id: p.id, score: 0.9, payload: p.payload })) });
  }
  if (String(url).includes("/points?wait")) { store.push(...body.points); return ok({ result: {} }); }
  return ok({});
};

const app = createApp().listen(0);
const base = `http://localhost:${app.address().port}`;
const real = globalThis.fetch;
const req = async (path, { method = "GET", body, token } = {}) => {
  // route app traffic through real http, but keep mocks for outbound services
  const http = await import("node:http");
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
      let s = ""; res.on("data", (c) => (s += c)); res.on("end", () => resolve({ status: res.statusCode, json: s ? JSON.parse(s) : {} }));
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
};

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let tokenA, tokenB;

test("signup validates input and hashes password", async () => {
  assert.equal((await req("/api/auth/signup", { method: "POST", body: { name: "A", email: "bad", password: "secret1" } })).status, 400);
  assert.equal((await req("/api/auth/signup", { method: "POST", body: { name: "A", email: "a@x.com", password: "123" } })).status, 400);
  const r = await req("/api/auth/signup", { method: "POST", body: { name: "Asha", email: "a@x.com", password: "secret1" } });
  assert.equal(r.status, 201); tokenA = r.json.token;
  assert.notEqual(users[0].passwordHash, "secret1");
  assert.equal((await req("/api/auth/signup", { method: "POST", body: { name: "Asha", email: "A@x.com", password: "secret1" } })).status, 409);
});

test("login rejects wrong password with a generic message", async () => {
  const bad = await req("/api/auth/login", { method: "POST", body: { email: "a@x.com", password: "wrong!!" } });
  assert.equal(bad.status, 401);
  const none = await req("/api/auth/login", { method: "POST", body: { email: "nobody@x.com", password: "wrong!!" } });
  assert.equal(none.json.error, bad.json.error);
  const ok = await req("/api/auth/login", { method: "POST", body: { email: "a@x.com", password: "secret1" } });
  assert.equal(ok.status, 200); assert.ok(ok.json.token);
});

test("protected routes need a valid token", async () => {
  assert.equal((await req("/api/me")).status, 401);
  assert.equal((await req("/api/me", { token: "garbage" })).status, 401);
  assert.equal((await req("/api/me", { token: tokenA })).status, 200);
});

test("state is saved, cleaned and returned on login", async () => {
  await req("/api/state", { method: "PUT", token: tokenA, body: { state: { goal: "rank", tasks: [{ id: "1" }], evil: "x", passwordHash: "hack" } } });
  const me = await req("/api/me", { token: tokenA });
  assert.equal(me.json.state.goal, "rank"); assert.equal(me.json.state.evil, undefined); assert.equal(me.json.state.passwordHash, undefined);
  assert.notEqual(users[0].passwordHash, "hack");
});

test("ask stores memory, then retrieves it for the same user only", async () => {
  const first = await req("/api/ask", { method: "POST", token: tokenA, body: { id: uuid(1), subject: "OS", question: "What is a deadlock?" } });
  assert.equal(first.status, 200); assert.equal(first.json.related.length, 0); assert.ok(first.json.answer);
  const second = await req("/api/ask", { method: "POST", token: tokenA, body: { id: uuid(2), subject: "OS", question: "How to prevent deadlock?" } });
  assert.equal(second.json.related.length, 1); assert.equal(second.json.related[0].question, "What is a deadlock?");
  // another user must never see user A's memory
  const b = await req("/api/auth/signup", { method: "POST", body: { name: "Bo", email: "b@x.com", password: "secret1" } }); tokenB = b.json.token;
  const other = await req("/api/ask", { method: "POST", token: tokenB, body: { id: uuid(3), subject: "OS", question: "deadlock again" } });
  assert.equal(other.json.related.length, 0);
});

test("ask rejects bad input", async () => {
  assert.equal((await req("/api/ask", { method: "POST", token: tokenA, body: { id: uuid(9), question: "" } })).status, 400);
  assert.equal((await req("/api/ask", { method: "POST", token: tokenA, body: { id: "not-a-uuid", question: "hi" } })).status, 400);
});

test.after(() => { app.close(); });

test("ask still answers when vector memory fails, and says so", async () => {
  const prev = globalThis.fetch;
  globalThis.fetch = async (url, opts) => (String(url).includes("generativelanguage") ? { ok: false, status: 429, text: async () => "quota", json: async () => ({}) } : prev(url, opts));
  const r = await req("/api/ask", { method: "POST", token: tokenA, body: { id: uuid(20), subject: "OS", question: "What is paging?" } });
  globalThis.fetch = prev;
  assert.equal(r.status, 200); assert.ok(r.json.answer); assert.match(r.json.warning, /Memory lookup failed/);
});
