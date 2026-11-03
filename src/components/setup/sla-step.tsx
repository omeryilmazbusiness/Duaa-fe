"use client";

import { useState } from "react";
import { Clock3 } from "lucide-react";
import { toast } from "sonner";
import { toCafeSave, type CafeDefinition, type CafeSLA } from "@/domain/cafe/definition";
import { slaStepValid } from "@/domain/cafe/setup";
import { kernel } from "@/lib/kernel";
import { useLocale } from "@/providers/locale-provider";
import { GlassField, GlassGroup, GlassInput, StepHero } from "./glass";
import { StepFooter } from "./step-footer";

type Props = {
  definition: CafeDefinition;
  onBack: (() => void) | null;
  onSaved: (next: CafeDefinition) => void;
};

export function SLAStep({ definition, onBack, onSaved }: Props) {
  const { t } = useLocale();
  const [sla, setSla] = useState<CafeSLA>({ ...definition.sla });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const valid = slaStepValid({ sla });

  function setNum(key: "ackMinutes" | "resolveMinutes" | "compensationLimit", raw: string) {
    const n = Number(raw);
    setSla((prev) => ({ ...prev, [key]: Number.isFinite(n) && n >= 0 ? n : 0 }));
    if (key === "ackMinutes") setError(undefined);
  }

  async function save() {
    if (!definition.canWrite) {
      toast.error(t.cafeReadOnly);
      return;
    }
    if (!valid) {
      setError(t.required);
      return;
    }
    setBusy(true);
    try {
      const saved = await kernel.saveCafeDefinition(
        definition.workspaceId,
        toCafeSave({ ...definition, sla }),
      );
      toast.success(t.cafeSaved);
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.cafeLoadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepHero icon={Clock3} tint="sla" title={t.setupSLATitle} subtitle={t.setupSLASubtitle} />

      <GlassGroup title={t.cafeSLA} footer={t.setupSLAFooter}>
        <GlassField id="setup-sla-ack" label={t.cafeSLAAck} error={error}>
          <GlassInput
            id="setup-sla-ack"
            type="number"
            min={1}
            inputMode="numeric"
            value={sla.ackMinutes || ""}
            invalid={Boolean(error)}
            placeholder="15"
            data-testid="setup-sla-ack"
            onChange={(e) => setNum("ackMinutes", e.target.value)}
          />
        </GlassField>
        <GlassField id="setup-sla-resolve" label={t.cafeSLAResolve}>
          <GlassInput
            id="setup-sla-resolve"
            type="number"
            min={0}
            inputMode="numeric"
            value={sla.resolveMinutes || ""}
            placeholder="60"
            data-testid="setup-sla-resolve"
            onChange={(e) => setNum("resolveMinutes", e.target.value)}
          />
        </GlassField>
        <GlassField id="setup-sla-after" label={t.cafeSLAAfterHours}>
          <GlassInput
            id="setup-sla-after"
            value={sla.afterHoursMessage}
            placeholder={t.cafeSLAAfterHours}
            onChange={(e) => setSla((prev) => ({ ...prev, afterHoursMessage: e.target.value }))}
          />
        </GlassField>
        <GlassField id="setup-sla-comp" label={t.cafeSLACompensation}>
          <GlassInput
            id="setup-sla-comp"
            type="number"
            min={0}
            inputMode="numeric"
            value={sla.compensationLimit || ""}
            onChange={(e) => setNum("compensationLimit", e.target.value)}
          />
        </GlassField>
        <GlassField id="setup-sla-comp-cur" label={t.cafeSLACompensationCurrency}>
          <GlassInput
            id="setup-sla-comp-cur"
            value={sla.compensationCurrency}
            placeholder={definition.currency || "IQD"}
            maxLength={3}
            onChange={(e) =>
              setSla((prev) => ({ ...prev, compensationCurrency: e.target.value.toUpperCase() }))
            }
          />
        </GlassField>
      </GlassGroup>

      <StepFooter
        onBack={onBack}
        primaryLabel={t.setupContinue}
        onPrimary={() => void save()}
        busy={busy}
        disabled={!valid}
      />
    </div>
  );
}
