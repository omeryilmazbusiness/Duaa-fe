"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";
import { clampPct, ringRadius } from "@/domain/charts/geometry";
import { cn } from "@/lib/utils";
import { CHART_COLOR } from "@/theme/chart-colors";
import type { Tone } from "@/theme/tones";

export interface RingSpec {
  id: string;
  /** 0..100; anything else is clamped. */
  pct: number;
  tone: Tone;
}

const EASE = [0.32, 0.72, 0, 1] as const;

/** Activity-style nested progress rings: the first ring is the outermost. */
export function ConcentricRings({
  rings,
  size = 148,
  thickness = 14,
  spacing = 5,
  center,
  className,
  testId,
}: {
  rings: readonly RingSpec[];
  size?: number;
  thickness?: number;
  spacing?: number;
  center?: ReactNode;
  className?: string;
  testId?: string;
}) {
  const reduce = useReducedMotion();
  const uid = useId();
  const mid = size / 2;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} data-testid={testId}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
        <defs>
          {rings.map((ring) => (
            <linearGradient key={ring.id} id={`${uid}-${ring.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR[ring.tone].from} />
              <stop offset="100%" stopColor={CHART_COLOR[ring.tone].to} />
            </linearGradient>
          ))}
        </defs>
        {rings.map((ring, index) => {
          const inset = index * (thickness + spacing);
          const radius = ringRadius(size - inset * 2, thickness);
          if (radius <= 0) return null;
          const circumference = 2 * Math.PI * radius;
          const pct = clampPct(ring.pct);
          const length = (pct / 100) * circumference;
          return (
            <g key={ring.id} transform={`rotate(-90 ${mid} ${mid})`}>
              <circle cx={mid} cy={mid} r={radius} fill="none" stroke={CHART_COLOR[ring.tone].from} strokeOpacity={0.16} strokeWidth={thickness} />
              {pct > 0 ? (
                <motion.circle
                  cx={mid}
                  cy={mid}
                  r={radius}
                  fill="none"
                  stroke={`url(#${uid}-${ring.id})`}
                  strokeWidth={thickness}
                  strokeLinecap="round"
                  initial={reduce ? false : { strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${length} ${Math.max(circumference - length, 0)}` }}
                  transition={{ duration: 1, ease: EASE, delay: reduce ? 0 : index * 0.08 }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      {center ? <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div> : null}
    </div>
  );
}
