/** Shared iOS tone tokens. Presentation-only — no React, no IO. */

export const TONES = ["rose", "amber", "sky", "emerald", "violet", "indigo", "teal", "zinc"] as const;

export type Tone = (typeof TONES)[number];

export function isTone(value: string): value is Tone {
  return (TONES as readonly string[]).includes(value);
}

/** Saturated fill for KPI tiles, decision cards, and list rows. */
export const TONE_FILL: Record<Tone, string> = {
  rose: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
  amber: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
  sky: "bg-gradient-to-br from-sky-500 to-blue-600 text-white",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
  violet: "bg-gradient-to-br from-violet-500 to-purple-600 text-white",
  indigo: "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white",
  teal: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
  zinc: "bg-gradient-to-br from-zinc-500 to-zinc-700 text-white",
};

/** Soft glass tint for the selected manager tab pill. */
export const TONE_LIQUID: Record<Tone, string> = {
  rose: "bg-gradient-to-b from-white/88 to-rose-50/75",
  amber: "bg-gradient-to-b from-white/88 to-amber-50/75",
  sky: "bg-gradient-to-b from-white/88 to-sky-50/75",
  emerald: "bg-gradient-to-b from-white/88 to-emerald-50/75",
  violet: "bg-gradient-to-b from-white/88 to-violet-50/75",
  indigo: "bg-gradient-to-b from-white/88 to-indigo-50/75",
  teal: "bg-gradient-to-b from-white/88 to-teal-50/75",
  zinc: "bg-gradient-to-b from-white/88 to-zinc-50/70",
};

/** Idle tab / sidebar glyph color. */
export const TONE_FG: Record<Tone, string> = {
  rose: "text-rose-500",
  amber: "text-amber-500",
  sky: "text-sky-500",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  indigo: "text-indigo-500",
  teal: "text-teal-500",
  zinc: "text-zinc-500",
};

/** iOS Settings glyph tile (Wodi): top-lit gradient square. */
export const TONE_GLYPH: Record<Tone, string> = {
  rose: "from-rose-400 to-rose-600",
  amber: "from-amber-400 to-orange-500",
  sky: "from-sky-400 to-blue-600",
  emerald: "from-emerald-400 to-emerald-600",
  violet: "from-violet-400 to-purple-600",
  indigo: "from-indigo-400 to-indigo-600",
  teal: "from-teal-400 to-cyan-600",
  zinc: "from-zinc-400 to-zinc-600",
};

/** Solid squircle well for icons sitting on glass or dark chrome. */
export const TONE_WELL: Record<Tone, string> = {
  rose: "bg-rose-500 text-white",
  amber: "bg-amber-500 text-white",
  sky: "bg-sky-500 text-white",
  emerald: "bg-emerald-500 text-white",
  violet: "bg-violet-500 text-white",
  indigo: "bg-indigo-500 text-white",
  teal: "bg-teal-500 text-white",
  zinc: "bg-zinc-500 text-white",
};

/** Wodi Soft Light: count pills and status chips. */
export const TONE_SOFT: Record<Tone, string> = {
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  indigo: "bg-indigo-50 text-indigo-700",
  teal: "bg-teal-50 text-teal-700",
  zinc: "bg-zinc-100 text-zinc-600",
};

/** Wodi Soft Light: solid icon wells with a coloured drop shadow. */
export const TONE_SOLID: Record<Tone, string> = {
  rose: "bg-rose-500 text-white shadow-[0_8px_18px_-8px_rgba(244,63,94,0.7)]",
  amber: "bg-amber-500 text-white shadow-[0_8px_18px_-8px_rgba(245,158,11,0.7)]",
  sky: "bg-sky-500 text-white shadow-[0_8px_18px_-8px_rgba(14,165,233,0.7)]",
  emerald: "bg-emerald-500 text-white shadow-[0_8px_18px_-8px_rgba(16,185,129,0.7)]",
  violet: "bg-violet-500 text-white shadow-[0_8px_18px_-8px_rgba(139,92,246,0.7)]",
  indigo: "bg-indigo-500 text-white shadow-[0_8px_18px_-8px_rgba(99,102,241,0.7)]",
  teal: "bg-teal-500 text-white shadow-[0_8px_18px_-8px_rgba(20,184,166,0.7)]",
  zinc: "bg-zinc-800 text-white shadow-[0_8px_18px_-8px_rgba(24,24,27,0.6)]",
};

/** Wodi Soft Light: KPI tile wash (pair with bg-gradient-to-br). */
export const TONE_TINT: Record<Tone, string> = {
  rose: "from-rose-50 via-white to-white",
  amber: "from-amber-50 via-white to-white",
  sky: "from-sky-50 via-white to-white",
  emerald: "from-emerald-50 via-white to-white",
  violet: "from-violet-50 via-white to-white",
  indigo: "from-indigo-50 via-white to-white",
  teal: "from-teal-50 via-white to-white",
  zinc: "from-zinc-50 via-white to-white",
};

/** Wodi Soft Light: gradient squircles for MetricTile / ActionTile. */
export const TONE_GRADIENT: Record<Tone, string> = {
  rose: "bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-[0_14px_28px_-12px_rgba(244,63,94,0.55)]",
  amber: "bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_14px_28px_-12px_rgba(245,158,11,0.55)]",
  sky: "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_14px_28px_-12px_rgba(14,165,233,0.55)]",
  emerald: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_14px_28px_-12px_rgba(16,185,129,0.55)]",
  violet: "bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-[0_14px_28px_-12px_rgba(139,92,246,0.55)]",
  indigo: "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-[0_14px_28px_-12px_rgba(99,102,241,0.55)]",
  teal: "bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-[0_14px_28px_-12px_rgba(20,184,166,0.55)]",
  zinc: "bg-gradient-to-br from-zinc-600 to-zinc-900 text-white shadow-[0_14px_28px_-12px_rgba(24,24,27,0.45)]",
};
