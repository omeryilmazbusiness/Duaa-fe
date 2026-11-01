import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_FILL, type Tone } from "@/theme/tones";

export function WhiteCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("ios-glass rounded-[24px] p-4 sm:p-5", className)}>{children}</div>;
}

export function ToneCard({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("ios-fill-sheen rounded-[24px] p-3.5", TONE_FILL[tone], className)}>{children}</div>;
}

export function IconWell({
  icon: Icon,
  className,
  size = "md",
}: {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "h-11 w-11 rounded-[15px]" : size === "sm" ? "h-8 w-8 rounded-[11px]" : "h-10 w-10 rounded-[13px]";
  const glyph = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-white/22 text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
        box,
        className,
      )}
    >
      <Icon className={glyph} strokeWidth={1.7} aria-hidden />
    </span>
  );
}

export function SoftPulseKpi({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  tone: Tone;
  icon: LucideIcon;
}) {
  return (
    <ToneCard tone={tone} className="flex flex-col items-center gap-2 px-2 py-3.5">
      <IconWell icon={Icon} size="lg" />
      <p className="font-sans text-[24px] font-semibold leading-none lining-nums tabular-nums tracking-tight sm:text-[28px]">
        {value}
      </p>
      <p className="max-w-full truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/75">{label}</p>
    </ToneCard>
  );
}
