"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_SOLID, type Tone } from "@/theme/tones";

/** Only attention states keep colour; everything else stays quiet so warnings stand out. */
const ALERT_TONES = new Set<Tone>(["amber", "rose"]);

const STORAGE_KEY = "dua.dashboard.sections.v1";

function readOpenMap(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeOpen(id: string, open: boolean) {
  try {
    const next = { ...readOpenMap(), [id]: open };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: the section still works, it just will not remember.
  }
}

/** Open/closed state that survives reloads per section id. */
export function useSectionOpen(id: string | undefined, defaultOpen: boolean) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (!id) return;
    const saved = readOpenMap()[id];
    if (typeof saved === "boolean") setOpen(saved);
  }, [id]);
  const toggle = useCallback(() => {
    setOpen((cur) => {
      const next = !cur;
      if (id) writeOpen(id, next);
      return next;
    });
  }, [id]);
  return [open, toggle] as const;
}

export function CollapsibleSection({
  persistId,
  title,
  icon: Icon,
  tone = "sky",
  summary,
  badge,
  defaultOpen = false,
  children,
  actions,
  variant = "card",
  testId,
  anchorId,
}: {
  /** Remembers open state under this id; omit for transient sections. */
  persistId?: string;
  title: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** One-line plain-language status shown while collapsed and open. */
  summary?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  actions?: ReactNode;
  /** "card" for top-level sections, "inset" for sections nested in a card. */
  variant?: "card" | "inset";
  testId?: string;
  /** DOM id so a hub tile can scroll straight to this section. */
  anchorId?: string;
}) {
  const [open, toggle] = useSectionOpen(persistId, defaultOpen);
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const inset = variant === "inset";

  return (
    <section
      id={anchorId}
      className={cn(
        anchorId && "scroll-mt-32",
        inset
          ? "rounded-[20px] bg-zinc-50/80 ring-1 ring-inset ring-zinc-900/[0.05]"
          : "rounded-[26px] border border-zinc-200/60 bg-white shadow-[0_10px_34px_-26px_rgba(15,23,42,0.35)]",
      )}
      data-testid={testId}
      data-open={open ? "true" : "false"}
    >
      <div className={cn("flex items-center gap-2", inset ? "px-3.5 py-2.5" : "px-4 py-3.5 sm:px-5")}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15"
          data-testid={testId ? `${testId}-toggle` : undefined}
        >
          {Icon ? (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center",
                inset ? "h-8 w-8 rounded-[10px]" : "h-10 w-10 rounded-xl",
                ALERT_TONES.has(tone) ? TONE_SOLID[tone] : "bg-zinc-100 text-zinc-700",
              )}
            >
              <Icon className={inset ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2} />
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate font-semibold tracking-tight text-zinc-950", inset ? "text-[14px]" : "text-[16px]")}>
              {title}
            </span>
            {summary ? (
              <span className={cn("block truncate font-medium text-zinc-500", inset ? "text-[11.5px]" : "text-[12.5px]")}>{summary}</span>
            ) : null}
          </span>
          {badge ? <span className="shrink-0">{badge}</span> : null}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-180")}
            strokeWidth={2.2}
            aria-hidden
          />
        </button>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(inset ? "px-3.5 pb-3.5" : "border-t border-zinc-100 px-4 pb-4 pt-4 sm:px-5 sm:pb-5")}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
