"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { canSaveIntake, toIntakeSave } from "@/domain/cafe/intake";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export function CafeIntakeCard({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeIntake(workspaceId),
    queryFn: () => kernel.getCafeIntake(workspaceId),
    staleTime: 15_000,
  });
  const [closeNote, setCloseNote] = useState("");
  const [wasteNote, setWasteNote] = useState("");
  const [incidentNote, setIncidentNote] = useState("");
  const [shiftName, setShiftName] = useState("");

  useEffect(() => {
    if (!query.data) return;
    setCloseNote(query.data.closeNote);
    setWasteNote(query.data.wasteNote);
    setIncidentNote(query.data.incidentNote);
    setShiftName(query.data.shiftName);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      kernel.saveCafeIntake(
        workspaceId,
        toIntakeSave({
          businessDate: query.data?.businessDate ?? "",
          shiftName,
          closeNote,
          wasteNote,
          incidentNote,
        }),
      ),
    onSuccess: (view) => {
      qc.setQueryData(qk.cafeIntake(workspaceId), view);
      toast.success(t.intakeSaved);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-[14px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.intakeLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button type="button" className="text-[14px] font-medium text-[#007AFF]" onClick={() => void query.refetch()}>
        {t.intakeLoadError}
      </button>
    );
  }

  const view = query.data;
  const ready = canSaveIntake({ closeNote, wasteNote, incidentNote, canWrite: view.canWrite });

  return (
    <form
      className="space-y-3"
      data-testid="cafe-intake"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !save.isPending) save.mutate();
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] leading-relaxed text-zinc-500">{t.intakeHint}</p>
        <p className="shrink-0 text-[12px] font-medium text-zinc-400">{view.businessDate || t.intakeEmpty}</p>
      </div>

      {view.shifts.length > 0 ? (
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-zinc-500">{t.intakeShift}</span>
          <select
            value={shiftName}
            disabled={!view.canWrite}
            onChange={(e) => setShiftName(e.target.value)}
            className="h-11 w-full rounded-xl bg-zinc-50 px-3 text-[15px] outline-none ring-1 ring-zinc-200"
          >
            <option value="">{t.intakeNoShift}</option>
            {view.shifts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-[12px] text-zinc-400">{t.intakeNoShiftRecorded}</p>
      )}

      <NoteField label={t.intakeClose} value={closeNote} onChange={setCloseNote} disabled={!view.canWrite} />
      <NoteField label={t.intakeWaste} value={wasteNote} onChange={setWasteNote} disabled={!view.canWrite} />
      <NoteField label={t.intakeIncident} value={incidentNote} onChange={setIncidentNote} disabled={!view.canWrite} />

      {view.authorName && view.persisted ? (
        <p className="text-[12px] text-zinc-400">{view.authorName}</p>
      ) : null}

      <button
        type="submit"
        disabled={!ready || save.isPending}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-[15px] font-semibold text-white disabled:opacity-35",
        )}
      >
        {save.isPending ? t.intakeSaving : t.intakeSave}
      </button>
    </form>
  );
}

function NoteField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-zinc-500">{label}</span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-xl bg-zinc-50 px-3 py-2.5 text-[15px] leading-relaxed text-zinc-950 outline-none ring-1 ring-zinc-200 placeholder:text-zinc-400 disabled:opacity-60"
      />
    </label>
  );
}
