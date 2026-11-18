"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HotelPMSView, OHIPConfigSave, OHIPSyncMode } from "@/domain/hotel/pms";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

/** OHIP live connection and OPERA export import for one hotel. */
export function HotelOhipPanel({ view }: { view: HotelPMSView }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const workspaceId = view.workspaceId;
  const conn = view.connector;
  const [form, setForm] = useState<OHIPConfigSave>(() => ({
    enabled: conn.enabled || !conn.configured,
    hostUrl: conn.hostUrl ?? "",
    hotelId: conn.hotelId ?? "",
    clientId: conn.clientId ?? "",
    clientSecret: "",
    appKey: "",
    syncMode: conn.syncMode,
  }));
  const [raw, setRaw] = useState("");

  function refresh(next?: HotelPMSView) {
    if (next) qc.setQueryData(qk.hotelPMS(workspaceId), next);
    else void qc.invalidateQueries({ queryKey: qk.hotelPMS(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.portfolio() });
  }

  const onError = (err: Error) => toast.error(err instanceof ApiError ? err.message : t.aiErrGeneric);

  const saveCfg = useMutation({
    mutationFn: () => kernel.saveHotelOHIP(workspaceId, form),
    onSuccess: () => {
      toast.success(t.ohipSaved);
      setForm((f) => ({ ...f, clientSecret: "", appKey: "" }));
      refresh();
    },
    onError,
  });
  const sync = useMutation({
    mutationFn: () => kernel.syncHotelOHIP(workspaceId),
    onSuccess: (next) => {
      if (next.connector.lastSyncStatus === "error") toast.error(next.connector.lastError || t.hotelFreshStale);
      else toast.success(t.ohipSynced);
      refresh(next);
    },
    onError,
  });
  const importFile = useMutation({
    mutationFn: () => kernel.importHotelPMS(workspaceId, { businessDate: view.businessDate, rawContent: raw.trim() }),
    onSuccess: (next) => {
      toast.success(t.ohipImported);
      setRaw("");
      refresh(next);
    },
    onError,
  });

  function submitCfg(e: FormEvent) {
    e.preventDefault();
    saveCfg.mutate();
  }

  return (
    <div className="space-y-4" data-testid="hotel-ohip-panel">
      <div className="rounded-2xl bg-white p-3 text-[12.5px] text-zinc-700 ring-1 ring-inset ring-zinc-900/[0.05]">
        <p className="font-semibold text-zinc-900">
          {conn.configured ? `${conn.hotelId || "—"} · ${conn.syncMode === "ohip_api" ? t.ohipModeApi : t.ohipModeExport}` : t.hotelFreshUnavailable}
        </p>
        {conn.lastSyncAt ? (
          <p className="mt-0.5 text-[11.5px] text-zinc-500">
            {conn.lastSyncStatus} · {new Date(conn.lastSyncAt).toLocaleString()}
          </p>
        ) : null}
        {conn.lastError ? <p className="mt-1 text-[11.5px] text-rose-700">{conn.lastError}</p> : null}
        {conn.configured && view.canRecord && conn.syncMode === "ohip_api" ? (
          <Button type="button" size="sm" className="mt-2" disabled={sync.isPending} onClick={() => sync.mutate()}>
            <RefreshCw className={cn("me-1.5 h-3.5 w-3.5", sync.isPending && "animate-spin")} />
            {t.ohipSyncNow}
          </Button>
        ) : null}
      </div>

      {view.canManageOhip ? (
        <form onSubmit={submitCfg} className="space-y-2">
          <p className="text-[12px] text-zinc-500">{t.ohipSubtitle}</p>
          <select
            className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
            value={form.syncMode}
            onChange={(e) => setForm({ ...form, syncMode: e.target.value as OHIPSyncMode })}
            aria-label={t.ohipSyncMode}
          >
            <option value="ohip_api">{t.ohipModeApi}</option>
            <option value="opera_export">{t.ohipModeExport}</option>
          </select>
          {form.syncMode === "ohip_api" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder={t.ohipHostUrl} value={form.hostUrl} onChange={(e) => setForm({ ...form, hostUrl: e.target.value })} className="sm:col-span-2" />
              <Input placeholder={t.ohipHotelId} value={form.hotelId} onChange={(e) => setForm({ ...form, hotelId: e.target.value })} />
              <Input placeholder={t.ohipClientId} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
              <Input
                type="password"
                autoComplete="off"
                placeholder={conn.secretHint ? `${t.ohipClientSecret} (${conn.secretHint})` : t.ohipClientSecret}
                value={form.clientSecret}
                onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
              />
              <Input
                type="password"
                autoComplete="off"
                placeholder={conn.appKeyHint ? `${t.ohipAppKey} (${conn.appKeyHint})` : t.ohipAppKey}
                value={form.appKey}
                onChange={(e) => setForm({ ...form, appKey: e.target.value })}
              />
            </div>
          ) : null}
          <Button type="submit" size="sm" disabled={saveCfg.isPending}>
            {t.ohipSave}
          </Button>
        </form>
      ) : null}

      {view.canRecord ? (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-zinc-800">{t.ohipImportTitle}</p>
          <textarea
            rows={4}
            placeholder="business_date,currency,total_rooms,occupied_rooms,room_revenue,…"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 font-mono text-[12px]"
          />
          <Button type="button" size="sm" variant="outline" disabled={!raw.trim() || importFile.isPending} onClick={() => importFile.mutate()}>
            <Upload className="me-1.5 h-3.5 w-3.5" />
            {t.ohipImportBtn}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
