/**
 * Coffee Corner domain contracts.
 *
 * Interface Segregation: each live stream owns a tiny, independent shape so a
 * consumer (popup, scene, hook) only depends on the stream it renders.
 * Everything is language-neutral (keys + numbers); labels are resolved by the
 * presentation layer through i18n.
 */

export type Severity = "ok" | "warn" | "critical";

/* ── Stock ─────────────────────────────────────────────── */
export type StockItemKey = "beans" | "milk" | "cups" | "syrup";

export interface StockItem {
  readonly item: StockItemKey;
  /** Remaining level, 0–100. */
  readonly level: number;
}

export interface StockStatus {
  readonly items: readonly StockItem[];
  /** Lowest item, pre-computed so consumers do not re-scan. */
  readonly lowest: StockItem;
  readonly severity: Severity;
}

/* ── Requests ──────────────────────────────────────────── */
export type RequestKind = "refill" | "bill" | "table_service" | "cleaning";

export interface FloorRequest {
  readonly id: string;
  readonly kind: RequestKind;
  readonly table: number;
  readonly waitingMinutes: number;
}

export interface RequestsStatus {
  readonly pending: readonly FloorRequest[];
  readonly oldest: FloorRequest | null;
  readonly severity: Severity;
}

/* ── Faults (Arıza) ────────────────────────────────────── */
export type FaultDevice = "espresso_machine" | "grinder" | "fridge" | "ice_machine";

export interface FaultReport {
  readonly id: string;
  readonly device: FaultDevice;
  readonly severity: Severity;
  readonly openedMinutesAgo: number;
}

export interface FaultsStatus {
  readonly open: readonly FaultReport[];
  readonly worst: FaultReport | null;
  readonly severity: Severity;
}

/* ── Aggregate snapshot ────────────────────────────────── */
export interface CoffeeCornerSnapshot {
  readonly stock: StockStatus;
  readonly requests: RequestsStatus;
  readonly faults: FaultsStatus;
  /** Epoch ms of the last tick, useful for "live" indicators. */
  readonly updatedAt: number;
}

/* ── Scene annotations ─────────────────────────────────── */
export type StreamId = "stock" | "requests" | "faults";

/** Hook contract — kept separate so tests/fakes can implement just this. */
export interface CoffeeCornerDataSource {
  snapshot: CoffeeCornerSnapshot;
}
