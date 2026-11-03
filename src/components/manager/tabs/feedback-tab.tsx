"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Handshake,
  MessageSquare,
  QrCode,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { CafeChecklistCard } from "@/components/manager/cafe-checklist-card";
import { CafeWasteCard } from "@/components/manager/cafe-waste-card";
import { CafeHandoverCard } from "@/components/manager/cafe-handover-card";
import { CafeIntakeCard } from "@/components/manager/cafe-intake-card";
import { ReportInbox } from "@/components/manager/report-inbox";
import { VoiceInbox } from "@/components/manager/tabs/voice-inbox";
import { CafeQRDesk } from "@/components/settings/cafe-qr-desk";
import type { ManagerTab } from "@/domain/catalog";
import { EXPAND_SPRING, FADE_UP, IOS_EASE, PRESS_SOFT, STAGGER_PARENT } from "@/lib/motion";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_SOFT, TONE_TINT, TONE_WELL, type Tone } from "@/theme/tones";

function FloorSection({
  title,
  icon: Icon,
  tone,
  count,
  testId,
  children,
  index = 0,
}: {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  count?: number;
  testId?: string;
  children: React.ReactNode;
  index?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={cn(
        "overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_40px_-28px_rgba(15,23,42,0.35)]",
        TONE_TINT[tone],
      )}
      data-testid={testId}
      variants={FADE_UP}
      transition={reduce ? { duration: 0.01 } : { duration: 0.45, ease: IOS_EASE, delay: index * 0.04 }}
      whileHover={reduce ? undefined : { y: -2 }}
    >
      <header className="flex min-h-12 items-center gap-3 border-b border-white/70 px-4 py-3.5 sm:px-5">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white shadow-sm", TONE_WELL[tone])}>
          <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        {count !== undefined && count > 0 ? (
          <motion.span
            className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums", TONE_SOFT[tone])}
            initial={reduce ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
          >
            {count}
          </motion.span>
        ) : null}
      </header>
      <div className="px-3 py-3 sm:px-4 sm:py-4">{children}</div>
    </motion.section>
  );
}

function StatusMetric({
  label,
  value,
  tone,
  active,
  icon: Icon,
  testId,
}: {
  label: string;
  value: string | number;
  tone: Tone;
  active?: boolean;
  icon: LucideIcon;
  testId?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(
        "relative flex min-w-[8rem] flex-1 flex-col gap-1 overflow-hidden rounded-[20px] border border-white/80 bg-gradient-to-br px-3.5 py-3.5 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]",
        TONE_TINT[tone],
      )}
      data-testid={testId}
      variants={FADE_UP}
      whileHover={reduce ? undefined : PRESS_SOFT.whileHover}
      whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
      transition={reduce ? { duration: 0.01 } : { duration: 0.4, ease: IOS_EASE }}
    >
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-white", TONE_WELL[tone])}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="text-[12px] font-medium text-zinc-500">{label}</span>
      <span className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-zinc-950">{value}</span>
      {active ? (
        <motion.span
          className={cn("absolute end-2.5 top-2.5 h-2 w-2 rounded-full", TONE_WELL[tone])}
          animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      ) : null}
    </motion.div>
  );
}

