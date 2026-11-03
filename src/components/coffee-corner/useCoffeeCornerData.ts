"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { coffeeCornerFromLive, type CoffeeCornerSnapshot } from "@/domain/coffee-corner";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";

/**
 * Live Coffee Corner streams via existing ops ports.
 *
 * SRP: this hook only fetches + composes. Mapping lives in `domain/coffee-corner`.
 * React Query keys match Feedback / Reports / Waste so mutations elsewhere
 * invalidate this widget automatically.
 */

const STALE_MS = 15_000;
const CLOCK_MS = 60_000;

export interface UseCoffeeCornerDataOptions {
  /** Pause polling while the widget is off-screen. */
  paused?: boolean;
  /** Poll interval while visible. Default matches cafe staleTime (15s). */
  intervalMs?: number;
}

export function useCoffeeCornerData(
  workspaceId: string,
  { paused = false, intervalMs = STALE_MS }: UseCoffeeCornerDataOptions = {},
): CoffeeCornerSnapshot {
  const poll = paused ? false : intervalMs;
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Keep waiting / open-age minutes honest between network polls.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setNowMs(Date.now());
    }, CLOCK_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const reports = useQuery({
    queryKey: qk.reports(workspaceId),
    queryFn: () => kernel.listReports(workspaceId),
    staleTime: STALE_MS,
    refetchInterval: poll,
    refetchIntervalInBackground: false,
  });

  const voices = useQuery({
    queryKey: qk.cafeVoices(workspaceId),
    queryFn: () => kernel.listCafeVoices(workspaceId),
    staleTime: STALE_MS,
    refetchInterval: poll,
    refetchIntervalInBackground: false,
  });

  const waste = useQuery({
    queryKey: qk.cafeWaste(workspaceId),
    queryFn: () => kernel.getCafeWaste(workspaceId),
    staleTime: STALE_MS,
    refetchInterval: poll,
    refetchIntervalInBackground: false,
  });

  return useMemo(
    () =>
      coffeeCornerFromLive({
        reports: reports.data,
        voices: voices.data,
        waste: waste.data,
        nowMs,
      }),
    [reports.data, voices.data, waste.data, nowMs],
  );
}
