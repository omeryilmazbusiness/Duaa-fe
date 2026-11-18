/** Pure ring geometry for the SVG charts. No React, no IO. */

export interface Arc {
  /** Index of the input value this arc draws. */
  index: number;
  /** Visible length along the circumference. */
  length: number;
  /** Distance from the 12 o'clock start to where the arc begins. */
  offset: number;
  /** Share of the whole, 0..1. */
  fraction: number;
}

function safe(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Clamp a percentage into 0..100 and round it, so a bad feed can never overdraw a ring. */
export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/** Share of `part` in `whole`, 0..1; 0 when there is no whole. */
export function fractionOf(part: number, whole: number): number {
  const p = safe(part);
  const w = safe(whole);
  if (w === 0) return 0;
  return Math.min(1, p / w);
}

/**
 * Splits a circle into arcs, one per positive value. Arcs are separated by `gap` so
 * neighbours read as distinct colours; a lone arc fills the whole ring with no gap.
 * Zero, negative and non-finite values draw nothing.
 */
export function buildArcs(values: readonly number[], circumference: number, gap: number): Arc[] {
  const cleaned = values.map(safe);
  const total = cleaned.reduce((sum, v) => sum + v, 0);
  if (total === 0 || circumference <= 0) return [];

  const visible = cleaned.filter((v) => v > 0).length;
  const spacing = visible > 1 ? Math.max(0, gap) : 0;
  const arcs: Arc[] = [];
  let cursor = 0;
  cleaned.forEach((value, index) => {
    if (value === 0) return;
    const fraction = value / total;
    const span = fraction * circumference;
    const length = Math.max(span - spacing, Math.min(span, 0.5));
    arcs.push({ index, length, offset: cursor + spacing / 2, fraction });
    cursor += span;
  });
  return arcs;
}

/** Radius that keeps a stroke of `thickness` inside a square of `size`. */
export function ringRadius(size: number, thickness: number): number {
  return Math.max(0, (size - thickness) / 2);
}
