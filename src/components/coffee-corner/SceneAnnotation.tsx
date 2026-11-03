"use client";

import { Html } from "@react-three/drei";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AnchorConfig } from "./anchors";
import type { Severity } from "./types";

const RING: Record<Severity, string> = {
  ok: "bg-emerald-400/90 shadow-[0_0_14px_rgba(52,211,153,0.9)]",
  warn: "bg-amber-400/90 shadow-[0_0_14px_rgba(251,191,36,0.9)]",
  critical: "bg-rose-400/90 shadow-[0_0_14px_rgba(251,113,133,0.95)]",
};
const PING: Record<Severity, string> = {
  ok: "bg-emerald-400/40",
  warn: "bg-amber-400/40",
  critical: "bg-rose-400/45",
};

/** Horizontal run before the card, so the line "lands" on the card edge. */
const TAIL = 14;

interface SceneAnnotationProps {
  readonly anchor: AnchorConfig;
  readonly severity: Severity;
  readonly compact: boolean;
  readonly children: ReactNode;
}

/**
 * Bridges one 3D point to one screen-space card:
 *   • a pulsing marker exactly on the model coordinate,
 *   • an ultra-thin SVG leader line (non-scaling 1px stroke),
 *   • the popup, docked to the line's end.
 * Everything lives in a single zero-size `<Html>` so it tracks the camera for free.
 */
export function SceneAnnotation({ anchor, severity, compact, children }: SceneAnnotationProps) {
  const [dx, dy] = compact ? anchor.offsetCompact : anchor.offset;
  const side = dx >= 0 ? 1 : -1;
  const elbowX = dx - side * TAIL;
  const path = `M0 0 L${elbowX} ${dy} L${dx} ${dy}`;

  return (
    <group position={anchor.position as [number, number, number]}>
      <Html center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
        <div className="relative h-0 w-0">
          {/* marker */}
          <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
            <span className={cn("absolute inset-0 -m-2 rounded-full cc-ping", PING[severity])} aria-hidden />
            <span className={cn("block h-2 w-2 rounded-full ring-1 ring-white/70", RING[severity])} aria-hidden />
          </span>

          {/* leader line */}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
            <path
              d={path}
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="cc-line"
            />
            <circle cx={dx} cy={dy} r="1.5" fill="rgba(255,255,255,0.75)" />
          </svg>

          {/* card */}
          <div
            className="absolute cc-card"
            style={{
              left: dx,
              top: dy,
              transform: side === 1 ? "translate(6px, -50%)" : "translate(calc(-100% - 6px), -50%)",
            }}
          >
            {children}
          </div>
        </div>
      </Html>
    </group>
  );
}
