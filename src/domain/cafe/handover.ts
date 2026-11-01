export interface CafeHandoverRef {
  id: string;
  title: string;
}

export interface CafeHandover {
  id: string;
  businessDate: string;
  timezone: string;
  fromShift: string;
  toShift: string;
  status: "" | "open" | "accepted";
  note: string;
  shifts: string[];
  tasks: CafeHandoverRef[];
  recoveries: CafeHandoverRef[];
  breakdowns: CafeHandoverRef[];
  openedBy: string;
  openedByName: string;
  acceptedBy: string;
  acceptedByName: string;
  persisted: boolean;
  canWrite: boolean;
  openedAt: string;
  acceptedAt: string;
  updatedAt: string;
}

export interface CafeHandoverOpen {
  businessDate?: string;
  fromShift?: string;
  toShift?: string;
  note?: string;
}

export function canOpenHandover(view: Pick<CafeHandover, "canWrite" | "persisted">): boolean {
  return view.canWrite && !view.persisted;
}

export function canAcceptHandover(view: Pick<CafeHandover, "canWrite" | "persisted" | "status">): boolean {
  return view.canWrite && view.persisted && view.status === "open";
}

export function toHandoverOpen(input: { businessDate: string; fromShift: string; toShift: string; note: string }): CafeHandoverOpen {
  return {
    businessDate: input.businessDate.trim() || undefined,
    fromShift: input.fromShift.trim() || undefined,
    toShift: input.toShift.trim() || undefined,
    note: input.note.trim() || undefined,
  };
}
