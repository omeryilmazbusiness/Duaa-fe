"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  ClipboardList,
  Handshake,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  QrCode,
  Sun,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FloorChip } from "@/components/dashboard/floor-chip";
import { TodayBriefHero } from "@/components/dashboard/today-brief-hero";
import { CafeChecklistCard } from "@/components/manager/cafe-checklist-card";
import { CafeWasteCard } from "@/components/manager/cafe-waste-card";
import { CafeHandoverCard } from "@/components/manager/cafe-handover-card";
import { CafeIntakeCard } from "@/components/manager/cafe-intake-card";
import { ReportInbox } from "@/components/manager/report-inbox";
import { VoiceInbox } from "@/components/manager/tabs/voice-inbox";
import { CafeQRDesk } from "@/components/settings/cafe-qr-desk";
import type { ManagerTab } from "@/domain/catalog";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_SOFT, TONE_WELL, type Tone } from "@/theme/tones";

function GlassPanel({
  title,
  icon: Icon,
  tone,
  count,
  testId,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  count?: number;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_50px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl"
      data-testid={testId}
    >
      <header className="flex items-center gap-3 border-b border-zinc-100/80 px-5 py-4">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white", TONE_WELL[tone])}>
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        {count !== undefined ? (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums", TONE_SOFT[tone])}>{count}</span>
        ) : null}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

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

  const summary =
    lateRecoveries > 0
      ? t.floorLate
      : openRecoveries > 0 || openBreakdowns > 0
        ? t.feedbackKicker
        : t.allClear;

  return (
    <div className="space-y-4" data-testid="feedback-board">
      <TodayBriefHero
        kicker={t.tabFeedback}
        summary={summary}
        detail={t.feedbackHint}
        actions={
          onOpenTab
            ? [
                { id: "today", label: t.tabToday, icon: Sun, tone: "rose", onClick: () => onOpenTab("today") },
                { id: "ops", label: t.tabOps, icon: ListTodo, tone: "amber", onClick: () => onOpenTab("ops") },
                { id: "dashboard", label: t.tabDashboard, icon: LayoutGrid, tone: "teal", onClick: () => onOpenTab("dashboard") },
              ]
            : []
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-2.5" data-testid="feedback-kpis">
        <FloorChip
          label={t.floorRecoveries}
          icon={MessageSquare}
          tone={lateRecoveries > 0 ? "rose" : "sky"}
          active={!pending && openRecoveries > 0}
          meta={pending ? "—" : openRecoveries}
          testId="feedback-kpi-recoveries"
        />
        <FloorChip
          label={t.floorBreakdowns}
          icon={Wrench}
          tone="rose"
          active={!pending && openBreakdowns > 0}
          meta={pending ? "—" : openBreakdowns}
          testId="feedback-kpi-breakdowns"
        />
        <FloorChip
          label={t.floorHandover}
          icon={Handshake}
          tone="violet"
          active={!pending && handoverOpen}
          meta={pending ? "—" : handoverOpen ? 1 : 0}
          testId="feedback-kpi-handover"
        />
        <FloorChip
          label={t.floorClose}
          icon={ClipboardCheck}
          tone="teal"
          active={!pending && closeWritten}
          meta={pending ? "—" : closeWritten ? 1 : 0}
          testId="feedback-kpi-close"
        />
        <FloorChip
          label={t.floorChecks}
          icon={ClipboardList}
          tone="indigo"
          active={!pending && checkRemaining > 0}
          meta={pending ? "—" : checkRemaining}
          testId="feedback-kpi-checks"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <GlassPanel title={t.reviewInbox} icon={MessageSquare} tone="sky" count={openRecoveries} testId="feedback-voice">
          <VoiceInbox workspaceId={workspaceId} canRecover={canRotate} />
        </GlassPanel>
        <GlassPanel title={t.employeeReports} icon={Wrench} tone="rose" count={openBreakdowns} testId="feedback-reports">
          <ReportInbox workspaceId={workspaceId} canAssign={canAssign} emptyLabel={t.noReports} />
        </GlassPanel>
        <GlassPanel title={t.intakeTitle} icon={ClipboardCheck} tone="teal" testId="feedback-intake">
          <CafeIntakeCard workspaceId={workspaceId} />
        </GlassPanel>
        <GlassPanel title={t.handoverTitle} icon={Handshake} tone="violet" testId="feedback-handover">
          <CafeHandoverCard workspaceId={workspaceId} />
        </GlassPanel>
        <GlassPanel title={t.checkTitle} icon={ClipboardList} tone="indigo" testId="feedback-checklist">
          <CafeChecklistCard workspaceId={workspaceId} />
        </GlassPanel>
        <div className="min-w-0">
          <CafeWasteCard workspaceId={workspaceId} />
        </div>
      </div>

      <GlassPanel title={t.qrDesk} icon={QrCode} tone="indigo" testId="feedback-qr">
        <CafeQRDesk workspaceId={workspaceId} canRotate={canRotate} />
      </GlassPanel>
    </div>
  );
}
