import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarCheck, Timer, Brain, UserRound, LogOut, MessageCircleQuestion } from "lucide-react";
import { actions, useStore, dueDoubts } from "../store";

export const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Ask", icon: MessageCircleQuestion, to: "/ask" },
  { label: "Planner", icon: CalendarCheck, to: "/planner" },
  { label: "Focus Timer", icon: Timer, to: "/focus" },
  { label: "Memory", icon: Brain, to: "/memory" },
  { label: "Profile", icon: UserRound, to: "/profile" },
];

export default function Sidebar() {
  const s = useStore();
  const nav = useNavigate();
  const due = dueDoubts(s).length;
  return (
    <>
      {/* desktop rail */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between p-6 border-r sticky top-0 h-screen" style={{ background: "#0F121B", borderColor: "#242938" }}>
        <div>
          <div className="mb-10 font-display text-2xl" style={{ color: "#F5F2EA" }}>MemoAI</div>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map(({ label, icon: Icon, to }) => (
              <NavLink key={to} to={to} className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg" style={({ isActive }) => ({ color: isActive ? "#E8A855" : "#9CA3AF" })}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-lg" style={{ background: "#1E2433" }} transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <Icon size={16} className="relative" />
                    <span className="relative">{label}</span>
                    {label === "Memory" && due > 0 && <span className="relative ml-auto text-[11px] px-1.5 rounded-full" style={{ background: "#E8A855", color: "#12151F" }}>{due}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "#5B6274" }}>Signed in as</p>
          <p className="text-sm mb-3 truncate">{s.user?.name || "Guest"}</p>
          <button onClick={() => { actions.logout(); nav("/"); }} className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}><LogOut size={14} /> Log out</button>
        </div>
      </aside>
      {/* mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex justify-around py-2 border-t" style={{ background: "#0F121B", borderColor: "#242938" }}>
        {NAV.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} aria-label={label} className="p-2 rounded-lg" style={({ isActive }) => ({ color: isActive ? "#E8A855" : "#9CA3AF" })}>
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>
    </>
  );
}
