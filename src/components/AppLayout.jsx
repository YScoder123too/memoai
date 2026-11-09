import { Navigate, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import AmbientBackground from "./AmbientBackground";
import { useStore } from "../store";

export default function AppLayout() {
  const s = useStore();
  const loc = useLocation();
  const outlet = useOutlet();
  if (!s.user) return <Navigate to="/login" replace />;
  if (!s.goal) return <Navigate to="/onboarding" replace />;
  return (
    <div className="min-h-screen relative">
      <AmbientBackground />
      <div className="relative z-10 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 p-5 md:p-10 pb-24 md:pb-10 max-w-6xl overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28, ease: "easeOut" }}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
