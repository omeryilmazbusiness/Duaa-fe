"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AiThinkingOrb } from "@/components/ui/ai-thinking-orb";
import { FADE_UP, IOS_EASE, STAGGER_PARENT, TAP_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import type { Tone } from "@/theme/tones";

export interface BriefQuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  onClick: () => void;
}

export interface BriefPrimaryAction {
  label: string;
  hint?: string;
  onClick: () => void;
}

const GLASS_ICON =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white/90 " +
  "bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_28px_-16px_rgba(0,0,0,0.55)] " +
  "backdrop-blur-xl transition-[background,box-shadow,transform,color] duration-300 " +
  "hover:bg-white/[0.16] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_32px_-14px_rgba(52,211,153,0.45)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090f] " +
  "active:scale-[0.96]";

const TONE_GLOW: Record<Tone, string> = {
  rose: "group-hover:shadow-[0_0_24px_-6px_rgba(244,63,94,0.55)]",
  amber: "group-hover:shadow-[0_0_24px_-6px_rgba(245,158,11,0.55)]",
  sky: "group-hover:shadow-[0_0_24px_-6px_rgba(14,165,233,0.55)]",
  emerald: "group-hover:shadow-[0_0_24px_-6px_rgba(16,185,129,0.55)]",
  violet: "group-hover:shadow-[0_0_24px_-6px_rgba(139,92,246,0.55)]",
  indigo: "group-hover:shadow-[0_0_24px_-6px_rgba(99,102,241,0.55)]",
  teal: "group-hover:shadow-[0_0_24px_-6px_rgba(20,184,166,0.55)]",
  zinc: "group-hover:shadow-[0_0_24px_-6px_rgba(161,161,170,0.45)]",
};

/**
 * Dark ultra-premium Decide.Act brief: cinematic washes, typed headline, glass icon actions.
 */
