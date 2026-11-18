"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_FG, TONE_GRADIENT, TONE_TINT, type Tone } from "@/theme/tones";

interface IconGridTileProps {
  icon: LucideIcon;
  tone: Tone;
  value: string | number;
  unit?: string;
  label: string;
  caption?: string;
  /** Rose dot on the icon: something here needs the manager. */
  attention?: boolean;
  /** Greyed out for a source that is not connected yet. */
  muted?: boolean;
  onClick?: () => void;
  testId?: string;
}

/** Large-icon widget tile: gradient squircle, big number, soft tone wash. */
export function IconGridTile({ icon: Icon, tone, value, unit, label, caption, attention, muted, onClick, testId }: IconGridTileProps) {
  const longValue = String(value).length > 7;
  const shell = cn(
    "group relative flex min-h-[148px] w-full min-w-0 flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br p-4 text-start",
    "shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] ring-1 ring-inset ring-zinc-900/[0.05]",
    muted ? "from-zinc-50 via-white to-white" : TONE_TINT[tone],
    onClick &&
      "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-26px_rgba(15,23,42,0.5)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25",
  );

  const body = (
    <>
      <Icon
        aria-hidden
        className={cn("pointer-events-none absolute -bottom-5 -end-4 h-28 w-28 opacity-[0.07]", muted ? "text-zinc-500" : TONE_FG[tone])}
        strokeWidth={1.4}
      />
      <span className="relative flex items-start justify-between">
        <span className={cn("relative flex h-[60px] w-[60px] items-center justify-center rounded-[22px]", muted ? "bg-zinc-200 text-zinc-500" : TONE_GRADIENT[tone])}>
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/35 via-white/5 to-transparent" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/30" />
          <Icon className="relative h-8 w-8" strokeWidth={1.7} />
          {attention ? <span aria-hidden className="absolute -end-1 -top-1 h-4 w-4 rounded-full bg-rose-500 ring-[3px] ring-white" /> : null}
        </span>
        {onClick ? <ChevronRight aria-hidden className="mt-1 h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500 rtl:rotate-180" strokeWidth={2.2} /> : null}
      </span>
      <span className="relative mt-4 block min-w-0">
        <span className={cn("flex items-baseline gap-0.5 font-semibold leading-none tracking-[-0.03em] tabular-nums", muted ? "text-zinc-400" : "text-zinc-950", longValue ? "text-[22px]" : "text-[32px]")}>
          <span className="truncate">{value}</span>
          {unit ? <span className="text-[16px] font-semibold text-zinc-400">{unit}</span> : null}
        </span>
        <span className="mt-2 block truncate text-[13px] font-semibold text-zinc-700">{label}</span>
        {caption ? <span className="mt-0.5 block truncate text-[11.5px] font-medium text-zinc-400">{caption}</span> : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell} aria-label={`${label}: ${value}${unit ?? ""}`} data-testid={testId}>
        {body}
      </button>
    );
  }
  return (
    <div className={shell} data-testid={testId}>
      {body}
    </div>
  );
}

export function IconGrid({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid={testId}>
      {children}
    </div>
  );
}
