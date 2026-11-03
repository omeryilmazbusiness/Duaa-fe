import type { CoffeeCornerSnapshot, StreamId } from "@/domain/coffee-corner";
import type { Messages } from "@/lib/i18n";
import type { GlassmorphismPopupProps } from "./GlassmorphismPopup";

/** Pure mapping: (snapshot, i18n) → props for `GlassmorphismPopup`. No React. */
export type PopupModel = Omit<GlassmorphismPopupProps, "icon" | "compact" | "className">;
export type PopupModels = Record<StreamId, PopupModel>;

const fill = (tpl: string, n: number | string) => tpl.replace("{n}", String(n));

function stockRowSeverity(level: number): "ok" | "warn" | "critical" {
  return level <= 15 ? "critical" : level <= 35 ? "warn" : "ok";
}

export function buildPopupModels(s: CoffeeCornerSnapshot, t: Messages): PopupModels {
  const stock: PopupModel = !s.stock.available
    ? {
        title: t.ccStock,
        value: "—",
        caption: t.ccStockNoFeed,
        severity: "ok",
        rows: [],
      }
    : s.stock.lowest
      ? {
          title: t.ccStock,
          value: `${s.stock.lowest.level}%`,
          caption: `${s.stock.lowest.label} · ${t.ccLowest}`,
          severity: s.stock.severity,
          rows: s.stock.items.map((it) => ({
            id: it.id,
            label: it.label,
            value: `${it.level}%`,
            progress: it.level,
            severity: stockRowSeverity(it.level),
          })),
        }
      : {
          title: t.ccStock,
          value: "OK",
          caption: t.ccAllClear,
          severity: "ok",
          rows: [],
        };

  const requests: PopupModel = {
    title: t.ccRequests,
    value: String(s.requests.pending.length),
    caption: s.requests.pending.length === 0 ? t.ccAllClear : t.ccWaiting,
    severity: s.requests.severity,
    rows: s.requests.pending.slice(0, 3).map((r) => ({
      id: r.id,
      label: r.tableLabel ? `${r.label} · ${fill(t.ccTable, r.tableLabel)}` : r.label,
      value: fill(t.ccMin, r.waitingMinutes),
    })),
  };

  const faults: PopupModel = {
    title: t.ccFaults,
    value: String(s.faults.open.length),
    caption: s.faults.open.length === 0 ? t.ccAllClear : t.ccOpen,
    severity: s.faults.severity,
    rows: s.faults.open.slice(0, 3).map((f) => ({
      id: f.id,
      label: f.label,
      value: fill(t.ccAgo, f.openedMinutesAgo),
      severity: f.severity,
    })),
  };

  return { stock, requests, faults };
}
