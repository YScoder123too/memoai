import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import AmbientBackground from "../components/AmbientBackground";
import { GOALS, EXAM_NAMES } from "../exams";
import { actions, useStore } from "../store";

export default function Onboarding() {
  const s = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [exam, setExam] = useState("University Finals");
  const [date, setDate] = useState("");
  if (!s.user) return <Navigate to="/login" replace />;

  const finish = () => { actions.setPrefs({ goal, exam, examDate: date }); nav("/dashboard"); };
  const steps = [
    <div key="g">
      <h1 className="font-display text-3xl mb-2">What are you working towards?</h1>
      <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>This shapes the starting subjects on your dashboard.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {GOALS.map((g) => (
          <button key={g.id} onClick={() => { setGoal(g.id); setStep(1); }} className="glass rounded-2xl p-5 text-left hover:-translate-y-1 transition" style={goal === g.id ? { borderColor: "#E8A855" } : {}}>
            <p className="font-display text-lg">{g.title}</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{g.note}</p>
          </button>
        ))}
      </div>
    </div>,
    <div key="e">
      <h1 className="font-display text-3xl mb-2">Which exam are you preparing for?</h1>
      <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>You can switch this any time from the dashboard.</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {EXAM_NAMES.map((e) => (
          <button key={e} onClick={() => setExam(e)} className="px-4 py-2 rounded-full text-sm transition" style={exam === e ? { background: "#E8A855", color: "#12151F" } : { background: "rgba(26,30,43,.6)", border: "1px solid #262C3D" }}>{e}</button>
        ))}
      </div>
      <label className="text-sm block mb-2" style={{ color: "#9CA3AF" }}>Exam date (optional)</label>
      <input type="date" className="input max-w-xs" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="mt-8 flex gap-3">
        <button onClick={() => setStep(0)} className="px-4 py-2 text-sm" style={{ color: "#9CA3AF" }}>Back</button>
        <button onClick={() => setStep(2)} className="btn">Continue</button>
      </div>
    </div>,
    <div key="r" className="text-center">
      <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(232,168,85,.15)" }}><Check style={{ color: "#E8A855" }} /></div>
      <h1 className="font-display text-3xl mb-2">Your space is ready, {s.user.name.split(" ")[0]}.</h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>Preparing for {exam}. Start by adding a task or saving your first doubt.</p>
      <button onClick={finish} className="btn">Open my dashboard</button>
    </div>,
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center px-5 py-10">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex gap-2 mb-8 justify-center">
          {[0, 1, 2].map((i) => <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 36 : 12, background: i <= step ? "#E8A855" : "#262C3D" }} />)}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
