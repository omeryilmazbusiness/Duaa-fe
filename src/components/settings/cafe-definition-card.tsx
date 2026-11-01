"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  CAFE_AREAS,
  CAFE_CURRENCIES,
  CAFE_POS_STATUSES,
  CAFE_TIMEZONES,
  newBranch,
  newQRSite,
  newShift,
  previewCompleteness,
  toCafeSave,
  type CafeArea,
  type CafeDefinition,
  type CafeMissing,
  type CafePOSStatus,
} from "@/domain/cafe/definition";
import type { SessionPayload } from "@/domain/session/types";
import { CafeQRDesk } from "@/components/settings/cafe-qr-desk";
import { IosField, IosGroup, IosLinkButton, IosRow } from "@/components/ios/ios-settings";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import type { Messages } from "@/lib/i18n";
import { useLocale } from "@/providers/locale-provider";

const MISSING_LABEL: Record<CafeMissing, keyof Messages> = {
  name: "cafeChecklistName",
  timezone: "cafeChecklistTimezone",
  currency: "cafeChecklistCurrency",
  branch: "cafeChecklistBranch",
  qr_site: "cafeChecklistQR",
  sla: "cafeChecklistSLA",
};

const AREA_LABEL: Record<CafeArea, keyof Messages> = {
  indoor: "cafeAreaIndoor",
  garden: "cafeAreaGarden",
  counter: "cafeAreaCounter",
  table: "cafeAreaTable",
  other: "cafeAreaOther",
};

const POS_LABEL: Record<CafePOSStatus, keyof Messages> = {
  unknown: "cafePOSUnknown",
  none: "cafePOSNone",
  named: "cafePOSNamed",
};

export function CafeDefinitionCard({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const wid = session.workspace.id;
  const query = useQuery({
    queryKey: qk.cafeDefinition(wid),
    queryFn: () => kernel.getCafeDefinition(wid),
    enabled: session.workspace.kind === "cafe",
    staleTime: 30_000,
    retry: 1,
  });
  if (query.isPending) {
    return (
      <IosGroup>
        <div className="flex items-center gap-2 px-4 py-3 text-[15px] text-zinc-500" data-testid="cafe-definition-loading">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.cafeLoading}
        </div>
      </IosGroup>
    );
  }
  if (query.isError || !query.data) {
    return (
      <IosGroup footer={t.cafeLoadError}>
        <IosLinkButton onClick={() => void query.refetch()}>{t.aiRetry}</IosLinkButton>
      </IosGroup>
    );
  }
  return <CafeForm key={`${query.data.updatedAt}:${query.data.persisted}`} initial={query.data} />;
}

