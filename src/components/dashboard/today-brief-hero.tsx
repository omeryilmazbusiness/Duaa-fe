"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, type LucideIcon } from "lucide-react";
import { FADE_UP, IOS_EASE, PRESS_SOFT, STAGGER_PARENT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TONE_WELL, type Tone } from "@/theme/tones";

export interface BriefQuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  onClick: () => void;
}

/**
 * Premium AI-style morning brief: large Decide.Act headline + short clear summary.
 * Replaces the compact command bar on Today's focus.
 */
export function TodayBriefHero({
  kicker,
  summary,
  detail,
  actions = [],
}: {
  kicker: string;
  summary: string;
  detail?: string;
  actions?: readonly BriefQuickAction[];
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-white to-zinc-50/90 p-6 shadow-[0_1px_0_rgba(15,23,42,0.04),0_28px_60px_-36px_rgba(15,23,42,0.45)] sm:p-8"
      data-testid="today-brief-hero"
      variants={FADE_UP}
      initial={reduce ? false : "hidden"}
      animate="show"
      transition={reduce ? { duration: 0.01 } : { duration: 0.55, ease: IOS_EASE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-violet-300/35 via-sky-200/30 to-transparent blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -start-10 h-48 w-48 rounded-full bg-gradient-to-tr from-cyan-200/25 via-fuchsia-100/20 to-transparent blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 backdrop-blur">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_6px_14px_-8px_rgba(79,70,229,0.9)]">
              <Sparkles className="h-3 w-3" strokeWidth={2.4} />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{kicker}</span>
          </div>

          <h2 className="font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-zinc-950 sm:text-[44px] lg:text-[52px]">
            {summary}
          </h2>

          {detail ? (
            <p className="max-w-xl text-[14px] font-medium leading-relaxed text-zinc-500 sm:text-[15px]">{detail}</p>
          ) : null}
        </div>

        {actions.length ? (
          <motion.nav
            className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end"
            data-testid="dashboard-quick-actions"
            aria-label={kicker}
            variants={STAGGER_PARENT}
            initial={reduce ? false : "hidden"}
            animate="show"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  title={action.label}
                  data-testid={`dashboard-quick-${action.id}`}
                  variants={FADE_UP}
                  whileHover={reduce ? undefined : PRESS_SOFT.whileHover}
                  whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
                  transition={PRESS_SOFT.transition}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 py-2 ps-2 pe-3.5 text-[12px] font-semibold text-zinc-700 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.35)] backdrop-blur",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                      TONE_WELL[action.tone],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  {action.label}
                </motion.button>
              );
            })}
          </motion.nav>
        ) : null}
      </div>
    </motion.section>
  );
}
