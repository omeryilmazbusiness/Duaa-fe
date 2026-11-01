"use client";

import { LayoutDashboard, type LucideIcon } from "lucide-react";
import { ActionTile } from "@/components/dashboard/action-tile";
import type { Tone } from "@/theme/tones";

export interface CommandAction {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  onClick: () => void;
}

export function DashboardCommandBar({
  title,
  hint,
  actions,
}: {
  title: string;
  hint: string;
  actions: readonly CommandAction[];
}) {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8" data-testid="dashboard-command-bar">
      <div className="flex w-full items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-22px_rgba(15,23,42,0.28)] lg:flex-1">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,0.7)]">
          <LayoutDashboard className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 px-3.5 py-1">
          <p className="truncate text-[15px] font-medium text-zinc-950">{title}</p>
          <p className="truncate text-[12px] font-medium text-zinc-500">{hint}</p>
        </div>
      </div>
      {actions.length ? (
        <nav className="flex flex-wrap items-start justify-center gap-2 lg:justify-end" data-testid="dashboard-quick-actions">
          {actions.map((action) => (
            <ActionTile
              key={action.id}
              label={action.label}
              icon={action.icon}
              tone={action.tone}
              onClick={action.onClick}
              testId={`dashboard-quick-${action.id}`}
            />
          ))}
        </nav>
      ) : null}
    </section>
  );
}
