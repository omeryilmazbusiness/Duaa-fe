"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { buildPopupModels } from "./popupModels";
import type { Severity } from "./types";
import { useCoffeeCornerData } from "./useCoffeeCornerData";
import { useInView } from "./useInView";

/**
 * The R3F canvas + drei + three (~800 kB) and the 3D model are loaded only
 * on the client, only once the widget approaches the viewport.
 */
const CoffeeCornerScene = dynamic(() => import("./CoffeeCornerScene"), { ssr: false, loading: () => null });

const DOT: Record<Severity, string> = {
  ok: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]",
  warn: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]",
  critical: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.95)]",
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Layout shell for "Today's focus" → sits directly under the Decide.Act card.
 * Owns layout + lazy mounting only; data lives in the hook, drawing in the scene.
 */
export function TodaysFocusWidget({ className }: { className?: string }) {
  const { t } = useLocale();
  const { ref, seen, visible } = useInView<HTMLElement>();
  const snapshot = useCoffeeCornerData({ paused: !visible });
  const models = useMemo(() => buildPopupModels(snapshot, t), [snapshot, t]);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  // Resolved after mount so SSR and hydration markup agree.
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(hasWebGL()), []);

  const chips = [models.stock, models.requests, models.faults];

  return (
    <section
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#07090f] text-white",
        "shadow-[0_24px_56px_-28px_rgba(2,6,23,0.9)]",
        className,
      )}
      aria-label={t.ccTitle}
      data-testid="coffee-corner-widget"
    >
      {/* Cinematic backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 decide-ai-cinema opacity-80" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_58%,rgba(251,191,36,0.10),transparent_70%)]"
      />

      {/* Header */}
      <header className="relative flex items-center gap-3 px-5 pt-4 sm:px-6">
        <h3 className="text-[13px] font-semibold tracking-[0.14em] text-white/80">{t.ccTitle}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/90 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 cc-ping-dot" aria-hidden />
          {t.ccLive}
        </span>
        <span className="ms-auto hidden text-[11px] font-medium text-white/35 [@media(pointer:fine)]:inline">{t.ccHint}</span>
      </header>

      {/* Stage */}
      <div className="relative h-[300px] sm:h-[380px] lg:h-[420px]">
        {seen && webgl ? <CoffeeCornerScene models={models} onReady={onReady} /> : null}

        {/* Loading veil */}
        <div
          aria-hidden={ready}
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700",
            ready || !webgl ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <span className="h-9 w-9 animate-spin rounded-full border border-white/10 border-t-emerald-300/80" />
            <span className="text-[11px] font-medium tracking-wide text-white/40">{t.ccLoading}</span>
          </div>
        </div>
      </div>

      {/* Glanceable legend — also the accessible / no-WebGL representation of the 3 streams */}
      <ul className="relative flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-6" aria-live="polite">
        {chips.map((m) => (
          <li
            key={m.title}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] backdrop-blur-md [box-shadow:inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", DOT[m.severity])} aria-hidden />
            <span className="font-medium text-white/55">{m.title}</span>
            <span className="font-semibold text-white">{m.value}</span>
            {m.caption ? <span className="hidden text-white/40 sm:inline">{m.caption}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
