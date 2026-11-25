// Local learner-model helpers: keyword tags, similarity search over past doubts, weak-spot detection.
// With the backend running, similarity search is done by Qdrant embeddings instead (server/).
const STOP = new Set("a an the is are was were be been being of to in on at for with and or but not no do does did how why what when where which who whom this that these those it its as by from into than then so if can could should would will just i me my we you your they them their about over under between each any some more most other such only own same too very also there here have has had get got make made use used using explain tell give vs work works".split(" "));

export function tokens(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ""));
}
export const keywords = (text, n = 4) => {
  const f = {};
  tokens(text).forEach((t) => (f[t] = (f[t] || 0) + 1));
  return Object.entries(f).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, n).map(([t]) => t);
};

// TF-IDF cosine similarity between the query and each saved doubt (question + answer)
export function related(doubts, query, k = 3, minScore = 0.12) {
  const docs = doubts.map((d) => ({ d, t: tokens(`${d.question} ${d.question} ${d.answer || ""}`) }));
  const q = tokens(query);
  if (!q.length || !docs.length) return [];
  const df = {};
  docs.forEach(({ t }) => new Set(t).forEach((w) => (df[w] = (df[w] || 0) + 1)));
  const idf = (w) => Math.log(1 + docs.length / (1 + (df[w] || 0))) + 0.5;
  const vec = (ts) => { const v = {}; ts.forEach((w) => (v[w] = (v[w] || 0) + idf(w))); return v; };
  const qv = vec(q);
  const norm = (v) => Math.sqrt(Object.values(v).reduce((a, x) => a + x * x, 0)) || 1;
  const qn = norm(qv);
  return docs
    .map(({ d, t }) => {
      const dv = vec(t);
      let dot = 0;
      for (const w in qv) if (dv[w]) dot += qv[w] * dv[w];
      return { ...d, score: dot / (qn * norm(dv)) };
    })
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// A topic is a weak spot when it keeps coming back: 2+ doubts in it, or a revised doubt was forgotten.
// Doubts are filed under topics by the AI, so this works on topics, not on single keywords.
export function weakSpots(doubts, limit = 5) {
  const map = {};
  doubts.forEach((d) => {
    const topic = d.subject || "Miscellaneous";
    const e = (map[topic] ||= { topic, doubts: 0, forgot: 0 });
    e.doubts += 1;
    e.forgot += (d.history || []).filter((h) => !h.remembered).length;
  });
  return Object.values(map)
    .filter((e) => e.topic !== "Miscellaneous" && (e.doubts >= 2 || e.forgot >= 1))
    .map((e) => ({ ...e, weight: e.doubts + e.forgot * 2, why: e.forgot ? `Forgot ${e.forgot} ${e.forgot === 1 ? "time" : "times"} in revision` : `${e.doubts} doubts here` }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}