export function FeedbackTab({
  workspaceId,
  canAssign,
  canRotate,
}: {
  workspaceId: string;
  canAssign: boolean;
  canRotate: boolean;
  onOpenTab?: (tab: ManagerTab) => void;
}) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const [opsOpen, setOpsOpen] = useState(false);
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
  const opsAttention = (handoverOpen ? 1 : 0) + (checkRemaining > 0 ? 1 : 0);

  const summary =
    lateRecoveries > 0
      ? t.floorLate
      : openRecoveries > 0 || openBreakdowns > 0
        ? t.feedbackKicker
        : t.allClear;

  return (
    <motion.div
      className="space-y-4"
      data-testid="feedback-board"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={STAGGER_PARENT}
    >
      <motion.header className="px-0.5 pt-0.5" variants={FADE_UP} transition={{ duration: 0.45, ease: IOS_EASE }}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-violet-500/80">{t.tabFeedback}</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-zinc-950">{summary}</h1>
        <p className="mt-1 max-w-xl text-[15px] leading-snug text-zinc-500">{t.feedbackHint}</p>
      </motion.header>

      <motion.div
        className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5"
        data-testid="feedback-kpis"
        variants={STAGGER_PARENT}
      >
        <StatusMetric
          label={t.floorRecoveries}
          icon={MessageSquare}
          value={pending ? "—" : openRecoveries}
          tone={lateRecoveries > 0 ? "rose" : "sky"}
          active={!pending && openRecoveries > 0}
          testId="feedback-kpi-recoveries"
        />
        <StatusMetric
          label={t.floorBreakdowns}
          icon={Wrench}
          value={pending ? "—" : openBreakdowns}
          tone="rose"
          active={!pending && openBreakdowns > 0}
          testId="feedback-kpi-breakdowns"
        />
        <StatusMetric
          label={t.floorHandover}
          icon={Handshake}
          value={pending ? "—" : handoverOpen ? 1 : 0}
          tone="violet"
          active={!pending && handoverOpen}
          testId="feedback-kpi-handover"
        />
        <StatusMetric
          label={t.floorClose}
          icon={ClipboardCheck}
          value={pending ? "—" : closeWritten ? 1 : 0}
          tone="teal"
          active={!pending && closeWritten}
          testId="feedback-kpi-close"
        />
        <StatusMetric
          label={t.floorChecks}
          icon={ClipboardList}
          value={pending ? "—" : checkRemaining}
          tone="indigo"
          active={!pending && checkRemaining > 0}
          testId="feedback-kpi-checks"
        />
      </motion.div>

      <div className="grid items-start gap-3.5 lg:grid-cols-2 lg:gap-4">
        <FloorSection
          title={t.reviewInbox}
          icon={MessageSquare}
          tone="sky"
          count={openRecoveries}
          testId="feedback-voice"
          index={0}
        >
          <VoiceInbox workspaceId={workspaceId} canRecover={canRotate} />
        </FloorSection>

        <FloorSection
          title={t.employeeReports}
          icon={Wrench}
          tone="rose"
          count={openBreakdowns}
          testId="feedback-reports"
          index={1}
        >
          <ReportInbox workspaceId={workspaceId} canAssign={canAssign} emptyLabel={t.noReports} />
        </FloorSection>
      </div>

      <motion.div
        className={cn(
          "overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_40px_-28px_rgba(15,23,42,0.35)]",
          TONE_TINT.indigo,
        )}
        variants={FADE_UP}
        transition={{ duration: 0.45, ease: IOS_EASE }}
      >
        <motion.button
          type="button"
          className="flex min-h-12 w-full items-center gap-3 px-4 py-3.5 text-start sm:px-5"
          aria-expanded={opsOpen}
          onClick={() => setOpsOpen((v) => !v)}
          whileTap={reduce ? undefined : { scale: 0.99 }}
        >
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white", TONE_WELL.indigo)}>
            <ClipboardList className="h-4 w-4" strokeWidth={2.1} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-[15px] font-semibold text-zinc-950">
            {t.intakeTitle} · {t.handoverTitle} · {t.checkTitle}
          </span>
          {opsAttention > 0 ? (
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums", TONE_SOFT.indigo)}>
              {opsAttention}
            </span>
          ) : null}
          <motion.span animate={{ rotate: opsOpen ? 180 : 0 }} transition={EXPAND_SPRING}>
            <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden />
          </motion.span>
        </motion.button>

        <AnimatePresence initial={false}>
          {opsOpen ? (
            <motion.div
              key="ops"
              className="space-y-3 border-t border-white/70 px-3 py-3 sm:px-5 sm:py-4"
              data-testid="feedback-ops"
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={EXPAND_SPRING}
            >
              <div data-testid="feedback-intake">
                <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-teal-700">
                  <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
                  {t.intakeTitle}
                </p>
                <CafeIntakeCard workspaceId={workspaceId} />
              </div>
              <div data-testid="feedback-handover">
                <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-violet-700">
                  <Handshake className="h-3.5 w-3.5" aria-hidden />
                  {t.handoverTitle}
                </p>
                <CafeHandoverCard workspaceId={workspaceId} />
              </div>
              <div data-testid="feedback-checklist">
                <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-indigo-700">
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                  {t.checkTitle}
                </p>
                <CafeChecklistCard workspaceId={workspaceId} />
              </div>
              <CafeWasteCard workspaceId={workspaceId} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <FloorSection title={t.qrDesk} icon={QrCode} tone="indigo" testId="feedback-qr" index={2}>
        <CafeQRDesk workspaceId={workspaceId} canRotate={canRotate} />
      </FloorSection>
    </motion.div>
  );
}
