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
import { FloorChip } from "@/components/dashboard/floor-chip";
import { TodayBriefHero } from "@/components/dashboard/today-brief-hero";
import { ApprovalInbox } from "@/components/manager/approval-inbox";
import { CashPanel } from "@/components/manager/cash-panel";
import { CafeStockCard } from "@/components/manager/cafe-stock-card";
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
import { TONE_GRADIENT, TONE_WELL } from "@/theme/tones";

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
    mutationFn: (input: {
      externalRef: string;
      kind: "sale" | "return";
      tender: "cash" | "card" | "other";
      lines: number;
      gross: number;
      discount?: number;
    }) => kernel.recordCafePOS(wid, input),
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
  const busy =
    closeTill.isPending ||
    submitPack.isPending ||
    actPack.isPending ||
    attachPack.isPending ||
    recordPOS.isPending ||
    closePOS.isPending;
  const kpis = pulseKpis(pulse);
  const quick = dashboardQuickActions(session.tabs, isGm);

  const summary =
    pulse.overdueTasks > 0
      ? pulse.overdueTasks === 1
        ? t.headlineOverdueOne
        : t.headlineOverdue.replace("{n}", String(pulse.overdueTasks))
      : pulse.openTasks > 0
        ? t.dashHeroTitle
        : t.allClear;

  return (
    <div className="space-y-4" data-testid="dashboard-board">
      <TodayBriefHero
        kicker={t.tabDashboard}
        summary={summary}
        detail={t.dashHeroHint.replace("{name}", session.workspace.name)}
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
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Skeleton className="h-12 rounded-[16px]" />
          <Skeleton className="h-12 rounded-[16px]" />
          <Skeleton className="h-12 rounded-[16px]" />
          <Skeleton className="h-12 rounded-[16px]" />
        </div>
      ) : dash.isError ? (
        <section className="rounded-[28px] border border-rose-100 bg-white/90 px-5 py-6 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.35)]" data-testid="dashboard-error">
          <p className="text-sm text-rose-700">{dash.error instanceof Error ? dash.error.message : t.dashFailed}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[#007AFF]" onClick={() => void dash.refetch()}>
            {t.dashRetry}
          </button>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-2.5" data-testid="dashboard-kpis">
            {kpis.map((kpi) => (
              <FloorChip
                key={kpi.id}
                label={t[kpi.labelKey]}
                tone={kpi.tone}
                icon={PULSE_ICON[kpi.id] ?? Users}
                active={kpi.value > 0}
                meta={kpi.value}
                onClick={
                  kpi.id === "overdue" || kpi.id === "open"
                    ? () => onOpenTab("ops")
                    : kpi.id === "employees"
                      ? () => onOpenTab("today")
                      : undefined
                }
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
              <div className="lg:col-span-3">
                <CafeStockCard workspaceId={wid} />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {tiles.length > 0 ? (
              <section
                className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_50px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl"
                data-testid="dashboard-sources"
              >
                <header className="flex items-center gap-3 border-b border-zinc-100/80 px-5 py-4">
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white", TONE_WELL.sky)}>
                    <Utensils className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">{t.dashSources}</p>
                    <p className="truncate text-[12px] font-medium text-zinc-500">{t.dashSubtitle}</p>
                  </div>
                </header>
                <div className={cn("grid gap-2 p-4", tiles.length > 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
                  {tiles.map((tile) => {
                    const Icon = TILE_ICON[tileIconKey(tile.module)] ?? Ban;
                    const live = tile.status === "live";
                    const caption = live
                      ? tile.module === "cash" || tile.module === "waste"
                        ? formatIQD(tile.value, locale)
                        : String(tile.value)
                      : t[reasonCopyKey(tile.reasonKey)];
                    return (
                      <div
                        key={tile.module}
                        className="rounded-[16px] border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)]"
                        data-testid={`dashboard-source-${tile.module}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white",
                              TONE_WELL[tileTone(tile)],
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-zinc-800">{t[tileCopyKey(tile.labelKey)]}</p>
                            <p className="truncate text-[11px] font-medium tabular-nums text-zinc-500">{caption}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section
              className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_50px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl"
              data-testid="dashboard-workload"
            >
              <header className="flex items-center justify-between gap-3 border-b border-zinc-100/80 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white", TONE_WELL.amber)}>
                    <Users className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">{t.workload}</p>
                    <p className="truncate text-[12px] font-medium text-zinc-500">{t.opsEmptyHint}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenTab("ops")}
                  className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-200"
                >
                  {t.goToTab}
                </button>
              </header>

              <div className="px-3 py-3 sm:px-4">
                {workload.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", TONE_GRADIENT.emerald)}>
                      <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                    </span>
                    <p className="text-[15px] font-semibold text-zinc-900">{t.noWorkload}</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {workload.map((row) => (
                      <li key={row.userId} className="flex items-center gap-3.5 rounded-[20px] px-2.5 py-2.5 transition-colors hover:bg-zinc-50/90">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]",
                            TONE_GRADIENT[workloadTone(row)],
                          )}
                        >
                          <Users className="h-4 w-4" strokeWidth={2} />
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
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
