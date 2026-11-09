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

// A concept is a weak spot when it keeps coming back: asked about 2+ times, or forgotten in review.
export function weakSpots(doubts, limit = 5) {
  const map = {};
  doubts.forEach((d) => {
    const forgot = d.history.filter((h) => !h.remembered).length;
    (d.tags?.length ? d.tags : keywords(d.question, 2)).forEach((t) => {
      const e = (map[t] ||= { tag: t, asked: 0, forgot: 0, subject: d.subject });
      e.asked += 1; e.forgot += forgot;
    });
  });
  return Object.values(map)
    .map((e) => ({ ...e, weight: e.asked + e.forgot * 2 }))
    .filter((e) => e.asked >= 2 || e.forgot >= 1)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}
