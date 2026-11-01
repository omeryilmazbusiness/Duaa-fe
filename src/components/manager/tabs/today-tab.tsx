"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CheckCircle2, ClipboardCheck, Handshake, LayoutGrid, ListTodo, MessageSquare, ShieldCheck, Sparkles, TimerOff, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { DashboardCommandBar } from "@/components/dashboard/command-bar";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { StatTile } from "@/components/dashboard/stat-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { DecisionCard } from "@/components/manager/decision-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ManagerTab } from "@/domain/catalog";
import type { ActCommand, BriefView, DecisionAction } from "@/domain/executive";
import { emptyBriefKey, floorKpis, headlineParts, sourceCopyKey, todayKpis } from "@/domain/executive/look";
import type { SessionPayload } from "@/domain/session/types";
import { formatTimeRange } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import type { Messages } from "@/lib/i18n";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";
import { TONE_GRADIENT } from "@/theme/tones";

const KPI_ICON: Record<string, LucideIcon> = {
  overdue: TimerOff,
  open: ListTodo,
  done: CheckCircle2,
  recoveries: MessageSquare,
  breakdowns: Wrench,
  handover: Handshake,
  close: ClipboardCheck,
};

function composeHeadline(t: Messages, brief: BriefView): string {
  const parts = headlineParts(brief);
  if (parts.length === 0) return t.allClear;
  return parts.map((part) => (part.n === 1 ? t[part.one] : t[part.many].replace("{n}", String(part.n)))).join(" ");
}

