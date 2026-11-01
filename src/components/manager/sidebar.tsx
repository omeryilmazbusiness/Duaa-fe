"use client";

import { LogOut, Settings } from "lucide-react";
import type { ManagerTab } from "@/domain/catalog";
import { DuaMark } from "@/components/brand/dua-mark";
import { navForTabs } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_WELL } from "@/theme/tones";

export function ManagerDesktopSidebar({
  appName,
  roleLine,
  tabs,
  activeTab,
  badges,
  logoutLabel,
  settingsLabel,
  settingsActive,
  onTabChange,
  onSettings,
  onLogout,
}: {
  appName: string;
  roleLine: string;
  tabs: readonly ManagerTab[];
  activeTab: ManagerTab | "";
  badges: Partial<Record<ManagerTab, number>>;
  logoutLabel: string;
  settingsLabel?: string;
  settingsActive?: boolean;
  onTabChange: (tab: ManagerTab) => void;
  onSettings?: () => void;
  onLogout: () => void;
}) {
  const { t } = useLocale();
  const items = navForTabs(tabs);

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-white/8 bg-zinc-950 text-white lg:flex" aria-label={roleLine}>
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
        <DuaMark invert className="h-9 w-9 rounded-xl text-lg" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight">{appName}</p>
          <p className="truncate text-[11px] font-medium text-white/50">{roleLine}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            const badge = badges[item.id] ?? 0;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-white/55 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]", TONE_WELL[item.tone])}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-snug">{item.label(t)}</span>
                  {badge > 0 ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-lg px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
                        isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/80",
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        {onSettings ? (
          <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
            <li>
              <button
                type="button"
                onClick={onSettings}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  settingsActive
                    ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    : "text-white/55 hover:bg-white/8 hover:text-white",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-zinc-500 text-white">
                  <Settings className="h-[17px] w-[17px]" strokeWidth={1.7} />
                </span>
                <span className="text-[14px] font-medium">{settingsLabel}</span>
              </button>
            </li>
          </ul>
        ) : null}
      </nav>
      <div className="border-t border-white/10 px-2.5 py-3">
        <button
          type="button"
          onClick={onLogout}
          aria-label={logoutLabel}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-white/55 transition-colors hover:bg-white/8 hover:text-white"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <LogOut className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </span>
        </button>
      </div>
    </aside>
  );
}
