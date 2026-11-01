"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, UserPlus, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isOpenReport, type ReportView } from "@/domain/report/types";
import { memberDisplayName, memberInitials, type MemberView } from "@/domain/work/types";
import { ApiError } from "@/infrastructure/http/errors";
import { EXPAND_SPRING } from "@/lib/motion";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT, TONE_SOFT } from "@/theme/tones";

function kindLabel(kind: ReportView["kind"], t: { reportBreakage: string; reportRequest: string }) {
  return kind === "request" ? t.reportRequest : t.reportBreakage;
}

function ReportCard({
  report,
  staff,
  canAssign,
  busy,
  onAct,
}: {
  report: ReportView;
  staff: MemberView[];
  canAssign: boolean;
  busy: boolean;
  onAct: (action: "assign" | "resolve", extra?: { assigneeUserId: string }) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [assigneeUserId, setAssigneeUserId] = useState(staff[0]?.userId ?? "");
  useEffect(() => {
    if (report.status !== "open") setPicking(false);
  }, [report.status]);
  const assignee = staff.find((m) => m.userId === report.assigneeUserId);
  const tone = report.kind === "request" ? "amber" : "rose";

  return (
    <article className="rounded-[20px] px-2 py-2.5 transition-colors hover:bg-zinc-50/90">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t.collapseCard : t.expandCard}
        >
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", TONE_GRADIENT[tone])}>
            <Wrench className="h-5 w-5 text-white" strokeWidth={2.1} />
          </span>
          <span className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-zinc-950">{report.title}</p>
            <p className="truncate text-[11px] font-medium text-zinc-400">
              {kindLabel(report.kind, t)}
              {report.reporterName ? ` · ${report.reporterName}` : ""}
            </p>
          </span>
          {report.status === "assigned" && assignee ? (
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold", TONE_SOFT[tone])}>
              {memberInitials(assignee)}
            </span>
          ) : null}
          {open ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
        </button>
        {!picking && report.status !== "resolved" ? (
          <div className="flex items-center gap-1">
            {canAssign ? (
              <button
                type="button"
                disabled={busy || staff.length === 0}
                aria-label={t.assignTask}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 disabled:opacity-40"
                onClick={() => {
                  setAssigneeUserId(staff[0]?.userId ?? "");
                  setPicking(true);
                  setOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              aria-label={t.markDone}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 disabled:opacity-40"
              onClick={() => onAct("resolve")}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={EXPAND_SPRING}
            className="space-y-3 px-1.5 py-3"
          >
            {report.detail ? <p className="text-[13px] text-zinc-600">{report.detail}</p> : null}
            <p className="text-[12px] text-zinc-400">
              {report.reporterName}
              {report.reporterDepartment ? ` · ${report.reporterDepartment}` : ""}
              {report.status === "assigned" && assignee ? ` · ${t.assigned}: ${memberDisplayName(assignee)}` : ""}
            </p>
            {picking ? (
              <div className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-xl bg-zinc-50 px-2 text-sm outline-none ring-1 ring-zinc-200"
                  value={assigneeUserId}
                  onChange={(e) => setAssigneeUserId(e.target.value)}
                >
                  {staff.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {memberDisplayName(m)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || !assigneeUserId}
                  aria-label={t.assignTask}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white disabled:opacity-40"
                  onClick={() => onAct("assign", { assigneeUserId })}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button type="button" aria-label={t.cancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100" onClick={() => setPicking(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

export function ReportInbox({
  workspaceId,
  canAssign,
  emptyLabel,
}: {
  workspaceId: string;
  canAssign: boolean;
  emptyLabel: string;
}) {
  const qc = useQueryClient();
  const reports = useQuery({
    queryKey: qk.reports(workspaceId),
    queryFn: () => kernel.listReports(workspaceId),
  });
  const staff = useQuery({
    queryKey: qk.staff(workspaceId),
    queryFn: () => kernel.listPersonnel(workspaceId),
    enabled: canAssign,
  });
  const personnel = (staff.data ?? []).filter((m) => m.role === "personnel" && m.isActive);
  const open = (reports.data ?? []).filter(isOpenReport);

  const act = useMutation({
    mutationFn: (input: { id: string; action: "assign" | "resolve"; assigneeUserId?: string }) =>
      kernel.actOnReport(workspaceId, input.id, {
        action: input.action,
        assigneeUserId: input.assigneeUserId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reports(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.tasks(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (open.length === 0) {
    return <p className="py-6 text-center text-[14px] text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-1">
      {open.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          staff={personnel}
          canAssign={canAssign}
          busy={act.isPending}
          onAct={(action, extra) => act.mutate({ id: report.id, action, assigneeUserId: extra?.assigneeUserId })}
        />
      ))}
    </div>
  );
}
