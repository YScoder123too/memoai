import { useState } from "react";
import { Trash2, Check } from "lucide-react";
import { Page, Card } from "../components/Page";
import { topicsOf } from "../exams";
import { actions, useStore } from "../store";

export default function Planner() {
  const s = useStore();
  const subjects = topicsOf(s.exam, s.customSubjects);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [filter, setFilter] = useState("All");

  const add = (e) => { e.preventDefault(); actions.addTask(text, subject.trim()); setText(""); };
  const shown = s.tasks.filter((t) => filter === "All" || t.subject === filter);
  const done = s.tasks.filter((t) => t.done).length;
  const pct = s.tasks.length ? Math.round((done / s.tasks.length) * 100) : 0;
  const groups = [...new Set(shown.map((t) => t.subject || "General"))];

  return (
    <Page title="Planner" sub={`${s.exam}: plan the work, tick it off.`}>
      <Card className="mb-6">
        <form onSubmit={add} className="flex gap-3 flex-wrap">
          <input className="input flex-1 min-w-[200px]" placeholder="What will you study next?" value={text} onChange={(e) => setText(e.target.value)} aria-label="Task" />
          <input className="input !w-48" list="groups" placeholder="Group (pick or type)" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Task group" />
          <datalist id="groups">{[...new Set([...subjects, ...s.tasks.map((t) => t.subject).filter(Boolean)])].map((x) => <option key={x} value={x} />)}</datalist>
          <button className="btn">Add task</button>
        </form>
        <div className="mt-5">
          <div className="flex justify-between text-xs mb-2" style={{ color: "#9CA3AF" }}><span>{done} of {s.tasks.length} done</span><span>{pct}%</span></div>
          <div className="h-2 rounded-full" style={{ background: "#1E2433" }}><div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#E8A855" }} /></div>
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap mb-5">
        {["All", ...new Set(s.tasks.map((t) => t.subject).filter(Boolean))].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1 rounded-full text-xs" style={filter === f ? { background: "#E8A855", color: "#12151F" } : { border: "1px solid #262C3D", color: "#9CA3AF" }}>{f}</button>
        ))}
      </div>

      {s.tasks.length === 0 ? (
        <Card><p className="text-sm" style={{ color: "#9CA3AF" }}>No tasks yet. Add your first one above. Pick a subject so the planner can group it.</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {groups.map((g) => (
            <Card key={g}>
              <p className="font-display text-lg mb-3">{g}</p>
              <ul className="flex flex-col gap-2">
                {shown.filter((t) => (t.subject || "General") === g).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}>
                    <button onClick={() => actions.toggleTask(t.id)} aria-label={t.done ? "Mark as not done" : "Mark as done"} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={t.done ? { background: "#E8A855" } : { border: "1px solid #5B6274" }}>
                      {t.done && <Check size={12} color="#12151F" />}
                    </button>
                    <span className="text-sm flex-1" style={{ color: t.done ? "#5B6274" : "#EDEAE2", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                    <button onClick={() => actions.removeTask(t.id)} aria-label="Delete task" style={{ color: "#5B6274" }}><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
