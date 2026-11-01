"use client";

import { CreditCard, MinusCircle, Receipt, ShoppingBag, TicketPercent } from "lucide-react";
import { useState } from "react";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { isLivePOS } from "@/domain/cafe/pos";
import type { DashboardSales } from "@/domain/dashboard/types";
import { parseIQD } from "@/domain/finance/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/providers/locale-provider";

function iqd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

export function POSPanel({
  sales,
  canRecord,
  busy,
  onRecord,
  onClose,
}: {
  sales?: DashboardSales;
  canRecord: boolean;
  busy: boolean;
  onRecord: (input: { externalRef: string; kind: "sale" | "return"; tender: "cash" | "card" | "other"; lines: number; gross: number; discount?: number }) => void;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const live = isLivePOS(sales ?? { status: "unavailable" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ref: "", kind: "sale", tender: "cash", lines: "1", gross: "", discount: "" });

  return (
    <WidgetCard title={t.sales} icon={Receipt} tone={live ? "sky" : "zinc"} testId="dashboard-pos">
      <p className="mb-3 text-[13px] text-zinc-500">{t.posDoesNotInvent}</p>
      <div className="rounded-[22px] bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/60 p-4 ring-1 ring-inset ring-sky-900/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700/80">{live ? t.posLive : t.posNotWired}</p>
        <p className="mt-1 text-[34px] font-semibold tracking-tight tabular-nums text-zinc-950">
          {live ? iqd(sales?.net ?? 0, locale) : "—"}
          {live ? <span className="ms-1.5 text-[13px] font-medium text-zinc-400">IQD</span> : null}
        </p>
        {!live ? <p className="mt-1 text-[13px] text-zinc-500">{t.salesEmpty}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile icon={Receipt} tone={live ? "sky" : "zinc"} value={live ? iqd(sales?.gross ?? 0, locale) : "—"} label={t.posGross} compact />
        <MetricTile icon={TicketPercent} tone={live ? "violet" : "zinc"} value={live ? iqd(sales?.discount ?? 0, locale) : "—"} label={t.posDiscount} compact />
        <MetricTile icon={MinusCircle} tone={live ? "amber" : "zinc"} value={live ? iqd(sales?.returns ?? 0, locale) : "—"} label={t.posReturns} compact />
        <MetricTile
          icon={ShoppingBag}
          tone={live && (sales?.saleCount ?? 0) > 0 ? "teal" : "zinc"}
          value={live && (sales?.saleCount ?? 0) > 0 ? iqd(sales?.basket ?? 0, locale) : "—"}
          label={t.posBasket}
          compact
        />
      </div>

      {live ? (
        <p className="mt-3 text-[12px] font-medium text-zinc-500">
          <CreditCard className="me-1 inline h-3.5 w-3.5" />
          {t.posTender}: {iqd(sales?.cash ?? 0, locale)} {t.posCash} · {iqd(sales?.card ?? 0, locale)} {t.posCard} · {iqd(sales?.other ?? 0, locale)} {t.posOther}
        </p>
      ) : null}

      {canRecord && !sales?.closed ? (
        <div className="mt-4 space-y-2">
          {open ? (
            <form
              className="grid gap-2 rounded-[20px] bg-zinc-50/70 p-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                const gross = parseIQD(form.gross);
                const lines = parseIQD(form.lines);
                const discount = form.discount.trim() ? parseIQD(form.discount) : 0;
                if (!form.ref.trim() || gross == null || lines == null || lines <= 0 || discount == null) return;
                onRecord({
                  externalRef: form.ref.trim(),
                  kind: form.kind === "return" ? "return" : "sale",
                  tender: form.tender === "card" ? "card" : form.tender === "other" ? "other" : "cash",
                  lines,
                  gross,
                  discount,
                });
                setForm({ ref: "", kind: "sale", tender: "cash", lines: "1", gross: "", discount: "" });
                setOpen(false);
              }}
            >
              <Input placeholder={t.posTicketRef} value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  aria-label={t.posKind}
                >
                  <option value="sale">{t.posSale}</option>
                  <option value="return">{t.posReturn}</option>
                </select>
                <select
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                  value={form.tender}
                  onChange={(e) => setForm({ ...form, tender: e.target.value })}
                  aria-label={t.posTender}
                >
                  <option value="cash">{t.posCash}</option>
                  <option value="card">{t.posCard}</option>
                  <option value="other">{t.posOther}</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input inputMode="numeric" placeholder={t.posLines} value={form.lines} onChange={(e) => setForm({ ...form, lines: e.target.value })} required />
                <Input inputMode="numeric" placeholder={t.posGross} value={form.gross} onChange={(e) => setForm({ ...form, gross: e.target.value })} required />
                <Input inputMode="numeric" placeholder={t.posDiscount} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <Button type="submit" disabled={busy}>
                {t.posRecord}
              </Button>
            </form>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => setOpen(true)}>
              {t.posRecord}
            </Button>
          )}
          {live && !sales?.closed ? (
            <Button disabled={busy} onClick={onClose}>
              {t.posCloseDay}
            </Button>
          ) : null}
        </div>
      ) : null}
    </WidgetCard>
  );
}
