import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Planner from "./pages/Planner";
import FocusTimer from "./pages/FocusTimer";
import Memory from "./pages/Memory";
import Ask from "./pages/Ask";
import Profile from "./pages/Profile";

const APP_PATHS = ["/dashboard", "/planner", "/focus", "/memory", "/ask", "/profile"];
const Slide = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4, ease: "easeOut" }}>
    {children}
  </motion.div>
);

export default function App() {
  const loc = useLocation();
  // all in-app pages share one key so the sidebar stays mounted while pages slide inside it
  const key = APP_PATHS.includes(loc.pathname) ? "app" : loc.pathname;
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={key}>
        <Route path="/" element={<Slide><Landing /></Slide>} />
        <Route path="/login" element={<Slide><Auth mode="login" /></Slide>} />
        <Route path="/signup" element={<Slide><Auth mode="signup" /></Slide>} />
        <Route path="/onboarding" element={<Slide><Onboarding /></Slide>} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/focus" element={<FocusTimer />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
