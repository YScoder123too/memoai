// import { Link } from "react-router-dom";
// import { Flame, Clock, CheckCircle2, Brain, Sparkles, Circle, ExternalLink } from "lucide-react";
// import { motion } from "framer-motion";
// import { Page, Card } from "../components/Page";
// import SubjectHeatmap from "../components/SubjectHeatmap";
// import CountUp from "../components/CountUp";
// import { weakSpots } from "../memory";
// import { EXAM_NAMES, linksOf, isCustom } from "../exams";
// import { actions, useStore, dueDoubts, minutesOn, streak, daysUntil } from "../store";

// function greeting() {
//   const h = new Date().getHours();
//   return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
// }

// function Stat({ icon: Icon, label, value, hint }) {
//   return (
//     <motion.div variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="glass rounded-2xl p-5">
//       <Icon size={16} style={{ color: "#E8A855" }} />
//       <p className="font-display text-3xl mt-3">{typeof value === "number" ? <CountUp to={value} /> : value}</p>
//       <p className="text-sm" style={{ color: "#EDEAE2" }}>{label}</p>
//       <p className="text-xs mt-0.5" style={{ color: "#5B6274" }}>{hint}</p>
//     </motion.div>
//   );
// }

// function MonthCalendar({ sessions }) {
//   const now = new Date();
//   const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
//   const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
//   const studied = new Set(sessions.map((x) => new Date(x.at)).filter((d) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()).map((d) => d.getDate()));
//   return (
//     <div>
//       <div className="grid grid-cols-7 gap-1 text-[11px] text-center mb-1" style={{ color: "#5B6274" }}>
//         {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
//       </div>
//       <div className="grid grid-cols-7 gap-1 text-xs text-center">
//         {Array.from({ length: first }).map((_, i) => <span key={"e" + i} />)}
//         {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
//           const today = d === now.getDate();
//           return (
//             <span key={d} className="py-1.5 rounded-md" style={{ background: today ? "#E8A855" : studied.has(d) ? "rgba(232,168,85,.2)" : "transparent", color: today ? "#12151F" : studied.has(d) ? "#E8A855" : "#9CA3AF" }}>{d}</span>
//           );
//         })}
//       </div>
//       <p className="text-xs mt-3" style={{ color: "#5B6274" }}>Highlighted days are days you studied.</p>
//     </div>
//   );
// }

// export default function Dashboard() {
//   const s = useStore();
//   const due = dueDoubts(s);
//   const week = minutesOn(s, Date.now() - 7 * 86400000);
//   const left = daysUntil(s.examDate);
//   const pending = s.tasks.filter((t) => !t.done);
//   const doneCount = s.tasks.filter((t) => t.done).length;
//   const tilesRated = Object.values(s.mastery[s.exam] || {}).some((v) => v > 0);
//   const steps = [
//     { label: s.examDate ? "Exam date set" : "Set your exam date", done: !!s.examDate, to: "/dashboard" },
//     { label: isCustom(s.exam) ? "Add your subjects" : "Rate a topic on the heatmap", done: isCustom(s.exam) ? (s.customSubjects[s.exam] || []).length > 0 : tilesRated, to: "/dashboard" },
//     { label: "Add a task in the planner", done: s.tasks.length > 0, to: "/planner" },
//     { label: "Finish a focus session", done: s.sessions.length > 0, to: "/focus" },
//     { label: "Ask your first doubt", done: s.doubts.length > 0, to: "/ask" },
//   ];
//   const links = linksOf(s.exam);

//   return (
//     <Page title={`${greeting()}, ${s.user.name.split(" ")[0]}`} sub={`Preparing for ${s.exam}`}
//       action={
//         <select value={s.exam} onChange={(e) => actions.setPrefs({ exam: e.target.value })} className="input !w-auto" aria-label="Exam">
//           {EXAM_NAMES.map((e) => <option key={e} value={e}>{e}</option>)}
//         </select>
//       }>
//       {steps.some((x) => !x.done) && (
//         <Card className="mb-6">
//           <p className="font-display text-xl mb-1">Get started</p>
//           <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>{steps.filter((x) => x.done).length} of {steps.length} done. Each one unlocks a part of MemoAI.</p>
//           <ul className="grid sm:grid-cols-2 gap-2">
//             {steps.map((x) => (
//               <li key={x.label}>
//                 <Link to={x.to} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D", color: x.done ? "#5B6274" : "#EDEAE2" }}>
//                   {x.done ? <CheckCircle2 size={16} style={{ color: "#E8A855" }} /> : <Circle size={16} style={{ color: "#5B6274" }} />}
//                   <span style={{ textDecoration: x.done ? "line-through" : "none" }}>{x.label}</span>
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </Card>
//       )}

