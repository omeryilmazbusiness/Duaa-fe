"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "./types";

const RING: Record<Severity, string> = {
  ok: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]",
  warn: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]",
  critical: "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.75)]",
};
const PING: Record<Severity, string> = {
  ok: "bg-emerald-500/35",
  warn: "bg-amber-500/35",
  critical: "bg-rose-500/40",
};

/** Hairline leader: dark ink so it reads on page *and* model. */
const LINE = "rgba(24,24,27,0.55)";
const TAIL = 14;

export interface ScreenAnchor {
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

interface SceneAnnotationProps {
  readonly screen: ScreenAnchor;
  readonly offset: readonly [number, number];
  readonly severity: Severity;
  readonly children: ReactNode;
}

/**
 * Screen-space annotation (DOM only — no drei `<Html>`).
 * Position is the projected 3D point in canvas CSS pixels; offset docks the card.
 */
export function SceneAnnotation({ screen, offset, severity, children }: SceneAnnotationProps) {
  if (!screen.visible) return null;

  const [dx, dy] = offset;
  const side = dx >= 0 ? 1 : -1;
  const elbowX = dx - side * TAIL;
  const path = `M0 0 L${elbowX} ${dy} L${dx} ${dy}`;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{ transform: `translate3d(${screen.x}px, ${screen.y}px, 0)` }}
    >
      <div className="relative h-0 w-0">
        <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
          <span className={cn("absolute inset-0 -m-2 rounded-full cc-ping", PING[severity])} aria-hidden />
          <span className={cn("block h-2 w-2 rounded-full ring-[1.5px] ring-white", RING[severity])} aria-hidden />
        </span>

        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
          <path
            d={path}
            fill="none"
            stroke={LINE}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            className="cc-line"
          />
          <circle cx={dx} cy={dy} r="1.5" fill={LINE} />
        </svg>

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
    </div>
  );
}
