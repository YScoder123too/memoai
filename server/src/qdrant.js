import { config } from "./config.js";
import { EMBED_DIM } from "./ai.js";
import { failed } from "./http.js";

// Minimal Qdrant REST client. Vectors hold semantic memory only; structured data lives in MongoDB.
const COLLECTION = "memoai_doubts";
export const enabled = () => !!(config.qdrantUrl && config.gemini);

async function q(path, method, body) {
  const res = await fetch(`${config.qdrantUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(config.qdrantKey ? { "api-key": config.qdrantKey } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await failed(res, `Qdrant ${method} ${path}`);
  return res.json();
}

let ready;
export function ensureCollection() {
  ready ||= (async () => {
    const exists = await fetch(`${config.qdrantUrl}/collections/${COLLECTION}`, { headers: config.qdrantKey ? { "api-key": config.qdrantKey } : {} });
    if (exists.status === 404) {
      await q(`/collections/${COLLECTION}`, "PUT", { vectors: { size: EMBED_DIM, distance: "Cosine" } });
      await q(`/collections/${COLLECTION}/index`, "PUT", { field_name: "userId", field_schema: "keyword" });
    } else if (!exists.ok) throw await failed(exists, "Qdrant collection check");
  })().catch((e) => { ready = undefined; throw e; });
  return ready;
}

export async function upsert(id, vector, payload) {
  await ensureCollection();
  await q(`/collections/${COLLECTION}/points?wait=true`, "PUT", { points: [{ id, vector, payload }] });
}

// Search is always filtered by userId so one student can never retrieve another's memories.
export async function search(userId, vector, limit = 3, minScore = 0.55) {
  await ensureCollection();
  const r = await q(`/collections/${COLLECTION}/points/search`, "POST", {
    vector, limit, with_payload: true, score_threshold: minScore,
    filter: { must: [{ key: "userId", match: { value: String(userId) } }] },
  });
  return (r.result || []).map((p) => ({ id: p.id, score: p.score, ...p.payload }));
}

export async function remove(userId, id) {
  await ensureCollection();
  await q(`/collections/${COLLECTION}/points/delete?wait=true`, "POST", {
    filter: { must: [{ key: "userId", match: { value: String(userId) } }, { has_id: [id] }] },
  });
}
