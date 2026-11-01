import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_SOFT, TONE_SOLID, type Tone } from "@/theme/tones";

export function WidgetCard({
  title,
  icon: Icon,
  tone = "sky",
  count,
  onOpen,
  openLabel,
  actions,
  children,
  className,
  testId,
}: {
  title: string;
  icon: LucideIcon;
  tone?: Tone;
  count?: number;
  onOpen?: () => void;
  openLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-[28px] border border-zinc-200/60 bg-white p-5 shadow-[0_10px_34px_-24px_rgba(15,23,42,0.35)] sm:p-6",
        className,
      )}
      data-testid={testId}
    >
      <header className="mb-4 flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_SOLID[tone])}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <h2 className="min-w-0 truncate text-[17px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        {count !== undefined ? (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", TONE_SOFT[tone])}>{count}</span>
        ) : null}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {actions}
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label={openLabel ?? title}
              title={openLabel}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
