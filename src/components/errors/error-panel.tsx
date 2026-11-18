"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isChunkLoadError, reloadOnceForChunkError } from "@/components/errors/chunk-error";
import { useLocale } from "@/providers/locale-provider";

/** Calm recovery screen for a failed render. Stale-chunk failures reload the page once by themselves. */
export function ErrorPanel({ error, onRetry, fullScreen = false }: { error: unknown; onRetry: () => void; fullScreen?: boolean }) {
  const { t } = useLocale();
  const stale = isChunkLoadError(error);

  useEffect(() => {
    if (stale) reloadOnceForChunkError();
  }, [stale]);

  return (
    <div
      role="alert"
      data-testid="error-panel"
      className={
        fullScreen
          ? "ios-settings flex min-h-dvh flex-col items-center justify-center px-6 text-center"
          : "mx-auto flex max-w-md flex-col items-center rounded-3xl border border-zinc-200/70 bg-white px-6 py-10 text-center shadow-sm"
      }
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.8} aria-hidden />
      </span>
      <h2 className="mt-4 text-[17px] font-semibold text-zinc-900">{t.errorTitle}</h2>
      <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-zinc-500">{t.errorBody}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onRetry}>{t.errorRetry}</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t.errorReload}
        </Button>
      </div>
    </div>
  );
}
