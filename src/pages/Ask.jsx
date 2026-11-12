// import { useEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { Send, Brain, KeyRound, Trash2 } from "lucide-react";
// import { Page, Card } from "../components/Page";
// import { topicsOf } from "../exams";
// import { askGroq } from "../ai";
// import { api, hasApi, getToken } from "../api";
// import { related, weakSpots } from "../memory";
// import { actions, useStore, uid } from "../store";

// export default function Ask() {
//   const s = useStore();
//   const subjects = topicsOf(s.exam, s.customSubjects);
//   const [subject, setSubject] = useState(subjects[0] || "General");
//   const [q, setQ] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState("");
//   const end = useRef(null);
//   const server = hasApi && !!getToken();
//   const spots = weakSpots(s.doubts, 4);

//   useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [s.chat.length, busy]);

//   const send = async (e) => {
//     e.preventDefault();
//     const question = q.trim();
//     if (!question || busy) return;
//     if (!server && !s.groqKey) return setErr("Add a Groq key on the Memory page to get AI answers. Your past doubts are still searched without it.");
//     setErr(""); setQ(""); setBusy(true);
//     actions.addChat({ role: "user", text: question, subject });
//     try {
//       const id = uid();
//       let answer, rel, warning = null;
//       if (server) {
//         const r = await api.ask({ id, subject, question });
//         answer = r.answer; rel = r.related || []; warning = r.warning || null;
//       } else {
//         rel = related(s.doubts, question, 3);
//         answer = await askGroq(s.groqKey, subject, question, rel);
//       }
//       actions.addChat({ role: "ai", text: answer, related: rel.map((r) => ({ id: r.id, question: r.question, subject: r.subject })), doubtId: id, warning });
//       actions.addDoubt({ id, subject, question, answer });
//     } catch (ex) {
//       actions.addChat({ role: "ai", text: ex.message || "Something went wrong. Try again.", error: true });
//     }
//     setBusy(false);
//   };

//   return (
//     <Page title="Ask" sub="Every answer is saved to your memory and scheduled for review. Related past doubts are pulled in automatically."
//       action={s.chat.length > 0 && <button onClick={actions.clearChat} className="text-xs inline-flex items-center gap-1" style={{ color: "#9CA3AF" }}><Trash2 size={12} /> Clear chat</button>}>
//       <div className="grid lg:grid-cols-3 gap-6 items-start">
//         <div className="lg:col-span-2 flex flex-col">
//           <div className="glass rounded-2xl p-5 min-h-[360px] max-h-[55vh] overflow-y-auto flex flex-col gap-4" aria-live="polite">
//             {s.chat.length === 0 && (
//               <div className="m-auto text-center max-w-sm">
//                 <Brain className="mx-auto mb-3" style={{ color: "#E8A855" }} />
//                 <p className="font-display text-xl mb-1">Ask your first doubt</p>
//                 <p className="text-sm" style={{ color: "#9CA3AF" }}>The more you ask, the better MemoAI knows what you keep struggling with.</p>
//               </div>
//             )}
//             {s.chat.map((m) => (
//               <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%]"}>
//                 <div className="rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap" style={m.role === "user" ? { background: "#E8A855", color: "#12151F" } : { background: "rgba(18,21,31,.75)", border: `1px solid ${m.error ? "#5b2a2a" : "#262C3D"}`, lineHeight: 1.65 }}>{m.text}</div>
//                 {m.warning && <p className="mt-2 text-xs" style={{ color: "#C9A36A" }}>{m.warning}</p>}
//                 {m.related?.length > 0 && (
//                   <div className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>
//                     <span className="inline-flex items-center gap-1 mb-1" style={{ color: "#E8A855" }}><Brain size={12} /> Connected to what you asked before</span>
//                     <ul className="flex flex-col gap-1">{m.related.map((r) => <li key={r.id} className="truncate">&ldquo;{r.question}&rdquo; <span style={{ color: "#5B6274" }}>({r.subject})</span></li>)}</ul>
//                   </div>
//                 )}
//               </motion.div>
//             ))}
//             {busy && <p className="text-sm self-start" style={{ color: "#9CA3AF" }}>Searching your memory and thinking...</p>}
//             <div ref={end} />
//           </div>
//           <form onSubmit={send} className="mt-4 flex gap-3 flex-wrap">
//             <select className="input !w-auto" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">{subjects.map((x) => <option key={x}>{x}</option>)}</select>
//             <input className="input flex-1 min-w-[200px]" placeholder="Type your doubt..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Your doubt" />
//             <button className="btn inline-flex items-center gap-2" disabled={busy}><Send size={14} /> Ask</button>
//           </form>
//           {err && <p role="alert" className="text-sm mt-3 flex items-center gap-2" style={{ color: "#F08A7E" }}><KeyRound size={14} /> {err}</p>}
//         </div>

//         <Card>
//           <p className="font-display text-xl mb-1">Recurring weak spots</p>
//           <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Concepts you ask about repeatedly or forget in review.</p>
//           {spots.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Nothing recurring yet. Weak spots appear once a concept comes up more than once.</p> : (
//             <ul className="flex flex-col gap-3">
//               {spots.map((w) => (
//                 <li key={w.tag} className="flex items-center justify-between text-sm">
//                   <span>{w.tag} <span className="text-xs" style={{ color: "#5B6274" }}>{w.subject}</span></span>
//                   <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855" }}>asked {w.asked}x{w.forgot ? `, forgot ${w.forgot}x` : ""}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </Card>
//       </div>
//     </Page>
//   );
// }


