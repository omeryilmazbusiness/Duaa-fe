"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CoffeeCornerSnapshot,
  FaultDevice,
  FaultReport,
  FaultsStatus,
  FloorRequest,
  RequestKind,
  RequestsStatus,
  Severity,
  StockItem,
  StockStatus,
} from "./types";

/**
 * Live data streams for the Coffee Corner.
 *
 * SRP: this module owns *only* data. It is mocked with `setInterval` today;
 * swapping in React Query / SSE later only touches `nextSnapshot` + the effect,
 * the contract (`CoffeeCornerSnapshot`) stays untouched.
 */

const REQUEST_KINDS: readonly RequestKind[] = ["refill", "bill", "table_service", "cleaning"];
const FAULT_DEVICES: readonly FaultDevice[] = ["espresso_machine", "grinder", "fridge", "ice_machine"];

/* ── pure builders (no React, no IO) ───────────────────── */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function stockSeverity(level: number): Severity {
  return level <= 15 ? "critical" : level <= 35 ? "warn" : "ok";
}

export function buildStock(items: readonly StockItem[]): StockStatus {
  const lowest = items.reduce((min, it) => (it.level < min.level ? it : min), items[0] as StockItem);
  return { items, lowest, severity: stockSeverity(lowest.level) };
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

/** Deterministic first frame so SSR and hydration agree. */
const INITIAL: CoffeeCornerSnapshot = {
  stock: buildStock([
    { item: "beans", level: 62 },
    { item: "milk", level: 28 },
    { item: "cups", level: 74 },
    { item: "syrup", level: 41 },
  ]),
  requests: buildRequests([
    { id: "r1", kind: "refill", table: 4, waitingMinutes: 3 },
    { id: "r2", kind: "bill", table: 7, waitingMinutes: 6 },
  ]),
  faults: buildFaults([{ id: "f1", device: "grinder", severity: "warn", openedMinutesAgo: 22 }]),
  updatedAt: 0,
};

/* ── mock stream ───────────────────────────────────────── */
let seq = 100;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

function nextSnapshot(prev: CoffeeCornerSnapshot): CoffeeCornerSnapshot {
  // Stock drifts down, occasionally restocked.
  const items = prev.stock.items.map<StockItem>((it) => {
    const restock = Math.random() < 0.06;
    const level = restock ? 85 + Math.random() * 15 : clamp(it.level - Math.random() * 1.6, 4, 100);
    return { item: it.item, level: Math.round(level) };
  });

  // Requests age; some are served; new ones arrive.
  let pending = prev.requests.pending
    .map<FloorRequest>((r) => ({ ...r, waitingMinutes: r.waitingMinutes + 1 }))
    .filter(() => Math.random() > 0.18);
  if (pending.length < 6 && Math.random() < 0.45) {
    pending = [
      ...pending,
      { id: `r${seq++}`, kind: pick(REQUEST_KINDS), table: 1 + Math.floor(Math.random() * 12), waitingMinutes: 0 },
    ];
  }

  // Faults appear rarely, get resolved sometimes.
  let open = prev.faults.open
    .map<FaultReport>((f) => ({ ...f, openedMinutesAgo: f.openedMinutesAgo + 1 }))
    .filter(() => Math.random() > 0.08);
  if (open.length < 3 && Math.random() < 0.12) {
    open = [
      ...open,
      {
        id: `f${seq++}`,
        device: pick(FAULT_DEVICES),
        severity: Math.random() < 0.35 ? "critical" : "warn",
        openedMinutesAgo: 0,
      },
    ];
  }

  return {
    stock: buildStock(items),
    requests: buildRequests(pending),
    faults: buildFaults(open),
    updatedAt: Date.now(),
  };
}

export interface UseCoffeeCornerDataOptions {
  /** Tick interval in ms. Default 5000. */
  intervalMs?: number;
  /** Pause the stream (e.g. widget off-screen). */
  paused?: boolean;
}

export function useCoffeeCornerData({ intervalMs = 5000, paused = false }: UseCoffeeCornerDataOptions = {}): CoffeeCornerSnapshot {
  const [snapshot, setSnapshot] = useState<CoffeeCornerSnapshot>(INITIAL);
  // `nextSnapshot` is impure (random) → compute outside the state updater so
  // StrictMode's double-invocation cannot desync what we render.
  const latest = useRef(snapshot);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      // Skip work while the tab is hidden.
      if (document.hidden) return;
      latest.current = nextSnapshot(latest.current);
      setSnapshot(latest.current);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, paused]);

  return snapshot;
}

