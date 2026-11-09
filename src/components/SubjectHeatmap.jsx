import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { getExam, sectionsOf } from "../exams";
import { actions, useStore } from "../store";

// cold blue -> amber -> hot white, driven by mastery 0..100
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function tempColor(p) {
  const cold = [59, 110, 220], mid = [232, 168, 85], hot = [255, 250, 240];
  const c = p < 50 ? lerp(cold, mid, p / 50) : lerp(mid, hot, (p - 50) / 50);
  return `rgb(${c.join(",")})`;
}

export default function SubjectHeatmap() {
  const s = useStore();
  const [name, setName] = useState("");
  const exam = getExam(s.exam);
  const sections = sectionsOf(s.exam, s.customSubjects);
  const m = s.mastery[s.exam] || {};

  return (
    <div>
      {exam.custom && (
        <form onSubmit={(e) => { e.preventDefault(); actions.addSubject(name); setName(""); }} className="flex gap-2 mb-4">
          <input className="input" placeholder="Add a subject, e.g. Operating Systems" value={name} onChange={(e) => setName(e.target.value)} aria-label="New subject" />
          <button className="btn inline-flex items-center gap-1 text-sm"><Plus size={14} /> Add</button>
        </form>
      )}
      {exam.custom && sections[0].topics.length === 0 && <p className="text-sm" style={{ color: "#9CA3AF" }}>No subjects yet. Add the subjects you are studying and they will show up here, in the planner, timer and Ask.</p>}
      <div className="flex flex-col gap-6">
        {sections.filter((sec) => sec.topics.length).map((sec) => (
          <div key={sec.name}>
            {!exam.custom && <p className="text-sm mb-2" style={{ color: "#9CA3AF" }}>{sec.name}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sec.topics.map((t, i) => {
                const v = m[t] ?? 0;
                const col = tempColor(v);
                return (
                  <motion.div key={t} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} className="relative">
                    <button onClick={() => actions.setMastery(s.exam, t, v >= 100 ? 0 : Math.min(100, v + 10))} aria-label={`${t}, ${v} percent. Click to raise by 10.`}
                      className="relative w-full overflow-hidden rounded-xl p-4 text-left transition hover:-translate-y-0.5" style={{ background: "rgba(18,21,31,.6)", border: `1px solid ${col}55` }}>
                      <span aria-hidden className="absolute inset-0 transition-all duration-500" style={{ background: col, opacity: 0.08 + v / 380 }} />
                      <p className="relative text-sm pr-4">{t}</p>
                      <p className="relative font-display text-2xl mt-2" style={{ color: col }}>{v}%</p>
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
      <p className="text-xs mt-4" style={{ color: "#5B6274" }}>Tap a tile to rate how well you know it. Blue means neglected, white means solid.</p>
    </div>
  );
}