export function TodayBriefHero({
  kicker,
  summary,
  detail,
  primaryAction,
  actions = [],
}: {
  kicker: string;
  summary: string;
  detail?: string;
  primaryAction?: BriefPrimaryAction | null;
  actions?: readonly BriefQuickAction[];
}) {
  const reduce = useReducedMotion();
  const typedSummary = useTypewriter(summary, reduce, 0);
  const summaryDone = reduce || typedSummary.length >= summary.length;
  const typedDetail = useTypewriter(detail ?? "", reduce, summaryDone ? 180 : -1);

  return (
    <motion.section
      className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#07090f] px-5 py-4 text-white shadow-[0_24px_56px_-28px_rgba(2,6,23,0.9)] sm:px-6 sm:py-5"
      data-testid="today-brief-hero"
      variants={FADE_UP}
      initial={reduce ? false : "hidden"}
      animate="show"
      transition={reduce ? { duration: 0.01 } : { duration: 0.55, ease: IOS_EASE }}
    >
      {/* Cinematic color field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 decide-ai-cinema" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_30%_40%,black_15%,transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-[42%] decide-ai-sheen" />

      <div className="relative flex items-center gap-4 sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3.5">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 backdrop-blur-md"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: IOS_EASE }}
          >
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 via-cyan-400 to-violet-500 text-white shadow-[0_0_16px_rgba(52,211,153,0.5)]">
              <Sparkles className="h-3 w-3" strokeWidth={2.4} />
              {!reduce ? <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/25" aria-hidden /> : null}
            </span>
            <span className="text-[11px] font-semibold tracking-[0.16em] text-white/65 sm:text-[12px]">{kicker}</span>
          </motion.div>

          <h2
            className="min-h-[1.15em] text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[34px] lg:text-[38px]"
            data-testid="today-brief-summary"
            aria-label={summary}
          >
            <span className="bg-gradient-to-r from-white via-emerald-50 to-cyan-100/90 bg-clip-text text-transparent">
              {typedSummary}
            </span>
            {!reduce && !summaryDone ? (
              <span className="ms-0.5 inline-block h-[0.82em] w-[2.5px] translate-y-[0.1em] rounded-full bg-emerald-300 align-baseline decide-ai-caret" aria-hidden />
            ) : null}
          </h2>

          {detail ? (
            <p
              className="min-h-[1.35em] max-w-xl text-[13px] font-medium leading-relaxed text-white/50 sm:text-[14px]"
              aria-label={detail}
            >
              {typedDetail}
              {!reduce && summaryDone && typedDetail.length < detail.length ? (
                <span className="ms-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] rounded-full bg-white/40 align-baseline decide-ai-caret" aria-hidden />
              ) : null}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <AnimatePresence mode="wait">
              {primaryAction ? (
                <motion.div
                  key="primary"
                  className="flex items-center gap-2.5"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35, ease: IOS_EASE }}
                >
                  <motion.button
                    type="button"
                    onClick={primaryAction.onClick}
                    title={primaryAction.label}
                    aria-label={primaryAction.label}
                    data-testid="today-brief-act"
                    className={cn(
                      GLASS_ICON,
                      "h-12 w-12 bg-gradient-to-br from-emerald-400/25 via-cyan-400/15 to-violet-500/20",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_0_1px_rgba(52,211,153,0.18),0_16px_36px_-18px_rgba(52,211,153,0.65)]",
                    )}
                    whileHover={reduce ? undefined : { scale: 1.06 }}
                    whileTap={reduce ? undefined : { scale: 0.94 }}
                    transition={TAP_SPRING}
                  >
                    <ArrowRight className="h-5 w-5" strokeWidth={2.3} aria-hidden />
                  </motion.button>
                  {primaryAction.hint ? (
                    <span className="max-w-[11rem] text-[12px] font-medium leading-snug text-emerald-100/70 sm:max-w-[14rem]">
                      {primaryAction.hint}
                    </span>
                  ) : (
                    <span className="text-[12px] font-semibold tracking-wide text-white/70">{primaryAction.label}</span>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {actions.length ? (
              <motion.nav
                className="flex items-center gap-2"
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
                      aria-label={action.label}
                      data-testid={`dashboard-quick-${action.id}`}
                      variants={FADE_UP}
                      whileHover={reduce ? undefined : { scale: 1.08, y: -1 }}
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      transition={TAP_SPRING}
                      className={cn("group", GLASS_ICON, TONE_GLOW[action.tone])}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.1} />
                    </motion.button>
                  );
                })}
              </motion.nav>
            ) : null}
          </div>
        </div>

        <AiOrbPanel reduce={Boolean(reduce)} alert={Boolean(primaryAction)} />
      </div>
    </motion.section>
  );
}

/** `delayMs < 0` pauses the writer until the parent flips it positive. */
function useTypewriter(text: string, reduce: boolean | null, delayMs: number) {
  const [out, setOut] = useState(reduce ? text : "");

  useEffect(() => {
    if (reduce) {
      setOut(text);
      return;
    }
    if (delayMs < 0) {
      setOut("");
      return;
    }
    setOut("");
    let i = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      const tick = () => {
        i += 1;
        setOut(text.slice(0, i));
        if (i < text.length) {
          const ch = text[i - 1] ?? "";
          const pause = ch === " " || ch === "." || ch === "،" || ch === "。" ? 48 : text.length > 42 ? 16 : 22;
          id = window.setTimeout(tick, pause);
        }
      };
      id = window.setTimeout(tick, 12);
    }, delayMs);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(id);
    };
  }, [text, reduce, delayMs]);

  return out;
}

/** Compact MorphOrb — keeps card height close to the copy column. */
function AiOrbPanel({ reduce, alert }: { reduce: boolean; alert: boolean }) {
  const { t } = useLocale();
  return (
    <div
      className="relative hidden h-[132px] w-[132px] shrink-0 sm:block sm:h-[148px] sm:w-[148px] lg:h-[160px] lg:w-[160px]"
      aria-hidden
      data-testid="today-brief-ai-field"
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(52,211,153,0.28),transparent_62%)] blur-xl decide-ai-orb-glow" />
      <div className="pointer-events-none absolute inset-[6%] rounded-full bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[2px]" />
      <AiThinkingOrb className="relative z-[1] h-full w-full max-w-none" cycleMs={6800} reducedMotion={reduce} />
      {alert ? (
        <div className="pointer-events-none absolute inset-x-1 bottom-0 z-[2] truncate rounded-full bg-emerald-400/10 px-2 py-0.5 text-center text-[9px] font-semibold tracking-[0.14em] text-emerald-100/85 backdrop-blur-md">
          {t.sourceLive}
        </div>
      ) : null}
    </div>
  );
}
