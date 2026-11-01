import type { DecisionAction, DecisionStatus } from "./types";

const ALL: readonly DecisionAction[] = ["acknowledge", "assign", "resolve"];

/** Mirrors backend executive.AllowedActions — keep this table in the domain, not the UI. */
export function allowedActions(status: DecisionStatus | null | undefined): DecisionAction[] {
  const current: DecisionStatus = status ?? "open";
  if (current === "resolved") return [];
  return [...ALL];
}

export function can(status: DecisionStatus | null | undefined, action: DecisionAction): boolean {
  return allowedActions(status).includes(action);
}