//       <Card className="mb-6 flex items-center justify-between gap-6 flex-wrap">
//         <div>
//           <p className="text-sm" style={{ color: "#9CA3AF" }}>{left !== null ? `Days until ${s.exam}` : `Set your ${s.exam} date`}</p>
//           {left !== null ? <p className="font-display text-6xl md:text-7xl" style={{ color: "#E8A855" }}><CountUp to={left} /></p> : <p className="text-sm mt-2" style={{ color: "#5B6274" }}>Add a date to start the countdown.</p>}
//         </div>
//         <div>
//           <label htmlFor="examdate" className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>Exam date</label>
//           <input id="examdate" type="date" className="input" value={s.examDate} onChange={(e) => actions.setPrefs({ examDate: e.target.value })} />
//         </div>
//       </Card>

//       {due.length > 0 && (
//         <Link to="/memory" className="block mb-6 rounded-2xl p-5 transition hover:-translate-y-0.5" style={{ background: "linear-gradient(120deg, rgba(232,168,85,.22), rgba(232,168,85,.06))", border: "1px solid rgba(232,168,85,.4)" }}>
//           <p className="font-display text-xl flex items-center gap-2"><Sparkles size={18} style={{ color: "#E8A855" }} /> {due.length} {due.length === 1 ? "doubt is" : "doubts are"} ready for review</p>
//           <p className="text-sm mt-1" style={{ color: "#C7C3B8" }}>This is the moment you are about to forget them. A two minute review locks them in.</p>
//         </Link>
//       )}

//       <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" initial="hide" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
//         <Stat icon={Flame} label="Day streak" value={streak(s)} hint="Days with a focus session" />
//         <Stat icon={Clock} label="Focus this week" value={`${(week / 60).toFixed(1)}h`} hint="Last 7 days" />
//         <Stat icon={CheckCircle2} label="Tasks done" value={`${doneCount}/${s.tasks.length}`} hint={`${pending.length} still open`} />
//         <Stat icon={Brain} label="Doubts saved" value={s.doubts.length} hint={`${due.length} due now`} />
//       </motion.div>

//       <div className="grid lg:grid-cols-5 gap-6 items-start">
//         <Card className="lg:col-span-3">
//           <p className="font-display text-xl mb-4">Subject heatmap</p>
//           <SubjectHeatmap />
//         </Card>
//         <div className="lg:col-span-2 flex flex-col gap-6">
//           <Card>
//             <p className="font-display text-xl mb-4">{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>
//             <MonthCalendar sessions={s.sessions} />
//           </Card>
//           {links.length > 0 && (
//             <Card>
//               <p className="font-display text-xl mb-3">Official material</p>
//               <ul className="flex flex-col gap-2">
//                 {links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}><span>{l.label}</span><ExternalLink size={13} style={{ color: "#E8A855" }} /></a></li>)}
//               </ul>
//             </Card>
//           )}
//           <Card>
//             <div className="flex items-center justify-between mb-3">
//               <p className="font-display text-xl">Weak spots</p>
//               <Link to="/ask" className="text-xs" style={{ color: "#E8A855" }}>Ask a doubt</Link>
//             </div>
//             {weakSpots(s.doubts, 3).length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Concepts you ask about more than once will show up here.</p> : (
//               <ul className="flex flex-col gap-2">
//                 {weakSpots(s.doubts, 3).map((w) => <li key={w.tag} className="flex justify-between text-sm"><span>{w.tag}</span><span className="text-xs" style={{ color: "#E8A855" }}>asked {w.asked}x{w.forgot ? `, forgot ${w.forgot}x` : ""}</span></li>)}
//               </ul>
//             )}
//           </Card>
//           <Card>
//             <div className="flex items-center justify-between mb-3">
//               <p className="font-display text-xl">Up next</p>
//               <Link to="/planner" className="text-xs" style={{ color: "#E8A855" }}>Open planner</Link>
//             </div>
//             {pending.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>No open tasks. Add one in the Planner.</p> : (
//               <ul className="flex flex-col gap-2">
//                 {pending.slice(0, 4).map((t) => (
//                   <li key={t.id}><button onClick={() => actions.toggleTask(t.id)} className="w-full flex items-center gap-3 text-sm text-left px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}>
//                     <span className="w-4 h-4 rounded-full shrink-0" style={{ border: "1px solid #5B6274" }} /> <span className="truncate">{t.text}</span>
//                   </button></li>
//                 ))}
//               </ul>
//             )}
//           </Card>
//         </div>
//       </div>
//     </Page>
//   );
// }




