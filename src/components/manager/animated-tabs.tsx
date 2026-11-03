"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ManagerTab } from "@/domain/catalog";
import { navForTabs } from "@/lib/nav";
import { PILL_SPRING, PRESS_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_FG, TONE_LIQUID } from "@/theme/tones";

/**
 * Compact left-aligned mobile tab strip — soft glass, icon-forward.
 * Does not span the full viewport width.
 */
export function ManagerAnimatedTabs({
  tabs,
  active,
  badges,
  onChange,
}: {
  tabs: readonly ManagerTab[];
  active: ManagerTab | "";
  badges: Partial<Record<ManagerTab, number>>;
  onChange: (tab: ManagerTab) => void;
}) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const items = navForTabs(tabs);

  return (
    <div
      className="ios-liquid-track inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[14px] p-0.5"
      style={{ scrollbarWidth: "none" }}
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        const count = badges[tab.id] ?? 0;
        return (
          <motion.button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label(t)}
            title={tab.label(t)}
            onClick={() => onChange(tab.id)}
            whileHover={reduce ? undefined : { scale: 1.04 }}
            whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
            transition={PRESS_SOFT.transition}
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
          >
            {isActive ? (
              <motion.span
                layoutId="manager-tab-liquid"
                className={cn("ios-liquid-pill absolute inset-0 rounded-[11px]", TONE_LIQUID[tab.tone])}
                transition={reduce ? { duration: 0.01 } : PILL_SPRING}
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center justify-center" aria-hidden>
              <Icon
                className={cn("h-[17px] w-[17px]", isActive ? TONE_FG[tab.tone] : "text-zinc-700/70")}
                strokeWidth={isActive ? 2.15 : 1.85}
              />
              {count > 0 ? (
                <span
                  className={cn(
                    "absolute -end-1 -top-1 min-w-[12px] rounded-full px-0.5 py-px text-center font-mono text-[6.5px] font-bold leading-none",
                    "border border-white/80 bg-zinc-900 text-white",
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
