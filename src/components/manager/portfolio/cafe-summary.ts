import type { CafeCard } from "@/domain/portfolio/types";
import { formatIQD } from "@/lib/format";
import type { Messages } from "@/lib/i18n";

export function cafeSummaryLine(cafe: CafeCard, t: Messages, locale: string): string {
  const parts = [cafe.salesStatus === "live" ? `${t.sales} ${formatIQD(cafe.salesNet, locale)}` : t.cafeNoSalesYet];
  if (cafe.stockStatus === "live" && cafe.stockLowCount > 0) parts.push(t.cafeLowStock.replace("{n}", String(cafe.stockLowCount)));
  parts.push(`${t.completenessTitle} ${cafe.completenessPct}%`);
  return parts.join(" · ");
}
