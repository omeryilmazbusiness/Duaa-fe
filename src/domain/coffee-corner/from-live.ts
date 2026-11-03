import type { CafeVoice } from "@/domain/cafe/qr";
import type { WasteDay } from "@/domain/cafe/waste";
import { isOpenReport, type ReportView } from "@/domain/report/types";
import { buildFaults, buildRequests, buildStock, clamp, faultSeverity, minutesSince } from "./build";
import type { CoffeeCornerSnapshot, FaultReport, FloorRequest, StockItem } from "./types";

/**
 * Pure adapter: ops DTOs → Coffee Corner snapshot.
 *
 * Mapping (intentional, no invention beyond documented proxies):
 * - Faults   ← open breakage reports (arıza)
 * - Requests ← open guest voices kind=request + open staff reports kind=request
 * - Stock    ← bar recipe supply-health from today's waste (proxy until inventory API)
 */

export interface LiveCoffeeCornerInput {
  readonly reports?: readonly ReportView[] | null;
  readonly voices?: readonly CafeVoice[] | null;
  readonly waste?: WasteDay | null;
  readonly nowMs?: number;
}

export function mapFaultsFromReports(reports: readonly ReportView[], nowMs: number): FaultReport[] {
  return reports
    .filter((r) => r.kind === "breakage" && isOpenReport(r))
    .map((r) => {
      const openedMinutesAgo = minutesSince(r.createdAt, nowMs);
      return {
        id: r.id,
        label: r.title.trim() || "Breakage",
        severity: faultSeverity(openedMinutesAgo),
        openedMinutesAgo,
      };
    })
    .sort((a, b) => b.openedMinutesAgo - a.openedMinutesAgo);
}

export function mapRequestsFromLive(
  voices: readonly CafeVoice[],
  reports: readonly ReportView[],
  nowMs: number,
): FloorRequest[] {
  const fromVoices: FloorRequest[] = voices
    .filter((v) => v.kind === "request" && v.recoveryStatus !== "closed")
    .map((v) => ({
      id: `voice:${v.id}`,
      label: (v.comment.trim() || "Request").slice(0, 48),
      tableLabel: v.label.trim(),
      waitingMinutes: minutesSince(v.createdAt, nowMs),
      source: "voice",
    }));

  const fromReports: FloorRequest[] = reports
    .filter((r) => r.kind === "request" && isOpenReport(r))
    .map((r) => ({
      id: `report:${r.id}`,
      label: (r.title.trim() || "Request").slice(0, 48),
      tableLabel: (r.reporterDepartment ?? "").trim(),
      waitingMinutes: minutesSince(r.createdAt, nowMs),
      source: "report",
    }));

  return [...fromVoices, ...fromReports].sort((a, b) => b.waitingMinutes - a.waitingMinutes);
}

/**
 * Supply-health proxy: bar recipes vs today's waste grams.
 * When waste feed is down → available=false (UI must not fake %).
 * When live but no recipes/tickets → available=true, empty items (all clear).
 */
export function mapStockFromWaste(waste: WasteDay | null | undefined): ReturnType<typeof buildStock> {
  if (!waste || waste.status !== "live") {
    return buildStock([], false);
  }

  const barRecipes = waste.recipes.filter((r) => r.station === "bar");
  const recipes = barRecipes.length > 0 ? barRecipes : waste.recipes;

  if (recipes.length > 0) {
    const items: StockItem[] = recipes.map((recipe) => {
      const wasted = waste.tickets
        .filter((t) => t.recipeId === recipe.id || t.item === recipe.name)
        .reduce((sum, t) => sum + t.grams, 0);
      const lineGrams = recipe.lines.reduce((sum, l) => sum + l.grams, 0);
      // Soft daily budget: ~8× recipe BOM (or 400 g floor).
      const par = Math.max(lineGrams * 8, 400);
      const level = clamp(Math.round(100 - (wasted / par) * 100), 0, 100);
      return { id: recipe.id, label: recipe.name, level };
    });
    return buildStock(items, true);
  }

  // No recipes: group raw waste tickets by item name.
  const byItem = new Map<string, { grams: number; id: string }>();
  for (const ticket of waste.tickets) {
    const key = ticket.item.trim() || ticket.id;
    const prev = byItem.get(key);
    byItem.set(key, { id: ticket.recipeId || key, grams: (prev?.grams ?? 0) + ticket.grams });
  }
  if (byItem.size === 0) return buildStock([], true);

  const items: StockItem[] = [...byItem.entries()].map(([label, { id, grams }]) => ({
    id,
    label,
    // 500 g wasted → 0%. Honest relative pressure, not on-hand inventory.
    level: clamp(100 - Math.round(grams / 5), 0, 100),
  }));
  return buildStock(items, true);
}

export function coffeeCornerFromLive(input: LiveCoffeeCornerInput): CoffeeCornerSnapshot {
  const nowMs = input.nowMs ?? Date.now();
  const reports = input.reports ?? [];
  const voices = input.voices ?? [];

  return {
    stock: mapStockFromWaste(input.waste),
    requests: buildRequests(mapRequestsFromLive(voices, reports, nowMs)),
    faults: buildFaults(mapFaultsFromReports(reports, nowMs)),
    updatedAt: nowMs,
  };
}
