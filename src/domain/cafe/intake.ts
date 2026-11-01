export interface CafeIntake {
  id: string;
  businessDate: string;
  timezone: string;
  shiftName: string;
  shifts: string[];
  closeNote: string;
  wasteNote: string;
  incidentNote: string;
  authorUserId: string;
  authorName: string;
  persisted: boolean;
  canWrite: boolean;
  updatedAt: string;
}

export interface CafeIntakeSave {
  businessDate?: string;
  shiftName?: string;
  closeNote: string;
  wasteNote: string;
  incidentNote: string;
}

export function canSaveIntake(input: { closeNote: string; wasteNote: string; incidentNote: string; canWrite: boolean }): boolean {
  if (!input.canWrite) return false;
  return input.closeNote.trim().length >= 2 || input.wasteNote.trim().length >= 2 || input.incidentNote.trim().length >= 2;
}

export function toIntakeSave(input: { businessDate: string; shiftName: string; closeNote: string; wasteNote: string; incidentNote: string }): CafeIntakeSave {
  return {
    businessDate: input.businessDate.trim() || undefined,
    shiftName: input.shiftName.trim() || undefined,
    closeNote: input.closeNote.trim(),
    wasteNote: input.wasteNote.trim(),
    incidentNote: input.incidentNote.trim(),
  };
}
