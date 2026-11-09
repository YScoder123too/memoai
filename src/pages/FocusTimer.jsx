// import { useEffect, useRef, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import { Play, Pause, Square, CloudRain, Waves, Wind, Music, VolumeX, Coffee, Check, Volume2 } from "lucide-react";
// import { Page, Card } from "../components/Page";
// import FocusScene from "../components/FocusScene";
// import { topicsOf } from "../exams";
// import { SOUNDS, startSound, stopSound, setVolume, chime } from "../sound";
// import { actions, useStore, minutesOn } from "../store";

// const PRESETS = [15, 25, 45, 60, 90];
// const BREAK = 5;
// const ICONS = { off: VolumeX, rain: CloudRain, waves: Waves, brown: Wind, pad: Music };
// const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
// const clampLen = (n) => Math.min(240, Math.max(1, Math.round(Number(n) || 0)));

// export default function FocusTimer() {
//   const s = useStore();
//   const subjects = topicsOf(s.exam, s.customSubjects);
//   const [subject, setSubject] = useState(subjects[0]);
//   const [len, setLen] = useState(45);
//   const [custom, setCustom] = useState("");
//   const [sound, setSound] = useState("rain");
//   const [vol, setVol] = useState(0.5);
//   const [phase, setPhase] = useState("idle"); // idle | active | done
//   const [mode, setMode] = useState("focus"); // focus | break
//   const [running, setRunning] = useState(false);
//   const [left, setLeft] = useState(len * 60);
//   const [summary, setSummary] = useState(0);
//   const endRef = useRef(0);
//   const total = (mode === "focus" ? len : BREAK) * 60;

//   useEffect(() => { if (!subjects.includes(subject)) setSubject(subjects[0]); }, [s.exam, s.customSubjects]); // eslint-disable-line
//   useEffect(() => { if (phase === "idle") setLeft(len * 60); }, [len, phase]);
//   useEffect(() => { setVolume(vol); }, [vol]);
//   useEffect(() => () => stopSound(), []);

//   // tab title shows the countdown, so you can keep the tab in the background
//   useEffect(() => {
//     const base = document.title;
//     if (phase === "active") document.title = `${fmt(left)} ${mode === "focus" ? "Focus" : "Break"} | MemoAI`;
//     return () => { document.title = base; };
//   }, [left, phase, mode]);

//   useEffect(() => {
//     if (!running) return;
//     const id = setInterval(() => {
//       const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
//       setLeft(rem);
//       if (rem === 0) {
//         setRunning(false);
//         if (mode === "focus") { actions.logSession(subject, len); setSummary(len); setPhase("done"); chime(); stopSound(); }
//         else { chime(); setPhase("idle"); stopSound(); }
//       }
//     }, 250);
//     return () => clearInterval(id);
//   }, [running, mode, subject, len]);

//   const begin = (m = "focus") => {
//     const secs = (m === "focus" ? len : BREAK) * 60;
//     setMode(m); setLeft(secs); endRef.current = Date.now() + secs * 1000;
//     setPhase("active"); setRunning(true);
//     startSound(m === "break" ? "off" : sound); // the click that starts the session also unlocks audio
//   };
//   const toggle = () => { if (!running) endRef.current = Date.now() + left * 1000; setRunning(!running); };
//   // ending early still saves the time you actually studied, if it was at least a minute
//   const endSession = () => {
//     if (mode === "focus") { const spent = Math.floor((total - left) / 60); if (spent >= 1) actions.logSession(subject, spent); }
//     setRunning(false); setPhase("idle"); stopSound();
//   };
//   const pickSound = (id) => { setSound(id); if (phase === "active" && mode === "focus") startSound(id); };
//   const pickLen = (n) => { setLen(n); setCustom(""); };

