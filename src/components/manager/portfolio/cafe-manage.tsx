"use client";

import { Info, Package, Receipt, Sparkles, Trash2 } from "lucide-react";
import { TodaysFocusWidget } from "@/components/coffee-corner/TodaysFocusWidget";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { BareWidgetFrame } from "@/components/dashboard/widget-card";
import { CafeStockCard } from "@/components/manager/cafe-stock-card";
import { CafeWasteCard } from "@/components/manager/cafe-waste-card";
import { CafeInfoForm } from "@/components/manager/portfolio/cafe-info-form";
import { CafeMoney } from "@/components/manager/portfolio/cafe-money";
import type { CafeCard } from "@/domain/portfolio/types";
import { formatIQD } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";

/** Everything a manager edits for one cafe, each in its own collapsible. */
export function CafeManageSections({
  workspaceId,
  cafe,
  seeMoney,
  canClose,
  canRecordPOS,
}: {
  workspaceId: string;
  cafe: CafeCard | undefined;
  seeMoney: boolean;
  canClose: boolean;
  canRecordPOS: boolean;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="space-y-2" data-testid="cafe-manage">
      <CollapsibleSection variant="inset" persistId={`cafe:${workspaceId}:info`} title={t.cafeInfoTitle} icon={Info} tone="sky" testId="cafe-info-section">
        <CafeInfoForm workspaceId={workspaceId} />
      </CollapsibleSection>

      {seeMoney ? (
        <CollapsibleSection
          variant="inset"
          persistId={`cafe:${workspaceId}:money`}
          title={t.cafeMoneyTitle}
          icon={Receipt}
          tone="teal"
          summary={cafe ? (cafe.posClosed ? t.posClosedToday : cafe.salesStatus === "live" ? `${cafe.ticketCount} ${t.posLines}` : t.cafeNoSalesYet) : undefined}
          testId="cafe-money-section"
        >
          <CafeMoney workspaceId={workspaceId} canClose={canClose} canRecordPOS={canRecordPOS} />
        </CollapsibleSection>
      ) : null}

      {seeMoney ? (
        <CollapsibleSection
          variant="inset"
          persistId={`cafe:${workspaceId}:stock`}
          title={t.stockTitle}
          icon={Package}
          tone={cafe && cafe.stockLowCount > 0 ? "rose" : "teal"}
          summary={
            cafe && cafe.stockStatus === "live"
              ? `${cafe.stockItems} ${t.stockItems.toLowerCase()} · ${t.cafeLowStock.replace("{n}", String(cafe.stockLowCount))}`
              : undefined
          }
          testId="cafe-stock-section"
        >
          <BareWidgetFrame>
            <CafeStockCard workspaceId={workspaceId} />
          </BareWidgetFrame>
        </CollapsibleSection>
      ) : null}

      {seeMoney ? (
        <CollapsibleSection
          variant="inset"
          persistId={`cafe:${workspaceId}:waste`}
          title={t.wasteTitle}
          icon={Trash2}
          tone="amber"
          summary={cafe && cafe.wasteStatus === "live" ? formatIQD(cafe.wasteCost, locale) : undefined}
          testId="cafe-waste-section"
        >
          <BareWidgetFrame>
            <CafeWasteCard workspaceId={workspaceId} />
          </BareWidgetFrame>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection variant="inset" persistId={`cafe:${workspaceId}:focus`} title={t.cafeFocusTitle} icon={Sparkles} tone="violet" testId="cafe-focus-section">
        <TodaysFocusWidget workspaceId={workspaceId} />
      </CollapsibleSection>
    </div>
  );
}
