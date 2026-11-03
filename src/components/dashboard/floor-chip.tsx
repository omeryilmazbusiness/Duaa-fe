"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { PILL_SPRING, PRESS_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TONE_WELL, type Tone } from "@/theme/tones";

/** Compact Apple-style floor shortcut: icon + name only. */
export function FloorChip({
  label,
  icon: Icon,
  tone = "sky",
  active,
  selected,
  meta,
  onClick,
  testId,
  layoutGroup = "floor-chip",
}: {
  label: string;
  icon: LucideIcon;
  tone?: Tone;
  /** Quiet pulse when something is waiting — no big numbers. */
  active?: boolean;
  selected?: boolean;
  /** Optional quiet count / status — kept small. */
  meta?: string | number;
  onClick?: () => void;
  testId?: string;
  layoutGroup?: string;
}) {
  const reduce = useReducedMotion();
  const shell = cn(
    "relative flex w-full items-center gap-2.5 overflow-hidden rounded-[16px] border px-2.5 py-2 backdrop-blur-xl",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
    selected ? "border-zinc-900/15 bg-white" : "border-white/70 bg-white/80",
  );

  const body = (
    <>
      {selected ? (
        <motion.span
          layoutId={`${layoutGroup}-selected`}
          className="absolute inset-0 rounded-[16px] bg-white shadow-[0_12px_28px_-16px_rgba(15,23,42,0.35)] ring-1 ring-zinc-900/8"
          transition={reduce ? { duration: 0.01 } : PILL_SPRING}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
          TONE_WELL[tone],
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
        {active ? (
          <motion.span
            aria-hidden
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={PILL_SPRING}
            className={cn(
              "absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white",
              tone === "rose" ? "bg-rose-500" : tone === "amber" ? "bg-amber-500" : "bg-sky-500",
            )}
          />
        ) : null}
      </span>
      <span className="relative z-10 min-w-0 flex-1 truncate text-start text-[12px] font-semibold tracking-[-0.01em] text-zinc-800">
        {label}
      </span>
      {meta !== undefined ? (
        <span className="relative z-10 shrink-0 text-[11px] font-semibold tabular-nums text-zinc-400">{meta}</span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        className={shell}
        data-testid={testId}
        title={label}
        whileHover={reduce ? undefined : PRESS_SOFT.whileHover}
        whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
        transition={PRESS_SOFT.transition}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <div className={cn(shell, "cursor-default")} data-testid={testId} title={label}>
      {body}
    </div>
  );
}

export function FloorChipRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-2.5" data-testid="today-floor">
      {children}
    </div>
  );
}
