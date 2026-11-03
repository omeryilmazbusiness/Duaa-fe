"use client";

import { useMemo, useState } from "react";
import { Plus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CAFE_AREAS,
  newQRSite,
  toCafeSave,
  type CafeArea,
  type CafeDefinition,
  type CafeQRSite,
} from "@/domain/cafe/definition";
import { tablesStepValid } from "@/domain/cafe/setup";
import type { Messages } from "@/lib/i18n";
import { kernel } from "@/lib/kernel";
import { useLocale } from "@/providers/locale-provider";
import { GlassField, GlassGroup, GlassInput, GlassSelect, PillButton, StepHero } from "./glass";
import { StepFooter } from "./step-footer";

const AREA_LABEL: Record<CafeArea, keyof Messages> = {
  indoor: "cafeAreaIndoor",
  garden: "cafeAreaGarden",
  counter: "cafeAreaCounter",
  table: "cafeAreaTable",
  other: "cafeAreaOther",
};

type Props = {
  definition: CafeDefinition;
  onBack: (() => void) | null;
  onSaved: (next: CafeDefinition) => void;
};

export function TablesStep({ definition, onBack, onSaved }: Props) {
  const { t } = useLocale();
  const activeBranches = useMemo(
    () => definition.branches.filter((b) => b.active && b.name.trim()),
    [definition.branches],
  );
  const defaultBranch = activeBranches[0]?.id ?? "";
  const [sites, setSites] = useState<CafeQRSite[]>(() =>
    definition.qrSites.length
      ? definition.qrSites.map((q) => ({ ...q }))
      : [newQRSite(defaultBranch)],
  );
  const [busy, setBusy] = useState(false);
  const valid = tablesStepValid({ qrSites: sites });

  function update(id: string, patch: Partial<CafeQRSite>) {
    setSites((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  async function save() {
    if (!definition.canWrite) {
      toast.error(t.cafeReadOnly);
      return;
    }
    if (!valid) {
      toast.error(t.cafeEmptyQR);
      return;
    }
    if (sites.some((q) => q.active && q.label.trim() && !q.branchId)) {
      toast.error(t.cafeEmptyBranch);
      return;
    }
    setBusy(true);
    try {
      const saved = await kernel.saveCafeDefinition(
        definition.workspaceId,
        toCafeSave({ ...definition, qrSites: sites }),
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
      <StepHero icon={QrCode} tint="tables" title={t.setupTablesTitle} subtitle={t.setupTablesSubtitle} />

      <GlassGroup title={t.cafeQRSites} footer={t.setupTablesFooter}>
        {sites.map((site, index) => (
          <div key={site.id} data-testid={`setup-table-${index}`}>
            <GlassField id={`setup-table-label-${site.id}`} label={t.cafeQRLabel}>
              <div className="flex items-center gap-2">
                <GlassInput
                  id={`setup-table-label-${site.id}`}
                  value={site.label}
                  placeholder={t.cafeQRLabel}
                  data-testid={`setup-table-label-${index}`}
                  onChange={(e) => update(site.id, { label: e.target.value, active: true })}
                />
                {sites.length > 1 ? (
                  <button
                    type="button"
                    aria-label={t.cafeRemove}
                    className="shrink-0 text-white/40 hover:text-rose-300"
                    onClick={() => setSites((prev) => prev.filter((q) => q.id !== site.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </GlassField>
            <GlassField id={`setup-table-branch-${site.id}`} label={t.cafeQRBranch}>
              <GlassSelect
                id={`setup-table-branch-${site.id}`}
                value={site.branchId}
                data-testid={`setup-table-branch-${index}`}
                onChange={(e) => update(site.id, { branchId: e.target.value })}
              >
                <option value="" className="bg-[#151a31] text-white">
                  {t.required}
                </option>
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#151a31] text-white">
                    {b.name}
                  </option>
                ))}
              </GlassSelect>
            </GlassField>
            <GlassField id={`setup-table-area-${site.id}`} label={t.cafeQRArea}>
              <GlassSelect
                id={`setup-table-area-${site.id}`}
                value={site.area}
                onChange={(e) => update(site.id, { area: e.target.value as CafeArea })}
              >
                {CAFE_AREAS.map((area) => (
                  <option key={area} value={area} className="bg-[#151a31] text-white">
                    {t[AREA_LABEL[area]]}
                  </option>
                ))}
              </GlassSelect>
            </GlassField>
          </div>
        ))}
      </GlassGroup>

      <PillButton
        variant="glass"
        className="w-full"
        onClick={() => setSites((prev) => [...prev, newQRSite(defaultBranch)])}
        data-testid="setup-add-table"
      >
        <Plus className="h-4 w-4" />
        {t.cafeAddQR}
      </PillButton>

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
