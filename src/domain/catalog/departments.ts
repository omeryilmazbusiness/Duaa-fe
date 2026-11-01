export type Department = string;

export const CAFE_DEPARTMENTS = [
  "KITCHEN",
  "BAR",
  "SERVICE",
  "CLEANING",
  "MAINTENANCE",
  "FINANCIAL_ACCOUNTING",
] as const;

export const HOTEL_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RECEPTION",
  "RESTAURANT",
  "KITCHEN",
  "FINANCIAL_ACCOUNTING",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "SPA_GYM",
] as const;

export const SUPPLY_DEPARTMENTS = ["SALES", "WAREHOUSE", "DELIVERY", "FINANCIAL_ACCOUNTING"] as const;

export function containsDept(list: readonly string[], dept: string): boolean {
  return list.includes(dept);
}
