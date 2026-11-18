"use client";

import { ConcentricRings } from "@/components/charts/concentric-rings";
import { clampPct } from "@/domain/charts/geometry";
import type { Tone } from "@/theme/tones";

/** One thick progress ring with the percentage in the middle. */
export function RadialGauge({ pct, tone, size = 132, label, testId }: { pct: number; tone: Tone; size?: number; label?: string; testId?: string }) {
  const value = clampPct(pct);
  return (
    <ConcentricRings
      rings={[{ id: "gauge", pct: value, tone }]}
      size={size}
      thickness={Math.round(size * 0.14)}
      testId={testId}
      center={
        <>
          <span className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-zinc-950">
            {value}
            <span className="text-[15px] font-medium text-zinc-400">%</span>
          </span>
          {label ? <span className="mt-1 max-w-[70%] truncate text-[11px] font-medium text-zinc-500">{label}</span> : null}
        </>
      }
    />
  );
}
