import { cn } from "@/lib/utils";

export function DuaMark({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-serif tracking-tight",
        invert ? "bg-white text-zinc-950" : "bg-zinc-950 text-white",
        className,
      )}
      aria-hidden
    >
      D
    </div>
  );
}
