"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  TimerOff,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { cardDisplayValue, cardIconKey, cardTitleKey, cardTone, sourceCopyKey } from "@/domain/executive/look";
import type { BriefCard, DecisionAction } from "@/domain/executive";
import type { ManagerTab } from "@/domain/catalog";
import { memberDisplayName, memberInitials, type MemberView } from "@/domain/work/types";
import { Button } from "@/components/ui/button";
import { formatIQD } from "@/lib/format";
import { EXPAND_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT, TONE_SOFT } from "@/theme/tones";

const KIND_ICON = {
  late_staff: TimerOff,
  customer_voice: MessageCircle,
  reservations: CalendarDays,
  cash_variance: Banknote,
} as const;

export function DecisionCard({
  card,
  staff,
  items = [],
  busy,
  onOpenTab,
  onAct,
}: {
  card: BriefCard;
  staff: MemberView[];
  items?: { id: string; title: string; meta?: string }[];
  busy: boolean;
  onOpenTab: (tab: ManagerTab) => void;
  onAct: (action: DecisionAction, extra?: { assigneeUserId: string; title: string }) => void;
}) {
  const { t, locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigneeUserId, setAssigneeUserId] = useState(staff[0]?.userId ?? "");
  const titleKey = cardTitleKey(card.titleKey);
  const title = titleKey ? t[titleKey] : card.titleKey;
  const assignee = staff.find((m) => m.userId === card.decision?.assigneeUserId);
  const tone = cardTone(card.kind);
  const Icon = KIND_ICON[cardIconKey(card.kind)];
  const kind = sourceCopyKey(card.kind);
  const kindLabel = kind ? t[kind] : card.kind.replaceAll("_", " ");
  const shown = cardDisplayValue(card);
  const display = shown.kind === "cash" ? formatIQD(shown.value, locale) : String(shown.value);
  const detail = card.kind === "cash_variance" ? null : card.detail && card.detail !== String(shown.value) ? card.detail : null;
  const urgent = card.severity === "high" || card.kind === "late_staff";

  return (
    <article className="rounded-[20px] px-2.5 py-2.5 transition-colors hover:bg-zinc-50/90" data-testid={`today-card-${card.kind}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3.5 text-start"
          aria-expanded={expanded}
          aria-label={expanded ? t.collapseCard : t.expandCard}
          onClick={() => setExpanded((open) => !open)}
        >
          <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_12px_-6px_rgba(15,23,42,0.28)]", TONE_GRADIENT[tone])}>
            <Icon className="h-5 w-5" strokeWidth={2.1} />
            {urgent ? <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" aria-hidden /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[14px] font-semibold tracking-tight text-zinc-900">{title}</span>
              {urgent ? <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", TONE_SOFT.rose)}>{t.overdue}</span> : null}
            </span>
            <span className="block truncate text-[12px] font-medium text-zinc-500">
              {kindLabel}
              {assignee ? ` · ${memberDisplayName(assignee)}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-end">
            <span className="block text-[15px] font-semibold tabular-nums tracking-tight text-zinc-950">{display}</span>
            {assignee ? (
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-700">
                {memberInitials(assignee)}
              </span>
            ) : null}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label={t.goToTab}
            onClick={() => {
              onAct("acknowledge");
              onOpenTab((card.targetTab || "ops") as ManagerTab);
            }}
          >
            <ArrowUpRight />
          </Button>
          {card.allowedActions.includes("assign") ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={busy}
              aria-label={t.assignTask}
              onClick={() => {
                setAssigneeUserId((id) => id || staff[0]?.userId || "");
                setAssignOpen(true);
                setExpanded(true);
              }}
            >
              <UserPlus />
            </Button>
          ) : null}
          {card.allowedActions.includes("resolve") ? (
            <Button type="button" variant="ghost" size="icon-sm" disabled={busy} aria-label={t.markDone} onClick={() => onAct("resolve")}>
              <Check />
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={EXPAND_SPRING}
          >
            <div className="ms-[58px] mt-2 space-y-2 rounded-[16px] bg-zinc-50/80 px-3.5 py-3">
              {detail ? <p className="text-[13px] text-zinc-600">{detail}</p> : null}
              {items.length > 0 ? (
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="text-[13px] leading-snug text-zinc-800">
                      <span className="font-medium">{item.title}</span>
                      {item.meta ? <span className="mt-0.5 block text-[11px] font-medium text-zinc-500">{item.meta}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {assignee ? (
                <p className="text-[13px] text-zinc-600">
                  {t.assigned}: {memberDisplayName(assignee)}
                </p>
              ) : null}
              {assignOpen ? (
                <form
                  className="flex items-center gap-1.5 pt-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!assigneeUserId) return;
                    onAct("assign", { assigneeUserId, title: t.followUpTitle });
                    setAssignOpen(false);
                  }}
                >
                  <select
                    className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none"
                    value={assigneeUserId}
                    onChange={(e) => setAssigneeUserId(e.target.value)}
                    required
                    aria-label={t.assignee}
                  >
                    {staff.length === 0 ? <option value="">{t.noStaff}</option> : null}
                    {staff.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {memberDisplayName(m)}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="icon-sm" disabled={busy || !assigneeUserId} aria-label={t.assignTask}>
                    <Check />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setAssignOpen(false)} aria-label={t.cancel}>
                    <X />
                  </Button>
                </form>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
