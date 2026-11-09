// import { Download, RotateCcw, Database } from "lucide-react";
// import { Page, Card } from "../components/Page";
// import { sectionsOf } from "../exams";
// import { tempColor } from "../components/SubjectHeatmap";
// import { actions, useStore, streak, minutesOn } from "../store";

// export default function Profile() {
//   const s = useStore();
//   const sections = sectionsOf(s.exam, s.customSubjects).filter((x) => x.topics.length);
//   const m = s.mastery[s.exam] || {};
//   const total = minutesOn(s, 0);
//   const initials = s.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
//   const recalls = s.doubts.flatMap((d) => d.history);
//   const rate = recalls.length ? Math.round((recalls.filter((x) => x.remembered).length / recalls.length) * 100) : null;

//   const exportData = () => {
//     const blob = new Blob([JSON.stringify({ ...s, groqKey: undefined }, null, 2)], { type: "application/json" });
//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(blob); a.download = "memoai-data.json"; a.click();
//   };

//   return (
//     <Page title="Profile" sub={s.user.email}>
//       <div className="flex items-center gap-5 mb-8">
//         <div className="w-20 h-20 rounded-full flex items-center justify-center font-display text-2xl glass" style={{ color: "#E8A855", borderColor: "#E8A855" }}>{initials}</div>
//         <div><p className="font-display text-2xl">{s.user.name}</p><p className="text-sm" style={{ color: "#9CA3AF" }}>Preparing for {s.exam}</p></div>
//       </div>

//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//         {[
//           ["Total focus", `${(total / 60).toFixed(1)}h`],
//           ["Sessions", s.sessions.length],
//           ["Current streak", `${streak(s)}d`],
//           ["Recall rate", rate === null ? "No reviews yet" : `${rate}%`],
//         ].map(([l, v]) => <Card key={l} className="text-center"><p className="font-display text-2xl" style={{ color: "#E8A855" }}>{v}</p><p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{l}</p></Card>)}
//       </div>

//       <Card className="mb-8">
//         <p className="font-display text-xl mb-4">Strengths in {s.exam}</p>
//         {sections.length === 0 && <p className="text-sm" style={{ color: "#9CA3AF" }}>Add your subjects on the Dashboard to see your strengths here.</p>}
//         <div className="flex flex-col gap-6">
//           {sections.map((sec) => {
//             const avg = Math.round(sec.topics.reduce((a, t) => a + (m[t] ?? 0), 0) / sec.topics.length);
//             return (
//               <div key={sec.name}>
//                 <div className="flex justify-between text-sm mb-2"><span style={{ color: "#EDEAE2" }}>{sec.name}</span><span style={{ color: "#9CA3AF" }}>{avg}% average</span></div>
//                 <ul className="flex flex-col gap-2">
//                   {sec.topics.map((t) => {
//                     const v = m[t] ?? 0;
//                     return (
//                       <li key={t} className="flex items-center gap-3 text-xs">
//                         <span className="w-44 truncate" style={{ color: "#9CA3AF" }}>{t}</span>
//                         <div className="h-1.5 flex-1 rounded-full" style={{ background: "#1E2433" }}><div className="h-1.5 rounded-full transition-all" style={{ width: `${v}%`, background: tempColor(v) }} /></div>
//                         <span className="w-8 text-right" style={{ color: "#9CA3AF" }}>{v}%</span>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               </div>
//             );
//           })}
//         </div>
//       </Card>

//       <Card>
//         <p className="font-display text-xl mb-1">Your data</p>
//         <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>Everything is stored in this browser. Export it any time, or start fresh.</p>
//         <div className="flex gap-3 flex-wrap">
//           <button onClick={exportData} className="btn text-sm inline-flex items-center gap-2"><Download size={14} /> Export as JSON</button>
//           <button onClick={actions.loadDemo} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D" }}><Database size={14} /> Fill with demo data</button>
//           <button onClick={() => window.confirm("This deletes all your tasks, sessions and doubts. Continue?") && actions.reset()} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#5b2a2a", color: "#F08A7E" }}><RotateCcw size={14} /> Reset everything</button>
//         </div>
//       </Card>
//     </Page>
//   );
// }


import { Download, RotateCcw, Database } from "lucide-react";
import { Page, Card } from "../components/Page";
import { sectionsOf } from "../exams";
import { Award, Lock } from "lucide-react";
import { computeXP, levelOf, earnedBadges } from "../gamify";
import { tempColor } from "../components/SubjectHeatmap";
import { actions, useStore, streak, minutesOn } from "../store";

