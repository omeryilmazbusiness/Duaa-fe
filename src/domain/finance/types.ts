export type ApprovalStatus = "open" | "approved" | "rejected" | "needs_evidence";
export type ApprovalAction = "approve" | "reject" | "request_evidence";

export interface CashCloseView {
  id: string;
  businessDate: string;
  countedAmount: number;
  expectedAmount?: number;
  variance: number;
  note?: string;
  closedAt: string;
}

export interface SpendApproval {
  id: string;
  title: string;
  supplier: string;
  amount: number;
  currency: string;
  evidence?: string;
  version: number;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

export function isPendingApproval(pack: { status: string }): boolean {
  return pack.status === "open" || pack.status === "needs_evidence";
}

/** Approve still does not pay. It only needs an open pack with evidence. */
export function canApprove(pack: { status: string; evidence?: string }): boolean {
  return pack.status === "open" && Boolean(pack.evidence?.trim());
}

/** Whole IQD only. Never parse a float into money. */
export function parseIQD(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d+$/.test(value)) return null;
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) return null;
  return amount;
}
