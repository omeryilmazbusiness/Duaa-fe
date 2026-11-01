import { cn } from "@/lib/utils";

/** Shared Duaa canvas: white ground, liquid-glass child surfaces. */
export function PageShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("ios-canvas min-h-dvh text-zinc-900", className)}>{children}</div>;
}

export function ScreenMain({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <main className={cn("mx-auto max-w-2xl space-y-4 px-4 py-5 pb-8 lg:max-w-none lg:px-8 lg:py-6", className)}>
      {children}
    </main>
  );
}

export function AppHeader({
  start,
  end,
  hairline = false,
  className,
}: {
  start: React.ReactNode;
  end?: React.ReactNode;
  hairline?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-14 bg-white/45 backdrop-blur-2xl",
        hairline && "border-b border-white/50",
        className,
      )}
    >
      <div className="flex h-full items-center gap-2 px-3 lg:px-8">
        {start}
        {end ? <div className="ms-auto flex shrink-0 items-center gap-1.5">{end}</div> : null}
      </div>
    </header>
  );
}
