import { useEffect, useState } from "react";
import { animate } from "framer-motion";
export default function CountUp({ to, decimals = 0, suffix = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => { const c = animate(0, Number(to) || 0, { duration: 1.1, ease: "easeOut", onUpdate: setV }); return () => c.stop(); }, [to]);
  return <>{v.toFixed(decimals)}{suffix}</>;
}