//   const todayMin = minutesOn(s, new Date().setHours(0, 0, 0, 0));
//   const todayCount = s.sessions.filter((x) => x.at >= new Date().setHours(0, 0, 0, 0)).length;
//   const recent = [...s.sessions].reverse().slice(0, 5);
//   const r = 140, c = 2 * Math.PI * r;
//   const progress = total ? 1 - left / total : 0;

//   const soundPicker = (compact) => (
//     <div className={`flex flex-wrap items-center gap-2 ${compact ? "justify-center" : ""}`}>
//       {SOUNDS.map(({ id, label }) => {
//         const Icon = ICONS[id];
//         const on = sound === id;
//         return (
//           <button key={id} onClick={() => pickSound(id)} aria-pressed={on} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition" style={on ? { background: "#E8A855", color: "#12151F" } : { border: "1px solid rgba(255,255,255,.14)", color: "#C7C3B8" }}>
//             <Icon size={14} /> {label}
//           </button>
//         );
//       })}
//       <label className="inline-flex items-center gap-2 text-xs ml-1" style={{ color: "#9CA3AF" }}>
//         <Volume2 size={14} />
//         <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => setVol(Number(e.target.value))} aria-label="Volume" className="w-24 accent-[#E8A855]" />
//       </label>
//     </div>
//   );

//   return (
//     <Page title="Focus timer" sub="Pick a subject and a length. Finished sessions feed your dashboard and streak.">
//       <div className="grid lg:grid-cols-5 gap-6 items-start">
//         <Card className="lg:col-span-3">
//           <label className="text-xs block mb-2" style={{ color: "#9CA3AF" }}>What are you studying?</label>
//           <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input mb-6" aria-label="Subject">{subjects.map((x) => <option key={x}>{x}</option>)}</select>

//           <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Length</p>
//           <div className="flex flex-wrap items-center gap-2 mb-6">
//             {PRESETS.map((n) => (
//               <button key={n} onClick={() => pickLen(n)} className="px-4 py-2 rounded-xl text-sm" style={len === n && !custom ? { background: "#E8A855", color: "#12151F" } : { border: "1px solid #262C3D", color: "#9CA3AF" }}>{n} min</button>
//             ))}
//             <div className="flex items-center gap-2">
//               <input type="number" min="1" max="240" placeholder="Custom" value={custom} onChange={(e) => { setCustom(e.target.value); if (e.target.value) setLen(clampLen(e.target.value)); }} className="input !w-28" aria-label="Custom minutes" />
//               <span className="text-xs" style={{ color: "#5B6274" }}>min (1 to 240)</span>
//             </div>
//           </div>

//           <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Background sound</p>
//           <div className="mb-8">{soundPicker(false)}</div>

//           <button onClick={() => begin("focus")} className="btn inline-flex items-center gap-2 text-base px-6 py-3"><Play size={18} /> Begin {len} minute session</button>
//           <p className="text-xs mt-3" style={{ color: "#5B6274" }}>Sounds are generated in your browser. Headphones recommended. You can also play your own music in another tab.</p>
//         </Card>

//         <div className="lg:col-span-2 flex flex-col gap-6">
//           <div className="grid grid-cols-2 gap-4">
//             <Card className="text-center"><p className="text-xs" style={{ color: "#9CA3AF" }}>Sessions today</p><p className="font-display text-3xl">{todayCount}</p></Card>
//             <Card className="text-center"><p className="text-xs" style={{ color: "#9CA3AF" }}>Focused today</p><p className="font-display text-3xl">{todayMin >= 60 ? `${Math.floor(todayMin / 60)}h ${todayMin % 60}m` : `${todayMin}m`}</p></Card>
//           </div>
//           <Card>
//             <p className="font-display text-xl mb-3">Recent sessions</p>
//             {recent.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Your finished sessions will appear here.</p> : (
//               <ul className="flex flex-col gap-2">
//                 {recent.map((x) => <li key={x.id} className="flex justify-between text-sm"><span className="truncate pr-3">{x.subject}</span><span style={{ color: "#9CA3AF" }}>{x.minutes} min · {new Date(x.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></li>)}
//               </ul>
//             )}
//           </Card>
//         </div>
//       </div>

