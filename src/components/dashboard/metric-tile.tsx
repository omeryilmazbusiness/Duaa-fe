import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_GRADIENT, type Tone } from "@/theme/tones";

export function MetricTile({
  icon: Icon,
  tone,
  value,
  label,
  caption,
  compact,
  active,
  onClick,
  disabled,
  alert,
  testId,
}: {
  icon: LucideIcon;
  tone: Tone;
  value: ReactNode;
  label: string;
  caption?: string;
  compact?: boolean;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  alert?: boolean;
  testId?: string;
}) {
  const inert = Boolean(disabled) && !active;
  const className = cn(
    "flex min-w-0 flex-col items-center gap-1.5 rounded-[20px] px-1 pb-2.5 pt-3 transition-all",
    onClick
      ? active
        ? "bg-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.45)] ring-2 ring-zinc-900/80"
        : "bg-zinc-50/70 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_26px_-20px_rgba(15,23,42,0.45)]"
      : "bg-zinc-50/70",
    inert && "cursor-default opacity-45 hover:translate-y-0 hover:bg-zinc-50/70 hover:shadow-none",
  );
  const body = (
    <>
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", TONE_GRADIENT[tone])}>
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <span
        className={cn(
          compact ? "text-[15px]" : "text-[18px]",
          "block max-w-full truncate font-semibold leading-[22px] tracking-tight tabular-nums",
          alert ? "text-rose-600" : "text-zinc-950",
        )}
      >
        {value}
      </span>
      <span className="w-full truncate text-center text-[11px] font-medium text-zinc-500">{label}</span>
      {caption ? <span className="w-full truncate text-center text-[10px] font-medium text-zinc-400">{caption}</span> : null}
    </>
  );
  if (onClick) {
    return (
      <button type="button" disabled={inert} aria-pressed={active} onClick={onClick} data-testid={testId} className={className}>
        {body}
      </button>
    );
  }
  return (
    <div data-testid={testId} className={className}>
      {body}
    </div>
  );
}
