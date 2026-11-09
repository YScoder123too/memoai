import { motion } from "framer-motion";
export function Page({ title, sub, children, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl" style={{ color: "#F5F2EA" }}>{title}</h1>
          {sub && <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}
export const Card = ({ className = "", children, ...p }) => <div className={`glass rounded-2xl p-5 ${className}`} {...p}>{children}</div>;
