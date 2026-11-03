"use client";

import { Check, ChevronRight } from "lucide-react";
import type { CafeSetupOverview, CafeSetupStepKey } from "@/domain/cafe/setup";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";
import { useLocale } from "@/providers/locale-provider";
import { AppIcon, GlassGroup, PillButton, StepHero } from "./glass";
import { STEP_ICONS } from "./step-dock";

const STEP_LABEL: Record<CafeSetupStepKey, keyof Messages> = {
  cafe: "setupStepCafe",
  branches: "setupStepBranches",
  tables: "setupStepTables",
  sla: "setupStepSLA",
  ai: "setupStepAI",
};

const STATUS_LABEL: Record<"pending" | "done" | "skipped", keyof Messages> = {
  pending: "setupStatusPending",
  done: "setupStatusDone",
  skipped: "setupStatusSkipped",
};

type Props = {
  overview: CafeSetupOverview;
  onEdit: (step: CafeSetupStepKey) => void;
  onFinish: () => void;
};

export function SetupDone({ overview, onEdit, onFinish }: Props) {
  const { t } = useLocale();
  return (
    <div className="space-y-6">
      <StepHero icon={Check} tint="done" title={t.setupDoneTitle} subtitle={t.setupDoneSubtitle} />

      <GlassGroup title={t.setupDoneSummary}>
        {overview.steps.map((step) => (
          <button
            key={step.key}
            type="button"
            onClick={() => onEdit(step.key)}
            className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-white/[0.08]"
            data-testid={`setup-summary-${step.key}`}
          >
            <AppIcon icon={STEP_ICONS[step.key]} tint={step.key} size="sm" />
            <span className="min-w-0 flex-1 text-[14px] font-semibold text-white">{t[STEP_LABEL[step.key]]}</span>
            <span
              className={cn(
                "text-[12px] font-medium",
                step.status === "done" ? "text-emerald-300" : "text-white/40",
              )}
            >
              {t[STATUS_LABEL[step.status]]}
            </span>
            <ChevronRight className="h-4 w-4 text-white/30 rtl:rotate-180" />
          </button>
        ))}
      </GlassGroup>

      <PillButton className="w-full" onClick={onFinish} data-testid="setup-go-dashboard">
        {t.setupDoneCta}
      </PillButton>
    </div>
  );
}
