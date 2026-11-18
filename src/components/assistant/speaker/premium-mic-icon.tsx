import { cn } from "@/lib/utils";

interface PremiumMicIconProps {
  className?: string;
  variant?: "light" | "dark";
}

/** Clean studio mic used by the AI speaker. */
export function PremiumMicIcon({ className, variant = "light" }: PremiumMicIconProps) {
  const color = variant === "light" ? "#ffffff" : "#18181b";
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("h-7 w-7", className)} aria-hidden>
      <rect x="9.25" y="3" width="5.5" height="10.25" rx="2.75" fill={color} />
      <path d="M6 11.25a6 6 0 0 0 12 0" stroke={color} strokeWidth="1.65" strokeLinecap="round" />
      <path d="M12 17.25v2.25" stroke={color} strokeWidth="1.65" strokeLinecap="round" />
      <path d="M8.75 19.5h6.5" stroke={color} strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

function MicSparkle({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("absolute", className)} aria-hidden>
      <path d="M12 2.5 13.1 6.9 17.5 8 13.1 9.1 12 13.5 10.9 9.1 6.5 8 10.9 6.9Z" fill={variant === "light" ? "#ffffff" : "#6366f1"} />
    </svg>
  );
}

export function PremiumMicWithSparkle({ className, variant = "light" }: PremiumMicIconProps) {
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <PremiumMicIcon variant={variant} className="h-[1.85rem] w-[1.85rem]" />
      <MicSparkle variant={variant} className="-right-1 -top-1 h-3.5 w-3.5 opacity-95" />
    </span>
  );
}
