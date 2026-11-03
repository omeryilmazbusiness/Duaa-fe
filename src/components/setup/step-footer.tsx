"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";
import { PillButton } from "./glass";

type Props = {
  onBack: (() => void) | null;
  primaryLabel: string;
  onPrimary: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: { label: string; onClick: () => void; /** Skip stays clickable while primary is busy/loading. */ alwaysEnabled?: boolean };
};

export function StepFooter({ onBack, primaryLabel, onPrimary, busy, disabled, secondary }: Props) {
  const { t } = useLocale();
  return (
    <div className="space-y-2 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <PillButton variant="glass" onClick={onBack ?? undefined} disabled={!onBack || busy} data-testid="setup-back">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={2.25} />
          {t.setupBack}
        </PillButton>
        <PillButton onClick={onPrimary} disabled={disabled || busy} data-testid="setup-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {primaryLabel}
          {busy ? null : <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2.25} />}
        </PillButton>
      </div>
      {secondary ? (
        <PillButton
          variant="glass"
          className="w-full"
          onClick={secondary.onClick}
          disabled={secondary.alwaysEnabled ? false : busy}
          data-testid="setup-skip"
        >
          {secondary.label}
        </PillButton>
      ) : (
        <div className="h-11" aria-hidden />
      )}
    </div>
  );
}
