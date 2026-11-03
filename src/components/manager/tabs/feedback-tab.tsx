"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, ClipboardList, Handshake, LayoutGrid, ListTodo, MessageSquare, QrCode, Wrench } from "lucide-react";
import { CafeChecklistCard } from "@/components/manager/cafe-checklist-card";
import { CafeWasteCard } from "@/components/manager/cafe-waste-card";
import { CafeHandoverCard } from "@/components/manager/cafe-handover-card";
import { CafeIntakeCard } from "@/components/manager/cafe-intake-card";
import { ReportInbox } from "@/components/manager/report-inbox";
import { VoiceInbox } from "@/components/manager/tabs/voice-inbox";
import { CafeQRDesk } from "@/components/settings/cafe-qr-desk";
import { DashboardCommandBar } from "@/components/dashboard/command-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import type { ManagerTab } from "@/domain/catalog";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

export function FeedbackTab({
  workspaceId,
  canAssign,
  canRotate,
  onOpenTab,
}: {
  workspaceId: string;
  canAssign: boolean;
  canRotate: boolean;
  onOpenTab?: (tab: ManagerTab) => void;
}) {
  const { t } = useLocale();
  const voices = useQuery({ queryKey: qk.cafeVoices(workspaceId), queryFn: () => kernel.listCafeVoices(workspaceId), staleTime: 15_000 });
  const reports = useQuery({ queryKey: qk.reports(workspaceId), queryFn: () => kernel.listReports(workspaceId), staleTime: 15_000 });
  const handover = useQuery({ queryKey: qk.cafeHandover(workspaceId), queryFn: () => kernel.getCafeHandover(workspaceId), staleTime: 15_000 });
  const intake = useQuery({ queryKey: qk.cafeIntake(workspaceId), queryFn: () => kernel.getCafeIntake(workspaceId), staleTime: 15_000 });
  const checks = useQuery({ queryKey: qk.cafeChecklist(workspaceId), queryFn: () => kernel.getCafeChecklist(workspaceId), staleTime: 15_000 });

  const pending = voices.isPending || reports.isPending || handover.isPending || intake.isPending || checks.isPending;
  const openRecoveries = (voices.data ?? []).filter((v) => v.needsRecovery && v.recoveryStatus !== "closed").length;
  const lateRecoveries = (voices.data ?? []).filter((v) => v.lateAck || v.lateResolve).length;
  const openBreakdowns = (reports.data ?? []).filter((r) => r.kind === "breakage" && r.status !== "resolved").length;
  const handoverOpen = handover.data?.persisted === true && handover.data.status === "open";
  const closeWritten = intake.data?.persisted === true;
  const checkRemaining = checks.data ? checks.data.open.remaining + checks.data.close.remaining : 0;
  const checkTotal = checks.data ? checks.data.open.total + checks.data.close.total : 0;

  return (
    <div className="space-y-5" data-testid="feedback-board">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{t.tabFeedback}</h1>
        <p className="max-w-2xl text-sm font-medium text-zinc-500">{t.feedbackHint}</p>
      </header>

      {onOpenTab ? (
        <DashboardCommandBar
          title={t.feedbackKicker}
          hint={t.feedbackHint}
          actions={[
            { id: "today", label: t.tabToday, icon: LayoutGrid, tone: "rose", onClick: () => onOpenTab("today") },
            { id: "ops", label: t.tabOps, icon: ListTodo, tone: "amber", onClick: () => onOpenTab("ops") },
          ]}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4" data-testid="feedback-kpis">
        <StatTile
          label={t.floorRecoveries}
          value={pending ? "—" : openRecoveries}
          caption={!pending && lateRecoveries > 0 ? t.floorLate : undefined}
          tone={lateRecoveries > 0 ? "rose" : "sky"}
          icon={MessageSquare}
          testId="feedback-kpi-recoveries"
        />
        <StatTile label={t.floorBreakdowns} value={pending ? "—" : openBreakdowns} tone="rose" icon={Wrench} testId="feedback-kpi-breakdowns" />
        <StatTile
          label={t.floorHandover}
          value={pending ? "—" : handoverOpen ? 1 : 0}
          caption={pending ? undefined : handoverOpen ? t.floorHandoverOpen : t.floorHandoverQuiet}
          tone="violet"
          icon={Handshake}
          testId="feedback-kpi-handover"
        />
        <StatTile
          label={t.floorClose}
          value={pending ? "—" : closeWritten ? 1 : 0}
          caption={pending ? undefined : closeWritten ? t.floorCloseWritten : t.floorCloseOpen}
          tone="teal"
          icon={ClipboardCheck}
          testId="feedback-kpi-close"
        />
        <StatTile
          label={t.floorChecks}
          value={pending ? "—" : checkRemaining}
          caption={pending ? undefined : checkTotal === 0 ? t.floorChecksQuiet : checkRemaining === 0 ? t.floorChecksDone : t.floorChecksOpen}
          tone="indigo"
          icon={ClipboardList}
          testId="feedback-kpi-checks"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <WidgetCard title={t.reviewInbox} icon={MessageSquare} tone="sky" count={openRecoveries} testId="feedback-voice">
          <VoiceInbox workspaceId={workspaceId} canRecover={canRotate} />
        </WidgetCard>
        <WidgetCard title={t.employeeReports} icon={Wrench} tone="rose" count={openBreakdowns} testId="feedback-reports">
          <ReportInbox workspaceId={workspaceId} canAssign={canAssign} emptyLabel={t.noReports} />
        </WidgetCard>
        <WidgetCard title={t.intakeTitle} icon={ClipboardCheck} tone="teal" testId="feedback-intake">
          <CafeIntakeCard workspaceId={workspaceId} />
        </WidgetCard>
        <WidgetCard title={t.handoverTitle} icon={Handshake} tone="violet" testId="feedback-handover">
          <CafeHandoverCard workspaceId={workspaceId} />
        </WidgetCard>
        <WidgetCard title={t.checkTitle} icon={ClipboardList} tone="indigo" testId="feedback-checklist">
          <CafeChecklistCard workspaceId={workspaceId} />
        </WidgetCard>
        <CafeWasteCard workspaceId={workspaceId} />
      </div>

      <WidgetCard title={t.qrDesk} icon={QrCode} tone="indigo" testId="feedback-qr">
        <CafeQRDesk workspaceId={workspaceId} canRotate={canRotate} />
      </WidgetCard>
    </div>
  );
}
