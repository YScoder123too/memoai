export default function AmbientBackground() {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div style={{ position: "absolute", top: "-12%", left: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,168,85,.30), transparent 65%)", filter: "blur(60px)", animation: "drift1 22s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-6%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,110,220,.28), transparent 65%)", filter: "blur(70px)", animation: "drift2 28s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,12,20,.7) 100%)" }} />
    </div>
  );
}
