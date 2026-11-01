import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_GRADIENT, type Tone } from "@/theme/tones";

export function ActionTile({
  label,
  icon: Icon,
  tone = "sky",
  onClick,
  testId,
}: {
  label: string;
  icon: LucideIcon;
  tone?: Tone;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      data-testid={testId}
      className="group flex w-[88px] flex-col items-center gap-2 rounded-2xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
    >
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-[22px] ring-1 ring-inset ring-white/25 transition-all duration-200 group-hover:-translate-y-0.5 group-active:scale-95",
          TONE_GRADIENT[tone],
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={1.9} />
      </span>
      <span className="w-full truncate text-center text-xs font-semibold text-zinc-700">{label}</span>
    </button>
  );
}
