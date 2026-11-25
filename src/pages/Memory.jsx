import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trash2, Check, X, KeyRound, MessageSquare, Search, Plus } from "lucide-react";
import { Page, Card } from "../components/Page";
import Markdown, { plain } from "../components/Markdown";
import { topicsOf } from "../exams";
import { askGroq, MISC } from "../ai";
import { hasApi, getToken } from "../api";
import { actions, useStore, dueDoubts, INTERVALS } from "../store";

const when = (t) => {
  const d = Math.round((t - Date.now()) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
};

// five dots, one per revision step (day 1, 3, 7, 14, 30)
function Steps({ stage }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Revision step ${stage + 1} of ${INTERVALS.length}`}>
      {INTERVALS.map((d, i) => <i key={d} className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: i <= stage ? "#E8A855" : "#2A3042" }} />)}
    </span>
  );
}

function ReviewCard({ d, left }) {
  const [shown, setShown] = useState(false);
  return (
    <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }} className="glass rounded-2xl p-6">
      <div className="flex justify-between text-xs mb-3" style={{ color: "#9CA3AF" }}><span>{d.subject}</span><span>{left} to revise today</span></div>
      <p className="font-display text-xl mb-1">{d.question}</p>
      <p className="text-xs mb-4" style={{ color: "#5B6274" }}>Try to recall the answer in your head first.</p>
      {!shown ? (
        <button onClick={() => setShown(true)} className="btn text-sm">Show the answer</button>
      ) : (
        <>
          <div className="text-sm p-4 rounded-xl mb-4" style={{ background: "rgba(18,21,31,.7)", border: "1px solid #262C3D", color: "#C7C3B8", lineHeight: 1.6 }}>{d.answer ? <Markdown text={d.answer} /> : "You did not save an answer for this one."}</div>
          <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Did you remember it before looking?</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => actions.review(d.id, true)} className="btn text-sm inline-flex items-center gap-2"><Check size={14} /> Yes, push it out</button>
            <button onClick={() => actions.review(d.id, false)} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D" }}><X size={14} /> No, show it again tomorrow</button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function DoubtModal({ d, topics, onClose }) {
  const nav = useNavigate();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const options = [...new Set([...topics, MISC, d.subject].filter(Boolean))];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,10,16,.75)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} role="dialog" aria-modal="true" aria-label="Saved doubt" className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center gap-4 mb-3">
          <label className="text-xs flex items-center gap-2" style={{ color: "#9CA3AF" }}>
            Topic
            <select className="input !w-auto !py-1 !text-xs" value={d.subject} onChange={(e) => actions.updateDoubt(d.id, { subject: e.target.value })} aria-label="Change topic">
              {options.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <button onClick={onClose} aria-label="Close" style={{ color: "#9CA3AF" }}><X size={18} /></button>
        </div>
        <p className="font-display text-2xl mb-4">{d.question}</p>
        <div className="text-sm p-4 rounded-xl mb-4" style={{ background: "rgba(18,21,31,.7)", border: "1px solid #262C3D", color: "#C7C3B8", lineHeight: 1.6 }}>
          {d.answer ? <Markdown text={d.answer} /> : "You did not save an answer for this one."}
        </div>
        <p className="text-xs mb-4 flex items-center gap-3 flex-wrap" style={{ color: "#5B6274" }}>
          <span>Saved {new Date(d.at).toLocaleDateString()}</span><span>Next revision {when(d.nextReview)}</span><Steps stage={d.stage} />
        </p>
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
  const loc = useLocation();
  const server = hasApi && !!getToken();
  const topics = topicsOf(s.exam, s.customSubjects);
  const [subject, setSubject] = useState(topics[0] || "General");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(loc.state?.topic || "All");
  const due = dueDoubts(s);
  const openDoubt = s.doubts.find((d) => d.id === openId);
  const present = useMemo(() => [...new Set(s.doubts.map((d) => d.subject || MISC))], [s.doubts]);
  const shown = s.doubts.filter((d) => (topic === "All" || (d.subject || MISC) === topic) && (!search.trim() || `${d.question} ${d.answer || ""}`.toLowerCase().includes(search.trim().toLowerCase())));
  const next = s.doubts.length ? [...s.doubts].sort((x, y) => x.nextReview - y.nextReview)[0] : null;

  const save = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    actions.addDoubt({ subject, question: q.trim(), answer: a.trim() });
    setQ(""); setA(""); setErr("");
  };
  const draft = async () => {
    if (!q.trim()) return setErr("Type your doubt first.");
    if (!s.groqKey) return setShowKey(true);
    setBusy(true); setErr("");
    try { setA(await askGroq(s.groqKey, s.exam, q)); } catch (e) { setErr(e.message || "Could not reach the AI."); }
    setBusy(false);
  };

  return (
    <Page title="Memory" sub="Every doubt you ask is saved here and comes back for revision at 1, 3, 7, 14 and 30 days, right before you would forget it.">
      <section aria-label="Today's revision" className="mb-8">
        <p className="font-display text-xl mb-3">Today's revision</p>
        {due.length === 0 ? (
          <Card>
            <p className="text-sm" style={{ color: "#C7C3B8" }}>Nothing to revise right now.</p>
            <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
              {next ? <>Next up: &ldquo;{next.question}&rdquo; comes back {when(next.nextReview)}.</> : "Ask a doubt on the Ask page and it will appear here for revision."}
            </p>
          </Card>
        ) : (
          <AnimatePresence mode="wait"><ReviewCard key={due[0].id} d={due[0]} left={due.length} /></AnimatePresence>
        )}
      </section>

      <section aria-label="Your doubts" className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
          <p className="font-display text-xl">Your doubts ({s.doubts.length})</p>
          {s.doubts.length > 0 && (
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5B6274" }} />
              <input className="input !pl-9 !w-56" placeholder="Search your doubts" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search your doubts" />
            </label>
          )}
        </div>
        {present.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {["All", ...present].map((t) => (
              <button key={t} onClick={() => setTopic(t)} className="px-3 py-1 rounded-full text-xs" style={topic === t ? { background: "#E8A855", color: "#12151F" } : { border: "1px solid #262C3D", color: "#9CA3AF" }}>{t}</button>
            ))}
          </div>
        )}
        {s.doubts.length === 0 ? <Card><p className="text-sm" style={{ color: "#9CA3AF" }}>Nothing saved yet. Every doubt you ask on the Ask page lands here automatically, filed under its topic.</p></Card> : shown.length === 0 ? <Card><p className="text-sm" style={{ color: "#9CA3AF" }}>No doubts match that search.</p></Card> : (
          <div className="grid md:grid-cols-2 gap-4">
            {shown.map((d) => (
              <Card key={d.id} className="cursor-pointer transition-colors hover:border-[#E8A855]/40">
                <div role="button" tabIndex={0} aria-label={`Open: ${d.question}`} onClick={() => setOpenId(d.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(d.id))} className="outline-none focus-visible:ring-2 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855" }}>{d.subject || MISC}</span>
                    <button onClick={(e) => { e.stopPropagation(); actions.removeDoubt(d.id); }} aria-label="Delete doubt" style={{ color: "#5B6274" }}><Trash2 size={14} /></button>
                  </div>
                  <p className="text-sm mb-2">{d.question}</p>
                  <p className="text-xs line-clamp-2" style={{ color: "#9CA3AF" }}>{plain(d.answer)}</p>
                  <p className="text-xs mt-3 flex items-center gap-3" style={{ color: "#5B6274" }}><Steps stage={d.stage} /> <span>Revise {when(d.nextReview)}</span></p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <details className="glass rounded-2xl p-5">
        <summary className="cursor-pointer font-display text-lg inline-flex items-center gap-2"><Plus size={16} /> Add a doubt yourself</summary>
        <p className="text-xs mt-2 mb-4" style={{ color: "#9CA3AF" }}>For something you worked out on your own. Doubts you ask on the Ask page are saved automatically, so you do not need this for them.</p>
        <form onSubmit={save} className="flex flex-col gap-3">
          <select className="input !w-auto self-start" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Topic">{topics.map((x) => <option key={x}>{x}</option>)}</select>
          <textarea className="input" rows={2} placeholder="What confused you?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Doubt" />
          <textarea className="input" rows={3} placeholder="Your answer or notes (you will be quizzed on this)" value={a} onChange={(e) => setA(e.target.value)} aria-label="Answer" />
          {err && <p role="alert" className="text-sm" style={{ color: "#F08A7E" }}>{err}</p>}
          <div className="flex gap-3 flex-wrap">
            <button className="btn text-sm">Save to memory</button>
            {!server && <button type="button" onClick={draft} disabled={busy} className="px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 border" style={{ borderColor: "#262C3D" }}><Sparkles size={14} /> {busy ? "Thinking..." : "Draft an answer with AI"}</button>}
            {!server && <button type="button" onClick={() => setShowKey(!showKey)} className="text-xs inline-flex items-center gap-1" style={{ color: "#9CA3AF" }}><KeyRound size={12} /> AI key</button>}
          </div>
          {!server && showKey && (
            <div className="rounded-xl p-4" style={{ background: "rgba(18,21,31,.6)", border: "1px solid #262C3D" }}>
              <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Optional. Paste a free Groq API key to let the AI draft answers. It is stored only in this browser and sent only to Groq. Always check AI answers before trusting them.</p>
              <input className="input" type="password" placeholder="gsk_..." value={s.groqKey} onChange={(e) => actions.setGroqKey(e.target.value.trim())} aria-label="Groq API key" />
            </div>
          )}
        </form>
      </details>

      <AnimatePresence>{openDoubt && <DoubtModal key={openDoubt.id} d={openDoubt} topics={topics} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </Page>
  );
}