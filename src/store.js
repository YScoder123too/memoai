import { useSyncExternalStore } from "react";
import { topicsOf } from "./exams";
import { keywords } from "./memory";
import { api, hasApi, getToken, setToken } from "./api";

const KEY = "memoai_v1";
export const INTERVALS = [1, 3, 7, 14, 30]; // days between reviews

const empty = {
  user: null, // { name, email }
  goal: null,
  exam: "University Finals",
  examDate: "",
  tasks: [],
  sessions: [],
  mastery: {},
  customSubjects: {},
  doubts: [],
  groqKey: "",
  chat: [],
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : { ...empty };
  } catch {
    return { ...empty };
  }
}

let state = load();
const listeners = new Set();
const setTokenSafe = () => setToken(null);

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  listeners.forEach((l) => l());
  scheduleSync();
}

// With a backend, push the user data (never the API key) after changes, debounced.
let syncTimer;
function scheduleSync() {
  if (!hasApi || !getToken() || !state.user) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const { user, groqKey, ...data } = state; // eslint-disable-line no-unused-vars
    api.saveState(data).catch(() => {});
  }, 800);
}

export const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const DAY = 86400000;

export function useStore() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state
  );
}

export const actions = {
  login: (user, remoteState) => commit({ ...(remoteState ? { ...empty, ...remoteState, groqKey: state.groqKey } : state), user }),
  logout: () => { setTokenSafe(); commit(hasApi ? { ...empty, groqKey: state.groqKey } : { ...state, user: null }); },
  setPrefs: (p) => commit({ ...state, ...p }),
  addTask: (text, subject = "") =>
    text.trim() && commit({ ...state, tasks: [{ id: uid(), text: text.trim(), subject, done: false, at: Date.now() }, ...state.tasks] }),
  toggleTask: (id) => commit({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }),
  removeTask: (id) => commit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) }),
  logSession: (subject, minutes) =>
    commit({ ...state, sessions: [...state.sessions, { id: uid(), subject, minutes, at: Date.now() }] }),
  addSubject: (name) => {
    const n = name.trim().slice(0, 40);
    const cur = state.customSubjects[state.exam] || [];
    if (!n || cur.some((x) => x.toLowerCase() === n.toLowerCase())) return;
    commit({ ...state, customSubjects: { ...state.customSubjects, [state.exam]: [...cur, n] } });
  },
  removeSubject: (name) => commit({ ...state, customSubjects: { ...state.customSubjects, [state.exam]: (state.customSubjects[state.exam] || []).filter((x) => x !== name) } }),
  setMastery: (exam, subject, value) =>
    commit({ ...state, mastery: { ...state.mastery, [exam]: { ...(state.mastery[exam] || {}), [subject]: value } } }),
  addDoubt: ({ id, subject, question, answer }) =>
    commit({
      ...state,
      doubts: [{ id: id || uid(), subject, question, answer, tags: keywords(question), at: Date.now(), stage: 0, nextReview: Date.now() + INTERVALS[0] * DAY, history: [] }, ...state.doubts],
    }),
  updateDoubt: (id, patch) => commit({ ...state, doubts: state.doubts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }),
  removeDoubt: (id) => { if (hasApi && getToken()) api.forget(id).catch(() => {}); commit({ ...state, doubts: state.doubts.filter((d) => d.id !== id) }); },
  addChat: (m) => commit({ ...state, chat: [...state.chat, { id: uid(), at: Date.now(), ...m }].slice(-60) }),
  clearChat: () => commit({ ...state, chat: [] }),
  // spaced repetition: remembered moves it further out, forgot resets it to day 1
  review: (id, remembered) =>
    commit({
      ...state,
      doubts: state.doubts.map((d) => {
        if (d.id !== id) return d;
        const stage = remembered ? Math.min(d.stage + 1, INTERVALS.length - 1) : 0;
        return { ...d, stage, nextReview: Date.now() + INTERVALS[stage] * DAY, history: [...d.history, { at: Date.now(), remembered }] };
      }),
    }),
  setGroqKey: (groqKey) => commit({ ...state, groqKey }),
  loadDemo: () => {
    const now = Date.now();
    const subs = topicsOf(state.exam, state.customSubjects);
    if (!subs.length) subs.push("General");
    commit({
      ...state,
      tasks: [
        { id: uid(), text: `Revise ${subs[0]} notes`, subject: subs[0], done: false, at: now },
        { id: uid(), text: `Attempt a practice set for ${subs[1] || subs[0]}`, subject: subs[1] || subs[0], done: false, at: now },
      ],
      sessions: [
        { id: uid(), subject: subs[0], minutes: 45, at: now - DAY },
        { id: uid(), subject: subs[1] || subs[0], minutes: 25, at: now - 2 * DAY },
      ],
      doubts: [
        { id: uid(), subject: subs[0], question: "Why does spaced repetition beat cramming?", answer: "Each recall at a growing gap forces retrieval from long-term memory, which strengthens it more than re-reading.", at: now - 3 * DAY, stage: 1, nextReview: now - 1000, history: [] },
      ],
    });
  },
  reset: () => commit({ ...empty }),
};

// derived helpers
export const dueDoubts = (s) => s.doubts.filter((d) => d.nextReview <= Date.now()).sort((a, b) => a.nextReview - b.nextReview);
export const minutesOn = (s, sinceMs) => s.sessions.filter((x) => x.at >= sinceMs).reduce((a, x) => a + x.minutes, 0);
export function streak(s) {
  const days = new Set(s.sessions.map((x) => new Date(x.at).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export const daysUntil = (iso) => (iso ? Math.max(0, Math.ceil((new Date(iso) - new Date()) / DAY)) : null);
