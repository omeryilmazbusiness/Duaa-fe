import { previewCompleteness, type CafeDefinition } from "./definition";

export const CAFE_SETUP_STEPS = ["cafe", "branches", "tables", "sla", "ai"] as const;
export type CafeSetupStepKey = (typeof CAFE_SETUP_STEPS)[number];
export type CafeSetupStepStatus = "pending" | "done" | "skipped";

export interface CafeSetupStep {
  key: CafeSetupStepKey;
  status: CafeSetupStepStatus;
  required: boolean;
}

export interface CafeSetupOverview {
  steps: CafeSetupStep[];
  totalSteps: number;
  doneCount: number;
  /** Reviews gate — first four steps. AI may still be pending/skipped. */
  workshopReady: boolean;
  completed: boolean;
}

/** Required for ReadyForReviews. AI is optional like Wodi channels. */
export const REQUIRED_SETUP_STEPS: readonly CafeSetupStepKey[] = ["cafe", "branches", "tables", "sla"];

export function setupPath(slug: string): string {
  return `/${slug}/setup`;
}

export function aiSkipStorageKey(workspaceId: string): string {
  return `duaa.setup.ai.skip.${workspaceId}`;
}

export function readAiSkipped(workspaceId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(aiSkipStorageKey(workspaceId)) === "1";
  } catch {
    return false;
  }
}

export function writeAiSkipped(workspaceId: string, skipped: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (skipped) window.sessionStorage.setItem(aiSkipStorageKey(workspaceId), "1");
    else window.sessionStorage.removeItem(aiSkipStorageKey(workspaceId));
  } catch {
    /* ignore quota */
  }
}

export function laterStorageKey(workspaceId: string): string {
  return `duaa.setup.later.${workspaceId}`;
}

export function readSetupLater(workspaceId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(laterStorageKey(workspaceId)) === "1";
  } catch {
    return false;
  }
}

export function writeSetupLater(workspaceId: string, later: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (later) window.sessionStorage.setItem(laterStorageKey(workspaceId), "1");
    else window.sessionStorage.removeItem(laterStorageKey(workspaceId));
  } catch {
    /* ignore */
  }
}

function statusFor(
  key: CafeSetupStepKey,
  def: CafeDefinition,
  aiConfigured: boolean,
  aiSkipped: boolean,
): CafeSetupStepStatus {
  const c = previewCompleteness(def);
  switch (key) {
    case "cafe":
      return c.hasName && c.hasTimezone && c.hasCurrency ? "done" : "pending";
    case "branches":
      return c.hasBranch ? "done" : "pending";
    case "tables":
      return c.hasQRSite ? "done" : "pending";
    case "sla":
      return c.hasSLA ? "done" : "pending";
    case "ai":
      if (aiConfigured) return "done";
      if (aiSkipped) return "skipped";
      return "pending";
  }
}

export function buildSetupOverview(
  def: CafeDefinition,
  opts: { aiConfigured: boolean; aiSkipped: boolean },
): CafeSetupOverview {
  const steps: CafeSetupStep[] = CAFE_SETUP_STEPS.map((key) => ({
    key,
    status: statusFor(key, def, opts.aiConfigured, opts.aiSkipped),
    required: key !== "ai",
  }));
  const doneCount = steps.filter((s) => s.status === "done").length;
  const workshopReady = previewCompleteness(def).readyForReviews;
  const aiSettled = opts.aiConfigured || opts.aiSkipped;
  return {
    steps,
    totalSteps: steps.length,
    doneCount,
    workshopReady,
    completed: workshopReady && aiSettled,
  };
}

export function stepOrder(o: CafeSetupOverview): CafeSetupStepKey[] {
  return o.steps.map((s) => s.key);
}

export function statusOf(o: CafeSetupOverview, key: CafeSetupStepKey): CafeSetupStepStatus {
  return o.steps.find((s) => s.key === key)?.status ?? "pending";
}

/** First incomplete required step, else AI if still open, else summary. */
export function initialStep(o: CafeSetupOverview): CafeSetupStepKey | null {
  for (const key of REQUIRED_SETUP_STEPS) {
    if (statusOf(o, key) === "pending") return key;
  }
  if (statusOf(o, "ai") === "pending") return "ai";
  return null;
}

export function neighborStep(
  o: CafeSetupOverview,
  step: CafeSetupStepKey,
  dir: -1 | 1,
): CafeSetupStepKey | null {
  const order = stepOrder(o);
  const i = order.indexOf(step);
  if (i < 0) return null;
  return order[i + dir] ?? null;
}

/** Later steps stay closed until every earlier required step is done. */
export function isStepLocked(o: CafeSetupOverview, key: CafeSetupStepKey): boolean {
  const order = stepOrder(o);
  const i = order.indexOf(key);
  for (let j = 0; j < i; j++) {
    const prev = order[j]!;
    if (REQUIRED_SETUP_STEPS.includes(prev) && statusOf(o, prev) === "pending") return true;
  }
  return false;
}

export function cafeStepValid(def: Pick<CafeDefinition, "displayName" | "timezone" | "currency">): boolean {
  const c = previewCompleteness({
    displayName: def.displayName,
    timezone: def.timezone,
    currency: def.currency,
    branches: [],
    qrSites: [],
    sla: { ackMinutes: 0, resolveMinutes: 0, afterHoursMessage: "", compensationLimit: 0, compensationCurrency: "" },
  });
  return c.hasName && c.hasTimezone && c.hasCurrency;
}

export function branchesStepValid(def: Pick<CafeDefinition, "branches">): boolean {
  return def.branches.some((b) => b.active && b.name.trim().length >= 2);
}

export function tablesStepValid(def: Pick<CafeDefinition, "qrSites">): boolean {
  return def.qrSites.some((q) => q.active && q.label.trim().length >= 1);
}

export function slaStepValid(def: Pick<CafeDefinition, "sla">): boolean {
  return def.sla.ackMinutes > 0;
}
