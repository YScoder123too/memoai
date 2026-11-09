// XP, levels and badges are calculated from data the app already stores (sessions, tasks, doubts, reviews).
// Nothing extra is saved, so it works the same in local mode and with the backend.
import { streak } from "./store";

export const sessionXP = (minutes) => minutes; // 1 XP per focused minute

export function computeXP(s) {
  const focus = s.sessions.reduce((a, x) => a + sessionXP(x.minutes), 0);
  const tasks = s.tasks.filter((t) => t.done).length * 10;
  const saved = s.doubts.length * 5;
  const reviews = s.doubts.flatMap((d) => d.history);
  const recalled = reviews.filter((r) => r.remembered).length * 15; // remembering is worth the most: it is the point of the app
  const missed = reviews.filter((r) => !r.remembered).length * 5; // trying still counts
  return { total: focus + tasks + saved + recalled + missed, focus, tasks, saved, recalled, missed };
}

// Level n starts at 50 * n * (n - 1) XP: 100, 300, 600, 1000...
const startOf = (n) => 50 * n * (n - 1);
const TITLES = ["Beginner", "Learner", "Student", "Scholar", "Adept", "Specialist", "Master"];

export function levelOf(xp) {
  const level = Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2);
  const from = startOf(level), to = startOf(level + 1);
  return { level, title: TITLES[Math.min(level - 1, TITLES.length - 1)], into: xp - from, span: to - from, toNext: to - xp, pct: Math.round(((xp - from) / (to - from)) * 100) };
}

const totalMinutes = (s) => s.sessions.reduce((a, x) => a + x.minutes, 0);
const totalReviews = (s) => s.doubts.reduce((a, d) => a + d.history.length, 0);

export const BADGES = [
  { id: "first-session", label: "First focus", desc: "Finish a focus session", test: (s) => s.sessions.length >= 1 },
  { id: "hour", label: "One hour club", desc: "Focus for 60 minutes in total", test: (s) => totalMinutes(s) >= 60 },
  { id: "ten-hours", label: "Ten hours in", desc: "Focus for 10 hours in total", test: (s) => totalMinutes(s) >= 600 },
  { id: "streak3", label: "Three day streak", desc: "Study 3 days in a row", test: (s) => streak(s) >= 3 },
  { id: "streak7", label: "Week streak", desc: "Study 7 days in a row", test: (s) => streak(s) >= 7 },
  { id: "tasks5", label: "Getting things done", desc: "Complete 5 planner tasks", test: (s) => s.tasks.filter((t) => t.done).length >= 5 },
  { id: "doubt", label: "Curious mind", desc: "Save your first doubt", test: (s) => s.doubts.length >= 1 },
  { id: "reviews10", label: "Revision habit", desc: "Complete 10 reviews", test: (s) => totalReviews(s) >= 10 },
  { id: "long", label: "It stuck", desc: "Remember one doubt across 4 reviews in a row", test: (s) => s.doubts.some((d) => d.stage >= 4) },
];

export const earnedBadges = (s) => BADGES.map((b) => ({ ...b, earned: b.test(s) }));