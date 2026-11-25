// Study progress per topic, worked out from what the student actually did. Nothing is self-rated.
//   effort  = doubts asked + tasks finished + focus time (30 min counts as one unit), capped at 4 units
//   recall  = share of revision answers the student remembered
//   score   = effort and recall each worth half. Without any revision yet, the score tops out at 70.
// A topic is "neglected" when it had activity but nothing in the last 14 days.
const DAY = 86400000;
export const NEGLECT_DAYS = 14;

const norm = (x) => String(x || "").trim().toLowerCase();

export function topicStats(s, topics) {
  const out = {};
  topics.forEach((t) => { out[t] = { topic: t, doubts: 0, tasksDone: 0, minutes: 0, reviews: 0, remembered: 0, lastAt: 0 }; });
  const byName = Object.fromEntries(topics.map((t) => [norm(t), t]));
  const bump = (name, at, fn) => { const e = out[byName[norm(name)]]; if (e) { fn(e); e.lastAt = Math.max(e.lastAt, at || 0); } };

  s.doubts.forEach((d) => {
    bump(d.subject, d.at, (e) => { e.doubts++; });
    (d.history || []).forEach((h) => bump(d.subject, h.at, (e) => { e.reviews++; if (h.remembered) e.remembered++; }));
  });
  s.tasks.forEach((t) => t.done && bump(t.subject, t.doneAt || t.at, (e) => { e.tasksDone++; }));
  s.sessions.forEach((x) => bump(x.subject, x.at, (e) => { e.minutes += x.minutes; }));

  const now = Date.now();
  Object.values(out).forEach((e) => {
    const units = e.doubts + e.tasksDone + e.minutes / 30;
    e.touched = units > 0;
    const effort = Math.min(1, units / 4);
    const recall = e.reviews ? e.remembered / e.reviews : null;
    e.recall = recall === null ? null : Math.round(recall * 100);
    e.score = e.touched ? Math.round(recall === null ? effort * 70 : effort * 50 + recall * 50) : null;
    e.idleDays = e.lastAt ? Math.floor((now - e.lastAt) / DAY) : null;
    e.state = !e.touched ? "new" : e.idleDays >= NEGLECT_DAYS ? "neglected" : e.score >= 70 ? "strong" : "building";
  });
  return out;
}

// What to look at next: neglected topics first, then low scores, then topics never started.
export function focusNext(stats, limit = 3) {
  const list = Object.values(stats);
  const reason = (e) =>
    e.state === "neglected" ? `Nothing for ${e.idleDays} days` :
    e.state === "new" ? "Not started" :
    e.recall !== null && e.recall < 60 ? `Remembered ${e.recall}% in revision` : `${e.score}% so far`;
  const rank = (e) => (e.state === "neglected" ? 0 : e.state === "building" && e.recall !== null && e.recall < 60 ? 1 : e.state === "new" ? 3 : e.state === "building" ? 2 : 9);
  return list.filter((e) => rank(e) < 9).sort((a, b) => rank(a) - rank(b) || (a.score ?? -1) - (b.score ?? -1)).slice(0, limit).map((e) => ({ ...e, why: reason(e) }));
}