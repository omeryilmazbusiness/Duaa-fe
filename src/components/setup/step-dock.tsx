"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, Check, Clock3, MapPin, Minus, QrCode, Sparkles, type LucideIcon } from "lucide-react";
import type { CafeSetupStep, CafeSetupStepKey } from "@/domain/cafe/setup";
import { PILL_SPRING, PRESS_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import type { Messages } from "@/lib/i18n";

export const STEP_ICONS: Record<CafeSetupStepKey, LucideIcon> = {
  cafe: Building2,
  branches: MapPin,
  tables: QrCode,
  sla: Clock3,
  ai: Sparkles,
};

const STEP_LABEL: Record<CafeSetupStepKey, keyof Messages> = {
  cafe: "setupStepCafe",
  branches: "setupStepBranches",
  tables: "setupStepTables",
  sla: "setupStepSLA",
  ai: "setupStepAI",
};

type Props = {
  steps: CafeSetupStep[];
  active: CafeSetupStepKey | null;
  onSelect: (step: CafeSetupStepKey) => void;
  locked: (step: CafeSetupStepKey) => boolean;
};

export function StepDock({ steps, active, onSelect, locked }: Props) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const settled = steps.filter((s) => s.status !== "pending").length;
  const fill = steps.length > 1 ? Math.min(settled, steps.length - 1) / (steps.length - 1) : 0;

  return (
    <nav aria-label={t.setupDockAria} className="relative mx-auto w-full max-w-[640px]">
      <div className="absolute inset-x-[8%] top-[22px] h-[2px] overflow-hidden rounded-full bg-white/[0.12]" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-300 via-white to-violet-200 rtl:ms-auto"
          initial={false}
          animate={{ width: `${fill * 100}%` }}
          transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 180, damping: 28, mass: 0.85 }}
        />
      </div>
      <ol className="relative grid grid-cols-5">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.key];
          const isActive = step.key === active;
          const disabled = locked(step.key);
          return (
            <li key={step.key} className="flex justify-center">
              <motion.button
                type="button"
                onClick={() => onSelect(step.key)}
                disabled={disabled}
                aria-current={isActive ? "step" : undefined}
                data-testid={`setup-dock-${step.key}`}
                whileHover={reduce || disabled ? undefined : PRESS_SOFT.whileHover}
                whileTap={reduce || disabled ? undefined : PRESS_SOFT.whileTap}
                transition={PRESS_SOFT.transition}
                className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full",
                    step.status === "done" && "bg-white text-zinc-950 shadow-[0_8px_18px_-10px_rgba(15,23,42,0.8)]",
                    step.status !== "done" &&
                      "bg-[#151a31] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_0.5px_rgba(255,255,255,0.16)]",
                    step.status === "skipped" && "text-white/40",
                    step.status === "pending" && "text-white/55",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="setup-dock-ring"
                      className="absolute -inset-[3px] rounded-full ring-[3px] ring-sky-300/55"
                      transition={reduce ? { duration: 0.01 } : PILL_SPRING}
                      aria-hidden
                    />
                  ) : null}
                  {step.status === "done" ? (
                    <Check className="relative z-10 h-[18px] w-[18px]" strokeWidth={2.5} />
                  ) : step.status === "skipped" ? (
                    <Minus className="relative z-10 h-[18px] w-[18px]" strokeWidth={2.25} />
                  ) : (
                    <Icon className={cn("relative z-10 h-[18px] w-[18px]", isActive && "text-white")} strokeWidth={1.9} />
                  )}
                </span>
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-[10px] font-medium tabular-nums text-white/40">{i + 1}</span>
                  <span
                    className={cn(
                      "text-[12px] font-semibold tracking-[-0.01em] transition-colors duration-300",
                      isActive ? "text-white" : "text-white/55",
                    )}
                  >
                    {t[STEP_LABEL[step.key]]}
                  </span>
                </span>
              </motion.button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
