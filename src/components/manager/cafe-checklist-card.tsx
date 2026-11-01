"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CafeCheckLine } from "@/domain/cafe/checklist";
import { ApiError } from "@/infrastructure/http/errors";
import { cn } from "@/lib/utils";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

export function CafeChecklistCard({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeChecklist(workspaceId),
    queryFn: () => kernel.getCafeChecklist(workspaceId),
    staleTime: 15_000,
  });
  const toggle = useMutation({
    mutationFn: (itemId: string) => kernel.toggleCafeChecklist(workspaceId, { businessDate: query.data?.businessDate, itemId }),
    onSuccess: (view) => {
      qc.setQueryData(qk.cafeChecklist(workspaceId), view);
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-[14px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.checkLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button type="button" className="text-[14px] font-medium text-[#007AFF]" onClick={() => void query.refetch()}>
        {t.checkLoadError}
      </button>
    );
  }

  const view = query.data;
  const open = view.items.filter((line) => line.kind === "open" && line.active);
  const close = view.items.filter((line) => line.kind === "close" && line.active);

  return (
    <div className="space-y-4" data-testid="cafe-checklist">
      <p className="text-[13px] text-zinc-500">
        {view.businessDate}
        {view.hasList ? ` · ${view.open.done}/${view.open.total} ${t.checkOpen} · ${view.close.done}/${view.close.total} ${t.checkClose}` : ""}
      </p>
      {!view.hasList ? <p className="text-[13px] text-zinc-400">{t.checkEmpty}</p> : null}
      <CheckGroup title={t.checkOpen} lines={open} canCheck={view.canCheck} busy={toggle.isPending} onToggle={(id) => toggle.mutate(id)} />
      <CheckGroup title={t.checkClose} lines={close} canCheck={view.canCheck} busy={toggle.isPending} onToggle={(id) => toggle.mutate(id)} />
    </div>
  );
}

function CheckGroup({
  title,
  lines,
  canCheck,
  busy,
  onToggle,
}: {
  title: string;
  lines: CafeCheckLine[];
  canCheck: boolean;
  busy: boolean;
  onToggle: (id: string) => void;
}) {
  if (lines.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{title}</h3>
      <ul className="space-y-1.5">
        {lines.map((line) => (
          <li key={line.id}>
            <button
              type="button"
              disabled={!canCheck || busy}
              data-testid={`cafe-check-${line.id}`}
              onClick={() => onToggle(line.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-start transition-colors",
                line.done ? "bg-emerald-50/80" : "bg-zinc-50/80 hover:bg-zinc-100/80",
                (!canCheck || busy) && "opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                  line.done ? "bg-emerald-500 text-white" : "bg-white text-zinc-300 ring-1 ring-zinc-200",
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[14px] font-medium", line.done ? "text-emerald-900" : "text-zinc-900")}>{line.title}</span>
                {line.done && line.doneByName ? <span className="block truncate text-[11px] text-zinc-500">{line.doneByName}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
