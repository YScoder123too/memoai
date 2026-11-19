import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trash2, Check, X, KeyRound, MessageSquare } from "lucide-react";
import { Page, Card } from "../components/Page";
import Markdown, { plain } from "../components/Markdown";
import { topicsOf } from "../exams";
import { askGroq } from "../ai";
import { actions, useStore, dueDoubts, INTERVALS } from "../store";

const when = (t) => {
  const d = Math.round((t - Date.now()) / 86400000);
  return d <= 0 ? "due now" : d === 1 ? "tomorrow" : `in ${d} days`;
};

function ReviewCard({ d, left }) {
  const [shown, setShown] = useState(false);
  return (
    <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }} className="glass rounded-2xl p-6">
      <div className="flex justify-between text-xs mb-3" style={{ color: "#9CA3AF" }}><span>{d.subject}</span><span>{left} left today</span></div>
      <p className="font-display text-xl mb-4">{d.question}</p>
      {!shown ? (
        <button onClick={() => setShown(true)} className="btn text-sm">Show my answer</button>
      ) : (
        <>
          <div className="text-sm p-4 rounded-xl mb-4" style={{ background: "rgba(18,21,31,.7)", border: "1px solid #262C3D", color: "#C7C3B8", lineHeight: 1.6 }}>{d.answer ? <Markdown text={d.answer} /> : "You did not save an answer for this one."}</div>
          <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Did you remember it before looking?</p>
          <div className="flex gap-3">
            <button onClick={() => actions.review(d.id, true)} className="btn text-sm inline-flex items-center gap-2"><Check size={14} /> Yes, push it out</button>
            <button onClick={() => actions.review(d.id, false)} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D" }}><X size={14} /> No, see it tomorrow</button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function DoubtModal({ d, onClose }) {
  const nav = useNavigate();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,10,16,.75)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} role="dialog" aria-modal="true" aria-label="Saved doubt" className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-4 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855" }}>{d.subject}</span>
          <button onClick={onClose} aria-label="Close" style={{ color: "#9CA3AF" }}><X size={18} /></button>
        </div>
        <p className="font-display text-2xl mb-4">{d.question}</p>
        <div className="text-sm p-4 rounded-xl mb-4" style={{ background: "rgba(18,21,31,.7)", border: "1px solid #262C3D", color: "#C7C3B8", lineHeight: 1.6 }}>
          {d.answer ? <Markdown text={d.answer} /> : "You did not save an answer for this one."}
        </div>
        <p className="text-xs mb-4" style={{ color: "#5B6274" }}>Saved {new Date(d.at).toLocaleDateString()} · next review {when(d.nextReview)} · step {d.stage + 1} of {INTERVALS.length}</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => nav("/ask", { state: { doubtId: d.id } })} className="btn text-sm inline-flex items-center gap-2"><MessageSquare size={14} /> Continue in chat</button>
          <button onClick={() => { actions.removeDoubt(d.id); onClose(); }} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D", color: "#F08A7E" }}><Trash2 size={14} /> Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Memory() {
  const s = useStore();
  const subjects = topicsOf(s.exam, s.customSubjects);
  const [subject, setSubject] = useState(subjects[0] || "General");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showKey, setShowKey] = useState(false);
  const due = dueDoubts(s);
  const [openId, setOpenId] = useState(null);
  const openDoubt = s.doubts.find((d) => d.id === openId);

  const save = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    actions.addDoubt({ subject, question: q.trim(), answer: a.trim() });
    setQ(""); setA(""); setErr("");
  };
  const ask = async () => {
    if (!q.trim()) return setErr("Type your doubt first.");
    if (!s.groqKey) return setShowKey(true);
    setBusy(true); setErr("");
    try { setA(await askGroq(s.groqKey, subject, q)); } catch (e) { setErr(e.message || "Could not reach the AI."); }
    setBusy(false);
  };

  return (
    <Page title="Memory" sub="Save a doubt once. MemoAI brings it back at 1, 3, 7, 14 and 30 days.">
      <section aria-label="Review queue" className="mb-8">
        <p className="font-display text-xl mb-3">Review queue</p>
        {due.length === 0 ? (
          <Card><p className="text-sm" style={{ color: "#9CA3AF" }}>Nothing is due. {s.doubts.length ? "Your next review is " + when(Math.min(...s.doubts.map((d) => d.nextReview))) + "." : "Save a doubt below to start your queue."}</p></Card>
        ) : (
          <AnimatePresence mode="wait"><ReviewCard key={due[0].id} d={due[0]} left={due.length} /></AnimatePresence>
        )}
      </section>

      <Card className="mb-8">
        <form onSubmit={save} className="flex flex-col gap-3">
          <p className="font-display text-xl">Save a new doubt</p>
          <select className="input !w-auto self-start" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">{subjects.map((x) => <option key={x}>{x}</option>)}</select>
          <textarea className="input" rows={2} placeholder="What confused you?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Doubt" />
          <textarea className="input" rows={3} placeholder="Your answer or notes (you will be quizzed on this)" value={a} onChange={(e) => setA(e.target.value)} aria-label="Answer" />
          {err && <p role="alert" className="text-sm" style={{ color: "#F08A7E" }}>{err}</p>}
          <div className="flex gap-3 flex-wrap">
            <button className="btn text-sm">Save to memory</button>
            <button type="button" onClick={ask} disabled={busy} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D" }}><Sparkles size={14} /> {busy ? "Thinking..." : "Draft an answer with AI"}</button>
            <button type="button" onClick={() => setShowKey(!showKey)} className="text-xs inline-flex items-center gap-1" style={{ color: "#9CA3AF" }}><KeyRound size={12} /> AI key</button>
          </div>
          {showKey && (
            <div className="rounded-xl p-4" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}>
              <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Optional. Paste a free Groq API key to let the AI draft answers. It is stored only in this browser and sent only to Groq. Always check AI answers before trusting them.</p>
              <input className="input" type="password" placeholder="gsk_..." value={s.groqKey} onChange={(e) => actions.setGroqKey(e.target.value.trim())} aria-label="Groq API key" />
            </div>
          )}
        </form>
      </Card>

      <p className="font-display text-xl mb-3">Everything you have saved ({s.doubts.length})</p>
      {s.doubts.length === 0 ? <Card><p className="text-sm" style={{ color: "#9CA3AF" }}>Empty for now. Your saved doubts will show here with their next review date.</p></Card> : (
        <div className="grid md:grid-cols-2 gap-4">
          {s.doubts.map((d) => (
            <Card key={d.id} className="cursor-pointer transition-colors hover:border-[#E8A855]/40">
              <div role="button" tabIndex={0} aria-label={`Open: ${d.question}`} onClick={() => setOpenId(d.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(d.id))} className="outline-none focus-visible:ring-2 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855" }}>{d.subject}</span>
                <button onClick={(e) => { e.stopPropagation(); actions.removeDoubt(d.id); }} aria-label="Delete doubt" style={{ color: "#5B6274" }}><Trash2 size={14} /></button>
              </div>
              <p className="text-sm mb-2">{d.question}</p>
              <p className="text-xs line-clamp-2" style={{ color: "#9CA3AF" }}>{plain(d.answer)}</p>
              <p className="text-xs mt-3" style={{ color: "#5B6274" }}>Next review {when(d.nextReview)} · step {d.stage + 1} of {INTERVALS.length}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
      <AnimatePresence>{openDoubt && <DoubtModal key={openDoubt.id} d={openDoubt} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </Page>
  );
}