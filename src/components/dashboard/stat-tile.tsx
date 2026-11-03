import type { LucideIcon } from "lucide-react";
import { IconWell } from "@/components/manager/white-card";
import { cn } from "@/lib/utils";
import { TONE_FILL, type Tone } from "@/theme/tones";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "sky",
  caption,
  compact,
  onClick,
  testId,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  caption?: string;
  compact?: boolean;
  onClick?: () => void;
  testId?: string;
}) {
  const shell = cn(
    "ios-fill-sheen group flex h-full flex-col justify-between transition-all duration-300",
    TONE_FILL[tone],
    compact ? "min-h-[96px] rounded-[22px] p-3.5" : "min-h-[148px] rounded-[28px] p-5",
    onClick &&
      "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
  );
  const body = (
    <>
      <IconWell icon={Icon} size={compact ? "sm" : "lg"} />
      <div className={cn("min-w-0", compact ? "mt-2.5" : "mt-4")}>
        <p
          className={cn(
            "truncate font-semibold leading-none tracking-tight tabular-nums text-white",
            compact ? "text-[26px]" : "text-[34px]",
          )}
        >
          {value}
        </p>
        <p className={cn("truncate font-medium text-white/75", compact ? "mt-1.5 text-[12px]" : "mt-2 text-[13px]")}>
          {label}
        </p>
        {caption ? <p className="mt-0.5 truncate text-[11px] font-medium text-white/60">{caption}</p> : null}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("block w-full text-start", shell)} data-testid={testId}>
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
