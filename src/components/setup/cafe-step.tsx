"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  CAFE_CURRENCIES,
  CAFE_TIMEZONES,
  toCafeSave,
  type CafeDefinition,
} from "@/domain/cafe/definition";
import { cafeStepValid } from "@/domain/cafe/setup";
import { kernel } from "@/lib/kernel";
import { useLocale } from "@/providers/locale-provider";
import { GlassField, GlassGroup, GlassInput, GlassSelect, StepHero } from "./glass";
import { StepFooter } from "./step-footer";

type Props = {
  definition: CafeDefinition;
  onBack: (() => void) | null;
  onSaved: (next: CafeDefinition) => void;
};

export function CafeStep({ definition, onBack, onSaved }: Props) {
  const { t } = useLocale();
  const [name, setName] = useState(definition.displayName);
  const [timezone, setTimezone] = useState(definition.timezone || CAFE_TIMEZONES[0]);
  const [currency, setCurrency] = useState(definition.currency);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; timezone?: string; currency?: string }>({});

  const draft = { displayName: name, timezone, currency };
  const valid = cafeStepValid(draft);

  async function save() {
    if (!definition.canWrite) {
      toast.error(t.cafeReadOnly);
      return;
    }
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = t.required;
    if (!timezone.trim()) nextErrors.timezone = t.required;
    if (!/^[A-Z]{3}$/i.test(currency.trim())) nextErrors.currency = t.required;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const saved = await kernel.saveCafeDefinition(
        definition.workspaceId,
        toCafeSave({
          ...definition,
          displayName: name,
          timezone,
          currency: currency.trim().toUpperCase(),
        }),
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
      <StepHero icon={Building2} tint="cafe" title={t.setupCafeTitle} subtitle={t.setupCafeSubtitle} />

      <GlassGroup title={t.cafeOfficialName} footer={t.setupCafeFooter}>
        <GlassField id="setup-cafe-name" label={t.cafeOfficialName} error={errors.name}>
          <GlassInput
            id="setup-cafe-name"
            value={name}
            invalid={Boolean(errors.name)}
            placeholder={t.cafeOfficialName}
            data-testid="setup-cafe-name"
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
        </GlassField>
        <GlassField id="setup-cafe-tz" label={t.cafeTimezone} error={errors.timezone}>
          <GlassSelect
            id="setup-cafe-tz"
            value={timezone}
            invalid={Boolean(errors.timezone)}
            data-testid="setup-cafe-timezone"
            onChange={(e) => {
              setTimezone(e.target.value);
              setErrors((prev) => ({ ...prev, timezone: undefined }));
            }}
          >
            {!CAFE_TIMEZONES.includes(timezone as (typeof CAFE_TIMEZONES)[number]) && timezone ? (
              <option value={timezone}>{timezone}</option>
            ) : null}
            {CAFE_TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-[#151a31] text-white">
                {tz}
              </option>
            ))}
          </GlassSelect>
        </GlassField>
        <GlassField id="setup-cafe-currency" label={t.cafeCurrency} error={errors.currency}>
          <GlassSelect
            id="setup-cafe-currency"
            value={currency}
            invalid={Boolean(errors.currency)}
            data-testid="setup-cafe-currency"
            onChange={(e) => {
              setCurrency(e.target.value);
              setErrors((prev) => ({ ...prev, currency: undefined }));
            }}
          >
            <option value="" className="bg-[#151a31] text-white">
              {t.required}
            </option>
            {CAFE_CURRENCIES.map((code) => (
              <option key={code} value={code} className="bg-[#151a31] text-white">
                {code}
              </option>
            ))}
            {currency && !CAFE_CURRENCIES.includes(currency as (typeof CAFE_CURRENCIES)[number]) ? (
              <option value={currency} className="bg-[#151a31] text-white">
                {currency}
              </option>
            ) : null}
          </GlassSelect>
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
