import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, CalendarCheck, Timer, Layers, ArrowRight, ExternalLink } from "lucide-react";
import AmbientBackground from "../components/AmbientBackground";
import { EXAM_NAMES } from "../exams";
import { useStore } from "../store";

// Forgetting curve: memory decays, each review lifts it and slows the decay.
function ForgettingCurve() {
  const W = 560, H = 260, pad = 28;
  const reviews = [0, 1, 3, 7, 14];
  const pts = [];
  let strength = 1.2;
  for (let i = 0; i < reviews.length; i++) {
    const start = reviews[i];
    const end = i + 1 < reviews.length ? reviews[i + 1] : 24;
    for (let t = start; t <= end; t += 0.25) pts.push([t, Math.exp(-(t - start) / strength)]);
    strength *= 2.4;
  }
  const x = (t) => pad + (t / 24) * (W - pad * 2);
  const y = (v) => H - pad - v * (H - pad * 2);
  const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const plain = Array.from({ length: 97 }, (_, i) => i * 0.25).map((t, i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(Math.exp(-t / 1.2)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Memory strength over 24 days. Without review it drops within days. With reviews on day 1, 3, 7 and 14 it stays high.">
      {[0.25, 0.5, 0.75, 1].map((v) => <line key={v} x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.06)" />)}
      <path d={plain} fill="none" stroke="#5B6274" strokeWidth="2" strokeDasharray="4 5" />
      <motion.path d={d} fill="none" stroke="#E8A855" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.2, ease: "easeInOut", delay: 0.5 }} style={{ filter: "drop-shadow(0 0 8px rgba(232,168,85,.55))" }} />
      {reviews.slice(1).map((t, i) => (
        <motion.g key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 0.7 }}>
          <circle cx={x(t)} cy={y(1)} r="5" fill="#E8A855" />
          <text x={x(t)} y={y(1) - 12} textAnchor="middle" fontSize="11" fill="#9CA3AF">day {t}</text>
        </motion.g>
      ))}
      <text x={x(5.5)} y={y(0.12)} fontSize="12" fill="#5B6274">without review</text>
      <text x={W - pad} y={H - 6} textAnchor="end" fontSize="11" fill="#5B6274">days</text>
    </svg>
  );
}

const features = [
  { icon: Brain, title: "It remembers your doubts", text: "Save a question and your answer. MemoAI keeps it and schedules it for review at 1, 3, 7, 14 and 30 days." },
  { icon: Layers, title: "Heatmap of what is weak", text: "Rate each subject after a session. Cold tiles are the ones you are neglecting, so you see where to spend tomorrow." },
  { icon: CalendarCheck, title: "A planner that stays in sync", text: "Tasks, focus sessions and reviews feed one dashboard. Nothing lives in a separate tab you forget about." },
  { icon: Timer, title: "Focus sessions that count", text: "Every finished session is logged by subject, so your streak and weekly hours are real numbers." },
];

const research = [
  { cite: "Roediger & Karpicke, 2006", title: "Taking a test beats re-reading", text: "Students who practised recall remembered far more after a week than students who studied the same text again.", href: "https://doi.org/10.1111/j.1467-9280.2006.01693.x" },
  { cite: "Cepeda et al., 2006", title: "Spacing study sessions apart helps", text: "A review of 317 experiments found that spreading practice over time improves long-term retention compared with massing it.", href: "https://doi.org/10.1037/0033-2909.132.3.354" },
  { cite: "Dunlosky et al., 2013", title: "Which study habits actually work", text: "Practice testing and distributed practice were the two techniques rated highest in a large review of learning methods.", href: "https://doi.org/10.1177/1529100612453266" },
];

export default function Landing() {
  const s = useStore();
  const cta = s.user ? "/dashboard" : "/signup";
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 md:px-12 py-6 max-w-6xl mx-auto">
          <span className="font-display text-2xl" style={{ color: "#F5F2EA" }}>MemoAI</span>
          <div className="flex items-center gap-3">
            <Link to={s.user ? "/dashboard" : "/login"} className="text-sm px-4 py-2" style={{ color: "#9CA3AF" }}>{s.user ? "Open app" : "Log in"}</Link>
            {!s.user && <Link to="/signup" className="btn text-sm">Get started</Link>}
          </div>
        </header>

        <section className="px-6 md:px-12 max-w-6xl mx-auto pt-10 pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-display text-5xl md:text-6xl leading-[1.05]" style={{ color: "#F5F2EA" }}>
              Study smarter, remember longer.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-6 text-lg max-w-md" style={{ color: "#9CA3AF", lineHeight: 1.6 }}>
              MemoAI keeps every doubt you have and brings it back right before you would forget it. Pick your exam, plan your days, and let the revision queue run itself.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex gap-3 flex-wrap">
              <Link to={cta} className="btn inline-flex items-center gap-2">Start for free <ArrowRight size={16} /></Link>
              <a href="#why" className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: "#262C3D", color: "#EDEAE2" }}>See why it works</a>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }} className="glass rounded-3xl p-6">
            <p className="font-display text-lg mb-1">What you remember over time</p>
            <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>Illustrative curve. Each review lifts memory and slows the next drop.</p>
            <ForgettingCurve />
          </motion.div>
        </section>

        <section className="px-6 md:px-12 max-w-6xl mx-auto pb-24">
          <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>Works for any exam you pick</p>
          <div className="flex flex-wrap gap-2">
            {EXAM_NAMES.map((e) => <span key={e} className="px-4 py-1.5 rounded-full text-sm glass">{e}</span>)}
          </div>
        </section>

        <section className="px-6 md:px-12 max-w-6xl mx-auto pb-24 grid sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, text }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (i % 2) * 0.1 }} className="glass rounded-2xl p-6">
              <Icon size={20} style={{ color: "#E8A855" }} />
              <h3 className="font-display text-xl mt-4 mb-2">{title}</h3>
              <p className="text-sm" style={{ color: "#9CA3AF", lineHeight: 1.6 }}>{text}</p>
            </motion.div>
          ))}
        </section>

        <section id="why" className="px-6 md:px-12 max-w-6xl mx-auto pb-24">
          <h2 className="font-display text-3xl md:text-4xl mb-2" style={{ color: "#F5F2EA" }}>The method is not new. It is just hard to keep up.</h2>
          <p className="text-sm mb-8 max-w-xl" style={{ color: "#9CA3AF" }}>Decades of memory research point to the same two habits. MemoAI automates the scheduling so you only do the studying.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {research.map((r) => (
              <a key={r.href} href={r.href} target="_blank" rel="noreferrer" className="glass rounded-2xl p-6 block hover:-translate-y-1 transition">
                <p className="text-xs mb-3" style={{ color: "#E8A855" }}>{r.cite}</p>
                <h3 className="font-display text-lg mb-2">{r.title}</h3>
                <p className="text-sm mb-4" style={{ color: "#9CA3AF", lineHeight: 1.6 }}>{r.text}</p>
                <span className="text-xs inline-flex items-center gap-1" style={{ color: "#EDEAE2" }}>Read the paper <ExternalLink size={12} /></span>
              </a>
            ))}
          </div>
        </section>

        <footer className="px-6 md:px-12 max-w-6xl mx-auto pb-12 pt-6 border-t text-xs flex justify-between flex-wrap gap-2" style={{ borderColor: "#242938", color: "#5B6274" }}>
          <span>MemoAI, a student project.</span>
          <span>Your data stays in your browser.</span>
        </footer>
      </div>
    </div>
  );
}