export function TodayTab({
  session,
  onOpenTab,
}: {
  session: SessionPayload;
  onOpenTab: (tab: ManagerTab) => void;
}) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const workspaceId = session.workspace.id;
  const brief = useQuery({
    queryKey: qk.brief(workspaceId),
    queryFn: () => kernel.getBrief(workspaceId),
  });
  const staff = useQuery({
    queryKey: qk.staff(workspaceId),
    queryFn: () => kernel.listPersonnel(workspaceId),
  });
  const tasks = useQuery({
    queryKey: qk.tasks(workspaceId),
    queryFn: () => kernel.listTasks(workspaceId),
  });

  const act = useMutation({
    mutationFn: (command: ActCommand) => kernel.actOnBrief(workspaceId, command),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.tasks(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const pulse = brief.data?.pulse ?? {
    overdueTasks: 0,
    openTasks: 0,
    completedToday: 0,
    openRecoveries: 0,
    lateRecoveries: 0,
    openBreakdowns: 0,
    handoverOpen: false,
    intakeWritten: false,
  };
  const kpis = todayKpis(pulse);
  const floor = floorKpis(pulse);
  const personnel = (staff.data ?? []).filter((m) => m.role === "personnel" && m.isActive);
  const overdueItems = (tasks.data ?? [])
    .filter((task) => task.isOverdue)
    .map((task) => ({
      id: task.id,
      title: task.title,
      meta: formatTimeRange(task.scheduledStartAt, task.scheduledEndAt, locale),
    }));
  const cards = brief.data?.cards ?? [];
  const sources = brief.data?.sources ?? [];

  function run(card: NonNullable<BriefView["cards"]>[number], action: DecisionAction, extra?: { assigneeUserId: string; title: string }) {
    act.mutate({
      sourceKey: card.sourceKey,
      fingerprint: card.fingerprint,
      kind: card.kind,
      titleKey: card.titleKey,
      detail: card.detail,
      severity: card.severity,
      targetTab: card.targetTab,
      action,
      assigneeUserId: extra?.assigneeUserId,
      title: extra?.title,
    });
  }

  const headline = brief.data ? composeHeadline(t, brief.data) : t.todayKicker;

  return (
    <div className="space-y-5" data-testid="today-board">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{t.tabToday}</h1>
        <p className="max-w-2xl text-sm font-medium text-zinc-500">{brief.data ? headline : t.todaySubtitle}</p>
      </header>

      <DashboardCommandBar
        title={t.todayKicker}
        hint={`${session.workspace.name} · ${headline}`}
        actions={[
          { id: "ops", label: t.tabOps, icon: ListTodo, tone: "amber", onClick: () => onOpenTab("ops") },
          { id: "dashboard", label: t.tabDashboard, icon: LayoutGrid, tone: "teal", onClick: () => onOpenTab("dashboard") },
          ...(session.tabs.includes("feedback")
            ? [{ id: "feedback", label: t.tabFeedback, icon: MessageSquare, tone: "violet" as const, onClick: () => onOpenTab("feedback") }]
            : []),
        ]}
      />

      <div className="grid grid-cols-3 gap-3 lg:gap-4" data-testid="today-kpis">
        {kpis.map((kpi) => (
          <StatTile
            key={kpi.id}
            label={t[kpi.labelKey]}
            value={kpi.value}
            tone={kpi.tone}
            icon={KPI_ICON[kpi.id] ?? ListTodo}
            onClick={kpi.id === "done" ? undefined : () => onOpenTab("ops")}
            testId={`today-kpi-${kpi.id}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" data-testid="today-floor">
        {floor.map((kpi) => (
          <StatTile
            key={kpi.id}
            label={t[kpi.labelKey]}
            value={kpi.value}
            caption={kpi.captionKey ? t[kpi.captionKey] : undefined}
            tone={kpi.tone}
            icon={KPI_ICON[kpi.id] ?? ListTodo}
            onClick={session.tabs.includes("feedback") ? () => onOpenTab("feedback") : undefined}
            testId={`today-floor-${kpi.id}`}
          />
        ))}
      </div>

      {brief.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-[28px]" />
          <Skeleton className="h-48 rounded-[28px]" />
        </div>
      ) : brief.isError ? (
        <WidgetCard title={t.tabToday} icon={Sparkles} tone="rose" testId="today-error">
          <p className="text-sm text-rose-700">{brief.error instanceof Error ? brief.error.message : t.todayFailed}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[#007AFF]" onClick={() => void brief.refetch()}>
            {t.todayRetry}
          </button>
        </WidgetCard>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <WidgetCard title={t.todayDecisions} icon={Sparkles} tone="violet" count={cards.length} testId="today-decisions">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center" data-testid="today-empty">
                <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", TONE_GRADIENT.emerald)}>
                  <ShieldCheck className="h-7 w-7" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-semibold text-zinc-900">{t[emptyBriefKey(brief.data!)]}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {cards.map((card) => (
                  <DecisionCard
                    key={card.sourceKey}
                    card={card}
                    staff={personnel}
                    items={card.kind === "late_staff" ? overdueItems : []}
                    busy={act.isPending}
                    onOpenTab={onOpenTab}
                    onAct={(action, extra) => run(card, action, extra)}
                  />
                ))}
              </div>
            )}
          </WidgetCard>

          <WidgetCard title={t.todaySources} icon={MessageSquare} tone="sky" testId="today-sources">
            {sources.length === 0 ? (
              <p className="text-[13px] text-zinc-500">{t.sourceUnavailable}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {sources.map((src) => {
                  const label = sourceCopyKey(src.kind);
                  return (
                    <MetricTile
                      key={src.kind}
                      icon={
                        src.kind === "cash_variance"
                          ? Banknote
                          : src.kind === "customer_voice"
                            ? MessageSquare
                            : src.kind === "handover"
                              ? Handshake
                              : src.kind === "breakdown"
                                ? Wrench
                                : src.kind === "daily_close"
                                  ? ClipboardCheck
                                  : TimerOff
                      }
                      tone={src.status === "live" ? "emerald" : "zinc"}
                      value={src.status === "live" ? t.sourceLive : "—"}
                      label={label ? t[label] : src.kind.replaceAll("_", " ")}
                      caption={src.status === "live" ? undefined : t.sourceUnavailable}
                      testId={`today-source-${src.kind}`}
                    />
                  );
                })}
              </div>
            )}
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
