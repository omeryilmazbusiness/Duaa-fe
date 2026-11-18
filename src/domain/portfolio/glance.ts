import type { PortfolioView } from "@/domain/portfolio/types";

export type GlanceTone = "good" | "warn" | "info";

/** One plain-language line for the "Today at a glance" section. Amounts stay raw; the UI formats them. */
export type GlanceItem =
  | { id: "overdue"; tone: "warn"; count: number }
  | { id: "hotel_missing"; tone: "warn"; names: string[] }
  | { id: "cafe_no_sales"; tone: "warn"; name: string }
  | { id: "cafe_low_stock"; tone: "warn"; name: string; count: number }
  | { id: "hotel_revenue"; tone: GlanceTone; currency: string; amountMinor: number; deltaPct?: number }
  | { id: "cafe_sales"; tone: "good"; name: string; amount: number; tickets: number }
  | { id: "completeness"; tone: "warn"; pct: number }
  | { id: "all_clear"; tone: "good" };

const TONE_ORDER: Record<GlanceTone, number> = { warn: 0, info: 1, good: 2 };

export function buildGlance(portfolio: PortfolioView, overdueTasks = 0): GlanceItem[] {
  const items: GlanceItem[] = [];

  if (overdueTasks > 0) items.push({ id: "overdue", tone: "warn", count: overdueTasks });

  const missing = portfolio.hotels.hotels.filter((h) => h.freshness === "unavailable").map((h) => h.name);
  if (missing.length > 0) items.push({ id: "hotel_missing", tone: "warn", names: missing });

  for (const total of portfolio.hotels.totalsByCurrency) {
    const tone: GlanceTone = total.deltaPct === undefined ? "info" : total.deltaPct < 0 ? "warn" : "good";
    items.push({ id: "hotel_revenue", tone, currency: total.currency, amountMinor: total.todayTotalRevenueMinor, deltaPct: total.hasYesterday ? total.deltaPct : undefined });
  }

  for (const cafe of portfolio.cafes.cafes) {
    if (cafe.salesStatus === "live") {
      items.push({ id: "cafe_sales", tone: "good", name: cafe.name, amount: cafe.salesNet, tickets: cafe.ticketCount });
    } else {
      items.push({ id: "cafe_no_sales", tone: "warn", name: cafe.name });
    }
    if (cafe.stockStatus === "live" && cafe.stockLowCount > 0) {
      items.push({ id: "cafe_low_stock", tone: "warn", name: cafe.name, count: cafe.stockLowCount });
    }
  }

  const pct = portfolio.completeness.overallPct;
  // Completeness has its own section; the glance only raises it when it is a problem.
  if (pct < 40) items.push({ id: "completeness", tone: "warn", pct });

  if (!items.some((item) => item.tone === "warn")) items.push({ id: "all_clear", tone: "good" });

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => TONE_ORDER[a.item.tone] - TONE_ORDER[b.item.tone] || a.index - b.index)
    .map(({ item }) => item);
}

export function glanceWarnings(items: readonly GlanceItem[]): number {
  return items.filter((item) => item.tone === "warn").length;
}
