"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ManagerTab } from "@/domain/catalog";
import { resolveActiveTab, managerGuard, postLoginPath } from "@/domain/staff-scope";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { ManagerDashboardHeader } from "@/components/manager/header";
import { ManagerDesktopSidebar } from "@/components/manager/sidebar";
import { ManagerTabBody } from "@/components/manager/tab-registry";
import { ManagerTabPanel } from "@/components/manager/tab-panel";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { PageShell, ScreenMain } from "@/components/theme/page-shell";
import { parseSettingsPane, settingsQuery, type SettingsPane } from "@/domain/settings/pane";
import { navForTabs } from "@/lib/nav";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { useQuery } from "@tanstack/react-query";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";

export function ManagerShell({ slug }: { slug: string }) {
  const { session, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !session) {
      router.replace(`/${slug}/login`);
      return;
    }
    const gate = managerGuard(session.scope);
    if (gate === "staff") {
      router.replace(postLoginPath({ slug: session.workspace.slug, surface: "staff_portal" }));
    }
  }, [isLoading, isAuthenticated, session, router, slug]);

  const tabs = session?.tabs ?? [];
  const urlSettings = params.get("view") === "settings";
  const settingsPane = parseSettingsPane(params.get("pane"));
  const urlTab = urlSettings ? "" : resolveActiveTab(params.get("tab"), tabs, session?.defaultTab ?? "");
  const [pendingTab, setPendingTab] = useState<ManagerTab | "settings" | null>(null);

  useEffect(() => {
    if (pendingTab === "settings" && urlSettings) setPendingTab(null);
    if (pendingTab && pendingTab !== "settings" && urlTab === pendingTab) setPendingTab(null);
  }, [pendingTab, urlSettings, urlTab]);

  const settingsOpen = pendingTab === "settings" || (pendingTab === null && urlSettings);
  const pendingManagerTab = pendingTab !== null && pendingTab !== "settings" ? pendingTab : null;
  const active = settingsOpen ? "" : (pendingManagerTab ?? urlTab);

  const setTab = useCallback(
    (tab: ManagerTab) => {
      setPendingTab(tab);
      router.replace(`/${slug}/manager?tab=${tab}`, { scroll: false });
    },
    [router, slug],
  );

  const openSettings = useCallback(() => {
    setPendingTab("settings");
    router.replace(`/${slug}/manager?${settingsQuery("root")}`, { scroll: false });
  }, [router, slug]);

  const setSettingsPane = useCallback(
    (pane: SettingsPane) => {
      router.replace(`/${slug}/manager?${settingsQuery(pane)}`, { scroll: false });
    },
    [router, slug],
  );

  const brief = useQuery({
    queryKey: qk.brief(session?.workspace.id ?? ""),
    queryFn: () => kernel.getBrief(session!.workspace.id),
    enabled: !!session && (session.scope === "general_manager" || session.scope === "department_manager"),
  });

  const reports = useQuery({
    queryKey: qk.reports(session?.workspace.id ?? ""),
    queryFn: () => kernel.listReports(session!.workspace.id),
    enabled: !!session && (session.scope === "general_manager" || session.scope === "floor_ops"),
  });

  const badges = useMemo<Partial<Record<ManagerTab, number>>>(() => {
    const pulse = brief.data?.pulse;
    const openReports = (reports.data ?? []).filter((r) => r.status === "open" || r.status === "assigned").length;
    return {
      today: brief.data?.isClear ? 0 : brief.data?.cards.length,
      ops: pulse?.overdueTasks,
      feedback: openReports,
      requests: openReports,
    };
  }, [brief.data, reports.data]);

  if (isLoading || !session) {
    return (
      <div className="ios-canvas flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  const isGm = session.scope === "general_manager";
  const title = settingsOpen
    ? t.settings
    : (navForTabs(tabs).find((n) => n.id === active)?.label(t) ?? t.tabToday);

  return (
    <PageShell>
      <ManagerDesktopSidebar
        appName={session.workspace.name}
        roleLine={session.scopeLabel}
        tabs={tabs}
        activeTab={active}
        badges={badges}
        logoutLabel={t.logout}
        settingsLabel={isGm ? t.settings : undefined}
        settingsActive={settingsOpen}
        onTabChange={setTab}
        onSettings={isGm ? openSettings : undefined}
        onLogout={() => {
          logout();
          router.replace(`/${slug}/login`);
        }}
      />
      <div
        className={
          settingsOpen
            ? "ios-settings min-h-dvh bg-zinc-50 lg:ps-64"
            : active === "dashboard" || active === "today" || active === "ops"
              ? "min-h-dvh bg-[#F9FAFB] lg:ps-64"
              : "lg:ps-64"
        }
      >
        <ManagerDashboardHeader
          appName={session.workspace.name}
          roleLine={session.scopeLabel}
          tabs={tabs}
          activeTab={active}
          badges={badges}
          desktopTitle={title}
          logoutLabel={t.logout}
          settingsLabel={isGm ? t.settings : undefined}
          settingsChrome={settingsOpen}
          boardChrome={active === "dashboard" || active === "today" || active === "ops"}
          onTabChange={setTab}
          onSettings={isGm ? openSettings : undefined}
          onLogout={() => {
            logout();
            router.replace(`/${slug}/login`);
          }}
        />
        <ScreenMain
          className={
            settingsOpen
              ? "max-w-none px-4 py-5 lg:px-8"
              : active === "dashboard" || active === "today" || active === "ops"
                ? "max-w-[1400px] px-5 py-6 sm:px-8 sm:py-7 lg:px-10"
                : undefined
          }
        >
          <ManagerTabPanel tabKey={settingsOpen ? `settings:${settingsPane}` : active || "empty"}>
            {settingsOpen && isGm ? (
              <SettingsScreen
                session={session}
                pane={settingsPane}
                onPane={setSettingsPane}
                onLogout={() => {
                  logout();
                  router.replace(`/${slug}/login`);
                }}
              />
            ) : active ? (
              <ManagerTabBody tab={active} session={session} onOpenTab={setTab} />
            ) : null}
          </ManagerTabPanel>
        </ScreenMain>
      </div>
      {isGm ? <AssistantWidget session={session} /> : null}
    </PageShell>
  );
}
