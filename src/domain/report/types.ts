export type ReportKind = "breakage" | "request";
export type ReportStatus = "open" | "assigned" | "resolved";
export type ReportAction = "assign" | "resolve";

export interface ReportView {
  id: string;
  kind: ReportKind;
  title: string;
  detail: string;
  status: ReportStatus;
  reporterUserId: string;
  reporterName: string;
  reporterDepartment?: string;
  assigneeUserId?: string;
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export function isOpenReport(report: ReportView): boolean {
  return report.status === "open" || report.status === "assigned";
}
