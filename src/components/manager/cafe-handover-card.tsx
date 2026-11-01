"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { canAcceptHandover, canOpenHandover, toHandoverOpen, type CafeHandoverRef } from "@/domain/cafe/handover";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export function CafeHandoverCard({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeHandover(workspaceId),
    queryFn: () => kernel.getCafeHandover(workspaceId),
    staleTime: 15_000,
  });
  const [fromShift, setFromShift] = useState("");
  const [toShift, setToShift] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!query.data) return;
    setFromShift(query.data.fromShift);
    setToShift(query.data.toShift);
    setNote(query.data.note);
  }, [query.data]);

  const open = useMutation({
    mutationFn: () =>
      kernel.openCafeHandover(
        workspaceId,
        toHandoverOpen({
          businessDate: query.data?.businessDate ?? "",
          fromShift,
          toShift,
          note,
        }),
      ),
    onSuccess: (view) => {
      qc.setQueryData(qk.cafeHandover(workspaceId), view);
      toast.success(t.handoverOpened);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const accept = useMutation({
    mutationFn: () => kernel.acceptCafeHandover(workspaceId, query.data?.id ?? ""),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.cafeHandover(workspaceId) });
      toast.success(t.handoverAccepted);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-[14px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.handoverLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button type="button" className="text-[14px] font-medium text-[#007AFF]" onClick={() => void query.refetch()}>
        {t.handoverLoadError}
      </button>
    );
  }

  const view = query.data;
  const outgoing = canOpenHandover(view);
  const incoming = canAcceptHandover(view);
  const busy = open.isPending || accept.isPending;

  return (
    <form
      className="space-y-3"
      data-testid="cafe-handover"
      onSubmit={(e) => {
        e.preventDefault();
        if (outgoing && !busy) open.mutate();
        else if (incoming && !busy) accept.mutate();
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] leading-relaxed text-zinc-500">{t.handoverHint}</p>
        <p className="shrink-0 text-[12px] font-medium text-zinc-400">{view.businessDate || t.handoverEmpty}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Pulse label={t.handoverTasks} count={view.tasks.length} />
        <Pulse label={t.handoverRecoveries} count={view.recoveries.length} />
        <Pulse label={t.handoverBreakdowns} count={view.breakdowns.length} />
      </div>

      {view.tasks.length + view.recoveries.length + view.breakdowns.length === 0 ? (
        <p className="text-[13px] text-zinc-400">{t.handoverQuiet}</p>
      ) : (
        <>
          <RefList title={t.handoverTasks} items={view.tasks} />
          <RefList title={t.handoverRecoveries} items={view.recoveries} />
          <RefList title={t.handoverBreakdowns} items={view.breakdowns} />
        </>
      )}

      {view.shifts.length > 0 && outgoing ? (
        <div className="grid grid-cols-2 gap-2">
          <ShiftSelect label={t.handoverFrom} value={fromShift} options={view.shifts} none={t.handoverNoShift} onChange={setFromShift} />
          <ShiftSelect label={t.handoverTo} value={toShift} options={view.shifts} none={t.handoverNoShift} onChange={setToShift} />
        </div>
      ) : view.shifts.length === 0 && outgoing ? (
        <p className="text-[12px] text-zinc-400">{t.handoverNoShiftRecorded}</p>
      ) : view.fromShift || view.toShift ? (
        <p className="text-[13px] text-zinc-600">
          {[view.fromShift, view.toShift].filter(Boolean).join(" → ")}
        </p>
      ) : null}

      {outgoing ? (
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-zinc-500">{t.handoverNote}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl bg-zinc-50 px-3 py-2.5 text-[15px] leading-relaxed text-zinc-950 outline-none ring-1 ring-zinc-200 placeholder:text-zinc-400"
          />
        </label>
      ) : view.note ? (
        <p className="text-[13px] leading-relaxed text-zinc-600">{view.note}</p>
      ) : null}

      {view.openedByName && view.persisted ? (
        <p className="text-[12px] text-zinc-400">
          {view.openedByName}
          {view.acceptedByName ? ` → ${view.acceptedByName}` : ""}
        </p>
      ) : null}

      {outgoing || incoming ? (
        <button
          type="submit"
          disabled={busy}
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-[15px] font-semibold text-white disabled:opacity-35",
          )}
        >
          {busy ? t.handoverSaving : incoming ? t.handoverAccept : t.handoverOpen}
        </button>
      ) : null}
    </form>
  );
}

function Pulse({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-2xl bg-zinc-50/80 px-3 py-2.5">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="text-[20px] font-semibold tabular-nums text-zinc-950">{count}</p>
    </div>
  );
}

function RefList({ title, items }: { title: string; items: CafeHandoverRef[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 6);
  return (
    <div>
      <p className="mb-1 text-[12px] font-medium text-zinc-500">{title}</p>
      <ul className="space-y-1">
        {shown.map((item) => (
          <li key={item.id} className="truncate text-[13px] text-zinc-800">
            {item.title || item.id}
          </li>
        ))}
        {items.length > shown.length ? (
          <li className="text-[12px] text-zinc-400">+{items.length - shown.length}</li>
        ) : null}
      </ul>
    </div>
  );
}

function ShiftSelect({
  label,
  value,
  options,
  none,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  none: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl bg-zinc-50 px-3 text-[15px] outline-none ring-1 ring-zinc-200"
      >
        <option value="">{none}</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
