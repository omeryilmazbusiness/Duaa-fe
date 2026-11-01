"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, Settings } from "lucide-react";
import { useState } from "react";
import type { ManagerTab } from "@/domain/catalog";
import { DuaMark } from "@/components/brand/dua-mark";
import { LanguagePicker } from "@/components/login/language-picker";
import { ManagerAnimatedTabs } from "@/components/manager/animated-tabs";
import { AppHeader } from "@/components/theme/page-shell";
import { Button } from "@/components/ui/button";
import { DRAWER_SPRING } from "@/lib/motion";
import { navForTabs } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_WELL } from "@/theme/tones";

export function ManagerDashboardHeader({
  appName,
  roleLine,
  tabs,
  activeTab,
  badges,
  desktopTitle,
  logoutLabel,
  settingsLabel,
  onTabChange,
  onSettings,
  onLogout,
  settingsChrome = false,
  boardChrome = false,
}: {
  appName: string;
  roleLine: string;
  tabs: readonly ManagerTab[];
  activeTab: ManagerTab | "";
  badges: Partial<Record<ManagerTab, number>>;
  desktopTitle?: string;
  logoutLabel: string;
  settingsLabel?: string;
  onTabChange: (tab: ManagerTab) => void;
  onSettings?: () => void;
  onLogout: () => void;
  settingsChrome?: boolean;
  boardChrome?: boolean;
}) {
  const { t, dir } = useLocale();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const items = navForTabs(tabs);
  const hiddenX = dir === "rtl" ? "100%" : "-100%";

  return (
    <>
      <AppHeader
        hairline={false}
        className={settingsChrome || boardChrome ? "bg-[#F9FAFB]/80" : undefined}
        start={
          <>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" strokeWidth={1.7} />
            </button>
            {settingsChrome ? null : (
              <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:hidden">
                <DuaMark className="h-8 w-8 rounded-xl text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-serif text-[15px] text-zinc-900">{appName}</p>
                  <p className="truncate text-[11px] text-zinc-900/45">{roleLine}</p>
                </div>
              </div>
            )}
            {settingsChrome || boardChrome ? null : (
              <p className="hidden min-w-0 flex-1 truncate font-serif text-lg text-zinc-900 lg:block">{desktopTitle}</p>
            )}
          </>
        }
        end={
          settingsChrome ? undefined : (
            <>
              <LanguagePicker />
              <Button type="button" variant="ghost" size="icon-sm" onClick={onLogout} aria-label={logoutLabel} className="hidden md:inline-flex">
                <LogOut />
              </Button>
            </>
          )
        }
      />
      {settingsChrome ? null : (
        <div className="sticky top-14 z-10 bg-transparent lg:hidden">
          <div className="px-3 pb-1.5 pt-1">
            <ManagerAnimatedTabs tabs={tabs} active={activeTab} badges={badges} onChange={onTabChange} />
          </div>
        </div>
      )}
      <AnimatePresence>
        {open ? (
        <motion.div key="manager-drawer" className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button
            type="button"
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setOpen(false)}
            aria-label="Close"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
          <motion.aside
            className="absolute inset-y-0 start-0 w-[min(18rem,86vw)] bg-zinc-950 text-white"
            initial={reduce ? false : { x: hiddenX }}
            animate={{ x: 0 }}
            exit={{ x: hiddenX }}
            transition={reduce ? { duration: 0.01 } : DRAWER_SPRING}
          >
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
              <DuaMark invert className="h-9 w-9 rounded-xl text-lg" />
              <div>
                <p className="text-[15px] font-semibold">{appName}</p>
                <p className="text-[11px] text-white/50">{roleLine}</p>
              </div>
            </div>
            <nav className="px-2.5 py-3">
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeTab;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onTabChange(item.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left",
                          isActive ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" : "text-white/60",
                        )}
                      >
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-[11px]", TONE_WELL[item.tone])}>
                          <Icon className="h-4 w-4" strokeWidth={1.7} />
                        </span>
                        {item.label(t)}
                      </button>
                    </li>
                  );
                })}
                {onSettings ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onSettings();
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-white/60"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-zinc-500 text-white">
                        <Settings className="h-4 w-4" strokeWidth={1.7} />
                      </span>
                      {settingsLabel}
                    </button>
                  </li>
                ) : null}
              </ul>
            </nav>
            <div className="border-t border-white/10 px-2.5 py-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-white/60"
              >
                <LogOut className="h-4 w-4" />
                {logoutLabel}
              </button>
            </div>
          </motion.aside>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
