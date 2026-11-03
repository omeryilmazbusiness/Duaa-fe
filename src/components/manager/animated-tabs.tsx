"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ManagerTab } from "@/domain/catalog";
import { navForTabs } from "@/lib/nav";
import { PILL_SPRING, PRESS_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_FG, TONE_LIQUID } from "@/theme/tones";

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
      className="ios-liquid-track flex gap-0.5 overflow-x-auto rounded-[26px] p-1"
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
            className="relative flex min-w-[3.25rem] flex-1 shrink-0 items-center justify-center rounded-[20px] px-2.5 py-1.5 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
          >
            {isActive ? (
              <motion.span
                layoutId="manager-tab-liquid"
                className={cn("ios-liquid-pill absolute inset-0 rounded-[20px]", TONE_LIQUID[tab.tone])}
                transition={reduce ? { duration: 0.01 } : PILL_SPRING}
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center justify-center" aria-hidden>
              <motion.span
                animate={{ scale: isActive ? 1.06 : 1 }}
                transition={PILL_SPRING}
                className="inline-flex"
              >
                <Icon
                  className={cn("h-[22px] w-[22px]", isActive ? TONE_FG[tab.tone] : "text-zinc-900/38")}
                  strokeWidth={isActive ? 1.85 : 1.55}
                />
              </motion.span>
              {count > 0 ? (
                <span
                  className={cn(
                    "absolute -end-2.5 -top-1.5 min-w-[13px] rounded-full px-1 py-px text-center font-mono text-[7px] font-bold leading-none",
                    isActive ? "bg-zinc-950 text-white" : "bg-zinc-950/80 text-white",
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
