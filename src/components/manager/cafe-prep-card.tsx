"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, Clock3, UtensilsCrossed, Wine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isLivePrep, type PrepStation } from "@/domain/cafe/prep";
import { allows } from "@/domain/staff-scope/rbac";
import type { SessionPayload } from "@/domain/session/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

export function CafePrepCard({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const canRecord = allows(session.scope, "prep.record");
  const query = useQuery({
    queryKey: qk.cafePrep(wid),
    queryFn: () => kernel.getCafePrep(wid),
    staleTime: 15_000,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ref: "", station: "kitchen", table: "" });

  function invalidate() {
    qc.invalidateQueries({ queryKey: qk.cafePrep(wid) });
    qc.invalidateQueries({ queryKey: qk.brief(wid) });
  }

  const record = useMutation({
    mutationFn: () =>
      kernel.recordCafePrep(wid, {
        station: form.station === "bar" ? "bar" : "kitchen",
        ticketRef: form.ref.trim(),
        tableLabel: form.table.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t.prepRecord);
      setForm({ ref: "", station: "kitchen", table: "" });
      setOpen(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const ready = useMutation({
    mutationFn: (id: string) => kernel.readyCafePrep(wid, id),
    onSuccess: () => {
      toast.success(t.prepMarkReady);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const serve = useMutation({
    mutationFn: (id: string) => kernel.serveCafePrep(wid, id),
    onSuccess: () => {
      toast.success(t.prepMarkServed);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (query.isPending) {
    return (
      <WidgetCard title={t.prepTitle} icon={Clock3} tone="zinc" testId="today-prep">
        <p className="text-[13px] text-zinc-500">{t.prepLoading}</p>
      </WidgetCard>
    );
  }
  if (query.isError) {
    return (
      <WidgetCard title={t.prepTitle} icon={Clock3} tone="rose" testId="today-prep">
        <button type="button" className="text-sm font-semibold text-[#007AFF]" onClick={() => void query.refetch()}>
          {t.prepLoadError}
        </button>
      </WidgetCard>
    );
  }

  const day = query.data;
  const live = isLivePrep(day);
  const busy = record.isPending || ready.isPending || serve.isPending;

  return (
    <WidgetCard title={t.prepTitle} icon={Clock3} tone={live ? "amber" : "zinc"} testId="today-prep">
      <p className="mb-3 text-[13px] text-zinc-500">{t.prepDoesNotInvent}</p>
      <div className="rounded-[22px] bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 p-4 ring-1 ring-inset ring-amber-900/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700/80">{live ? t.prepLive : t.prepNotWired}</p>
        <p className="mt-1 text-[34px] font-semibold tracking-tight tabular-nums text-zinc-950">
          {live ? day.waitingCount + day.readyCount : "—"}
        </p>
        {!live ? <p className="mt-1 text-[13px] text-zinc-500">{t.prepEmpty}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile icon={ChefHat} tone={live && day.waitingCount > 0 ? "amber" : "zinc"} value={live ? day.waitingCount : "—"} label={t.prepWaiting} compact />
        <MetricTile icon={UtensilsCrossed} tone={live && day.readyCount > 0 ? "teal" : "zinc"} value={live ? day.readyCount : "—"} label={t.prepReady} compact />
        <MetricTile icon={Wine} tone={live && day.servedCount > 0 ? "emerald" : "zinc"} value={live ? day.servedCount : "—"} label={t.prepServed} compact />
      </div>

      {live ? (
        <ul className="mt-4 space-y-1.5">
          {day.tickets.map((ticket) => (
            <li key={ticket.id} className="flex items-center gap-3 rounded-[20px] bg-zinc-50/80 px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold tracking-tight text-zinc-900">
                  {ticket.ticketRef}
                  {ticket.tableLabel ? ` · ${t.qrTable} ${ticket.tableLabel}` : ""}
                </span>
                <span className="block truncate text-[12px] font-medium text-zinc-500">
                  {ticket.station === "bar" ? t.prepBar : t.prepKitchen}
                  {ticket.status !== "served" ? ` · ${ticket.openMinutes} ${t.prepMinutes}` : ""}
                </span>
              </span>
              {canRecord && ticket.status === "waiting" ? (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => ready.mutate(ticket.id)}>
                  {t.prepMarkReady}
                </Button>
              ) : null}
              {canRecord && ticket.status === "ready" ? (
                <Button size="sm" disabled={busy} onClick={() => serve.mutate(ticket.id)}>
                  {t.prepMarkServed}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canRecord ? (
        <div className="mt-4">
          {open ? (
            <form
              className="grid gap-2 rounded-[20px] bg-zinc-50/70 p-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.ref.trim() || record.isPending) return;
                record.mutate();
              }}
            >
              <Input placeholder={t.prepTicketRef} value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                  value={form.station}
                  onChange={(e) => setForm({ ...form, station: e.target.value as PrepStation })}
                  aria-label={t.prepStation}
                >
                  <option value="kitchen">{t.prepKitchen}</option>
                  <option value="bar">{t.prepBar}</option>
                </select>
                <Input placeholder={t.prepTable} value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })} />
              </div>
              <Button type="submit" disabled={busy}>
                {t.prepRecord}
              </Button>
            </form>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => setOpen(true)}>
              {t.prepRecord}
            </Button>
          )}
        </div>
      ) : null}
    </WidgetCard>
  );
}
