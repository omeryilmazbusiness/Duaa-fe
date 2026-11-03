"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { buildPopupModels } from "./popupModels";
import { useCoffeeCornerData } from "./useCoffeeCornerData";
import { useInView } from "./useInView";

/**
 * The R3F canvas + drei + three (~800 kB) and the 3D model are loaded only
 * on the client, only once the widget approaches the viewport.
 */
const CoffeeCornerScene = dynamic(() => import("./CoffeeCornerScene"), { ssr: false, loading: () => null });

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
 *
 * Deliberately chrome-free: no card, border, title or backdrop. It only owns
 * the stage size, lazy mounting and a screen-reader summary. Data lives in the
 * hook, drawing in the scene, glass in the popup.
 */
export function TodaysFocusWidget({
  workspaceId,
  className,
}: {
  workspaceId: string;
  className?: string;
}) {
  const { t } = useLocale();
  const { ref, seen, visible } = useInView<HTMLDivElement>();
  const snapshot = useCoffeeCornerData(workspaceId, { paused: !visible });
  const models = useMemo(() => buildPopupModels(snapshot, t), [snapshot, t]);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  // Resolved after mount so SSR and hydration markup agree.
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(hasWebGL()), []);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t.ccTitle}
      data-testid="coffee-corner-widget"
      className={cn("relative w-full", webgl ? "h-[320px] sm:h-[400px] lg:h-[440px]" : "h-0", className)}
    >
      {seen && webgl ? (
        <div className={cn("absolute inset-0 transition-opacity duration-700 ease-out", ready ? "opacity-100" : "opacity-0")}>
          <CoffeeCornerScene models={models} onReady={onReady} />
        </div>
      ) : null}

      {/* Screen-reader / no-WebGL representation of the three live streams. */}
      <ul className="sr-only" aria-live="polite">
        {[models.stock, models.requests, models.faults].map((m) => (
          <li key={m.title}>
            {m.title}: {m.value} {m.caption ?? ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
