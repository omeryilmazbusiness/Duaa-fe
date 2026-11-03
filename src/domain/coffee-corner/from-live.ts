import type { CafeVoice } from "@/domain/cafe/qr";
import type { StockDay } from "@/domain/cafe/stock";
import { isOpenReport, type ReportView } from "@/domain/report/types";
import { buildFaults, buildRequests, buildStock, faultSeverity, minutesSince } from "./build";
import type { CoffeeCornerSnapshot, FaultReport, FloorRequest, StockItem } from "./types";

/**
 * Pure adapter: ops DTOs → Coffee Corner snapshot.
 *
 * Mapping (intentional, no invention):
 * - Faults   ← open breakage reports (arıza)
 * - Requests ← open guest voices kind=request + open staff reports kind=request
 * - Stock    ← recorded inventory on-hand / par (never waste/recipe proxy)
 */

export interface LiveCoffeeCornerInput {
  readonly reports?: readonly ReportView[] | null;
  readonly voices?: readonly CafeVoice[] | null;
  readonly stock?: StockDay | null;
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
 * Inventory truth: on-hand levels from the stock catalog.
 * When catalog is unavailable → available=false (UI must not fake %).
 * When live with items → levels come from the API (onHand/par).
 */
export function mapStockFromInventory(stock: StockDay | null | undefined): ReturnType<typeof buildStock> {
  if (!stock || stock.status !== "live") {
    return buildStock([], false);
  }

  const active = stock.items.filter((it) => it.active);
  const bar = active.filter((it) => it.station === "bar");
  const source = bar.length > 0 ? bar : active;
  if (source.length === 0) return buildStock([], true);

  const items: StockItem[] = source.map((it) => ({
    id: it.id,
    label: it.name,
    level: Math.max(0, Math.min(100, Math.round(it.level))),
  }));
  return buildStock(items, true);
}

export function coffeeCornerFromLive(input: LiveCoffeeCornerInput): CoffeeCornerSnapshot {
  const nowMs = input.nowMs ?? Date.now();
  const reports = input.reports ?? [];
  const voices = input.voices ?? [];

  return {
    stock: mapStockFromInventory(input.stock),
    requests: buildRequests(mapRequestsFromLive(voices, reports, nowMs)),
    faults: buildFaults(mapFaultsFromReports(reports, nowMs)),
    updatedAt: nowMs,
  };
}
