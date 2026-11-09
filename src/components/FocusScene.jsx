import { useEffect, useRef } from "react";

// Slow amber embers rising through a dark room. Calmer when paused, still when the user prefers reduced motion.
export default function FocusScene({ running }) {
  const ref = useRef(null);
  const runRef = useRef(running);
  runRef.current = running;

  useEffect(() => {
    const cv = ref.current;
    const g = cv.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const make = (initial) => ({
      x: Math.random() * w, y: initial ? Math.random() * h : h + 20,
      r: 0.8 + Math.random() * 2.2, vy: 8 + Math.random() * 22, sway: Math.random() * Math.PI * 2, sp: 0.2 + Math.random() * 0.5,
      a: 0.15 + Math.random() * 0.55,
    });
    const N = Math.min(90, Math.round((w * h) / 14000));
    const ps = Array.from({ length: N }, () => make(true));
    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const speed = runRef.current ? 1 : 0.25;
      g.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!still) { p.y -= p.vy * dt * speed; p.sway += p.sp * dt; p.x += Math.sin(p.sway) * 10 * dt; }
        if (p.y < -20) Object.assign(p, make(false), { x: Math.random() * w });
        const fade = Math.min(1, Math.max(0, p.y / (h * 0.25)));
        const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grad.addColorStop(0, `rgba(255,214,150,${p.a * fade})`);
        grad.addColorStop(1, "rgba(232,168,85,0)");
        g.fillStyle = grad; g.beginPath(); g.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); g.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 w-full h-full" />;
}