import { Link } from "react-router-dom";
import { Flame, Clock, CheckCircle2, Brain, Sparkles, Circle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Page, Card } from "../components/Page";
import SubjectHeatmap from "../components/SubjectHeatmap";
import CountUp from "../components/CountUp";
import LevelCard from "../components/LevelCard";
import { weakSpots } from "../memory";
import { EXAM_NAMES, linksOf, isCustom } from "../exams";
import { actions, useStore, dueDoubts, minutesOn, streak, daysUntil } from "../store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <motion.div variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="glass rounded-2xl p-5">
      <Icon size={16} style={{ color: "#E8A855" }} />
      <p className="font-display text-3xl mt-3">{typeof value === "number" ? <CountUp to={value} /> : value}</p>
      <p className="text-sm" style={{ color: "#EDEAE2" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "#5B6274" }}>{hint}</p>
    </motion.div>
  );
}

function MonthCalendar({ sessions }) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const studied = new Set(sessions.map((x) => new Date(x.at)).filter((d) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()).map((d) => d.getDate()));
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-[11px] text-center mb-1" style={{ color: "#5B6274" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {Array.from({ length: first }).map((_, i) => <span key={"e" + i} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const today = d === now.getDate();
          return (
            <span key={d} className="py-1.5 rounded-md" style={{ background: today ? "#E8A855" : studied.has(d) ? "rgba(232,168,85,.2)" : "transparent", color: today ? "#12151F" : studied.has(d) ? "#E8A855" : "#9CA3AF" }}>{d}</span>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: "#5B6274" }}>Highlighted days are days you studied.</p>
    </div>
  );
}

