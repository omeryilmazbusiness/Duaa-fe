import { PremiumMicIcon, PremiumMicWithSparkle } from "@/components/assistant/speaker/premium-mic-icon";
import { SonicWaveform } from "@/components/assistant/speaker/sonic-waveform";
import { cn } from "@/lib/utils";

export function VoiceMicHero({
  isListening,
  isBusy,
  amplitude = 0,
  onClick,
  ariaLabel,
  disabled,
  className,
}: {
  isListening: boolean;
  /** Thinking or speaking: the wave moves on its own. */
  isBusy?: boolean;
  amplitude?: number;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative flex h-[6rem] w-full items-center justify-center", className)}>
      <div className="absolute inset-x-4 inset-y-2">
        <SonicWaveform amplitude={isListening ? amplitude : 0} simulate={!isListening && isBusy} active className="rounded-2xl" />
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={isListening}
        data-testid="ai-speaker-mic"
        className={cn(
          "relative z-10 flex h-[5.1rem] w-[5.1rem] items-center justify-center rounded-full",
          "bg-white/92 backdrop-blur-md transition-all duration-300 ease-out active:scale-[0.96]",
          "shadow-[0_10px_32px_-10px_rgba(79,70,229,0.25),inset_0_1px_0_rgba(255,255,255,0.98)]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25",
          "disabled:cursor-not-allowed disabled:opacity-60",
          isListening && "shadow-[0_8px_28px_-6px_rgba(99,102,241,0.3),inset_0_0_16px_rgba(99,102,241,0.05)]",
        )}
      >
        {isListening ? <PremiumMicIcon variant="dark" className="h-8 w-8 scale-105" /> : <PremiumMicWithSparkle variant="dark" />}
      </button>
    </div>
  );
}
