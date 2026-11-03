import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "./types";

export interface PopupRow {
  /** Stable unique id — labels alone are not unique (e.g. two grinders). */
  readonly id: string;
  readonly label: string;
  readonly value: string;
  /** Optional 0–100 meter rendered under the row. */
  readonly progress?: number;
  readonly severity?: Severity;
}

export interface GlassmorphismPopupProps {
  readonly title: string;
  /** Hero metric, e.g. "28%" or "3". */
  readonly value: string;
  readonly caption?: string;
  readonly severity: Severity;
  readonly icon?: ReactNode;
  readonly rows?: readonly PopupRow[];
  /** Icon + value pill for narrow canvases. */
  readonly compact?: boolean;
  readonly className?: string;
}

const DOT: Record<Severity, string> = {
  ok: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]",
  warn: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.65)]",
  critical: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]",
};

const BAR: Record<Severity, string> = {
  ok: "from-emerald-400 to-emerald-500/80",
  warn: "from-amber-400 to-amber-500/80",
  critical: "from-rose-400 to-rose-500/80",
};

/**
 * The only surface in the scene that is "glass": backdrop blur, translucent
 * white, a hairline border and a soft long shadow. Tuned for the light Wodi
 * page, so it stays legible both over the page and over the model.
 */
const GLASS =
  "select-none border border-white/60 bg-white/45 text-zinc-900 backdrop-blur-xl backdrop-saturate-150 " +
  "shadow-[0_18px_44px_-22px_rgba(15,23,42,0.45),0_1px_0_rgba(255,255,255,0.7)_inset,0_0_0_0.5px_rgba(15,23,42,0.06)] " +
  "[font-feature-settings:'tnum'] antialiased";

/**
 * Pure presentational annotation card — minimalist glassmorphism.
 * No state, no data fetching, no knowledge of 3D: props in, markup out.
 */
export function GlassmorphismPopup({ title, value, caption, severity, icon, rows, compact = false, className }: GlassmorphismPopupProps) {
  if (compact) {
    return (
      <div
        className={cn(GLASS, "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5", className)}
        title={title}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[severity])} aria-hidden />
        {icon ? <span className="text-zinc-500">{icon}</span> : null}
        <span className="text-[13px] font-semibold leading-none tracking-[-0.01em]">{value}</span>
      </div>
    );
  }

  return (
    <div className={cn(GLASS, "w-[188px] rounded-2xl p-3", className)}>
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[severity])} aria-hidden />
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</span>
        {icon ? <span className="ms-auto text-zinc-400">{icon}</span> : null}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-zinc-900">{value}</span>
        {caption ? <span className="truncate text-[11px] font-medium text-zinc-500">{caption}</span> : null}
      </div>

      {rows?.length ? (
        <ul className="mt-2.5 space-y-1.5 border-t border-zinc-900/[0.07] pt-2">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="flex items-center justify-between gap-2 text-[11px] leading-tight">
                <span className="truncate text-zinc-500">{row.label}</span>
                <span className="shrink-0 font-medium text-zinc-800">{row.value}</span>
              </div>
              {row.progress !== undefined ? (
                <div className="mt-1 h-[2px] overflow-hidden rounded-full bg-zinc-900/[0.08]">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", BAR[row.severity ?? "ok"])}
                    style={{ width: `${Math.max(2, Math.min(100, row.progress))}%` }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
