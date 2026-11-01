"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Repeat, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SessionPayload } from "@/domain/session/types";
import { memberDisplayName } from "@/domain/work/types";
import { IconWell, ToneCard, WhiteCard } from "@/components/manager/white-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";

export function RoutinesTab({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const staff = useQuery({ queryKey: qk.staff(wid), queryFn: () => kernel.listPersonnel(wid) });
  const routines = useQuery({ queryKey: qk.routines(wid), queryFn: () => kernel.listRoutines(wid) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    startTime: "08:00",
    endTime: "09:00",
  });

  const create = useMutation({
    mutationFn: () => kernel.createRoutine(wid, form),
    onSuccess: () => {
      toast.success("Routine saved");
      qc.invalidateQueries({ queryKey: qk.routines(wid) });
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[26px] text-zinc-900 sm:text-2xl">{t.tabRoutines}</h2>
        <Button size="icon" onClick={() => setOpen((v) => !v)} aria-label={t.createRoutine}>
          <Plus />
        </Button>
      </div>
      {open ? (
        <WhiteCard>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Input placeholder={t.title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white sm:col-span-2" required />
            <select
              className="h-11 rounded-2xl border border-sand-line bg-white px-3 text-sm"
              value={form.assigneeUserId}
              onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}
              required
            >
              <option value="">{t.assignee}</option>
              {(staff.data ?? []).map((m) => (
                <option key={m.userId} value={m.userId}>
                  {memberDisplayName(m)}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="bg-white" />
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="bg-white" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" size="icon" disabled={create.isPending} aria-label={t.save}>
                <Check />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t.cancel}>
                <X />
              </Button>
            </div>
          </form>
        </WhiteCard>
      ) : null}
      {(routines.data ?? []).length === 0 ? (
        <WhiteCard>
          <p className="text-sm text-zinc-900/50">{t.noRoutines}</p>
        </WhiteCard>
      ) : (
        <ul className="space-y-2">
          {(routines.data ?? []).map((r) => (
            <li key={r.id}>
              <ToneCard tone="amber" className="flex items-center gap-2.5 px-3 py-3">
                <IconWell icon={Repeat} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-[12px] font-mono text-white/70">
                    {r.startTime} – {r.endTime}
                  </p>
                </div>
              </ToneCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
