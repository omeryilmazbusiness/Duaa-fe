"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Banknote,
  BedDouble,
  CheckCircle2,
  FileWarning,
  ListTodo,
  MessageSquare,
  Settings,
  Sun,
  TimerOff,
  Trash2,
  Users,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardCommandBar } from "@/components/dashboard/command-bar";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { StatTile } from "@/components/dashboard/stat-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { ApprovalInbox } from "@/components/manager/approval-inbox";
import { CashPanel } from "@/components/manager/cash-panel";
import { CafeWasteCard } from "@/components/manager/cafe-waste-card";
import { POSPanel } from "@/components/manager/pos-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { ManagerTab } from "@/domain/catalog";
import {
  dashboardQuickActions,
  pulseKpis,
  reasonCopyKey,
  sourceTiles,
  tileCopyKey,
  tileIconKey,
  tileTone,
  workloadTone,
} from "@/domain/dashboard/look";
import type { ApprovalAction } from "@/domain/finance/types";
import type { SessionPayload } from "@/domain/session/types";
import { settingsQuery } from "@/domain/settings/pane";
import { allows } from "@/domain/staff-scope/rbac";
import { ApiError } from "@/infrastructure/http/errors";
import { departmentLabel, formatIQD } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT } from "@/theme/tones";

const TILE_ICON: Record<string, LucideIcon> = {
  reports: FileWarning,
  cash: Banknote,
  approvals: FileWarning,
  sales: Utensils,
  waste: Trash2,
  occupancy: BedDouble,
};

const PULSE_ICON: Record<string, LucideIcon> = {
  employees: Users,
  open: ListTodo,
  overdue: TimerOff,
  done: CheckCircle2,
};

const QUICK_ICON: Record<string, LucideIcon> = {
  today: Sun,
  ops: ListTodo,
  feedback: MessageSquare,
  settings: Settings,
};

const QUICK_LABEL: Record<string, "tabToday" | "tabOps" | "tabFeedback" | "settings"> = {
  today: "tabToday",
  ops: "tabOps",
  feedback: "tabFeedback",
  settings: "settings",
};

const EMPTY_PULSE = {
  employees: 0,
  openTasks: 0,
  overdueTasks: 0,
  completedToday: 0,
  openReports: 0,
  overloadedStaff: 0,
  pendingApprovals: 0,
};

