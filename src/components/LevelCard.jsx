import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useStore } from "../store";
import { computeXP, levelOf } from "../gamify";

export default function LevelCard() {
  const s = useStore();
  const xp = computeXP(s);
  const lv = levelOf(xp.total);
  return (
    <div className="glass rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-display text-2xl shrink-0" style={{ background: "rgba(232,168,85,.15)", color: "#E8A855", boxShadow: "0 0 24px rgba(232,168,85,.25)" }} aria-label={`Level ${lv.level}`}>{lv.level}</div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex justify-between items-baseline gap-3">
            <p className="font-display text-xl">{lv.title}</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>{xp.total} XP total</p>
          </div>
          <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: "#1E2433" }} role="progressbar" aria-valuenow={lv.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
            <motion.div className="h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${lv.pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }} style={{ background: "linear-gradient(90deg,#E8A855,#FFD596)" }} />
          </div>
          <p className="text-xs mt-2" style={{ color: "#5B6274" }}>{lv.toNext} XP to level {lv.level + 1}</p>
        </div>
      </div>
      <p className="text-xs mt-4 flex items-center gap-2" style={{ color: "#9CA3AF" }}>
        <Sparkles size={12} style={{ color: "#E8A855" }} /> Earn XP: 1 per focused minute, 10 per task done, 5 per doubt saved, 15 for each doubt you recall, 5 for trying one you forgot.
      </p>
    </div>
  );
}