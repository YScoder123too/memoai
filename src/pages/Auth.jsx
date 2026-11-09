import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";
import { actions, useStore } from "../store";
import { api, hasApi, setToken } from "../api";

// Demo auth: stored in the browser only. Real auth (JWT + database) is a planned upgrade.
export default function Auth({ mode }) {
  const signup = mode === "signup";
  const nav = useNavigate();
  const s = useStore();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (s.user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email address.");
    if (f.password.length < 6) return setErr("Password needs at least 6 characters.");
    if (signup && !f.name.trim()) return setErr("Tell us your name so we can greet you.");
    if (hasApi) {
      setBusy(true);
      try {
        const r = signup ? await api.signup(f) : await api.login(f);
        setToken(r.token);
        actions.login(r.user, r.state);
        nav(r.state?.goal ? "/dashboard" : "/onboarding");
      } catch (ex) { setErr(ex.message); }
      setBusy(false);
      return;
    }
    actions.login({ name: f.name.trim() || f.email.split("@")[0], email: f.email });
    nav(s.goal ? "/dashboard" : "/onboarding");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-5">
      <AmbientBackground />
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 glass rounded-3xl p-8 w-full max-w-sm">
        <Link to="/" className="font-display text-2xl block mb-6" style={{ color: "#F5F2EA" }}>MemoAI</Link>
        <h1 className="font-display text-2xl mb-1">{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>{signup ? "It takes under a minute." : "Pick up where you left off."}</p>
        <div className="flex flex-col gap-3">
          {signup && <input className="input" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Name" />}
          <input className="input" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="Email" />
          <input className="input" type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} aria-label="Password" />
        </div>
        {err && <p role="alert" className="text-sm mt-3" style={{ color: "#F08A7E" }}>{err}</p>}
        <button className="btn w-full mt-5" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Log in"}</button>
        <p className="text-sm mt-5 text-center" style={{ color: "#9CA3AF" }}>
          {signup ? "Already have an account? " : "New here? "}
          <Link to={signup ? "/login" : "/signup"} style={{ color: "#E8A855" }}>{signup ? "Log in" : "Create one"}</Link>
        </p>
        {!hasApi && <p className="text-[11px] mt-4 text-center" style={{ color: "#5B6274" }}>Demo mode: accounts are stored only in this browser.</p>}
      </motion.form>
    </div>
  );
}
