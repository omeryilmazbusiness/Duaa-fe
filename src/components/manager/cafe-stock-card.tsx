"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isLiveStock,
  type StockAdjustReason,
  type StockItemDraft,
  type StockStation,
  type StockUnit,
} from "@/domain/cafe/stock";
import { parseIQD } from "@/domain/finance/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

export function CafeStockCard({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeStock(workspaceId),
    queryFn: () => kernel.getCafeStock(workspaceId),
    staleTime: 15_000,
  });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: "",
    reason: "count" as StockAdjustReason,
    onHand: "",
    delta: "",
    note: "",
  });
  const [drafts, setDrafts] = useState<StockItemDraft[] | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: qk.cafeStock(workspaceId) });
  }

  const adjust = useMutation({
    mutationFn: (input: {
      itemId: string;
      reason: StockAdjustReason;
      onHand?: number;
      delta?: number;
      note?: string;
    }) => kernel.recordCafeStockAdjustment(workspaceId, input),
    onSuccess: () => {
      toast.success(t.stockRecorded);
      setForm({ itemId: "", reason: "count", onHand: "", delta: "", note: "" });
      setAdjustOpen(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const saveBook = useMutation({
    mutationFn: (items: StockItemDraft[]) => kernel.saveCafeStockCatalog(workspaceId, items),
    onSuccess: () => {
      toast.success(t.stockCatalogSaved);
      setDrafts(null);
      setBookOpen(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (query.isPending) {
    return (
      <WidgetCard title={t.stockTitle} icon={Package} tone="zinc" testId="cafe-stock">
        <p className="text-[13px] text-zinc-500">{t.stockLoading}</p>
      </WidgetCard>
    );
  }
  if (query.isError) {
    return (
      <WidgetCard title={t.stockTitle} icon={Package} tone="rose" testId="cafe-stock">
        <button type="button" className="text-sm font-semibold text-[#007AFF]" onClick={() => void query.refetch()}>
          {t.stockLoadError}
        </button>
      </WidgetCard>
    );
  }

  const day = query.data;
  const live = isLiveStock(day);
  const busy = adjust.isPending || saveBook.isPending;
  const catalog =
    drafts ??
    day.items.map((it) => ({
      id: it.id,
      name: it.name,
      station: it.station,
      unit: it.unit,
      par: it.par,
      active: it.active,
    }));

  return (
    <WidgetCard title={t.stockTitle} icon={Package} tone={live ? "teal" : "zinc"} testId="cafe-stock">
      <p className="mb-3 text-[13px] text-zinc-500">{t.stockDoesNotInvent}</p>
      <div className="rounded-[22px] bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/60 p-4 ring-1 ring-inset ring-teal-900/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700/80">{live ? t.stockLive : t.stockNotWiredLive}</p>
        <p className="mt-1 text-[34px] font-semibold tracking-tight tabular-nums text-zinc-950">
          {live ? day.itemCount : "—"}
          {live ? <span className="ms-1.5 text-[13px] font-medium text-zinc-400">{t.stockSkus}</span> : null}
        </p>
        {!live ? <p className="mt-1 text-[13px] text-zinc-500">{t.stockEmpty}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricTile icon={Package} tone={live ? "teal" : "zinc"} value={live ? String(day.itemCount) : "—"} label={t.stockItems} compact />
        <MetricTile icon={Scale} tone={live && day.lowCount > 0 ? "amber" : "zinc"} value={live ? String(day.lowCount) : "—"} label={t.stockLow} compact />
      </div>

      {live ? (
        <ul className="mt-4 space-y-1.5">
          {day.items.map((item) => (
            <li key={item.id} className="rounded-[20px] bg-zinc-50/80 px-3 py-2.5">
              <span className="block truncate text-[14px] font-semibold tracking-tight text-zinc-900">{item.name}</span>
              <span className="block truncate text-[12px] font-medium text-zinc-500">
                {item.station === "bar" ? t.prepBar : t.prepKitchen} · {item.onHand}/{item.par} {item.unit}
                {item.low ? ` · ${t.stockBelowPar}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {day.canRecord && live ? (
        <div className="mt-4">
          {adjustOpen ? (
            <form
              className="grid gap-2 rounded-[20px] bg-zinc-50/70 p-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.itemId || adjust.isPending) return;
                if (form.reason === "count") {
                  const onHand = parseIQD(form.onHand);
                  if (onHand == null || onHand < 0) return;
                  adjust.mutate({
                    itemId: form.itemId,
                    reason: "count",
                    onHand,
                    note: form.note.trim() || undefined,
                  });
                  return;
                }
                const delta = parseIQD(form.delta);
                if (delta == null || delta === 0) return;
                const signed = form.reason === "receive" ? Math.abs(delta) : -Math.abs(delta);
                adjust.mutate({
                  itemId: form.itemId,
                  reason: form.reason,
                  delta: form.reason === "other" ? delta : signed,
                  note: form.note.trim() || undefined,
                });
              }}
            >
              <select
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                value={form.itemId}
                onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                aria-label={t.stockItem}
                required
              >
                <option value="">{t.stockItem}</option>
                {day.items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value as StockAdjustReason })}
                aria-label={t.stockReason}
              >
                <option value="count">{t.stockCount}</option>
                <option value="receive">{t.stockReceive}</option>
                <option value="use">{t.stockUse}</option>
                <option value="spoil">{t.stockSpoil}</option>
                <option value="other">{t.stockOther}</option>
              </select>
              {form.reason === "count" ? (
                <Input
                  inputMode="numeric"
                  placeholder={t.stockOnHand}
                  value={form.onHand}
                  onChange={(e) => setForm({ ...form, onHand: e.target.value })}
                  required
                />
              ) : (
                <Input
                  inputMode="numeric"
                  placeholder={t.stockDelta}
                  value={form.delta}
                  onChange={(e) => setForm({ ...form, delta: e.target.value })}
                  required
                />
              )}
              <Input placeholder={t.stockNote} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <Button type="submit" disabled={busy}>
                {t.stockRecord}
              </Button>
            </form>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => setAdjustOpen(true)}>
              {t.stockRecord}
            </Button>
          )}
        </div>
      ) : null}

      {day.canEditCatalog ? (
        <div className="mt-4">
          {bookOpen ? (
            <div className="space-y-2 rounded-[20px] bg-zinc-50/70 p-3.5">
              <p className="text-[13px] text-zinc-500">{catalog.length === 0 ? t.stockCatalogEmpty : t.stockCatalog}</p>
              {catalog.map((row, index) => (
                <div key={row.id ?? `new-${index}`} className="grid gap-2 rounded-2xl bg-white p-3">
                  <Input
                    placeholder={t.stockItemName}
                    value={row.name}
                    onChange={(e) => {
                      const next = catalog.map((it, i) => (i === index ? { ...it, name: e.target.value } : it));
                      setDrafts(next);
                    }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                      value={row.station}
                      onChange={(e) => {
                        const next = catalog.map((it, i) =>
                          i === index ? { ...it, station: e.target.value as StockStation } : it,
                        );
                        setDrafts(next);
                      }}
                    >
                      <option value="kitchen">{t.prepKitchen}</option>
                      <option value="bar">{t.prepBar}</option>
                    </select>
                    <select
                      className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                      value={row.unit}
                      onChange={(e) => {
                        const next = catalog.map((it, i) => (i === index ? { ...it, unit: e.target.value as StockUnit } : it));
                        setDrafts(next);
                      }}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="ea">ea</option>
                    </select>
                    <Input
                      inputMode="numeric"
                      placeholder={t.stockPar}
                      value={row.par ? String(row.par) : ""}
                      onChange={(e) => {
                        const par = parseIQD(e.target.value) ?? 0;
                        const next = catalog.map((it, i) => (i === index ? { ...it, par } : it));
                        setDrafts(next);
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDrafts([...catalog, { name: "", station: "bar", unit: "ml", par: 0, active: true }])}
              >
                <Plus className="me-1 h-4 w-4" />
                {t.stockAddItem}
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  saveBook.mutate(
                    catalog
                      .filter((row) => row.name.trim().length >= 2)
                      .map((row) => ({ ...row, name: row.name.trim(), active: row.active ?? true })),
                  )
                }
              >
                {t.stockSaveCatalog}
              </Button>
            </div>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => setBookOpen(true)}>
              {t.stockCatalog}
            </Button>
          )}
        </div>
      ) : null}
    </WidgetCard>
  );
}
