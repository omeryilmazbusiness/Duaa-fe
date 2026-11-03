/**
 * Coffee Corner view-model contracts (presentation-agnostic).
 *
 * Interface Segregation: each live stream is a tiny, independent shape so a
 * consumer only depends on what it renders. Labels are already localized or
 * human-readable from the source system — no i18n keys here (domain stays pure).
 */

export type Severity = "ok" | "warn" | "critical";

export type StreamId = "stock" | "requests" | "faults";

/* ── Stock (supply-health proxy until an inventory API exists) ── */
export interface StockItem {
  readonly id: string;
  readonly label: string;
  /** Remaining health, 0–100. */
  readonly level: number;
}

export interface StockStatus {
  readonly items: readonly StockItem[];
  readonly lowest: StockItem | null;
  readonly severity: Severity;
  /**
   * false when the waste/recipe feed is unavailable — UI must not invent levels.
   * true with empty items means "wired and clear".
   */
  readonly available: boolean;
}

/* ── Floor / guest + staff requests ─────────────────────── */
export type RequestSource = "voice" | "report";

export interface FloorRequest {
  readonly id: string;
  readonly label: string;
  /** Table / site label from QR or reporter context (may be empty). */
  readonly tableLabel: string;
  readonly waitingMinutes: number;
  readonly source: RequestSource;
}

export interface RequestsStatus {
  readonly pending: readonly FloorRequest[];
  readonly oldest: FloorRequest | null;
  readonly severity: Severity;
}

/* ── Faults (Arıza) ← open breakage reports ─────────────── */
export interface FaultReport {
  readonly id: string;
  readonly label: string;
  readonly severity: Severity;
  readonly openedMinutesAgo: number;
}

export interface FaultsStatus {
  readonly open: readonly FaultReport[];
  readonly worst: FaultReport | null;
  readonly severity: Severity;
}

/* ── Aggregate ──────────────────────────────────────────── */
export interface CoffeeCornerSnapshot {
  readonly stock: StockStatus;
  readonly requests: RequestsStatus;
  readonly faults: FaultsStatus;
  readonly updatedAt: number;
}