export default function Dashboard() {
  const s = useStore();
  const due = dueDoubts(s);
  const week = minutesOn(s, Date.now() - 7 * 86400000);
  const left = daysUntil(s.examDate);
  const pending = s.tasks.filter((t) => !t.done);
  const doneCount = s.tasks.filter((t) => t.done).length;
  const tilesRated = Object.values(s.mastery[s.exam] || {}).some((v) => v > 0);
  const steps = [
    { label: s.examDate ? "Exam date set" : "Set your exam date", done: !!s.examDate, to: "/dashboard" },
    { label: isCustom(s.exam) ? "Add your subjects" : "Rate a topic on the heatmap", done: isCustom(s.exam) ? (s.customSubjects[s.exam] || []).length > 0 : tilesRated, to: "/dashboard" },
    { label: "Add a task in the planner", done: s.tasks.length > 0, to: "/planner" },
    { label: "Finish a focus session", done: s.sessions.length > 0, to: "/focus" },
    { label: "Ask your first doubt", done: s.doubts.length > 0, to: "/ask" },
  ];
  const links = linksOf(s.exam);

  return (
    <Page title={`${greeting()}, ${s.user.name.split(" ")[0]}`} sub={`Preparing for ${s.exam}`}
      action={
        <select value={s.exam} onChange={(e) => actions.setPrefs({ exam: e.target.value })} className="input !w-auto" aria-label="Exam">
          {EXAM_NAMES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      }>
      {steps.some((x) => !x.done) && (
        <Card className="mb-6">
          <p className="font-display text-xl mb-1">Get started</p>
          <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>{steps.filter((x) => x.done).length} of {steps.length} done. Each one unlocks a part of MemoAI.</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {steps.map((x) => (
              <li key={x.label}>
                <Link to={x.to} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D", color: x.done ? "#5B6274" : "#EDEAE2" }}>
                  {x.done ? <CheckCircle2 size={16} style={{ color: "#E8A855" }} /> : <Circle size={16} style={{ color: "#5B6274" }} />}
                  <span style={{ textDecoration: x.done ? "line-through" : "none" }}>{x.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>{left !== null ? `Days until ${s.exam}` : `Set your ${s.exam} date`}</p>
          {left !== null ? <p className="font-display text-6xl md:text-7xl" style={{ color: "#E8A855" }}><CountUp to={left} /></p> : <p className="text-sm mt-2" style={{ color: "#5B6274" }}>Add a date to start the countdown.</p>}
        </div>
        <div>
          <label htmlFor="examdate" className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>Exam date</label>
          <input id="examdate" type="date" className="input" value={s.examDate} onChange={(e) => actions.setPrefs({ examDate: e.target.value })} />
        </div>
      </Card>

      {due.length > 0 && (
        <Link to="/memory" className="block mb-6 rounded-2xl p-5 transition hover:-translate-y-0.5" style={{ background: "linear-gradient(120deg, rgba(232,168,85,.22), rgba(232,168,85,.06))", border: "1px solid rgba(232,168,85,.4)" }}>
          <p className="font-display text-xl flex items-center gap-2"><Sparkles size={18} style={{ color: "#E8A855" }} /> {due.length} {due.length === 1 ? "doubt is" : "doubts are"} ready for review</p>
          <p className="text-sm mt-1" style={{ color: "#C7C3B8" }}>This is the moment you are about to forget them. A two minute review locks them in.</p>
        </Link>
      )}

      <LevelCard />

      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" initial="hide" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
        <Stat icon={Flame} label="Day streak" value={streak(s)} hint="Days with a focus session" />
        <Stat icon={Clock} label="Focus this week" value={`${(week / 60).toFixed(1)}h`} hint="Last 7 days" />
        <Stat icon={CheckCircle2} label="Tasks done" value={`${doneCount}/${s.tasks.length}`} hint={`${pending.length} still open`} />
        <Stat icon={Brain} label="Doubts saved" value={s.doubts.length} hint={`${due.length} due now`} />
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <Card className="lg:col-span-3">
          <p className="font-display text-xl mb-4">Subject heatmap</p>
          <SubjectHeatmap />
        </Card>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <p className="font-display text-xl mb-4">{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>
            <MonthCalendar sessions={s.sessions} />
          </Card>
          {links.length > 0 && (
            <Card>
              <p className="font-display text-xl mb-3">Official material</p>
              <ul className="flex flex-col gap-2">
                {links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}><span>{l.label}</span><ExternalLink size={13} style={{ color: "#E8A855" }} /></a></li>)}
              </ul>
            </Card>
          )}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-xl">Weak spots</p>
              <Link to="/ask" className="text-xs" style={{ color: "#E8A855" }}>Ask a doubt</Link>
            </div>
            {weakSpots(s.doubts, 3).length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Concepts you ask about more than once will show up here.</p> : (
              <ul className="flex flex-col gap-2">
                {weakSpots(s.doubts, 3).map((w) => <li key={w.tag} className="flex justify-between text-sm"><span>{w.tag}</span><span className="text-xs" style={{ color: "#E8A855" }}>asked {w.asked}x{w.forgot ? `, forgot ${w.forgot}x` : ""}</span></li>)}
              </ul>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-xl">Up next</p>
              <Link to="/planner" className="text-xs" style={{ color: "#E8A855" }}>Open planner</Link>
            </div>
            {pending.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>No open tasks. Add one in the Planner.</p> : (
              <ul className="flex flex-col gap-2">
                {pending.slice(0, 4).map((t) => (
                  <li key={t.id}><button onClick={() => actions.toggleTask(t.id)} className="w-full flex items-center gap-3 text-sm text-left px-3 py-2 rounded-lg" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}>
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ border: "1px solid #5B6274" }} /> <span className="truncate">{t.text}</span>
                  </button></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}