/**
 * Management-shell screen ids. Guest-pro FE navigation is driven by these ids.
 * Cafe, hotel and supply catalogs pick a subset; the shell never hardcodes a vertical.
 */
export const MANAGER_TABS = [
  "today",
  "ops",
  "dashboard",
  "overview",
  "guests",
  "reservations",
  "rooms",
  "requests",
  "feedback",
  "team",
  "tasks_staff",
  "tasks_detail",
  "routines",
  "live_chat",
] as const;

export type ManagerTab = (typeof MANAGER_TABS)[number];

export function isManagerTab(value: string): value is ManagerTab {
  return (MANAGER_TABS as readonly string[]).includes(value);
}

export function parseManagerTabs(raw: readonly string[]): ManagerTab[] {
  return raw.filter(isManagerTab);
}
