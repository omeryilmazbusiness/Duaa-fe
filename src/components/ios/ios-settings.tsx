"use client";

import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_GLYPH, type Tone } from "@/theme/tones";

export function IosScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("ios-settings w-full pb-12", className)} data-testid="ios-settings">
      {children}
    </div>
  );
}

export function IosLargeTitle({ children }: { children: ReactNode }) {
  return <h1 className="px-1 text-[34px] font-bold leading-tight tracking-tight text-zinc-950">{children}</h1>;
}

export function IosNavBar({
  backLabel,
  onBack,
}: {
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="-ms-1.5 inline-flex min-h-11 items-center text-[16px] font-medium text-[#007AFF] lg:hidden"
      data-testid="ios-settings-back"
    >
      <ChevronLeft className="h-6 w-6 rtl:-scale-x-100" strokeWidth={2.4} aria-hidden />
      {backLabel}
    </button>
  );
}

export function IosGroup({
  header,
  footer,
  children,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {header ? (
        <h2 className="px-4 pb-1.5 text-[12.5px] font-medium uppercase tracking-wide text-zinc-500">{header}</h2>
      ) : null}
      <div className="divide-y divide-zinc-100 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/60">
        {children}
      </div>
      {footer ? <p className="px-4 pt-1.5 text-[12px] leading-relaxed text-zinc-500">{footer}</p> : null}
    </section>
  );
}

const GLYPH_SIZE = {
  sm: { box: "h-[30px] w-[30px] rounded-[8px]", icon: "h-[17px] w-[17px]" },
  lg: { box: "h-16 w-16 rounded-[20px]", icon: "h-8 w-8" },
} as const;

export function IosGlyph({
  icon: Icon,
  tone,
  size = "sm",
  className,
}: {
  icon: LucideIcon;
  tone: Tone;
  size?: keyof typeof GLYPH_SIZE;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-gradient-to-b text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        TONE_GLYPH[tone],
        GLYPH_SIZE[size].box,
        className,
      )}
      aria-hidden
    >
      <Icon className={GLYPH_SIZE[size].icon} strokeWidth={2.2} />
    </span>
  );
}

interface IosRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  chevron?: boolean;
  destructive?: boolean;
  active?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  testId?: string;
}

export function IosRow({
  icon,
  title,
  subtitle,
  value,
  chevron,
  destructive,
  active,
  onClick,
  trailing,
  testId,
}: IosRowProps) {
  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[15px] font-medium",
            destructive ? "text-ios-red" : active ? "text-white" : "text-zinc-950",
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className={cn("block truncate text-[12px]", active ? "text-white/80" : "text-zinc-500")}>{subtitle}</span>
        ) : null}
      </span>
      {value ? (
        <span className={cn("max-w-[40%] truncate text-[13px]", active ? "text-white/80" : "text-zinc-500")}>{value}</span>
      ) : null}
      {trailing}
      {chevron ? (
        <ChevronRight
          className={cn("h-[18px] w-[18px] shrink-0 rtl:-scale-x-100", active ? "text-white/80" : "text-zinc-300")}
          strokeWidth={2.4}
          aria-hidden
        />
      ) : null}
    </>
  );
  const rowClass = cn(
    "flex w-full min-h-[56px] items-center gap-3 px-3.5 py-2 text-start outline-none transition-colors",
    onClick && !active && "hover:bg-zinc-50 active:bg-zinc-100",
    onClick && "focus-visible:bg-sky-50",
    active && "bg-[#007AFF] text-white",
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} data-testid={testId} aria-current={active ? "page" : undefined} className={rowClass}>
        {body}
      </button>
    );
  }
  return (
    <div data-testid={testId} className={rowClass}>
      {body}
    </div>
  );
}

/** Kept for call sites; groups already divide rows. */
export function IosSeparator(_props?: { inset?: boolean }) {
  return null;
}

export function IosSwitch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-testid="ios-switch"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-[#34C759]" : "bg-[#E9E9EA]",
        disabled && "opacity-40",
      )}
    >
      <span
        className={cn(
          "ios-switch-knob absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white transition-transform duration-200",
          checked ? "translate-x-[22px] rtl:-translate-x-[22px]" : "translate-x-[2px] rtl:-translate-x-[2px]",
        )}
      />
    </button>
  );
}

export function IosField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full bg-transparent text-[17px] text-zinc-950 outline-none placeholder:text-zinc-400",
        className,
      )}
    />
  );
}

export function IosLinkButton({
  children,
  onClick,
  destructive,
  disabled,
  testId,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  testId?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        "w-full py-3.5 text-center text-[16px] font-medium disabled:opacity-40",
        destructive ? "text-[#FF3B30]" : "text-[#007AFF]",
      )}
    >
      {children}
    </button>
  );
}
