"use client";

import type { LucideIcon } from "lucide-react";
import { Building2, ChevronRight, Coffee, FileText, Layers, Percent, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { BareWidgetFrame } from "@/components/dashboard/widget-card";
import { cafeSummaryLine } from "@/components/manager/portfolio/cafe-summary";
import { CompletenessCard } from "@/components/manager/portfolio/completeness-card";
import { DocumentSimplifierCard } from "@/components/manager/portfolio/document-simplifier-card";
import { FreshnessPill, hotelSummaryLine } from "@/components/manager/portfolio/hotel-portfolio-view";
import { completenessTone } from "@/domain/dashboard/charts";
import { formatMinorMoney } from "@/domain/hotel/pms";
import { buildGlance, glanceWarnings, type GlanceItem } from "@/domain/portfolio/glance";
import type { PortfolioView } from "@/domain/portfolio/types";
import type { WorkspaceOption } from "@/domain/session/types";
import { formatIQD } from "@/lib/format";
import type { Messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT, type Tone } from "@/theme/tones";

const DOT: Record<GlanceItem["tone"], string> = {
  warn: "bg-amber-500",
  info: "bg-sky-500",
  good: "bg-emerald-500",
};

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export function glanceText(item: GlanceItem, t: Messages, locale: string): string {
  switch (item.id) {
    case "overdue":
      return fill(t.glanceOverdue, { n: item.count });
    case "hotel_missing":
      return fill(t.glanceHotelMissing, { names: item.names.join(", ") });
    case "cafe_no_sales":
      return fill(t.glanceCafeNoSales, { name: item.name });
    case "cafe_low_stock":
      return fill(t.glanceCafeLowStock, { name: item.name, n: item.count });
    case "hotel_revenue": {
      const base = fill(t.glanceHotelRevenue, { amount: formatMinorMoney(item.amountMinor, item.currency, locale) });
      if (item.deltaPct === undefined) return base;
      return `${base} ${fill(t.glanceVsYesterday, { delta: `${item.deltaPct >= 0 ? "+" : ""}${item.deltaPct}%` })}`;
    }
    case "cafe_sales":
      return fill(t.glanceCafeSales, { name: item.name, amount: formatIQD(item.amount, locale), tickets: item.tickets });
    case "completeness":
      return fill(t.glanceCompleteness, { pct: item.pct });
    case "all_clear":
      return t.glanceAllClear;
  }
}

function BusinessRow({ icon: Icon, tone, name, line, pill, onOpen }: { icon: LucideIcon; tone: Tone; name: string; line: string; pill?: ReactNode; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3.5 py-3.5 text-start transition-colors hover:bg-zinc-50/80">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px]", TONE_GRADIENT[tone])}>
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-zinc-950">{name}</span>
          <span className="block truncate text-[12px] text-zinc-500">{line}</span>
        </span>
        {pill}
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 rtl:rotate-180" strokeWidth={2.2} aria-hidden />
      </button>
    </li>
  );
}

export function GeneralPortfolioView({
  portfolio,
  workspaces,
  defaultWorkspaceId,
  overdueTasks,
  onOpenBusiness,
}: {
  portfolio: PortfolioView;
  workspaces: readonly WorkspaceOption[];
  defaultWorkspaceId: string;
  overdueTasks: number;
  /** Switches to the business's own dashboard. */
  onOpenBusiness: (workspaceId: string) => void;
}) {
  const { t, locale } = useLocale();
  const glance = buildGlance(portfolio, overdueTasks);
  const warnings = glanceWarnings(glance);
  const hotels = portfolio.hotels;
  const businessesSummary = [
    hotels.count > 0 ? fill(t.hotelsCount, { n: hotels.count }) : null,
    portfolio.cafes.count > 0 ? `${portfolio.cafes.count} ${t.scopeCoffee.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const recentDocs = portfolio.recentDocuments.length;

  return (
    <div className="space-y-3" data-testid="portfolio-general-view">
      <CollapsibleSection
        persistId="general:glance"
        defaultOpen
        title={t.glanceTitle}
        icon={Sun}
        tone={warnings > 0 ? "amber" : "emerald"}
        summary={warnings > 0 ? fill(t.glanceNeedsAttention, { n: warnings }) : t.glanceAllClear}
        testId="general-glance"
      >
        <ul className="space-y-2" data-testid="general-glance-list">
          {glance.map((item, index) => (
            <li key={`${item.id}-${index}`} className="flex items-start gap-3 rounded-[16px] bg-zinc-50/85 px-3.5 py-2.5">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[item.tone])} aria-hidden />
              <span className="text-[14px] leading-snug text-zinc-800">{glanceText(item, t, locale)}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {hotels.count + portfolio.cafes.count > 0 ? (
        <CollapsibleSection persistId="general:businesses" defaultOpen title={t.allBusinesses} icon={Layers} summary={businessesSummary} testId="general-businesses">
          <ul className="divide-y divide-zinc-100" data-testid="general-businesses-list">
            {hotels.hotels.map((h) => (
              <BusinessRow
                key={h.workspaceId}
                icon={Building2}
                tone="indigo"
                name={h.name}
                line={hotelSummaryLine(h, t, locale)}
                pill={<FreshnessPill freshness={h.freshness} />}
                onOpen={() => onOpenBusiness(h.workspaceId)}
              />
            ))}
            {portfolio.cafes.cafes.map((c) => (
              <BusinessRow
                key={c.workspaceId}
                icon={Coffee}
                tone="amber"
                name={c.name}
                line={cafeSummaryLine(c, t, locale)}
                pill={c.stockLowCount > 0 ? <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">{fill(t.cafeLowStock, { n: c.stockLowCount })}</span> : undefined}
                onOpen={() => onOpenBusiness(c.workspaceId)}
              />
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        persistId="general:completeness"
        title={t.completenessTitle}
        icon={Percent}
        tone={completenessTone(portfolio.completeness.overallPct)}
        summary={fill(t.glanceCompleteness, { pct: portfolio.completeness.overallPct })}
        testId="general-completeness"
      >
        <BareWidgetFrame>
          <CompletenessCard completeness={portfolio.completeness} />
        </BareWidgetFrame>
      </CollapsibleSection>

      <CollapsibleSection
        persistId="general:simplifier"
        title={t.docTitle}
        icon={FileText}
        tone="violet"
        summary={recentDocs > 0 ? fill(t.glanceDocsRecent, { n: recentDocs }) : t.docSubtitle}
        testId="general-simplifier"
      >
        <BareWidgetFrame>
          <DocumentSimplifierCard workspaces={workspaces} defaultWorkspaceId={defaultWorkspaceId} recentDocuments={portfolio.recentDocuments} />
        </BareWidgetFrame>
      </CollapsibleSection>
    </div>
  );
}
