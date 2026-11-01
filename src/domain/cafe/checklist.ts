export type CheckKind = "open" | "close";

export interface CafeCheckLine {
  id: string;
  kind: CheckKind;
  title: string;
  sort: number;
  active: boolean;
  done: boolean;
  doneAt: string;
  doneBy: string;
  doneByName: string;
}

export interface CafeCheckPulse {
  total: number;
  done: number;
  remaining: number;
}

export interface CafeChecklist {
  businessDate: string;
  timezone: string;
  items: CafeCheckLine[];
  open: CafeCheckPulse;
  close: CafeCheckPulse;
  hasList: boolean;
  canEdit: boolean;
  canCheck: boolean;
}

export interface CafeCheckDraft {
  id?: string;
  kind: CheckKind;
  title: string;
  active?: boolean;
}

export function isCheckKind(value: string): value is CheckKind {
  return value === "open" || value === "close";
}

export function remainingChecks(view: Pick<CafeChecklist, "open" | "close">): number {
  return Math.max(0, view.open.remaining) + Math.max(0, view.close.remaining);
}

export function canSaveChecklist(input: { canEdit: boolean; titles: string[] }): boolean {
  if (!input.canEdit) return false;
  return input.titles.every((title) => title.trim() === "" || title.trim().length >= 2);
}

export function toChecklistSave(lines: CafeCheckDraft[]): CafeCheckDraft[] {
  return lines
    .map((line) => ({
      id: line.id?.trim() || undefined,
      kind: line.kind,
      title: line.title.trim(),
      active: line.active,
    }))
    .filter((line) => line.title.length >= 2 && isCheckKind(line.kind));
}
