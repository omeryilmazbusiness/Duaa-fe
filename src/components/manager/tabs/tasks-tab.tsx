"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, TimerOff, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { SessionPayload } from "@/domain/session/types";
import { memberDisplayName } from "@/domain/work/types";
import { IconWell, ToneCard, WhiteCard } from "@/components/manager/white-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTimeRange, localDateTimeValue, toRfc3339 } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";

export function TasksTab({ session, perspective }: { session: SessionPayload; perspective: "staff" | "detail" }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const staff = useQuery({ queryKey: qk.staff(wid), queryFn: () => kernel.listPersonnel(wid) });
  const tasks = useQuery({ queryKey: qk.tasks(wid), queryFn: () => kernel.listTasks(wid) });
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of staff.data ?? []) map.set(m.userId, memberDisplayName(m));
    return map;
  }, [staff.data]);

  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    scheduledStartAt: localDateTimeValue(now),
    scheduledEndAt: localDateTimeValue(later),
  });

  const create = useMutation({
    mutationFn: () =>
      kernel.createTask(wid, {
        title: form.title,
        description: form.description,
        assigneeUserId: form.assigneeUserId,
        scheduledStartAt: toRfc3339(form.scheduledStartAt),
        scheduledEndAt: toRfc3339(form.scheduledEndAt),
      }),
    onSuccess: () => {
      toast.success("Task assigned");
      qc.invalidateQueries({ queryKey: qk.tasks(wid) });
      qc.invalidateQueries({ queryKey: qk.brief(wid) });
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-[26px] text-zinc-900 sm:text-2xl">
          {perspective === "staff" ? t.tabTasksStaff : t.tabTasksDetail}
        </h2>
        <Button size="icon" onClick={() => setOpen((v) => !v)} aria-label={t.assignTask}>
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
            <Input placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white sm:col-span-2" />
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
              <Input type="datetime-local" value={form.scheduledStartAt} onChange={(e) => setForm({ ...form, scheduledStartAt: e.target.value })} className="bg-white" />
              <Input type="datetime-local" value={form.scheduledEndAt} onChange={(e) => setForm({ ...form, scheduledEndAt: e.target.value })} className="bg-white" />
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
      {(tasks.data ?? []).length === 0 ? (
        <WhiteCard>
          <p className="text-sm text-zinc-900/50">{t.noTasks}</p>
        </WhiteCard>
      ) : (
        <ul className="space-y-2">
          {(tasks.data ?? []).map((task) => (
            <li key={task.id}>
              <ToneCard
                tone={task.isOverdue && task.status !== "completed" ? "rose" : task.status === "completed" ? "emerald" : "sky"}
                className="flex items-start justify-between gap-3 px-3 py-3"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconWell icon={TimerOff} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-[12px] text-white/70">
                      {names.get(task.assigneeUserId) ?? "Staff"} · {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt, locale)}
                    </p>
                  </div>
                </div>
                {task.isOverdue && task.status !== "completed" ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80" title={t.overdue} aria-label={t.overdue}>
                    {t.overdue}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-white/65">{task.status}</span>
                )}
              </ToneCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
