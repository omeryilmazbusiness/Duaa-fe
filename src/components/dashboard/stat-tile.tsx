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
  onClick,
  testId,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  caption?: string;
  onClick?: () => void;
  testId?: string;
}) {
  const shell = cn(
    "ios-fill-sheen group flex h-full min-h-[148px] flex-col justify-between rounded-[28px] p-5 transition-all duration-300",
    TONE_FILL[tone],
    onClick &&
      "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
  );
  const body = (
    <>
      <IconWell icon={Icon} size="lg" />
      <div className="mt-4 min-w-0">
        <p className="truncate text-[34px] font-semibold leading-none tracking-tight tabular-nums text-white">{value}</p>
        <p className="mt-2 truncate text-[13px] font-medium text-white/75">{label}</p>
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
