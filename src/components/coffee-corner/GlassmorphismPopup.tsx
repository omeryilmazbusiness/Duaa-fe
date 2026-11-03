import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "./types";

export interface PopupRow {
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
  ok: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]",
  warn: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]",
  critical: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.95)]",
};

const BAR: Record<Severity, string> = {
  ok: "from-emerald-300/90 to-emerald-400/70",
  warn: "from-amber-300/90 to-amber-400/70",
  critical: "from-rose-300/90 to-rose-400/70",
};

/**
 * Pure presentational annotation card — minimalist glassmorphism.
 * No state, no data fetching, no knowledge of 3D: props in, markup out.
 */
export function GlassmorphismPopup({ title, value, caption, severity, icon, rows, compact = false, className }: GlassmorphismPopupProps) {
  const surface =
    "select-none border border-white/10 bg-black/40 text-white backdrop-blur-xl " +
    "shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] [font-feature-settings:'tnum'] antialiased";

  if (compact) {
    return (
      <div
        className={cn(surface, "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5", className)}
        title={title}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[severity])} aria-hidden />
        {icon ? <span className="text-white/60">{icon}</span> : null}
        <span className="text-[13px] font-semibold leading-none tracking-[-0.01em]">{value}</span>
      </div>
    );
  }

  return (
    <div className={cn(surface, "w-[188px] rounded-2xl p-3", className)}>
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[severity])} aria-hidden />
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">{title}</span>
        {icon ? <span className="ms-auto text-white/60">{icon}</span> : null}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-white">{value}</span>
        {caption ? <span className="truncate text-[11px] font-medium text-white/50">{caption}</span> : null}
      </div>

      {rows?.length ? (
        <ul className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-center justify-between gap-2 text-[11px] leading-tight">
                <span className="truncate text-white/60">{row.label}</span>
                <span className="shrink-0 font-medium text-white/90">{row.value}</span>
              </div>
              {row.progress !== undefined ? (
                <div className="mt-1 h-[2px] overflow-hidden rounded-full bg-white/10">
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
