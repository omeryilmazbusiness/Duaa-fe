export type WasteStation = "kitchen" | "bar";
export type WasteReason = "prep" | "spoilage" | "overcook" | "other";
export type WasteDayStatus = "live" | "unavailable";

export interface RecipeLine {
  title: string;
  grams: number;
}

export interface Recipe {
  id: string;
  name: string;
  station: WasteStation;
  lines: RecipeLine[];
}

export interface WasteTicket {
  id: string;
  item: string;
  station: WasteStation;
  grams: number;
  cost: number;
  reason: WasteReason;
  note?: string;
  recipeId?: string;
  recordedAt: string;
  businessDate: string;
}

export interface WasteDay {
  businessDate: string;
  timezone: string;
  status: WasteDayStatus;
  reasonKey?: string;
  ticketCount: number;
  grams: number;
  cost: number;
  kitchenGrams: number;
  barGrams: number;
  tickets: WasteTicket[];
  recipes: Recipe[];
  canRecord: boolean;
  canEditRecipes: boolean;
}

export interface WasteTicketDraft {
  businessDate?: string;
  station: WasteStation;
  item: string;
  reason?: WasteReason;
  note?: string;
  recipeId?: string;
  grams: number;
  cost: number;
}

export interface RecipeDraft {
  id?: string;
  name: string;
  station: WasteStation;
  lines: RecipeLine[];
}

export function isLiveWaste(day: { status: string; ticketCount?: number }): boolean {
  return day.status === "live" && (day.ticketCount ?? 0) > 0;
}
