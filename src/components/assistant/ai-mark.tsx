import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small gradient orb with a sparkle — the DUAA AI identity. */
export function AiMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("duaa-ai-orb inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", className)}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
    </span>
  );
}