export function DashboardTab({
  session,
  onOpenTab,
}: {
  session: SessionPayload;
  onOpenTab: (tab: ManagerTab) => void;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const canClose = allows(session.scope, "cash.close");
  const canRecordPOS = allows(session.scope, "pos.record");
  const canSubmit = allows(session.scope, "approval.submit");
  const canAct = allows(session.scope, "approval.act");
  const seeMoney = allows(session.scope, "finance.view");
  const isGm = session.scope === "general_manager";

  const dash = useQuery({
    queryKey: qk.dashboard(wid),
    queryFn: () => kernel.getDashboard(wid),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: qk.dashboard(wid) });
    qc.invalidateQueries({ queryKey: qk.brief(wid) });
  }

  const closeTill = useMutation({
    mutationFn: (input: { countedAmount: number; expectedAmount?: number }) => kernel.closeCash(wid, input),
    onSuccess: () => {
      toast.success(t.tillClosed);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const submitPack = useMutation({
    mutationFn: (input: { title: string; supplier: string; amount: number; evidence?: string }) =>
      kernel.submitApproval(wid, input),
    onSuccess: () => {
      toast.success(t.newApproval);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const actPack = useMutation({
    mutationFn: (input: { id: string; body: { action?: ApprovalAction; amount?: number } }) =>
      kernel.actOnApproval(wid, input.id, input.body),
    onSuccess: () => invalidate(),
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const recordPOS = useMutation({
    mutationFn: (input: { externalRef: string; kind: "sale" | "return"; tender: "cash" | "card" | "other"; lines: number; gross: number; discount?: number }) =>
      kernel.recordCafePOS(wid, input),
    onSuccess: () => {
      toast.success(t.posRecord);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const closePOS = useMutation({
    mutationFn: () => kernel.closeCafePOS(wid),
    onSuccess: () => {
      toast.success(t.posCloseDay);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const attachPack = useMutation({
    mutationFn: (input: { id: string; evidence: string }) => kernel.attachApprovalEvidence(wid, input.id, input.evidence),
    onSuccess: () => {
      toast.success(t.attachEvidence);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const pulse = dash.data?.pulse ?? EMPTY_PULSE;
  const tiles = sourceTiles(dash.data?.tiles ?? []);
  const workload = dash.data?.workload ?? [];
  const busy = closeTill.isPending || submitPack.isPending || actPack.isPending || attachPack.isPending || recordPOS.isPending || closePOS.isPending;
  const kpis = pulseKpis(pulse);
  const quick = dashboardQuickActions(session.tabs, isGm);

  return (
    <div className="space-y-5" data-testid="dashboard-board">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{t.tabDashboard}</h1>
        <p className="max-w-2xl text-sm font-medium text-zinc-500">{t.dashSubtitle}</p>
      </header>

      <DashboardCommandBar
        title={t.dashHeroTitle}
        hint={t.dashHeroHint.replace("{name}", session.workspace.name)}
        actions={quick.map((item) => ({
          id: item.id,
          label: t[QUICK_LABEL[item.id] ?? "tabDashboard"],
          icon: QUICK_ICON[item.id] ?? ListTodo,
          tone: item.tone,
          onClick: () => {
            if (item.settings) {
              router.replace(`/${session.workspace.slug}/manager?${settingsQuery("root")}`);
              return;
            }
            if (item.tab) onOpenTab(item.tab);
          },
        }))}
      />

      {dash.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-[148px] rounded-[28px]" />
          <Skeleton className="h-[148px] rounded-[28px]" />
          <Skeleton className="h-[148px] rounded-[28px]" />
          <Skeleton className="h-[148px] rounded-[28px]" />
        </div>
      ) : dash.isError ? (
        <WidgetCard title={t.tabDashboard} icon={Ban} tone="rose" testId="dashboard-error">
          <p className="text-sm text-rose-700">{dash.error instanceof Error ? dash.error.message : t.dashFailed}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[#007AFF]" onClick={() => void dash.refetch()}>
            {t.dashRetry}
          </button>
        </WidgetCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="dashboard-kpis">
            {kpis.map((kpi) => (
              <StatTile
                key={kpi.id}
                label={t[kpi.labelKey]}
                value={kpi.value}
                tone={kpi.tone}
                icon={PULSE_ICON[kpi.id] ?? Users}
                onClick={kpi.id === "overdue" || kpi.id === "open" ? () => onOpenTab("ops") : kpi.id === "employees" ? () => onOpenTab("today") : undefined}
                testId={`dashboard-kpi-${kpi.id}`}
              />
            ))}
          </div>

          {seeMoney ? (
            <div className="grid gap-4 lg:grid-cols-3" data-testid="dashboard-money-row">
              <CashPanel cash={dash.data?.cash} canClose={canClose} busy={busy} onClose={(input) => closeTill.mutate(input)} />
              <div className="lg:col-span-2">
                <ApprovalInbox
                  packs={dash.data?.approvals ?? []}
                  canSubmit={canSubmit}
                  canAct={canAct}
                  busy={busy}
                  onSubmit={(input) => submitPack.mutate(input)}
                  onAct={(id, body) => actPack.mutate({ id, body })}
                  onAttach={(id, evidence) => attachPack.mutate({ id, evidence })}
                />
              </div>
              <div className="lg:col-span-3">
                <POSPanel
                  sales={dash.data?.sales}
                  canRecord={canRecordPOS}
                  busy={busy}
                  onRecord={(input) => recordPOS.mutate(input)}
                  onClose={() => closePOS.mutate()}
                />
              </div>
              <div className="lg:col-span-3">
                <CafeWasteCard workspaceId={wid} />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {tiles.length > 0 ? (
              <WidgetCard title={t.dashSources} icon={Utensils} tone="sky" testId="dashboard-sources">
                <div className={cn("grid gap-2", tiles.length > 3 ? "grid-cols-3" : "grid-cols-2")}>
                  {tiles.map((tile) => {
                    const Icon = TILE_ICON[tileIconKey(tile.module)] ?? Ban;
                    const live = tile.status === "live";
                    const value = live
                      ? tile.module === "cash" || tile.module === "waste"
                        ? formatIQD(tile.value, locale)
                        : tile.value
                      : "—";
                    return (
                      <MetricTile
                        key={tile.module}
                        icon={Icon}
                        tone={tileTone(tile)}
                        value={value}
                        label={t[tileCopyKey(tile.labelKey)]}
                        caption={live ? undefined : t[reasonCopyKey(tile.reasonKey)]}
                        compact={tile.module === "cash" || tile.module === "waste"}
                        testId={`dashboard-source-${tile.module}`}
                      />
                    );
                  })}
                </div>
              </WidgetCard>
            ) : null}

            <WidgetCard
              title={t.workload}
              icon={Users}
              tone="amber"
              count={workload.length}
              onOpen={() => onOpenTab("ops")}
              openLabel={t.goToTab}
              testId="dashboard-workload"
            >
              {workload.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", TONE_GRADIENT.emerald)}>
                    <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                  </span>
                  <p className="text-[15px] font-semibold text-zinc-900">{t.noWorkload}</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {workload.map((row) => (
                    <li key={row.userId} className="flex items-center gap-3.5 rounded-[20px] px-2.5 py-2 hover:bg-zinc-50/90">
                      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", TONE_GRADIENT[workloadTone(row)])}>
                        <Users className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold tracking-tight text-zinc-900">{row.name}</span>
                        <span className="block truncate text-[12px] font-medium text-zinc-500">
                          {row.department ? `${departmentLabel(row.department)} · ` : ""}
                          {t.open} {row.openTasks}
                          {row.overdueTasks > 0 ? ` · ${t.overdue} ${row.overdueTasks}` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </WidgetCard>
          </div>
        </>
      )}
    </div>
  );
}
