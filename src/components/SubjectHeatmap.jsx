import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Compass } from "lucide-react";
import { getExam, sectionsOf, topicsOf } from "../exams";
import { topicStats, focusNext } from "../progress";
import { actions, useStore } from "../store";

// cold blue -> amber -> hot white, driven by the topic score 0..100
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function tempColor(p) {
  const cold = [59, 110, 220], mid = [232, 168, 85], hot = [255, 250, 240];
  const c = p < 50 ? lerp(cold, mid, p / 50) : lerp(mid, hot, (p - 50) / 50);
  return `rgb(${c.join(",")})`;
}

const GREY = "rgb(91,98,116)";
const COLD = "rgb(59,110,220)";
const colorOf = (e) => (e.state === "new" ? GREY : e.state === "neglected" ? COLD : tempColor(e.score));
const when = (days) => (days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`);

export default function SubjectHeatmap() {
  const s = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(null);
  const exam = getExam(s.exam);
  const sections = sectionsOf(s.exam, s.customSubjects);
  const topics = topicsOf(s.exam, s.customSubjects);
  const stats = useMemo(() => topicStats(s, topics), [s.doubts, s.tasks, s.sessions, s.exam, s.customSubjects]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = focusNext(stats, 3);
  const sel = open && stats[open];

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>Built from your doubts, tasks, focus time and revision results. There is nothing to rate by hand.</p>

      {exam.custom && (
        <form onSubmit={(e) => { e.preventDefault(); actions.addSubject(name); setName(""); }} className="flex gap-2 mb-4">
          <input className="input" placeholder="Add a subject, e.g. Operating Systems" value={name} onChange={(e) => setName(e.target.value)} aria-label="New subject" />
          <button className="btn inline-flex items-center gap-1 text-sm"><Plus size={14} /> Add</button>
        </form>
      )}
      {exam.custom && sections[0].topics.length === 0 && <p className="text-sm" style={{ color: "#9CA3AF" }}>No subjects yet. Add the subjects you are studying and they will show up here, in the planner, timer and Ask.</p>}

      {next.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(232,168,85,.07)", border: "1px solid rgba(232,168,85,.25)" }}>
          <p className="text-sm mb-2 inline-flex items-center gap-2" style={{ color: "#E8A855" }}><Compass size={14} /> Look at these next</p>
          <ul className="flex flex-col gap-1.5">
            {next.map((e) => (
              <li key={e.topic}><button onClick={() => setOpen(e.topic)} className="w-full flex justify-between gap-3 text-sm text-left"><span>{e.topic}</span><span className="text-xs shrink-0" style={{ color: "#9CA3AF" }}>{e.why}</span></button></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {sections.filter((sec) => sec.topics.length).map((sec) => (
          <div key={sec.name}>
            {!exam.custom && <p className="text-sm mb-2" style={{ color: "#9CA3AF" }}>{sec.name}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sec.topics.map((t, i) => {
                const e = stats[t];
                const col = colorOf(e);
                const v = e.score ?? 0;
                return (
                  <motion.div key={t} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="relative">
                    <button onClick={() => setOpen(open === t ? null : t)} aria-expanded={open === t} aria-label={`${t}: ${e.state === "new" ? "not started" : `${v} percent, ${e.state}`}. Show details.`}
                      className="relative w-full overflow-hidden rounded-xl p-4 text-left transition hover:-translate-y-0.5" style={{ background: "rgba(18,21,31,.6)", border: `1px solid ${open === t ? "#E8A855" : col + "55"}` }}>
                      <span aria-hidden className="absolute inset-0 transition-all duration-500" style={{ background: col, opacity: e.state === "new" ? 0.04 : 0.08 + v / 380 }} />
                      <p className="relative text-sm pr-4">{t}</p>
                      <p className="relative font-display text-2xl mt-2" style={{ color: col }}>{e.state === "new" ? "New" : `${v}%`}</p>
                      <p className="relative text-[11px] mt-0.5" style={{ color: "#5B6274" }}>{e.state === "neglected" ? "Neglected" : e.state === "new" ? "Not started" : e.state === "strong" ? "Strong" : "Building"}</p>
                      <span aria-hidden className="absolute left-0 bottom-0 h-[3px] transition-all duration-500" style={{ width: `${v}%`, background: col }} />
                    </button>
                    {exam.custom && <button onClick={() => actions.removeSubject(t)} aria-label={`Remove ${t}`} className="absolute top-2 right-2" style={{ color: "#5B6274" }}><X size={13} /></button>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {sel && (
          <motion.div key={sel.topic} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(18,21,31,.7)", border: "1px solid #262C3D" }}>
              <div className="flex justify-between items-start gap-3 mb-3">
                <p className="font-display text-lg">{sel.topic}</p>
                <button onClick={() => setOpen(null)} aria-label="Close details" style={{ color: "#9CA3AF" }}><X size={16} /></button>
              </div>
              {!sel.touched ? <p className="text-sm" style={{ color: "#9CA3AF" }}>You have not studied this yet. Ask a doubt, finish a task or run a focus session on it and it fills in.</p> : (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><dt className="text-xs" style={{ color: "#5B6274" }}>Doubts asked</dt><dd>{sel.doubts}</dd></div>
                  <div><dt className="text-xs" style={{ color: "#5B6274" }}>Tasks done</dt><dd>{sel.tasksDone}</dd></div>
                  <div><dt className="text-xs" style={{ color: "#5B6274" }}>Focus time</dt><dd>{sel.minutes} min</dd></div>
                  <div><dt className="text-xs" style={{ color: "#5B6274" }}>Remembered in revision</dt><dd>{sel.recall === null ? "No revision yet" : `${sel.recall}%`}</dd></div>
                  <div className="col-span-2 sm:col-span-4 text-xs" style={{ color: "#9CA3AF" }}>Last activity {when(sel.idleDays)}.{sel.recall === null ? " Revise your doubts on this topic to push the score past 70%." : ""}</div>
                </dl>
              )}
              <div className="flex gap-3 mt-4 flex-wrap">
                <button onClick={() => nav("/ask")} className="btn text-sm">Ask about it</button>
                {sel.doubts > 0 && <button onClick={() => nav("/memory", { state: { topic: sel.topic } })} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "#262C3D" }}>See its doubts</button>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs mt-4 flex flex-wrap gap-x-4 gap-y-1" style={{ color: "#5B6274" }}>
        <span><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: GREY }} />Not started</span>
        <span><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "rgb(232,168,85)" }} />Building</span>
        <span><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "rgb(255,250,240)" }} />Strong</span>
        <span><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: COLD }} />Neglected for 14+ days</span>
      </p>
    </div>
  );
}