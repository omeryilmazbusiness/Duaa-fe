"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { canSaveChecklist, toChecklistSave, type CafeCheckDraft, type CheckKind } from "@/domain/cafe/checklist";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

type DraftRow = { key: string; id?: string; kind: CheckKind; title: string };

export function CafeChecklistDesk({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeChecklist(workspaceId),
    queryFn: () => kernel.getCafeChecklist(workspaceId),
    staleTime: 15_000,
  });
  const [rows, setRows] = useState<DraftRow[]>([]);

  useEffect(() => {
    if (!query.data) return;
    setRows(
      query.data.items.map((line) => ({
        key: line.id,
        id: line.id,
        kind: line.kind,
        title: line.title,
      })),
    );
  }, [query.data]);

  const save = useMutation({
    mutationFn: (items: CafeCheckDraft[]) => kernel.saveCafeChecklist(workspaceId, items),
    onSuccess: (view) => {
      qc.setQueryData(qk.cafeChecklist(workspaceId), view);
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
      toast.success(t.checkSaved);
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
  const ready = canSaveChecklist({ canEdit: view.canEdit, titles: rows.map((r) => r.title) });

  return (
    <form
      className="space-y-3"
      data-testid="cafe-checklist-desk"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !save.isPending) save.mutate(toChecklistSave(rows));
      }}
    >
      <p className="text-[13px] text-zinc-500">{t.checkHint}</p>
      {rows.length === 0 ? <p className="text-[13px] text-zinc-400">{t.checkEmpty}</p> : null}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <select
              className="h-10 rounded-xl border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
              value={row.kind}
              disabled={!view.canEdit}
              aria-label={t.checkKind}
              onChange={(e) =>
                setRows((cur) => cur.map((item) => (item.key === row.key ? { ...item, kind: e.target.value as CheckKind } : item)))
              }
            >
              <option value="open">{t.checkOpen}</option>
              <option value="close">{t.checkClose}</option>
            </select>
            <input
              className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none"
              value={row.title}
              disabled={!view.canEdit}
              placeholder={t.checkLine}
              onChange={(e) => setRows((cur) => cur.map((item) => (item.key === row.key ? { ...item, title: e.target.value } : item)))}
            />
            {view.canEdit ? (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-rose-600"
                aria-label={t.checkRemove}
                onClick={() => setRows((cur) => cur.filter((item) => item.key !== row.key))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {view.canEdit ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            onClick={() => setRows((cur) => [...cur, { key: `new-${cur.length}-${Date.now()}`, kind: "open", title: "" }])}
          >
            <Plus className="h-4 w-4" />
            {t.checkAdd}
          </button>
          <button
            type="submit"
            disabled={!ready || save.isPending}
            className="ms-auto inline-flex h-10 items-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {save.isPending ? t.checkSaving : t.checkSave}
          </button>
        </div>
      ) : null}
    </form>
  );
}
