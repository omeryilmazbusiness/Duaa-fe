"use client";

import { Banknote, Equal, HandCoins, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { cashVarianceLook } from "@/domain/dashboard/look";
import type { DashboardCash } from "@/domain/dashboard/types";
import { parseIQD } from "@/domain/finance/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/providers/locale-provider";

function iqd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

export function CashPanel({
  cash,
  canClose,
  busy,
  onClose,
}: {
  cash?: DashboardCash;
  canClose: boolean;
  busy: boolean;
  onClose: (input: { countedAmount: number; expectedAmount?: number }) => void;
}) {
  const { t, locale } = useLocale();
  const [counted, setCounted] = useState(cash?.countedAmount != null ? String(cash.countedAmount) : "");
  const [expected, setExpected] = useState(cash?.expectedAmount != null ? String(cash.expectedAmount) : "");
  const live = cash?.status === "live";
  const variance = cash?.variance ?? 0;
  const hasExpected = cash?.expectedAmount != null;
  const look = cashVarianceLook(variance, live, hasExpected);
  const varianceIcon = look.captionKey === "cashMissing" ? TrendingDown : look.captionKey === "cashExtra" ? TrendingUp : Equal;

  useEffect(() => {
    if (cash?.countedAmount != null) setCounted(String(cash.countedAmount));
    if (cash?.expectedAmount != null) setExpected(String(cash.expectedAmount));
  }, [cash?.countedAmount, cash?.expectedAmount]);

  return (
    <WidgetCard title={t.sourceCash} icon={Banknote} tone={live ? "teal" : "zinc"} testId="dashboard-cash">
      <div className="rounded-[22px] bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/60 p-4 ring-1 ring-inset ring-teal-900/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700/80">{live ? t.tillClosed : t.cashNotClosed}</p>
        <p className="mt-1 text-[34px] font-semibold tracking-tight tabular-nums text-zinc-950">
          {live ? iqd(cash?.countedAmount ?? 0, locale) : "—"}
          {live ? <span className="ms-1.5 text-[13px] font-medium text-zinc-400">IQD</span> : null}
        </p>
        {!live ? <p className="mt-1 text-[13px] text-zinc-500">{t.cashHint}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile
          icon={HandCoins}
          tone={live ? "emerald" : "zinc"}
          value={live ? iqd(cash?.countedAmount ?? 0, locale) : "—"}
          label={t.countedAmount}
          caption={t.cashYouCounted}
          compact
        />
        <MetricTile
          icon={Target}
          tone={live && hasExpected ? "sky" : "zinc"}
          value={live && hasExpected ? iqd(cash?.expectedAmount ?? 0, locale) : "—"}
          label={t.expectedAmount}
          caption={t.cashShouldBe}
          compact
        />
        <MetricTile
          icon={varianceIcon}
          tone={look.tone}
          value={live && hasExpected ? iqd(variance, locale) : "—"}
          label={t.variance}
          caption={t[look.captionKey]}
          compact
        />
      </div>

      {canClose ? (
        <form
          className="mt-4 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const countedAmount = parseIQD(counted);
            if (countedAmount == null) return;
            let expectedAmount: number | undefined;
            if (expected.trim() !== "") {
              const parsed = parseIQD(expected);
              if (parsed == null) return;
              expectedAmount = parsed;
            }
            onClose({ countedAmount, expectedAmount });
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-500">{t.cashYouCounted}</span>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t.countedAmount}
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              required
              aria-label={t.countedAmount}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-500">{t.cashShouldBe}</span>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t.optionalExpected}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              aria-label={t.optionalExpected}
            />
          </label>
          <Button type="submit" className="sm:col-span-2" disabled={busy || parseIQD(counted) == null}>
            {live ? t.recount : t.closeTill}
          </Button>
        </form>
      ) : null}
    </WidgetCard>
  );
}
