"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { PRESS, PRESS_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = HTMLMotionProps<"button"> & {
  soft?: boolean;
};

/** Premium spring press for selectable controls (chips, pills, dock items). */
export const Pressable = forwardRef<HTMLButtonElement, Props>(function Pressable(
  { className, soft, disabled, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  const press = soft ? PRESS_SOFT : PRESS;
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={cn("touch-manipulation will-change-transform", className)}
      whileHover={reduce || disabled ? undefined : press.whileHover}
      whileTap={reduce || disabled ? undefined : press.whileTap}
      transition={press.transition}
      {...props}
    />
  );
});
