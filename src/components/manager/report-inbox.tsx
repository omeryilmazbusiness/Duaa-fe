"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, UserPlus, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isOpenReport, type ReportView } from "@/domain/report/types";
import { memberDisplayName, memberInitials, type MemberView } from "@/domain/work/types";
import { IconWell, ToneCard } from "@/components/manager/white-card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/infrastructure/http/errors";
import { EXPAND_SPRING } from "@/lib/motion";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";
import type { Tone } from "@/theme/tones";

const KIND_TONE: Record<ReportView["kind"], Tone> = {
  breakage: "rose",
  request: "amber",
};

const GLASS_BTN = "bg-white/18 text-white hover:bg-white/28 hover:text-white focus-visible:ring-white/40";

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
  const tone = KIND_TONE[report.kind];
  const assignee = staff.find((m) => m.userId === report.assigneeUserId);

  return (
    <ToneCard tone={tone} className="px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-0.5 text-start"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t.collapseCard : t.expandCard}
        >
          <IconWell icon={Wrench} />
          <span className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{report.title}</p>
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70">
              {kindLabel(report.kind, t)}
              {report.reporterName ? ` · ${report.reporterName}` : ""}
            </p>
          </span>
          {report.status === "assigned" && assignee ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/22 text-[10px] font-bold">
              {memberInitials(assignee)}
            </span>
          ) : null}
          {open ? <ChevronUp className="h-5 w-5 text-white/80" /> : <ChevronDown className="h-5 w-5 text-white/80" />}
        </button>
        {!picking && report.status !== "resolved" ? (
          <div className="flex items-center gap-1">
            {canAssign ? (
              <Button
                size="icon-sm"
                disabled={busy || staff.length === 0}
                aria-label={t.assignTask}
                className={GLASS_BTN}
                onClick={() => {
                  setAssigneeUserId(staff[0]?.userId ?? "");
                  setPicking(true);
                  setOpen(true);
                }}
              >
                <UserPlus />
              </Button>
            ) : null}
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={busy}
              aria-label={t.markDone}
              className={GLASS_BTN}
              onClick={() => onAct("resolve")}
            >
              <Check />
            </Button>
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
            className="space-y-3 border-t border-white/15 px-1.5 py-3"
          >
              {report.detail ? <p className="text-[13px] text-white/90">{report.detail}</p> : null}
              <p className="text-[12px] text-white/70">
                {report.reporterName}
                {report.reporterDepartment ? ` · ${report.reporterDepartment}` : ""}
                {report.status === "assigned" && assignee
                  ? ` · ${t.assigned}: ${memberDisplayName(assignee)}`
                  : ""}
              </p>
              {picking ? (
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 flex-1 rounded-xl border-0 bg-white/20 px-2 text-sm text-white outline-none"
                    value={assigneeUserId}
                    onChange={(e) => setAssigneeUserId(e.target.value)}
                  >
                    {staff.map((m) => (
                      <option key={m.userId} value={m.userId} className="text-zinc-900">
                        {memberDisplayName(m)}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="icon-sm"
                    disabled={busy || !assigneeUserId}
                    aria-label={t.assignTask}
                    className={GLASS_BTN}
                    onClick={() => onAct("assign", { assigneeUserId })}
                  >
                    <Check />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t.cancel} className={GLASS_BTN} onClick={() => setPicking(false)}>
                    <X />
                  </Button>
                </div>
              ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ToneCard>
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
    return <p className="px-1 text-sm text-zinc-900/50">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {open.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          staff={personnel}
          canAssign={canAssign}
          busy={act.isPending}
          onAct={(action, extra) =>
            act.mutate({ id: report.id, action, assigneeUserId: extra?.assigneeUserId })
          }
        />
      ))}
    </div>
  );
}
