"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PANEL_SPRING } from "@/lib/motion";

export function ManagerTabPanel({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={tabKey}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0.01 } : PANEL_SPRING}
    >
      {children}
    </motion.div>
  );
}
