export const CAFE_AREAS = ["indoor", "garden", "counter", "table", "other"] as const;
export type CafeArea = (typeof CAFE_AREAS)[number];

export const CAFE_POS_STATUSES = ["unknown", "none", "named"] as const;
export type CafePOSStatus = (typeof CAFE_POS_STATUSES)[number];

export const CAFE_CURRENCIES = ["IQD", "USD", "TRY", "EUR", "GBP"] as const;
export const CAFE_TIMEZONES = [
  "Asia/Baghdad",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Europe/London",
  "UTC",
] as const;

export const CAFE_MISSING = ["name", "timezone", "currency", "branch", "qr_site", "sla"] as const;
export type CafeMissing = (typeof CAFE_MISSING)[number];

export interface CafeBranch {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

export interface CafeQRSite {
  id: string;
  branchId: string;
  label: string;
  area: CafeArea;
  active: boolean;
}

export interface CafeShift {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface CafeSLA {
  ackMinutes: number;
  resolveMinutes: number;
  afterHoursMessage: string;
  compensationLimit: number;
  compensationCurrency: string;
}

export interface CafeCompleteness {
  readyForReviews: boolean;
  hasName: boolean;
  hasTimezone: boolean;
  hasCurrency: boolean;
  hasBranch: boolean;
  hasQRSite: boolean;
  hasSLA: boolean;
  missing: CafeMissing[];
}

export interface CafeDefinition {
  workspaceId: string;
  displayName: string;
  currency: string;
  timezone: string;
  posVendor: string;
  posStatus: CafePOSStatus;
  branches: CafeBranch[];
  qrSites: CafeQRSite[];
  shifts: CafeShift[];
  sla: CafeSLA;
  completeness: CafeCompleteness;
  canWrite: boolean;
  persisted: boolean;
  updatedAt: string;
}

export type CafeDefinitionSave = Omit<CafeDefinition, "completeness" | "canWrite" | "persisted" | "updatedAt" | "workspaceId">;

export function emptySLA(): CafeSLA {
  return { ackMinutes: 0, resolveMinutes: 0, afterHoursMessage: "", compensationLimit: 0, compensationCurrency: "" };
}

export function newBranch(): CafeBranch {
  return { id: crypto.randomUUID(), name: "", address: "", active: true };
}

export function newQRSite(branchId = ""): CafeQRSite {
  return { id: crypto.randomUUID(), branchId, label: "", area: "other", active: true };
}

export function newShift(): CafeShift {
  return { id: crypto.randomUUID(), name: "", start: "08:00", end: "16:00" };
}

export function isCafeArea(value: string): value is CafeArea {
  return (CAFE_AREAS as readonly string[]).includes(value);
}

export function isCafePOSStatus(value: string): value is CafePOSStatus {
  return (CAFE_POS_STATUSES as readonly string[]).includes(value);
}

export function toCafeSave(def: CafeDefinition): CafeDefinitionSave {
  return {
    displayName: def.displayName.trim(),
    currency: def.currency.trim().toUpperCase(),
    timezone: def.timezone.trim(),
    posVendor: def.posStatus === "named" ? def.posVendor.trim() : "",
    posStatus: def.posStatus,
    branches: def.branches.map((b) => ({ ...b, name: b.name.trim(), address: b.address.trim() })),
    qrSites: def.qrSites.map((q) => ({ ...q, label: q.label.trim() })),
    shifts: def.shifts.map((s) => ({ ...s, name: s.name.trim() })),
    sla: {
      ...def.sla,
      afterHoursMessage: def.sla.afterHoursMessage.trim(),
      compensationCurrency: def.sla.compensationCurrency.trim().toUpperCase(),
    },
  };
}

export function completenessHint(missing: readonly string[]): string {
  return missing.join(",");
}

export function previewCompleteness(def: Pick<CafeDefinition, "displayName" | "timezone" | "currency" | "branches" | "qrSites" | "sla">): CafeCompleteness {
  const hasName = def.displayName.trim().length > 0;
  const hasTimezone = def.timezone.trim().length > 0;
  const hasCurrency = /^[A-Z]{3}$/.test(def.currency.trim().toUpperCase());
  const hasBranch = def.branches.some((b) => b.active && b.name.trim());
  const hasQRSite = def.qrSites.some((q) => q.active && q.label.trim());
  const hasSLA = def.sla.ackMinutes > 0;
  const flags: Record<CafeMissing, boolean> = {
    name: hasName,
    timezone: hasTimezone,
    currency: hasCurrency,
    branch: hasBranch,
    qr_site: hasQRSite,
    sla: hasSLA,
  };
  const missing = CAFE_MISSING.filter((key) => !flags[key]);
  return {
    readyForReviews: missing.length === 0,
    hasName,
    hasTimezone,
    hasCurrency,
    hasBranch,
    hasQRSite,
    hasSLA,
    missing,
  };
}
