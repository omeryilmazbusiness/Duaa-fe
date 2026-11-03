import type { Messages } from "@/lib/i18n";
import type { GlassmorphismPopupProps } from "./GlassmorphismPopup";
import type {
  CoffeeCornerSnapshot,
  FaultDevice,
  RequestKind,
  Severity,
  StockItemKey,
  StreamId,
} from "./types";

/** Pure mapping: (snapshot, i18n) → props for `GlassmorphismPopup`. No React. */
export type PopupModel = Omit<GlassmorphismPopupProps, "icon" | "compact" | "className">;
export type PopupModels = Record<StreamId, PopupModel>;

const ITEM: Record<StockItemKey, keyof Messages> = {
  beans: "ccItemBeans",
  milk: "ccItemMilk",
  cups: "ccItemCups",
  syrup: "ccItemSyrup",
};
const REQ: Record<RequestKind, keyof Messages> = {
  refill: "ccReqRefill",
  bill: "ccReqBill",
  table_service: "ccReqService",
  cleaning: "ccReqCleaning",
};
const DEV: Record<FaultDevice, keyof Messages> = {
  espresso_machine: "ccDevEspresso",
  grinder: "ccDevGrinder",
  fridge: "ccDevFridge",
  ice_machine: "ccDevIce",
};

const fill = (tpl: string, n: number) => tpl.replace("{n}", String(n));

function itemSeverity(level: number): Severity {
  return level <= 15 ? "critical" : level <= 35 ? "warn" : "ok";
}

export function buildPopupModels(s: CoffeeCornerSnapshot, t: Messages): PopupModels {
  const stock: PopupModel = {
    title: t.ccStock,
    value: `${s.stock.lowest.level}%`,
    caption: `${t[ITEM[s.stock.lowest.item]]} · ${t.ccLowest}`,
    severity: s.stock.severity,
    rows: s.stock.items.map((it) => ({
      label: t[ITEM[it.item]],
      value: `${it.level}%`,
      progress: it.level,
      severity: itemSeverity(it.level),
    })),
  };

  const requests: PopupModel = {
    title: t.ccRequests,
    value: String(s.requests.pending.length),
    caption: t.ccWaiting,
    severity: s.requests.severity,
    rows: [...s.requests.pending]
      .sort((a, b) => b.waitingMinutes - a.waitingMinutes)
      .slice(0, 3)
      .map((r) => ({
        label: `${t[REQ[r.kind]]} · ${fill(t.ccTable, r.table)}`,
        value: fill(t.ccMin, r.waitingMinutes),
      })),
  };

  const faults: PopupModel = {
    title: t.ccFaults,
    value: s.faults.open.length === 0 ? "0" : String(s.faults.open.length),
    caption: s.faults.open.length === 0 ? t.ccAllClear : t.ccOpen,
    severity: s.faults.severity,
    rows: s.faults.open.slice(0, 3).map((f) => ({
      label: t[DEV[f.device]],
      value: fill(t.ccAgo, f.openedMinutesAgo),
      severity: f.severity,
    })),
  };

  return { stock, requests, faults };
}