//       {/* Full-screen focus room */}
//       <AnimatePresence>
//         {phase !== "idle" && (
//           <motion.div key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6" style={{ background: "radial-gradient(ellipse at 50% 40%, #1a1d2c 0%, #0b0d15 70%)" }} role="dialog" aria-label="Focus session">
//             <FocusScene running={running} />
//             <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 45%, rgba(232,168,85,.10), transparent 55%)" }} />

//             {phase === "active" && (
//               <div className="relative flex flex-col items-center">
//                 <p className="font-display text-xl mb-1" style={{ color: "#C7C3B8" }}>{mode === "focus" ? subject : "Take a breath"}</p>
//                 <p className="text-xs mb-8" style={{ color: "#5B6274" }}>{mode === "focus" ? (running ? "Stay with it" : "Paused") : "Short break"}</p>
//                 <motion.div animate={running ? { scale: [1, 1.025, 1] } : { scale: 1 }} transition={{ duration: 5, repeat: running ? Infinity : 0, ease: "easeInOut" }} className="relative" style={{ width: 300, height: 300 }}>
//                   <svg viewBox="0 0 300 300" width="100%" height="100%" className="-rotate-90" aria-hidden>
//                     <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD596" /><stop offset="100%" stopColor="#E8A855" /></linearGradient></defs>
//                     <circle cx="150" cy="150" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6" />
//                     <circle cx="150" cy="150" r={r} fill="none" stroke="url(#ring)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} style={{ transition: "stroke-dashoffset .3s linear", filter: "drop-shadow(0 0 12px rgba(232,168,85,.7))" }} />
//                   </svg>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="font-display text-7xl tabular-nums" style={{ color: "#F5F2EA" }} role="timer" aria-live="off">{fmt(left)}</span>
//                   </div>
//                 </motion.div>
//                 <div className="flex items-center gap-5 mt-10">
//                   <button onClick={endSession} aria-label="End session" className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,.16)", color: "#C7C3B8" }}><Square size={16} /></button>
//                   <button onClick={toggle} aria-label={running ? "Pause" : "Resume"} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#E8A855", color: "#12151F", boxShadow: "0 0 32px rgba(232,168,85,.45)" }}>{running ? <Pause size={22} /> : <Play size={22} />}</button>
//                 </div>
//                 <p className="text-xs mt-3" style={{ color: "#5B6274" }}>{mode === "focus" ? "The square ends the session and saves the time so far." : ""}</p>
//                 {mode === "focus" && <div className="mt-8">{soundPicker(true)}</div>}
//               </div>
//             )}

//             {phase === "done" && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative text-center max-w-sm">
//                 <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(232,168,85,.15)", boxShadow: "0 0 48px rgba(232,168,85,.4)" }}><Check size={34} style={{ color: "#E8A855" }} /></motion.div>
//                 <h2 className="font-display text-4xl mb-2" style={{ color: "#F5F2EA" }}>Session complete</h2>
//                 <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>{summary} minutes of {subject} saved to your streak.</p>
//                 <div className="flex gap-3 justify-center flex-wrap">
//                   <button onClick={() => begin("break")} className="btn inline-flex items-center gap-2"><Coffee size={16} /> {BREAK} minute break</button>
//                   <button onClick={() => begin("focus")} className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: "rgba(255,255,255,.16)" }}>Start another</button>
//                   <button onClick={() => setPhase("idle")} className="px-5 py-2.5 text-sm" style={{ color: "#9CA3AF" }}>Close</button>
//                 </div>
//               </motion.div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </Page>
//   );
// }




import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Square, CloudRain, Waves, Wind, Music, VolumeX, Coffee, Check, Volume2 } from "lucide-react";
import { Page, Card } from "../components/Page";
import FocusScene from "../components/FocusScene";
import { topicsOf } from "../exams";
import { SOUNDS, startSound, stopSound, setVolume, chime } from "../sound";
import { sessionXP } from "../gamify";
import { actions, useStore, minutesOn } from "../store";