export default function Profile() {
  const s = useStore();
  const sections = sectionsOf(s.exam, s.customSubjects).filter((x) => x.topics.length);
  const m = s.mastery[s.exam] || {};
  const total = minutesOn(s, 0);
  const initials = s.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const recalls = s.doubts.flatMap((d) => d.history);
  const rate = recalls.length ? Math.round((recalls.filter((x) => x.remembered).length / recalls.length) * 100) : null;

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...s, groqKey: undefined }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "memoai-data.json"; a.click();
  };

  return (
    <Page title="Profile" sub={s.user.email}>
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center font-display text-2xl glass" style={{ color: "#E8A855", borderColor: "#E8A855" }}>{initials}</div>
        <div><p className="font-display text-2xl">{s.user.name}</p><p className="text-sm" style={{ color: "#9CA3AF" }}>Preparing for {s.exam}</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ["Total focus", `${(total / 60).toFixed(1)}h`],
          ["Sessions", s.sessions.length],
          ["Current streak", `${streak(s)}d`],
          ["Recall rate", rate === null ? "No reviews yet" : `${rate}%`],
        ].map(([l, v]) => <Card key={l} className="text-center"><p className="font-display text-2xl" style={{ color: "#E8A855" }}>{v}</p><p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{l}</p></Card>)}
      </div>

      <Card className="mb-8">
        {(() => { const badges = earnedBadges(s); const lv = levelOf(computeXP(s).total); return (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="font-display text-xl flex items-center gap-2"><Award size={18} style={{ color: "#E8A855" }} /> Badges</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Level {lv.level} {lv.title} · {badges.filter((b) => b.earned).length} of {badges.length} earned</p>
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {badges.map((b) => (
                <li key={b.id} className="rounded-xl p-3 flex items-start gap-3" style={{ background: "rgba(18,21,31,.6)", border: `1px solid ${b.earned ? "rgba(232,168,85,.45)" : "#262C3D"}`, opacity: b.earned ? 1 : 0.55 }}>
                  <span className="mt-0.5" style={{ color: b.earned ? "#E8A855" : "#5B6274" }}>{b.earned ? <Award size={16} /> : <Lock size={16} />}</span>
                  <span><span className="block text-sm">{b.label}</span><span className="block text-xs" style={{ color: "#9CA3AF" }}>{b.desc}</span></span>
                </li>
              ))}
            </ul>
          </>
        ); })()}
      </Card>

      <Card className="mb-8">
        <p className="font-display text-xl mb-4">Strengths in {s.exam}</p>
        {sections.length === 0 && <p className="text-sm" style={{ color: "#9CA3AF" }}>Add your subjects on the Dashboard to see your strengths here.</p>}
        <div className="flex flex-col gap-6">
          {sections.map((sec) => {
            const avg = Math.round(sec.topics.reduce((a, t) => a + (m[t] ?? 0), 0) / sec.topics.length);
            return (
              <div key={sec.name}>
                <div className="flex justify-between text-sm mb-2"><span style={{ color: "#EDEAE2" }}>{sec.name}</span><span style={{ color: "#9CA3AF" }}>{avg}% average</span></div>
                <ul className="flex flex-col gap-2">
                  {sec.topics.map((t) => {
                    const v = m[t] ?? 0;
                    return (
                      <li key={t} className="flex items-center gap-3 text-xs">
                        <span className="w-44 truncate" style={{ color: "#9CA3AF" }}>{t}</span>
                        <div className="h-1.5 flex-1 rounded-full" style={{ background: "#1E2433" }}><div className="h-1.5 rounded-full transition-all" style={{ width: `${v}%`, background: tempColor(v) }} /></div>
                        <span className="w-8 text-right" style={{ color: "#9CA3AF" }}>{v}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="font-display text-xl mb-1">Your data</p>
        <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>Everything is stored in this browser. Export it any time, or start fresh.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={exportData} className="btn text-sm inline-flex items-center gap-2"><Download size={14} /> Export as JSON</button>
          <button onClick={actions.loadDemo} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D" }}><Database size={14} /> Fill with demo data</button>
          <button onClick={() => window.confirm("This deletes all your tasks, sessions and doubts. Continue?") && actions.reset()} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#5b2a2a", color: "#F08A7E" }}><RotateCcw size={14} /> Reset everything</button>
        </div>
      </Card>
    </Page>
  );
}