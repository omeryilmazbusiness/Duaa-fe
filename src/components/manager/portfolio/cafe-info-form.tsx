"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CAFE_CURRENCIES,
  CAFE_TIMEZONES,
  newBranch,
  toCafeSave,
  type CafeDefinition,
  type CafePOSStatus,
} from "@/domain/cafe/definition";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

const SELECT_CLS = "h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900";
const FIELD_LABEL = "mb-1 block text-[11.5px] font-semibold text-zinc-600";

export function CafeInfoForm({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const def = useQuery({
    queryKey: qk.cafeDefinition(workspaceId),
    queryFn: () => kernel.getCafeDefinition(workspaceId),
    staleTime: 30_000,
  });

  if (def.isLoading) return <Skeleton className="h-40 rounded-[20px]" />;
  if (def.isError || !def.data) {
    return (
      <p className="text-[13px] text-rose-700">
        {def.error instanceof Error ? def.error.message : t.dashFailed}
        <button type="button" className="ms-2 font-semibold underline" onClick={() => void def.refetch()}>
          {t.dashRetry}
        </button>
      </p>
    );
  }
  return <CafeInfoFields key={`${workspaceId}:${def.data.updatedAt}`} workspaceId={workspaceId} def={def.data} />;
}

function CafeInfoFields({ workspaceId, def }: { workspaceId: string; def: CafeDefinition }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const branch = def.branches[0];
  const [draft, setDraft] = useState({
    displayName: def.displayName,
    currency: def.currency || "IQD",
    timezone: def.timezone || "Asia/Baghdad",
    posStatus: def.posStatus,
    posVendor: def.posVendor,
    branchAddress: branch?.address ?? "",
  });
  const [issue, setIssue] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const base = toCafeSave(def);
      const primary = branch ?? { ...newBranch(), name: draft.displayName.trim() };
      const branches = draft.branchAddress.trim() || branch
        ? [{ ...primary, address: draft.branchAddress.trim() }, ...base.branches.slice(branch ? 1 : 0)]
        : base.branches;
      return kernel.saveCafeDefinition(workspaceId, {
        ...base,
        displayName: draft.displayName.trim(),
        currency: draft.currency,
        timezone: draft.timezone,
        posStatus: draft.posStatus,
        posVendor: draft.posStatus === "none" ? "" : draft.posVendor.trim(),
        branches,
      });
    },
    onSuccess: (next) => {
      toast.success(t.cafeInfoSaved);
      qc.setQueryData(qk.cafeDefinition(workspaceId), next);
      void qc.invalidateQueries({ queryKey: qk.portfolio() });
      void qc.invalidateQueries({ queryKey: qk.workspaces });
      void qc.invalidateQueries({ queryKey: qk.me });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : t.aiErrGeneric),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.displayName.trim()) {
      setIssue(t.hotelInfoNameRequired);
      return;
    }
    setIssue(null);
    save.mutate();
  }

  const readOnly = !def.canWrite;

  return (
    <form onSubmit={submit} className="space-y-3" data-testid="cafe-info-form">
      {readOnly ? <p className="text-[12px] text-zinc-500">{t.hotelInfoReadOnly}</p> : null}
      <fieldset disabled={readOnly || save.isPending} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={FIELD_LABEL}>{t.cafeInfoName}</span>
          <Input value={draft.displayName} maxLength={80} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoCurrency}</span>
          <select className={SELECT_CLS} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>
            {CAFE_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoTimezone}</span>
          <select className={SELECT_CLS} value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
            {CAFE_TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.cafeInfoPos}</span>
          <select className={SELECT_CLS} value={draft.posStatus} onChange={(e) => setDraft({ ...draft, posStatus: e.target.value as CafePOSStatus })}>
            <option value="unknown">{t.cafeInfoPosUnknown}</option>
            <option value="none">{t.cafeInfoPosNone}</option>
            <option value="named">{t.cafeInfoPosNamed}</option>
          </select>
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.cafeInfoPosVendor}</span>
          <Input
            value={draft.posVendor}
            maxLength={80}
            disabled={draft.posStatus === "none"}
            onChange={(e) => setDraft({ ...draft, posVendor: e.target.value, posStatus: e.target.value.trim() ? "named" : draft.posStatus })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={FIELD_LABEL}>{t.hotelInfoAddress}</span>
          <Input value={draft.branchAddress} maxLength={200} onChange={(e) => setDraft({ ...draft, branchAddress: e.target.value })} />
        </label>
      </fieldset>
      {issue ? (
        <p className="text-[12px] font-medium text-rose-700" role="alert">
          {issue}
        </p>
      ) : null}
      {!readOnly ? (
        <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
          {save.isPending ? t.aiSaving : t.save}
        </Button>
      ) : null}
    </form>
  );
}
