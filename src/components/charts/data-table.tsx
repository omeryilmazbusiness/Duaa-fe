import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<Row> {
  key: string;
  header: string;
  /** Numbers read best right-aligned (left in RTL, which `text-end` follows). */
  align?: "start" | "end";
  render: (row: Row) => ReactNode;
}

/** Plain semantic table: rules and alignment, no zebra stripes. */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  emptyText,
  testId,
}: {
  caption: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  emptyText: string;
  testId?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500" data-testid={testId ? `${testId}-empty` : undefined}>
        {emptyText}
      </p>
    );
  }
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[320px] border-collapse text-[13px]" data-testid={testId}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-2 py-2 font-semibold", col.align === "end" ? "text-end" : "text-start")}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="text-zinc-800">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-2 py-2.5 align-middle", col.align === "end" ? "text-end tabular-nums" : "text-start")}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