import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Brain, KeyRound, Trash2 } from "lucide-react";
import { Page, Card } from "../components/Page";
import Markdown from "../components/Markdown";
import { topicsOf } from "../exams";
import { askGroq } from "../ai";
import { api, hasApi, getToken } from "../api";
import { related, weakSpots } from "../memory";
import { actions, useStore, uid } from "../store";

export default function Ask() {
  const s = useStore();
  const subjects = topicsOf(s.exam, s.customSubjects);
  const [subject, setSubject] = useState(subjects[0] || "General");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef(null);
  const server = hasApi && !!getToken();
  const spots = weakSpots(s.doubts, 4);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [s.chat.length, busy]);

  const send = async (e) => {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    if (!server && !s.groqKey) return setErr("Add a Groq key on the Memory page to get AI answers. Your past doubts are still searched without it.");
    setErr(""); setQ(""); setBusy(true);
    actions.addChat({ role: "user", text: question, subject });
    try {
      const id = uid();
      let answer, rel, warning = null;
      if (server) {
        const r = await api.ask({ id, subject, question });
        answer = r.answer; rel = r.related || []; warning = r.warning || null;
      } else {
        rel = related(s.doubts, question, 3);
        answer = await askGroq(s.groqKey, subject, question, rel);
      }
      actions.addChat({ role: "ai", text: answer, related: rel.map((r) => ({ id: r.id, question: r.question, subject: r.subject })), doubtId: id, warning });
      actions.addDoubt({ id, subject, question, answer });
    } catch (ex) {
      actions.addChat({ role: "ai", text: ex.message || "Something went wrong. Try again.", error: true });
    }
    setBusy(false);
  };

  return (
    <Page title="Ask" sub="Every answer is saved to your memory and scheduled for review. Related past doubts are pulled in automatically."
      action={s.chat.length > 0 && <button onClick={actions.clearChat} className="text-xs inline-flex items-center gap-1" style={{ color: "#9CA3AF" }}><Trash2 size={12} /> Clear chat</button>}>
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass rounded-2xl p-5 min-h-[360px] max-h-[55vh] overflow-y-auto flex flex-col gap-4" aria-live="polite">
            {s.chat.length === 0 && (
              <div className="m-auto text-center max-w-sm">
                <Brain className="mx-auto mb-3" style={{ color: "#E8A855" }} />
                <p className="font-display text-xl mb-1">Ask your first doubt</p>
                <p className="text-sm" style={{ color: "#9CA3AF" }}>The more you ask, the better MemoAI knows what you keep struggling with.</p>
              </div>
            )}
            {s.chat.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%]"}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${m.role === "user" || m.error ? "whitespace-pre-wrap" : ""}`} style={m.role === "user" ? { background: "#E8A855", color: "#12151F" } : { background: "rgba(18,21,31,.75)", border: `1px solid ${m.error ? "#5b2a2a" : "#262C3D"}`, lineHeight: 1.65 }}>{m.role === "user" || m.error ? m.text : <Markdown text={m.text} />}</div>
                {m.warning && <p className="mt-2 text-xs" style={{ color: "#C9A36A" }}>{m.warning}</p>}
                {m.related?.length > 0 && (
                  <div className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>
                    <span className="inline-flex items-center gap-1 mb-1" style={{ color: "#E8A855" }}><Brain size={12} /> Connected to what you asked before</span>
                    <ul className="flex flex-col gap-1">{m.related.map((r) => <li key={r.id} className="truncate">&ldquo;{r.question}&rdquo; <span style={{ color: "#5B6274" }}>({r.subject})</span></li>)}</ul>
                  </div>
                )}
              </motion.div>
            ))}
            {busy && <p className="text-sm self-start" style={{ color: "#9CA3AF" }}>Searching your memory and thinking...</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="mt-4 flex gap-3 flex-wrap">
            <select className="input !w-auto" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">{subjects.map((x) => <option key={x}>{x}</option>)}</select>
            <input className="input flex-1 min-w-[200px]" placeholder="Type your doubt..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Your doubt" />
            <button className="btn inline-flex items-center gap-2" disabled={busy}><Send size={14} /> Ask</button>
          </form>
          {err && <p role="alert" className="text-sm mt-3 flex items-center gap-2" style={{ color: "#F08A7E" }}><KeyRound size={14} /> {err}</p>}
        </div>

        <Card>
          <p className="font-display text-xl mb-1">Recurring weak spots</p>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Concepts you ask about repeatedly or forget in review.</p>
          {spots.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Nothing recurring yet. Weak spots appear once a concept comes up more than once.</p> : (
            <ul className="flex flex-col gap-3">
              {spots.map((w) => (
                <li key={w.tag} className="flex items-center justify-between text-sm">
                  <span>{w.tag} <span className="text-xs" style={{ color: "#5B6274" }}>{w.subject}</span></span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855" }}>asked {w.asked}x{w.forgot ? `, forgot ${w.forgot}x` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
}