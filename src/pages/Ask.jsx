import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Brain, KeyRound, Trash2, Plus, MessageSquare, Tag } from "lucide-react";
import { Page, Card } from "../components/Page";
import Markdown, { plain } from "../components/Markdown";
import { topicsOf } from "../exams";
import { askGroq, classifyGroq, MISC } from "../ai";
import { api, hasApi, getToken } from "../api";
import { related, weakSpots } from "../memory";
import { actions, useStore, uid } from "../store";

const cidOf = (m) => m.cid || "old";

// Group the flat message list into chats: one per conversation id, newest first.
function threadsOf(chat) {
  const map = new Map();
  for (const m of chat) {
    const c = cidOf(m);
    const t = map.get(c) || { cid: c, title: "", at: 0, count: 0 };
    if (!t.title && m.role === "user") t.title = m.text;
    t.at = Math.max(t.at, m.at || 0);
    t.count++;
    map.set(c, t);
  }
  return [...map.values()].sort((a, b) => b.at - a.at);
}

const ago = (t) => {
  const d = Math.floor((Date.now() - t) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
};

export default function Ask() {
  const s = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  const topics = topicsOf(s.exam, s.customSubjects); // the AI files each doubt under one of these
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef(null);
  const seeded = useRef(false);
  const server = hasApi && !!getToken();
  const spots = weakSpots(s.doubts, 4);
  const threads = useMemo(() => threadsOf(s.chat), [s.chat]);
  const [cid, setCid] = useState(() => threads[0]?.cid || uid());
  const messages = s.chat.filter((m) => cidOf(m) === cid);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, busy, cid]);

  // Arriving from a Memory card: open the chat that holds that doubt, or start one seeded with it.
  useEffect(() => {
    const id = loc.state?.doubtId;
    if (!id || seeded.current) return;
    seeded.current = true;
    const existing = s.chat.find((m) => m.doubtId === id);
    if (existing) setCid(cidOf(existing));
    else {
      const d = s.doubts.find((x) => x.id === id);
      if (d) {
        const c = uid();
        actions.addChat({ cid: c, role: "user", text: d.question });
        actions.addChat({ cid: c, role: "ai", text: d.answer || "No answer was saved for this doubt. Ask it again below.", doubtId: d.id, topic: d.subject });
        setCid(c);
      }
    }
    nav(loc.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const newChat = () => { setCid(uid()); setQ(""); setErr(""); };
  const removeThread = (c) => {
    actions.removeChat(c);
    if (c === cid) setCid(threads.find((t) => t.cid !== c)?.cid || uid());
  };

  const send = async (e) => {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    if (!server && !s.groqKey) return setErr("Add a Groq key on the Memory page to get AI answers. Your past doubts are still searched without it.");
    // earlier turns of this chat, so follow-ups like "explain simpler" keep their context
    const history = messages.filter((m) => !m.error).slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setErr(""); setQ(""); setBusy(true);
    actions.addChat({ cid, role: "user", text: question });
    try {
      const id = uid();
      let answer, rel, topic = MISC, warning = null;
      if (server) {
        const r = await api.ask({ id, subject: s.exam, topics, question, history });
        answer = r.answer; rel = r.related || []; warning = r.warning || null; topic = r.topic || MISC;
      } else {
        rel = related(s.doubts, question, 3);
        [answer, topic] = await Promise.all([askGroq(s.groqKey, s.exam, question, rel, history), classifyGroq(s.groqKey, question, topics)]);
      }
      actions.addChat({ cid, role: "ai", text: answer, related: rel.map((r) => ({ id: r.id, question: r.question, subject: r.subject })), doubtId: id, topic, warning });
      actions.addDoubt({ id, subject: topic, question, answer });
    } catch (ex) {
      actions.addChat({ cid, role: "ai", text: ex.message || "Something went wrong. Try again.", error: true });
    }
    setBusy(false);
  };

  return (
    <Page title="Ask" sub="Every answer is filed under the right topic, saved to your memory and scheduled for revision. Your chats are kept too."
      action={<button onClick={newChat} className="btn text-sm inline-flex items-center gap-2"><Plus size={14} /> New chat</button>}>
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass rounded-2xl p-5 min-h-[360px] max-h-[55vh] overflow-y-auto flex flex-col gap-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="m-auto text-center max-w-sm">
                <Brain className="mx-auto mb-3" style={{ color: "#E8A855" }} />
                <p className="font-display text-xl mb-1">Ask your first doubt</p>
                <p className="text-sm" style={{ color: "#9CA3AF" }}>The more you ask, the better MemoAI knows what you keep struggling with.</p>
              </div>
            )}
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%]"}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${m.role === "user" || m.error ? "whitespace-pre-wrap" : ""}`} style={m.role === "user" ? { background: "#E8A855", color: "#12151F" } : { background: "rgba(18,21,31,.75)", border: `1px solid ${m.error ? "#5b2a2a" : "#262C3D"}`, lineHeight: 1.65 }}>{m.role === "user" || m.error ? m.text : <Markdown text={m.text} />}</div>
                {m.topic && <p className="mt-2 text-xs inline-flex items-center gap-1" style={{ color: "#9CA3AF" }}><Tag size={11} style={{ color: "#E8A855" }} /> Saved under {m.topic}</p>}
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
            <input className="input flex-1 min-w-[200px]" placeholder={messages.length ? "Ask a follow-up..." : `Ask anything about ${s.exam}...`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Your doubt" />
            <button className="btn inline-flex items-center gap-2" disabled={busy}><Send size={14} /> Ask</button>
          </form>
          {err && <p role="alert" className="text-sm mt-3 flex items-center gap-2" style={{ color: "#F08A7E" }}><KeyRound size={14} /> {err}</p>}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <p className="font-display text-xl mb-1">Your chats</p>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Deleting a chat keeps its doubts in Memory.</p>
            {threads.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>No chats yet. Ask something and it shows up here.</p> : (
              <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {threads.map((t) => (
                  <li key={t.cid} className="flex items-center gap-1">
                    <button onClick={() => { setCid(t.cid); setErr(""); }} className="flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2" style={{ background: t.cid === cid ? "#1E2433" : "transparent", color: t.cid === cid ? "#E8A855" : "#C7C3B8" }}>
                      <MessageSquare size={14} className="mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate">{plain(t.title) || "Chat"}</span>
                        <span className="block text-[11px]" style={{ color: "#5B6274" }}>{ago(t.at)} · {Math.ceil(t.count / 2)} {Math.ceil(t.count / 2) === 1 ? "question" : "questions"}</span>
                      </span>
                    </button>
                    <button onClick={() => removeThread(t.cid)} aria-label="Delete chat" className="p-2" style={{ color: "#5B6274" }}><Trash2 size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="font-display text-xl mb-1">Weak spots</p>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Topics where you keep asking, or forgot something in revision.</p>
            {spots.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Nothing weak yet. A topic shows up here when you ask 2 or more doubts in it, or forget a doubt during revision.</p> : (
              <ul className="flex flex-col gap-3">
                {spots.map((w) => (
                  <li key={w.topic} className="flex items-center justify-between gap-3 text-sm">
                    <span>{w.topic}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855" }}>{w.why}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}