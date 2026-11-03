"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Star, UserPlus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { canActRecovery, canCompensate } from "@/domain/cafe/recovery";
import type { CafeVoice, RecoveryAction } from "@/domain/cafe/qr";
import { memberDisplayName, type MemberView } from "@/domain/work/types";
import { ApiError } from "@/infrastructure/http/errors";
import { EXPAND_SPRING, FADE_UP, PRESS_SOFT, STAGGER_PARENT, TAP_SPRING } from "@/lib/motion";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT, TONE_SOFT, type Tone } from "@/theme/tones";

function voiceTone(voice: CafeVoice): Tone {
  if (voice.lateAck || voice.lateResolve) return "rose";
  if (voice.kind === "complaint") return "rose";
  if (voice.kind === "request") return "sky";
  if (voice.unhappy) return "amber";
  return "emerald";
}

export function VoiceInbox({ workspaceId, canRecover }: { workspaceId: string; canRecover: boolean }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
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
      <div className="flex items-center gap-2 py-3 text-[15px] text-zinc-500" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t.voiceLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button
        type="button"
        className="min-h-11 py-2 text-[15px] font-medium text-[var(--ios-blue)]"
        onClick={() => void query.refetch()}
      >
        {t.voiceLoadError}
      </button>
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return <p className="py-8 text-center text-[15px] text-zinc-500">{t.voiceEmpty}</p>;
  }
  const personnel = (staff.data ?? []).filter((m) => m.role === "personnel" && m.isActive);
  return (
    <motion.ul
      className="space-y-2.5"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={STAGGER_PARENT}
    >
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
    </motion.ul>
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
  const reduce = useReducedMotion();
  const [picking, setPicking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [assigneeUserId, setAssigneeUserId] = useState(staff[0]?.userId ?? "");
  const [amount, setAmount] = useState("");
  const tone = voiceTone(voice);
  const kind =
    voice.kind === "review"
      ? `${voice.rating}/5`
      : voice.kind === "complaint"
        ? t.voiceKindComplaint
        : t.voiceKindRequest;
  const assignee = staff.find((m) => m.userId === voice.assigneeUserId);
  const open = canRecover && canActRecovery(voice);
  const late = voice.lateAck || voice.lateResolve;
  const statusLabel = late ? t.recoveryLate : voice.unhappy ? t.recoveryOpen : null;

  return (
    <motion.li
      className="rounded-[18px] bg-white/90 px-3 py-3 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)] ring-1 ring-zinc-900/5"
      data-testid="cafe-voice-row"
      variants={FADE_UP}
      layout
      {...(reduce ? {} : PRESS_SOFT)}
    >
      <div className="flex items-start gap-3">
        <motion.span
          className={cn("mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", TONE_GRADIENT[tone])}
          aria-hidden
          whileHover={reduce ? undefined : { rotate: [-2, 2, 0] }}
          transition={TAP_SPRING}
        >
          {voice.kind === "review" ? (
            <Star className="h-5 w-5" strokeWidth={2.1} fill="currentColor" />
          ) : voice.kind === "complaint" ? (
            <span className="text-[15px] font-bold">!</span>
          ) : (
            <span className="text-[15px] font-bold">?</span>
          )}
        </motion.span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-zinc-950">{voice.label || t.qrDesk}</p>
              <p className="mt-0.5 text-[13px] text-zinc-500">
                {kind}
                {voice.recoveryStatus === "assigned" && assignee ? ` · ${memberDisplayName(assignee)}` : ""}
                {voice.compensationAmount > 0 ? ` · ${voice.compensationAmount} ${voice.compensationCurrency}` : ""}
                {voice.recoveryStatus === "closed" ? ` · ${t.recoveryClosed}` : ""}
              </p>
            </div>
            {statusLabel ? (
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", TONE_SOFT[tone])}>
                {statusLabel}
              </span>
            ) : null}
          </div>

          {voice.comment ? <p className="mt-1.5 text-[15px] leading-snug text-zinc-700">{voice.comment}</p> : null}

          {late ? (
            <p className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", TONE_SOFT.rose)}>
              {voice.lateResolve ? t.recoveryLateResolve : t.recoveryLateAck}
            </p>
          ) : null}

          <AnimatePresence initial={false} mode="wait">
            {open ? (
              <motion.div
                key={picking ? "pick" : paying ? "pay" : "actions"}
                className="mt-3 flex flex-wrap items-center gap-2"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={EXPAND_SPRING}
              >
                {picking ? (
                  <>
                    <select
                      className="h-11 min-w-0 flex-1 rounded-xl bg-zinc-50 px-3 text-[15px] outline-none ring-1 ring-zinc-200"
                      value={assigneeUserId}
                      onChange={(e) => setAssigneeUserId(e.target.value)}
                      aria-label={t.recoveryAssign}
                    >
                      {staff.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {memberDisplayName(m)}
                        </option>
                      ))}
                    </select>
                    <motion.button
                      type="button"
                      disabled={busy || !assigneeUserId}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
                      onClick={() => onAct("assign", { assigneeUserId })}
                      whileTap={reduce ? undefined : { scale: 0.96 }}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      {t.recoveryAssign}
                    </motion.button>
                    <button
                      type="button"
                      aria-label="Cancel"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100"
                      onClick={() => setPicking(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : paying ? (
                  <>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={voice.compensationLimit}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`${voice.compensationLimit} ${voice.compensationCurrency}`}
                      aria-label={t.recoveryCompensate}
                      className="h-11 w-28 rounded-xl bg-zinc-50 px-3 text-[15px] outline-none ring-1 ring-zinc-200"
                    />
                    <motion.button
                      type="button"
                      disabled={busy || !amount}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
                      onClick={() => onAct("compensate", { amount: Number(amount) })}
                      whileTap={reduce ? undefined : { scale: 0.96 }}
                    >
                      {t.recoveryCompensate}
                    </motion.button>
                    <button
                      type="button"
                      aria-label="Cancel"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100"
                      onClick={() => setPaying(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      disabled={busy || staff.length === 0}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-sky-50 px-3.5 text-[15px] font-semibold text-sky-800 ring-1 ring-sky-100 disabled:opacity-40"
                      onClick={() => {
                        setAssigneeUserId(staff[0]?.userId ?? "");
                        setPicking(true);
                      }}
                      whileTap={reduce ? undefined : { scale: 0.96 }}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      {t.recoveryAssign}
                    </motion.button>
                    {canCompensate(voice) ? (
                      <motion.button
                        type="button"
                        disabled={busy}
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 text-[15px] font-semibold text-amber-800 ring-1 ring-amber-100"
                        onClick={() => setPaying(true)}
                        whileTap={reduce ? undefined : { scale: 0.96 }}
                      >
                        <Wallet className="h-4 w-4" aria-hidden />
                        {t.recoveryCompensate}
                      </motion.button>
                    ) : null}
                    <motion.button
                      type="button"
                      disabled={busy}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-[15px] font-semibold text-white shadow-[0_8px_16px_-10px_rgba(16,185,129,0.8)]"
                      onClick={() => onAct("close")}
                      whileTap={reduce ? undefined : { scale: 0.96 }}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      {t.recoveryClose}
                    </motion.button>
                  </>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}
