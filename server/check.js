// Run: npm run check
// Tests each service separately so you can see exactly which key or setting is wrong.
import mongoose from "mongoose";
import { config } from "./src/config.js";
import * as ai from "./src/ai.js";
import * as qd from "./src/qdrant.js";

let bad = 0;
async function step(name, fn) {
  try { const note = await fn(); console.log(`  OK    ${name}${note ? ` (${note})` : ""}`); }
  catch (e) { bad++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}
const present = (k, v) => { if (!v) throw new Error(`${k} is missing in server/.env`); };

console.log("\nMemoAI server check\n");
await step("JWT_SECRET is set", async () => { present("JWT_SECRET", config.jwt); if (config.jwt === "change-me") throw new Error("Still the placeholder value. Use a long random string."); });
await step("MongoDB connects", async () => {
  present("MONGODB_URI", config.mongo);
  await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 8000 });
  await mongoose.connection.db.admin().ping();
  return `database "${mongoose.connection.name}"`;
});
await step("MongoDB can write", async () => {
  if (mongoose.connection.readyState !== 1) throw new Error("Skipped because MongoDB did not connect.");
  const c = mongoose.connection.db.collection("memoai_check");
  const r = await c.insertOne({ at: new Date() });
  await c.deleteOne({ _id: r.insertedId });
});
await step("Groq answers", async () => { present("GROQ_API_KEY", config.groq); const a = await ai.answer("test", "Say OK in one word.", []); if (!a) throw new Error("Empty reply"); return a.slice(0, 20); });
let vec;
await step("Gemini embeddings", async () => { present("GEMINI_API_KEY", config.gemini); vec = await ai.embed("deadlock in operating systems"); return `${vec.length} dimensions`; });
await step("Qdrant stores and searches", async () => {
  present("QDRANT_URL", config.qdrantUrl);
  if (!vec) throw new Error("Skipped because the Gemini embedding step failed.");
  const id = "00000000-0000-4000-8000-0000000000aa";
  await qd.upsert(id, vec, { userId: "check", subject: "test", question: "check", answer: "" });
  const hits = await qd.search("check", vec, 1, 0.1);
  await qd.remove("check", id);
  if (!hits.length) throw new Error("Stored a point but search found nothing.");
});

console.log(bad ? `\n${bad} check(s) failed. Fix the FAIL lines above, then run again.\n` : "\nEverything works. Start the server with: npm run dev\n");
await mongoose.disconnect().catch(() => {});
process.exit(bad ? 1 : 0);
