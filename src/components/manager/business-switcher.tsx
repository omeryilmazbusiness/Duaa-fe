"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, Check, ChevronDown, Coffee, Layers } from "lucide-react";
import { useId } from "react";
import { useSectionOpen } from "@/components/dashboard/collapsible-section";
import type { WorkspaceOption } from "@/domain/session/types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_WELL } from "@/theme/tones";

/**
 * Collapsible "Business" block for the dark navigation menus.
 * The header always shows the active business so the list can stay closed.
 */
export function BusinessSwitcher({
  workspaces,
  activeWorkspaceId,
  onSwitch,
  compact = false,
}: {
  workspaces: readonly WorkspaceOption[];
  activeWorkspaceId?: string;
  onSwitch: (workspaceId: string) => void;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const panelId = useId();
  const [open, toggle] = useSectionOpen("nav:business", false);
  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="border-b border-white/10 px-2.5 py-2.5" data-testid="business-switcher">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="business-switcher-toggle"
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-start text-white transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <span className={cn("flex shrink-0 items-center justify-center bg-white/12", compact ? "h-8 w-8 rounded-[11px]" : "h-9 w-9 rounded-[13px]")}>
          <Layers className="h-[17px] w-[17px]" strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">{t.switchBusiness}</span>
          <span className="block truncate text-[13.5px] font-medium leading-snug">{active?.name ?? "—"}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/50 transition-transform duration-200", open && "rotate-180")} strokeWidth={2} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            id={panelId}
            key="list"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-1 overflow-hidden pt-1"
          >
            {workspaces.map((ws) => {
              const current = ws.id === activeWorkspaceId;
              const Icon = ws.kind === "hotel" ? Building2 : Coffee;
              return (
                <li key={ws.id}>
                  <button
                    type="button"
                    aria-current={current ? "true" : undefined}
                    onClick={() => {
                      if (!current) onSwitch(ws.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl py-2 ps-5 pe-3 text-start transition-colors",
                      current ? "bg-white/14 text-white" : "text-white/60 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]", TONE_WELL[ws.kind === "hotel" ? "indigo" : "amber"])}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{ws.name}</span>
                    {current ? <Check className="h-3.5 w-3.5 shrink-0 text-white/80" strokeWidth={2.4} aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
