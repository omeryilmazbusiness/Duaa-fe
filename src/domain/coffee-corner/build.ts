import type {
  FaultReport,
  FaultsStatus,
  FloorRequest,
  RequestsStatus,
  Severity,
  StockItem,
  StockStatus,
} from "./types";

export function stockSeverity(level: number): Severity {
  return level <= 15 ? "critical" : level <= 35 ? "warn" : "ok";
}

export function buildStock(items: readonly StockItem[], available = true): StockStatus {
  if (items.length === 0) {
    return { items: [], lowest: null, severity: "ok", available };
  }
  const lowest = items.reduce((min, it) => (it.level < min.level ? it : min), items[0] as StockItem);
  return { items, lowest, severity: stockSeverity(lowest.level), available };
}

export function buildRequests(pending: readonly FloorRequest[]): RequestsStatus {
  const oldest = pending.reduce<FloorRequest | null>(
    (max, r) => (max === null || r.waitingMinutes > max.waitingMinutes ? r : max),
    null,
  );
  const severity: Severity =
    oldest === null ? "ok" : oldest.waitingMinutes >= 10 ? "critical" : oldest.waitingMinutes >= 5 ? "warn" : "ok";
  return { pending, oldest, severity };
}

export function buildFaults(open: readonly FaultReport[]): FaultsStatus {
  const rank: Record<Severity, number> = { ok: 0, warn: 1, critical: 2 };
  const worst = open.reduce<FaultReport | null>(
    (max, f) => (max === null || rank[f.severity] > rank[max.severity] ? f : max),
    null,
  );
  return { open, worst, severity: worst?.severity ?? "ok" };
}

export function minutesSince(iso: string, nowMs: number): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((nowMs - t) / 60_000));
}

export function faultSeverity(openedMinutesAgo: number): Severity {
  return openedMinutesAgo >= 20 ? "critical" : "warn";
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