const PRESETS = [15, 25, 45, 60, 90];
const BREAK = 5;
const ICONS = { off: VolumeX, rain: CloudRain, waves: Waves, brown: Wind, pad: Music };
const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
const clampLen = (n) => Math.min(240, Math.max(1, Math.round(Number(n) || 0)));

export default function FocusTimer() {
  const s = useStore();
  const subjects = topicsOf(s.exam, s.customSubjects);
  const [subject, setSubject] = useState(subjects[0]);
  const [len, setLen] = useState(45);
  const [custom, setCustom] = useState("");
  const [sound, setSound] = useState("rain");
  const [vol, setVol] = useState(0.5);
  const [phase, setPhase] = useState("idle"); // idle | active | done
  const [mode, setMode] = useState("focus"); // focus | break
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(len * 60);
  const [summary, setSummary] = useState(0);
  const [guard, setGuard] = useState(true); // pause when the student leaves this tab
  const [leaves, setLeaves] = useState(0);
  const [notice, setNotice] = useState("");
  const endRef = useRef(0);
  const runningRef = useRef(false);
  const hiddenAt = useRef(0);
  runningRef.current = running;
  const total = (mode === "focus" ? len : BREAK) * 60;

  useEffect(() => { if (!subjects.includes(subject)) setSubject(subjects[0]); }, [s.exam, s.customSubjects]); // eslint-disable-line
  useEffect(() => { if (phase === "idle") setLeft(len * 60); }, [len, phase]);
  useEffect(() => { setVolume(vol); }, [vol]);
  useEffect(() => () => stopSound(), []);

  // tab title shows the countdown, so you can keep the tab in the background
  useEffect(() => {
    const base = document.title;
    if (phase === "active") document.title = `${fmt(left)} ${mode === "focus" ? "Focus" : "Break"} | MemoAI`;
    return () => { document.title = base; };
  }, [left, phase, mode]);

  // Anti-focus detector: leaving the tab pauses a focus session, coming back tells you how long you were away.
  useEffect(() => {
    if (!(phase === "active" && mode === "focus" && guard)) return;
    const onVisibility = () => {
      if (document.hidden) {
        if (!runningRef.current) return;
        hiddenAt.current = Date.now();
        setLeft(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)));
        setRunning(false);
        setLeaves((n) => n + 1);
      } else if (hiddenAt.current) {
        const secs = Math.round((Date.now() - hiddenAt.current) / 1000);
        hiddenAt.current = 0;
        setNotice(`You left for ${secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`}. The timer was paused. Press play to continue.`);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, mode, guard]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(rem);
      if (rem === 0) {
        setRunning(false);
        if (mode === "focus") { actions.logSession(subject, len); setSummary(len); setPhase("done"); chime(); stopSound(); }
        else { chime(); setPhase("idle"); stopSound(); }
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, mode, subject, len]);

  const begin = (m = "focus") => {
    const secs = (m === "focus" ? len : BREAK) * 60;
    setMode(m); setLeft(secs); endRef.current = Date.now() + secs * 1000;
    if (m === "focus") setLeaves(0);
    setNotice(""); hiddenAt.current = 0;
    setPhase("active"); setRunning(true);
    startSound(m === "break" ? "off" : sound); // the click that starts the session also unlocks audio
  };
  const toggle = () => { if (!running) endRef.current = Date.now() + left * 1000; setNotice(""); setRunning(!running); };
  // ending early still saves the time you actually studied, if it was at least a minute
  const endSession = () => {
    if (mode === "focus") { const spent = Math.floor((total - left) / 60); if (spent >= 1) actions.logSession(subject, spent); }
    setRunning(false); setPhase("idle"); stopSound();
  };
  const pickSound = (id) => { setSound(id); if (phase === "active" && mode === "focus") startSound(id); };
  const pickLen = (n) => { setLen(n); setCustom(""); };

  const todayMin = minutesOn(s, new Date().setHours(0, 0, 0, 0));
  const todayCount = s.sessions.filter((x) => x.at >= new Date().setHours(0, 0, 0, 0)).length;
  const recent = [...s.sessions].reverse().slice(0, 5);
  const r = 140, c = 2 * Math.PI * r;
  const progress = total ? 1 - left / total : 0;

  const soundPicker = (compact) => (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "justify-center" : ""}`}>
      {SOUNDS.map(({ id, label }) => {
        const Icon = ICONS[id];
        const on = sound === id;
        return (
          <button key={id} onClick={() => pickSound(id)} aria-pressed={on} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition" style={on ? { background: "#E8A855", color: "#12151F" } : { border: "1px solid rgba(255,255,255,.14)", color: "#C7C3B8" }}>
            <Icon size={14} /> {label}
          </button>
        );
      })}
      <label className="inline-flex items-center gap-2 text-xs ml-1" style={{ color: "#9CA3AF" }}>
        <Volume2 size={14} />
        <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => setVol(Number(e.target.value))} aria-label="Volume" className="w-24 accent-[#E8A855]" />
      </label>
    </div>
  );

  return (
    <Page title="Focus timer" sub="Pick a subject and a length. Finished sessions feed your dashboard and streak.">
      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <Card className="lg:col-span-3">
          <label className="text-xs block mb-2" style={{ color: "#9CA3AF" }}>What are you studying?</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input mb-6" aria-label="Subject">{subjects.map((x) => <option key={x}>{x}</option>)}</select>

          <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Length</p>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {PRESETS.map((n) => (
              <button key={n} onClick={() => pickLen(n)} className="px-4 py-2 rounded-xl text-sm" style={len === n && !custom ? { background: "#E8A855", color: "#12151F" } : { border: "1px solid #262C3D", color: "#9CA3AF" }}>{n} min</button>
            ))}
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="240" placeholder="Custom" value={custom} onChange={(e) => { setCustom(e.target.value); if (e.target.value) setLen(clampLen(e.target.value)); }} className="input !w-28" aria-label="Custom minutes" />
              <span className="text-xs" style={{ color: "#5B6274" }}>min (1 to 240)</span>
            </div>
          </div>

          <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Background sound</p>
          <div className="mb-8">{soundPicker(false)}</div>

          <button onClick={() => begin("focus")} className="btn inline-flex items-center gap-2 text-base px-6 py-3"><Play size={18} /> Begin {len} minute session</button>
          <label className="flex items-start gap-3 mt-6 text-sm cursor-pointer" style={{ color: "#C7C3B8" }}>
            <input type="checkbox" checked={guard} onChange={(e) => setGuard(e.target.checked)} className="mt-1 accent-[#E8A855]" />
            <span>Pause the timer if I leave this tab<span className="block text-xs" style={{ color: "#5B6274" }}>Keeps you honest. Turn it off if you want to play your own music in another tab.</span></span>
          </label>
          <p className="text-xs mt-3" style={{ color: "#5B6274" }}>Sounds are generated in your browser. Headphones recommended.</p>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center"><p className="text-xs" style={{ color: "#9CA3AF" }}>Sessions today</p><p className="font-display text-3xl">{todayCount}</p></Card>
            <Card className="text-center"><p className="text-xs" style={{ color: "#9CA3AF" }}>Focused today</p><p className="font-display text-3xl">{todayMin >= 60 ? `${Math.floor(todayMin / 60)}h ${todayMin % 60}m` : `${todayMin}m`}</p></Card>
          </div>
          <Card>
            <p className="font-display text-xl mb-3">Recent sessions</p>
            {recent.length === 0 ? <p className="text-sm" style={{ color: "#5B6274" }}>Your finished sessions will appear here.</p> : (
              <ul className="flex flex-col gap-2">
                {recent.map((x) => <li key={x.id} className="flex justify-between text-sm"><span className="truncate pr-3">{x.subject}</span><span style={{ color: "#9CA3AF" }}>{x.minutes} min · {new Date(x.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></li>)}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Full-screen focus room */}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6" style={{ background: "radial-gradient(ellipse at 50% 40%, #1a1d2c 0%, #0b0d15 70%)" }} role="dialog" aria-label="Focus session">
            <FocusScene running={running} />
            <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 45%, rgba(232,168,85,.10), transparent 55%)" }} />

            {phase === "active" && (
              <div className="relative flex flex-col items-center">
                <p className="font-display text-xl mb-1" style={{ color: "#C7C3B8" }}>{mode === "focus" ? subject : "Take a breath"}</p>
                <p className="text-xs mb-8" style={{ color: "#5B6274" }}>{mode === "focus" ? (running ? "Stay with it" : "Paused") : "Short break"}</p>
                <motion.div animate={running ? { scale: [1, 1.025, 1] } : { scale: 1 }} transition={{ duration: 5, repeat: running ? Infinity : 0, ease: "easeInOut" }} className="relative" style={{ width: 300, height: 300 }}>
                  <svg viewBox="0 0 300 300" width="100%" height="100%" className="-rotate-90" aria-hidden>
                    <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD596" /><stop offset="100%" stopColor="#E8A855" /></linearGradient></defs>
                    <circle cx="150" cy="150" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6" />
                    <circle cx="150" cy="150" r={r} fill="none" stroke="url(#ring)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} style={{ transition: "stroke-dashoffset .3s linear", filter: "drop-shadow(0 0 12px rgba(232,168,85,.7))" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-7xl tabular-nums" style={{ color: "#F5F2EA" }} role="timer" aria-live="off">{fmt(left)}</span>
                  </div>
                </motion.div>
                <div className="flex items-center gap-5 mt-10">
                  <button onClick={endSession} aria-label="End session" className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,.16)", color: "#C7C3B8" }}><Square size={16} /></button>
                  <button onClick={toggle} aria-label={running ? "Pause" : "Resume"} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#E8A855", color: "#12151F", boxShadow: "0 0 32px rgba(232,168,85,.45)" }}>{running ? <Pause size={22} /> : <Play size={22} />}</button>
                </div>
                <p className="text-xs mt-3" style={{ color: "#5B6274" }}>{mode === "focus" ? "The square ends the session and saves the time so far." : ""}</p>
                {notice && <p role="status" className="mt-4 text-sm px-4 py-2 rounded-xl" style={{ background: "rgba(232,168,85,.12)", border: "1px solid rgba(232,168,85,.35)", color: "#E8C58A" }}>{notice}</p>}
                {mode === "focus" && <div className="mt-8">{soundPicker(true)}</div>}
              </div>
            )}

            {phase === "done" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative text-center max-w-sm">
                <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(232,168,85,.15)", boxShadow: "0 0 48px rgba(232,168,85,.4)" }}><Check size={34} style={{ color: "#E8A855" }} /></motion.div>
                <h2 className="font-display text-4xl mb-2" style={{ color: "#F5F2EA" }}>Session complete</h2>
                <p className="font-display text-2xl mb-2" style={{ color: "#E8A855" }}>+{sessionXP(summary)} XP</p>
                <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>{summary} minutes of {subject} saved to your streak.{leaves > 0 ? ` You left the tab ${leaves} ${leaves === 1 ? "time" : "times"}.` : guard ? " You stayed on the tab the whole time." : ""}</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => begin("break")} className="btn inline-flex items-center gap-2"><Coffee size={16} /> {BREAK} minute break</button>
                  <button onClick={() => begin("focus")} className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: "rgba(255,255,255,.16)" }}>Start another</button>
                  <button onClick={() => setPhase("idle")} className="px-5 py-2.5 text-sm" style={{ color: "#9CA3AF" }}>Close</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}