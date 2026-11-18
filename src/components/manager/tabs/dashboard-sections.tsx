"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Ban, Banknote, BedDouble, FileCheck2, FileWarning, Radio, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { IconGrid, IconGridTile } from "@/components/dashboard/icon-grid-tile";
import { BareWidgetFrame } from "@/components/dashboard/widget-card";
import { ApprovalInbox } from "@/components/manager/approval-inbox";
import { reasonCopyKey, sourceTiles, tileCopyKey, tileIconKey, tileTone } from "@/domain/dashboard/look";
import type { DashboardView } from "@/domain/dashboard/types";
import type { ApprovalAction } from "@/domain/finance/types";
import { ApiError } from "@/infrastructure/http/errors";
import { formatIQD } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

const TILE_ICON: Record<string, LucideIcon> = {
  reports: FileWarning,
  cash: Banknote,
  approvals: FileWarning,
  sales: Utensils,
  waste: Trash2,
  occupancy: BedDouble,
};

/** Mutations for the signed-in workspace's money widgets, shared by every dashboard section. */
export function useDashboardActions(wid: string) {
  const { t } = useLocale();
  const qc = useQueryClient();
  function invalidate() {
    void qc.invalidateQueries({ queryKey: qk.dashboard(wid) });
    void qc.invalidateQueries({ queryKey: qk.brief(wid) });
    void qc.invalidateQueries({ queryKey: qk.portfolio() });
  }
  const onError = (err: Error) => toast.error(err instanceof ApiError ? err.message : t.aiErrGeneric);

  const submitPack = useMutation({
    mutationFn: (input: { title: string; supplier: string; amount: number; evidence?: string }) => kernel.submitApproval(wid, input),
    onSuccess: () => {
      toast.success(t.newApproval);
      invalidate();
    },
    onError,
  });
  const actPack = useMutation({
    mutationFn: (input: { id: string; body: { action?: ApprovalAction; amount?: number } }) => kernel.actOnApproval(wid, input.id, input.body),
    onSuccess: invalidate,
    onError,
  });
  const attachPack = useMutation({
    mutationFn: (input: { id: string; evidence: string }) => kernel.attachApprovalEvidence(wid, input.id, input.evidence),
    onSuccess: () => {
      toast.success(t.attachEvidence);
      invalidate();
    },
    onError,
  });

  const busy = submitPack.isPending || actPack.isPending || attachPack.isPending;
  return { submitPack, actPack, attachPack, busy };
}

type DashboardActions = ReturnType<typeof useDashboardActions>;

export function ApprovalsSection({ view, actions, canSubmit, canAct }: { view: DashboardView | undefined; actions: DashboardActions; canSubmit: boolean; canAct: boolean }) {
  const { t } = useLocale();
  const packs = view?.approvals ?? [];
  const pending = view?.pulse.pendingApprovals ?? 0;
  return (
    <CollapsibleSection
      persistId="dash:approvals"
      title={t.approvalsSectionTitle}
      icon={FileCheck2}
      tone={pending > 0 ? "amber" : "teal"}
      summary={pending > 0 ? t.approvalsWaiting.replace("{n}", String(pending)) : t.approvalsNone}
      testId="dashboard-approvals"
    >
      <BareWidgetFrame>
        <ApprovalInbox
          packs={packs}
          canSubmit={canSubmit}
          canAct={canAct}
          busy={actions.busy}
          onSubmit={(input) => actions.submitPack.mutate(input)}
          onAct={(id, body) => actions.actPack.mutate({ id, body })}
          onAttach={(id, evidence) => actions.attachPack.mutate({ id, evidence })}
        />
      </BareWidgetFrame>
    </CollapsibleSection>
  );
}

export function SourcesSection({ view }: { view: DashboardView | undefined }) {
  const { t, locale } = useLocale();
  const tiles = sourceTiles(view?.tiles ?? []);
  if (tiles.length === 0) return null;
  const live = tiles.filter((tile) => tile.status === "live").length;
  return (
    <CollapsibleSection
      persistId="dash:sources"
      title={t.dashSources}
      icon={Radio}
      tone="sky"
      summary={t.sourcesLive.replace("{n}", String(live)).replace("{total}", String(tiles.length))}
      testId="dashboard-sources"
    >
      <IconGrid>
        {tiles.map((tile) => {
          const isLive = tile.status === "live";
          const money = tile.module === "cash" || tile.module === "waste";
          return (
            <IconGridTile
              key={tile.module}
              icon={TILE_ICON[tileIconKey(tile.module)] ?? Ban}
              tone={tileTone(tile)}
              muted={!isLive}
              value={isLive ? (money ? formatIQD(tile.value, locale) : tile.value) : "—"}
              label={t[tileCopyKey(tile.labelKey)]}
              caption={isLive ? undefined : t[reasonCopyKey(tile.reasonKey)]}
              testId={`dashboard-source-${tile.module}`}
            />
          );
        })}
      </IconGrid>
    </CollapsibleSection>
  );
}
