"use client";

import { CheckCircle2, CircleDashed, Percent } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import type { CompletenessSummary } from "@/domain/portfolio/types";
import type { Messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export const CHANNEL_LABEL: Record<string, keyof Messages> = {
  pms_snapshot: "chPms",
  reservations: "chReservations",
  readiness: "chReadiness",
  cash_close: "chCash",
  documents: "chDocs",
  pos: "chPos",
  checklist: "chChecklist",
  handover: "chHandover",
  intake: "chIntake",
  stock: "chStock",
};

export function CompletenessCard({ completeness }: { completeness: CompletenessSummary }) {
  const { t } = useLocale();
  const overall = completeness.overallPct;

  return (
    <WidgetCard
      title={t.completenessTitle}
      icon={Percent}
      tone={overall >= 80 ? "emerald" : overall >= 40 ? "sky" : "amber"}
      testId="portfolio-completeness"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <p className="text-[13px] text-zinc-500">{t.completenessSubtitle}</p>
        <p className="shrink-0 text-[30px] font-semibold leading-none tracking-tight tabular-nums text-zinc-950">
          {overall}%
        </p>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            overall >= 80 ? "bg-emerald-500" : overall >= 40 ? "bg-sky-500" : "bg-amber-500",
          )}
          style={{ width: `${Math.max(overall, 3)}%` }}
        />
      </div>

      <div className="space-y-3">
        {completeness.byWorkspace.map((ws) => (
          <div key={ws.workspaceId} className="rounded-[20px] bg-zinc-50/80 p-3 ring-1 ring-inset ring-zinc-900/[0.04]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold tracking-tight text-zinc-950">{ws.workspaceName}</p>
                <p className="text-[11.5px] font-medium text-zinc-500">
                  {t.completenessFeeds
                    .replace("{entered}", String(ws.enteredCount))
                    .replace("{expected}", String(ws.expectedCount))}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums",
                  ws.pct >= 80
                    ? "bg-emerald-50 text-emerald-700"
                    : ws.pct >= 40
                      ? "bg-sky-50 text-sky-700"
                      : "bg-amber-50 text-amber-700",
                )}
              >
                {ws.pct}%
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {ws.channels.map((ch) => {
                const labelKey = CHANNEL_LABEL[ch.key];
                const label = labelKey ? t[labelKey] : ch.key;
                return (
                  <span
                    key={ch.key}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      ch.entered ? "bg-emerald-500/10 text-emerald-800" : "bg-zinc-200/70 text-zinc-600",
                    )}
                  >
                    {ch.entered ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <CircleDashed className="h-3 w-3 text-zinc-400" />
                    )}
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
