import type { Tone } from "./tones";

/** Gradient stops for chart arcs. Presentation-only; the data decides which tone a slice gets. */
export const CHART_COLOR: Record<Tone, { from: string; to: string }> = {
  rose: { from: "#fb7185", to: "#e11d48" },
  amber: { from: "#fbbf24", to: "#f97316" },
  sky: { from: "#38bdf8", to: "#2563eb" },
  emerald: { from: "#34d399", to: "#059669" },
  violet: { from: "#a78bfa", to: "#7c3aed" },
  indigo: { from: "#818cf8", to: "#4f46e5" },
  teal: { from: "#2dd4bf", to: "#0891b2" },
  zinc: { from: "#a1a1aa", to: "#52525b" },
};

/** CSS gradient for legend dots and chips so they match the arcs exactly. */
export function chartGradientCss(tone: Tone): string {
  const { from, to } = CHART_COLOR[tone];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
