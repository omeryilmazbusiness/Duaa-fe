"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";
import { buildArcs, ringRadius } from "@/domain/charts/geometry";
import { cn } from "@/lib/utils";
import { CHART_COLOR } from "@/theme/chart-colors";
import type { Tone } from "@/theme/tones";

export interface DonutSlice {
  id: string;
  value: number;
  tone: Tone;
}

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Multi-colour ring. Pass `center` for the number that sits in the hole.
 * The ring is decorative: the legend next to it carries the same numbers as text.
 */
export function DonutChart({
  slices,
  size = 148,
  thickness = 20,
  gap = 5,
  center,
  className,
  testId,
}: {
  slices: readonly DonutSlice[];
  size?: number;
  thickness?: number;
  gap?: number;
  center?: ReactNode;
  className?: string;
  testId?: string;
}) {
  const reduce = useReducedMotion();
  const uid = useId();
  const radius = ringRadius(size, thickness);
  const circumference = 2 * Math.PI * radius;
  const mid = size / 2;
  const arcs = buildArcs(
    slices.map((s) => s.value),
    circumference,
    gap,
  );

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} data-testid={testId}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
        <defs>
          {slices.map((s) => (
            <linearGradient key={s.id} id={`${uid}-${s.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR[s.tone].from} />
              <stop offset="100%" stopColor={CHART_COLOR[s.tone].to} />
            </linearGradient>
          ))}
        </defs>
        <circle cx={mid} cy={mid} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={thickness} />
        {arcs.map((arc) => {
          const slice = slices[arc.index];
          if (!slice) return null;
          const dash = `${arc.length} ${Math.max(circumference - arc.length, 0)}`;
          return (
            <motion.circle
              key={slice.id}
              cx={mid}
              cy={mid}
              r={radius}
              fill="none"
              stroke={`url(#${uid}-${slice.id})`}
              strokeWidth={thickness}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${mid} ${mid})`}
              initial={reduce ? false : { strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: dash }}
              transition={{ duration: 0.9, ease: EASE }}
            />
          );
        })}
      </svg>
      {center ? <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div> : null}
    </div>
  );
}
