export type StockStation = "kitchen" | "bar";
export type StockUnit = "g" | "ml" | "ea";
export type StockAdjustReason = "count" | "receive" | "use" | "spoil" | "other";
export type StockDayStatus = "live" | "unavailable";

export interface StockItem {
  id: string;
  name: string;
  station: StockStation;
  unit: StockUnit;
  onHand: number;
  par: number;
  level: number;
  active: boolean;
  low: boolean;
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  itemName: string;
  delta: number;
  onHandAfter: number;
  reason: StockAdjustReason;
  note?: string;
  recordedAt: string;
  businessDate: string;
}

export interface StockDay {
  businessDate: string;
  timezone: string;
  status: StockDayStatus;
  reasonKey?: string;
  itemCount: number;
  lowCount: number;
  items: StockItem[];
  adjustments: StockAdjustment[];
  canRecord: boolean;
  canEditCatalog: boolean;
}

export interface StockItemDraft {
  id?: string;
  name: string;
  station: StockStation;
  unit: StockUnit;
  par: number;
  active?: boolean;
}

export interface StockAdjustDraft {
  businessDate?: string;
  itemId: string;
  reason: StockAdjustReason;
  note?: string;
  onHand?: number;
  delta?: number;
}

export function isLiveStock(day: { status: string; itemCount?: number }): boolean {
  return day.status === "live" && (day.itemCount ?? 0) > 0;
}
