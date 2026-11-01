"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, UserPlus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { canActRecovery, canCompensate } from "@/domain/cafe/recovery";
import type { CafeVoice, RecoveryAction } from "@/domain/cafe/qr";
import { memberDisplayName, type MemberView } from "@/domain/work/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_SOFT } from "@/theme/tones";

export function VoiceInbox({ workspaceId, canRecover }: { workspaceId: string; canRecover: boolean }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeVoices(workspaceId),
    queryFn: () => kernel.listCafeVoices(workspaceId),
    staleTime: 15_000,
  });
  const staff = useQuery({
    queryKey: qk.staff(workspaceId),
    queryFn: () => kernel.listPersonnel(workspaceId),
    enabled: canRecover,
  });
  const act = useMutation({
    mutationFn: (input: { id: string; action: RecoveryAction; assigneeUserId?: string; note?: string; amount?: number }) =>
      kernel.actOnCafeVoice(workspaceId, input.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cafeVoices(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.tasks(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });
  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-[14px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.voiceLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button type="button" className="text-[14px] font-medium text-[#007AFF]" onClick={() => void query.refetch()}>
        {t.voiceLoadError}
      </button>
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return <p className="py-6 text-center text-[14px] text-zinc-500">{t.voiceEmpty}</p>;
  }
  const personnel = (staff.data ?? []).filter((m) => m.role === "personnel" && m.isActive);
  return (
    <ul className="-mx-1 divide-y divide-zinc-100">
      {items.map((v) => (
        <VoiceRow
          key={v.id}
          voice={v}
          staff={personnel}
          canRecover={canRecover}
          busy={act.isPending}
          onAct={(action, extra) => act.mutate({ id: v.id, action, ...extra })}
        />
      ))}
    </ul>
  );
}

function VoiceRow({
  voice,
  staff,
  canRecover,
  busy,
  onAct,
}: {
  voice: CafeVoice;
  staff: MemberView[];
  canRecover: boolean;
  busy: boolean;
  onAct: (action: RecoveryAction, extra?: { assigneeUserId?: string; amount?: number; note?: string }) => void;
}) {
  const { t } = useLocale();
  const [picking, setPicking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [assigneeUserId, setAssigneeUserId] = useState(staff[0]?.userId ?? "");
  const [amount, setAmount] = useState("");
  const kind =
    voice.kind === "review" ? `${voice.rating}/5` : voice.kind === "complaint" ? t.voiceKindComplaint : t.voiceKindRequest;
  const assignee = staff.find((m) => m.userId === voice.assigneeUserId);
  const open = canRecover && canActRecovery(voice);

  return (
    <li className="px-4 py-3" data-testid="cafe-voice-row">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-zinc-950">{voice.label || t.qrDesk}</p>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            {kind}
            {voice.recoveryStatus === "assigned" && assignee ? ` · ${memberDisplayName(assignee)}` : ""}
            {voice.compensationAmount > 0 ? ` · ${voice.compensationAmount} ${voice.compensationCurrency}` : ""}
            {voice.recoveryStatus === "closed" ? ` · ${t.recoveryClosed}` : ""}
          </p>
        </div>
        <span className={cn("shrink-0 text-[13px] font-semibold", voice.unhappy ? "text-rose-600" : "text-zinc-500")}>
          {voice.lateAck || voice.lateResolve ? t.recoveryLate : voice.unhappy ? t.recoveryOpen : null}
        </span>
      </div>
      {voice.comment ? <p className="mt-1 text-[14px] text-zinc-600">{voice.comment}</p> : null}
      {voice.lateAck || voice.lateResolve ? (
        <p className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", TONE_SOFT.rose)}>
          {voice.lateResolve ? t.recoveryLateResolve : t.recoveryLateAck}
        </p>
      ) : null}

      {open ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {picking ? (
            <>
              <select
                className="h-10 flex-1 rounded-xl bg-zinc-50 px-3 text-[14px] outline-none ring-1 ring-zinc-200"
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
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-950 px-3 text-[13px] font-semibold text-white disabled:opacity-40"
                onClick={() => onAct("assign", { assigneeUserId })}
              >
                <Check className="h-4 w-4" />
                {t.recoveryAssign}
              </button>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100" onClick={() => setPicking(false)}>
                <X className="h-4 w-4" />
              </button>
            </>
          ) : paying ? (
            <>
              <input
                type="number"
                min={1}
                max={voice.compensationLimit}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${voice.compensationLimit} ${voice.compensationCurrency}`}
                className="h-10 w-28 rounded-xl bg-zinc-50 px-3 text-[14px] outline-none ring-1 ring-zinc-200"
              />
              <button
                type="button"
                disabled={busy || !amount}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-950 px-3 text-[13px] font-semibold text-white disabled:opacity-40"
                onClick={() => onAct("compensate", { amount: Number(amount) })}
              >
                {t.recoveryCompensate}
              </button>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100" onClick={() => setPaying(false)}>
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy || staff.length === 0}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-[13px] font-semibold text-zinc-800 disabled:opacity-40"
                onClick={() => {
                  setAssigneeUserId(staff[0]?.userId ?? "");
                  setPicking(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                {t.recoveryAssign}
              </button>
              {canCompensate(voice) ? (
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-[13px] font-semibold text-zinc-800"
                  onClick={() => setPaying(true)}
                >
                  <Wallet className="h-4 w-4" />
                  {t.recoveryCompensate}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[13px] font-semibold text-white"
                onClick={() => onAct("close")}
              >
                <Check className="h-4 w-4" />
                {t.recoveryClose}
              </button>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}
