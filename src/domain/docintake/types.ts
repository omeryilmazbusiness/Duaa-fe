export type DocumentStatus = "analyzed" | "fallback_structured";
export type DocumentSourceKind = "csv" | "json" | "txt" | "opera_report";

export interface DocumentMetric {
  label: string;
  value: string;
}

export interface SimplifiedSummary {
  headline: string;
  keyMetrics: DocumentMetric[];
  takeaways: string[];
  risks: string[];
  actions: string[];
  rowCount: number;
  columnCount: number;
  missingCells: number;
  dataCoveragePct: number;
}

export interface WorkspaceDocument {
  id: string;
  workspaceId: string;
  businessDate: string;
  fileName: string;
  sourceKind: DocumentSourceKind;
  status: DocumentStatus;
  aiUsed: boolean;
  dataCoveragePct: number;
  summary: SimplifiedSummary;
  replayed?: boolean;
  createdAt: string;
}

export interface DocumentIngestInput {
  businessDate?: string;
  fileName: string;
  sourceKind?: string;
  content: string;
  locale?: string;
}