function CafeForm({ initial }: { initial: CafeDefinition }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [draft, setDraft] = useState(initial);
  useEffect(() => setDraft(initial), [initial]);
  const writable = initial.canWrite;

  const save = useMutation({
    mutationFn: () => kernel.saveCafeDefinition(initial.workspaceId, toCafeSave(draft)),
    onSuccess: (next) => {
      setDraft(next);
      qc.setQueryData(qk.cafeDefinition(initial.workspaceId), next);
      void qc.invalidateQueries({ queryKey: qk.me });
      void qc.invalidateQueries({ queryKey: qk.cafeQR(initial.workspaceId) });
      toast.success(t.cafeSaved);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const completeness = previewCompleteness(draft);
  const ready = completeness.readyForReviews;
  const status = ready ? t.cafeReady : t.cafeNotReady;

  return (
    <form
      className="space-y-8"
      data-testid="cafe-definition"
      onSubmit={(e) => {
        e.preventDefault();
        if (writable && !save.isPending) save.mutate();
      }}
    >
      <IosGroup header={t.cafeChecklist} footer={writable ? t.cafeHint : t.cafeReadOnly}>
        <IosRow title={status} value={ready ? t.cafeReady : `${completeness.missing.length}`} />
        {(["name", "timezone", "currency", "branch", "qr_site", "sla"] as const).map((key) => {
          const done = !completeness.missing.includes(key);
          return (
            <IosRow
              key={key}
              title={t[MISSING_LABEL[key]]}
              trailing={
                done ? <Check className="h-5 w-5 text-[#34C759]" strokeWidth={2.6} aria-hidden /> : <span className="text-[13px] text-zinc-400">—</span>
              }
              testId={`cafe-check-${key}`}
            />
          );
        })}
      </IosGroup>

      <IosGroup header={t.cafeOfficialName}>
        <label className="block px-4 py-1">
          <IosField
            value={draft.displayName}
            disabled={!writable}
            placeholder={t.cafeOfficialName}
            data-testid="cafe-name"
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
          />
        </label>
      </IosGroup>

      <IosGroup header={t.cafeTimezone}>
        <label className="block px-4">
          <select
            className="h-11 w-full bg-transparent text-[17px] text-zinc-950 outline-none"
            value={draft.timezone}
            disabled={!writable}
            data-testid="cafe-timezone"
            onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
          >
            {!CAFE_TIMEZONES.includes(draft.timezone as (typeof CAFE_TIMEZONES)[number]) && draft.timezone ? (
              <option value={draft.timezone}>{draft.timezone}</option>
            ) : null}
            {CAFE_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </IosGroup>

      <IosGroup header={t.cafeCurrency} footer={t.cafeCurrencyHint}>
        <label className="block px-4">
          <select
            className="h-11 w-full bg-transparent text-[17px] text-zinc-950 outline-none"
            value={draft.currency}
            disabled={!writable}
            data-testid="cafe-currency"
            onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
          >
            <option value="">{t.required}</option>
            {CAFE_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
            {draft.currency && !CAFE_CURRENCIES.includes(draft.currency as (typeof CAFE_CURRENCIES)[number]) ? (
              <option value={draft.currency}>{draft.currency}</option>
            ) : null}
          </select>
        </label>
      </IosGroup>

      <IosGroup header={t.cafePOS} footer={t.cafePOSVendorHint}>
        <label className="block px-4">
          <select
            className="h-11 w-full bg-transparent text-[17px] text-zinc-950 outline-none"
            value={draft.posStatus}
            disabled={!writable}
            data-testid="cafe-pos-status"
            onChange={(e) => setDraft((d) => ({ ...d, posStatus: e.target.value as CafePOSStatus, posVendor: e.target.value === "named" ? d.posVendor : "" }))}
          >
            {CAFE_POS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t[POS_LABEL[status]]}
              </option>
            ))}
          </select>
        </label>
        {draft.posStatus === "named" ? (
          <label className="block px-4 py-1">
            <IosField
              value={draft.posVendor}
              disabled={!writable}
              placeholder={t.cafePOSVendor}
              data-testid="cafe-pos-vendor"
              onChange={(e) => setDraft((d) => ({ ...d, posVendor: e.target.value }))}
            />
          </label>
        ) : null}
      </IosGroup>

      <CollectionGroup
        header={t.cafeBranches}
        empty={t.cafeEmptyBranch}
        addLabel={t.cafeAddBranch}
        canAdd={writable}
        onAdd={() => setDraft((d) => ({ ...d, branches: [...d.branches, newBranch()] }))}
      >
        {draft.branches.map((branch, index) => (
          <div key={branch.id || index} className="space-y-1 px-4 py-3" data-testid="cafe-branch-row">
            <div className="flex items-center gap-2">
              <IosField
                value={branch.name}
                disabled={!writable}
                placeholder={t.cafeBranchName}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    branches: d.branches.map((b, i) => (i === index ? { ...b, name: e.target.value } : b)),
                  }))
                }
              />
              {writable ? (
                <RemoveButton label={t.cafeRemove} onClick={() => setDraft((d) => ({ ...d, branches: d.branches.filter((_, i) => i !== index) }))} />
              ) : null}
            </div>
            <IosField
              value={branch.address}
              disabled={!writable}
              placeholder={t.cafeBranchAddress}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  branches: d.branches.map((b, i) => (i === index ? { ...b, address: e.target.value } : b)),
                }))
              }
            />
          </div>
        ))}
      </CollectionGroup>

      <CollectionGroup
        header={t.cafeQRSites}
        empty={t.cafeEmptyQR}
        addLabel={t.cafeAddQR}
        canAdd={writable}
        onAdd={() => setDraft((d) => ({ ...d, qrSites: [...d.qrSites, newQRSite(d.branches[0]?.id ?? "")] }))}
      >
        {draft.qrSites.map((site, index) => (
          <div key={site.id || index} className="space-y-1 px-4 py-3" data-testid="cafe-qr-row">
            <div className="flex items-center gap-2">
              <IosField
                value={site.label}
                disabled={!writable}
                placeholder={t.cafeQRLabel}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    qrSites: d.qrSites.map((q, i) => (i === index ? { ...q, label: e.target.value } : q)),
                  }))
                }
              />
              {writable ? (
                <RemoveButton label={t.cafeRemove} onClick={() => setDraft((d) => ({ ...d, qrSites: d.qrSites.filter((_, i) => i !== index) }))} />
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="h-11 bg-transparent text-[15px] text-zinc-950 outline-none"
                value={site.area}
                disabled={!writable}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    qrSites: d.qrSites.map((q, i) => (i === index ? { ...q, area: e.target.value as CafeArea } : q)),
                  }))
                }
              >
                {CAFE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {t[AREA_LABEL[area]]}
                  </option>
                ))}
              </select>
              {draft.branches.length > 1 ? (
                <select
                  className="h-11 bg-transparent text-[15px] text-zinc-950 outline-none"
                  value={site.branchId}
                  disabled={!writable}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      qrSites: d.qrSites.map((q, i) => (i === index ? { ...q, branchId: e.target.value } : q)),
                    }))
                  }
                >
                  <option value="">{t.cafeQRBranch}</option>
                  {draft.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || t.cafeBranchName}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>
        ))}
      </CollectionGroup>

      <CollectionGroup
        header={t.cafeShifts}
        empty={t.cafeEmptyShift}
        addLabel={t.cafeAddShift}
        canAdd={writable}
        onAdd={() => setDraft((d) => ({ ...d, shifts: [...d.shifts, newShift()] }))}
      >
        {draft.shifts.map((shift, index) => (
          <div key={shift.id || index} className="flex items-center gap-2 px-4 py-3" data-testid="cafe-shift-row">
            <IosField
              value={shift.name}
              disabled={!writable}
              placeholder={t.cafeShiftName}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shifts: d.shifts.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)),
                }))
              }
            />
            <input
              type="time"
              value={shift.start}
              disabled={!writable}
              className="h-11 bg-transparent text-[15px] text-zinc-950 outline-none"
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shifts: d.shifts.map((s, i) => (i === index ? { ...s, start: e.target.value } : s)),
                }))
              }
            />
            <input
              type="time"
              value={shift.end}
              disabled={!writable}
              className="h-11 bg-transparent text-[15px] text-zinc-950 outline-none"
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shifts: d.shifts.map((s, i) => (i === index ? { ...s, end: e.target.value } : s)),
                }))
              }
            />
            {writable ? (
              <RemoveButton label={t.cafeRemove} onClick={() => setDraft((d) => ({ ...d, shifts: d.shifts.filter((_, i) => i !== index) }))} />
            ) : null}
          </div>
        ))}
      </CollectionGroup>

      <IosGroup header={t.cafeSLA}>
        <label className="flex items-center justify-between gap-4 px-4">
          <span className="text-[15px] text-zinc-950">{t.cafeSLAAck}</span>
          <IosField
            type="number"
            min={0}
            max={1440}
            className="max-w-24 text-end"
            value={String(draft.sla.ackMinutes || "")}
            disabled={!writable}
            data-testid="cafe-sla-ack"
            onChange={(e) => setDraft((d) => ({ ...d, sla: { ...d.sla, ackMinutes: Number(e.target.value) || 0 } }))}
          />
        </label>
        <label className="flex items-center justify-between gap-4 px-4">
          <span className="text-[15px] text-zinc-950">{t.cafeSLAResolve}</span>
          <IosField
            type="number"
            min={0}
            max={1440}
            className="max-w-24 text-end"
            value={String(draft.sla.resolveMinutes || "")}
            disabled={!writable}
            onChange={(e) => setDraft((d) => ({ ...d, sla: { ...d.sla, resolveMinutes: Number(e.target.value) || 0 } }))}
          />
        </label>
        <label className="block px-4 py-1">
          <IosField
            value={draft.sla.afterHoursMessage}
            disabled={!writable}
            placeholder={t.cafeSLAAfterHours}
            onChange={(e) => setDraft((d) => ({ ...d, sla: { ...d.sla, afterHoursMessage: e.target.value } }))}
          />
        </label>
        <label className="flex items-center justify-between gap-4 px-4">
          <span className="text-[15px] text-zinc-950">{t.cafeSLACompensation}</span>
          <IosField
            type="number"
            min={0}
            className="max-w-28 text-end"
            value={String(draft.sla.compensationLimit || "")}
            disabled={!writable}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                sla: {
                  ...d.sla,
                  compensationLimit: Number(e.target.value) || 0,
                  compensationCurrency: Number(e.target.value) > 0 ? d.sla.compensationCurrency || d.currency : "",
                },
              }))
            }
          />
        </label>
        {draft.sla.compensationLimit > 0 ? (
          <label className="block px-4">
            <select
              className="h-11 w-full bg-transparent text-[17px] text-zinc-950 outline-none"
              value={draft.sla.compensationCurrency}
              disabled={!writable}
              onChange={(e) => setDraft((d) => ({ ...d, sla: { ...d.sla, compensationCurrency: e.target.value } }))}
            >
              <option value="">{t.cafeSLACompensationCurrency}</option>
              {CAFE_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </IosGroup>

      {writable ? (
        <IosGroup>
          <IosLinkButton type="submit" disabled={save.isPending} testId="cafe-save">
            {save.isPending ? t.cafeSaving : t.cafeSave}
          </IosLinkButton>
        </IosGroup>
      ) : null}

      {initial.persisted && draft.qrSites.some((q) => q.label.trim()) ? (
        <CafeQRDesk workspaceId={initial.workspaceId} canRotate={writable} />
      ) : null}
    </form>
  );
}

function CollectionGroup({
  header,
  empty,
  addLabel,
  canAdd,
  onAdd,
  children,
}: {
  header: string;
  empty: string;
  addLabel: string;
  canAdd: boolean;
  onAdd: () => void;
  children: ReactNode;
}) {
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <IosGroup header={header} footer={!count ? empty : undefined}>
      {children}
      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center gap-2 px-4 py-3 text-start text-[15px] font-medium text-[#007AFF]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          {addLabel}
        </button>
      ) : null}
    </IosGroup>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="shrink-0 p-2 text-zinc-400 hover:text-[#FF3B30]">
      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
    </button>
  );
}
