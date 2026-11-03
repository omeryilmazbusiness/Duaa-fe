"use client";

import { motion, useReducedMotion } from "framer-motion";
import { IOS_EASE, STAGE_SPRING } from "@/lib/motion";

export function ManagerTabPanel({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={tabKey}
      initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(10px)", scale: 0.985 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      transition={
        reduce
          ? { duration: 0.01 }
          : { ...STAGE_SPRING, opacity: { duration: 0.28, ease: IOS_EASE }, filter: { duration: 0.3, ease: IOS_EASE } }
      }
    >
      {children}
    </motion.div>
  );
}
