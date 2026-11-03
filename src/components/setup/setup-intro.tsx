"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FADE_UP, IOS_EASE, PILL_SPRING, PRESS } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { LOCALES, localeNameKey, type StaffLocale } from "@/lib/i18n";

const FADE_OUT_MS = 480;

type Props = {
  onDone: () => void;
};

export function SetupIntro({ onDone }: Props) {
  const { t, locale, setLocale, dir } = useLocale();
  const [leaving, setLeaving] = useState(false);
  const reduce = useReducedMotion();

  function proceed() {
    if (leaving) return;
    setLeaving(true);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onDone, still ? 0 : FADE_OUT_MS);
  }

  return (
    <motion.div
      data-testid="setup-intro"
      data-leaving={leaving || undefined}
      variants={FADE_UP}
      initial={reduce ? false : "hidden"}
      animate={leaving ? { opacity: 0, scale: 1.04, filter: "blur(14px)" } : "show"}
      transition={
        leaving
          ? { duration: 0.48, ease: IOS_EASE }
          : { duration: 0.55, ease: IOS_EASE }
      }
      className={cn(
        "mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-16 text-center",
        leaving && "pointer-events-none",
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-[13px]">{t.setupIntroEyebrow}</p>
      <h1 className="liquid-glass-text mt-3 text-balance text-[44px] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl">
        {t.setupIntroTitle}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/60 sm:text-[17px]">
        {t.setupIntroSubtitle}
      </p>

      <div
        role="radiogroup"
        aria-label={t.setupIntroLanguage}
        className="mt-10 grid w-full max-w-md grid-cols-3 gap-2 rounded-[16px] bg-white/[0.08] p-1.5"
      >
        {LOCALES.map((code) => {
          const active = code === locale;
          return (
            <motion.button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLocale(code as StaffLocale)}
              data-testid={`setup-lang-${code}`}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              transition={PRESS.transition}
              className={cn(
                "relative h-10 truncate rounded-[12px] px-2 text-[13px] font-semibold",
                active ? "text-white" : "text-white/55 hover:text-white/85",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="setup-lang-pill"
                  className="absolute inset-0 rounded-[12px] bg-white/[0.2] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_3px_rgba(0,0,0,0.35)]"
                  transition={reduce ? { duration: 0.01 } : PILL_SPRING}
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10">{t[localeNameKey(code)]}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        dir={dir}
        onClick={proceed}
        disabled={leaving}
        aria-busy={leaving || undefined}
        data-testid="setup-continue"
        whileHover={reduce || leaving ? undefined : PRESS.whileHover}
        whileTap={reduce || leaving ? undefined : PRESS.whileTap}
        transition={PRESS.transition}
        className={cn(
          "group relative mt-12 flex h-14 min-w-[220px] items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/20 bg-white/[0.12] px-8 text-[17px] font-semibold tracking-[-0.01em] text-white backdrop-blur-2xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_24px_48px_-24px_rgba(56,189,248,0.55)]",
          "hover:border-white/35 hover:bg-white/[0.18] disabled:opacity-70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]",
        )}
      >
        {t.setupIntroContinue}
        {leaving ? (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent motion-reduce:animate-none"
          />
        ) : (
          <ArrowRight
            className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            strokeWidth={2.2}
            aria-hidden
          />
        )}
      </motion.button>
    </motion.div>
  );
}
