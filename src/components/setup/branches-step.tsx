"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { newBranch, toCafeSave, type CafeBranch, type CafeDefinition } from "@/domain/cafe/definition";
import { branchesStepValid } from "@/domain/cafe/setup";
import { kernel } from "@/lib/kernel";
import { useLocale } from "@/providers/locale-provider";
import { GlassField, GlassGroup, GlassInput, PillButton, StepHero } from "./glass";
import { StepFooter } from "./step-footer";

type Props = {
  definition: CafeDefinition;
  onBack: (() => void) | null;
  onSaved: (next: CafeDefinition) => void;
};

export function BranchesStep({ definition, onBack, onSaved }: Props) {
  const { t } = useLocale();
  const [branches, setBranches] = useState<CafeBranch[]>(() =>
    definition.branches.length ? definition.branches.map((b) => ({ ...b })) : [newBranch()],
  );
  const [busy, setBusy] = useState(false);

  const valid = branchesStepValid({ branches });

  function update(id: string, patch: Partial<CafeBranch>) {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function save() {
    if (!definition.canWrite) {
      toast.error(t.cafeReadOnly);
      return;
    }
    if (!valid) {
      toast.error(t.cafeEmptyBranch);
      return;
    }
    setBusy(true);
    try {
      const saved = await kernel.saveCafeDefinition(
        definition.workspaceId,
        toCafeSave({ ...definition, branches }),
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
      <StepHero icon={MapPin} tint="branches" title={t.setupBranchesTitle} subtitle={t.setupBranchesSubtitle} />

      <GlassGroup title={t.cafeBranches} footer={t.setupBranchesFooter}>
        {branches.map((branch, index) => (
          <div key={branch.id} className="space-y-0" data-testid={`setup-branch-${index}`}>
            <GlassField id={`setup-branch-name-${branch.id}`} label={t.cafeBranchName}>
              <GlassInput
                id={`setup-branch-name-${branch.id}`}
                value={branch.name}
                placeholder={t.cafeBranchName}
                data-testid={`setup-branch-name-${index}`}
                onChange={(e) => update(branch.id, { name: e.target.value, active: true })}
              />
            </GlassField>
            <GlassField id={`setup-branch-addr-${branch.id}`} label={t.cafeBranchAddress}>
              <div className="flex items-center gap-2">
                <GlassInput
                  id={`setup-branch-addr-${branch.id}`}
                  value={branch.address}
                  placeholder={t.cafeBranchAddress}
                  onChange={(e) => update(branch.id, { address: e.target.value })}
                />
                {branches.length > 1 ? (
                  <button
                    type="button"
                    aria-label={t.cafeRemove}
                    className="shrink-0 text-white/40 hover:text-rose-300"
                    onClick={() => setBranches((prev) => prev.filter((b) => b.id !== branch.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </GlassField>
          </div>
        ))}
      </GlassGroup>

      <PillButton
        variant="glass"
        className="w-full"
        onClick={() => setBranches((prev) => [...prev, newBranch()])}
        data-testid="setup-add-branch"
      >
        <Plus className="h-4 w-4" />
        {t.cafeAddBranch}
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
