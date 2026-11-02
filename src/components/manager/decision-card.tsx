"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Handshake,
  MessageCircle,
  TimerOff,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { IconWell } from "@/components/manager/white-card";
import { cardDisplayValue, cardIconKey, cardTitleKey, cardTone, sourceCopyKey } from "@/domain/executive/look";
import type { BriefCard, DecisionAction } from "@/domain/executive";
import type { ManagerTab } from "@/domain/catalog";
import { memberDisplayName, memberInitials, type MemberView } from "@/domain/work/types";
import { Button } from "@/components/ui/button";
import { formatIQD } from "@/lib/format";
import { EXPAND_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_FILL } from "@/theme/tones";

const KIND_ICON = {
  late_staff: TimerOff,
  customer_voice: MessageCircle,
  reservations: CalendarDays,
  cash_variance: Banknote,
  handover: Handshake,
  breakdown: Wrench,
  prep_time: Clock3,
} as const;

const GLASS_ICON =
  "bg-white/15 text-white hover:bg-white/25 hover:text-white focus-visible:ring-white/40";

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
    <article
      className={cn("ios-fill-sheen rounded-[24px] p-3.5 transition-transform duration-200 hover:-translate-y-px", TONE_FILL[tone])}
      data-testid={`today-card-${card.kind}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3.5 text-start"
          aria-expanded={expanded}
          aria-label={expanded ? t.collapseCard : t.expandCard}
          onClick={() => setExpanded((open) => !open)}
        >
          <span className="relative shrink-0">
            <IconWell icon={Icon} size="lg" />
            {urgent ? <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white/80 bg-white" aria-hidden /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[14px] font-semibold tracking-tight text-white">{title}</span>
              {urgent ? (
                <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold text-white">{t.overdue}</span>
              ) : null}
            </span>
            <span className="block truncate text-[12px] font-medium text-white/75">
              {kindLabel}
              {assignee ? ` · ${memberDisplayName(assignee)}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-end">
            <span className="block text-[15px] font-semibold tabular-nums tracking-tight text-white">{display}</span>
            {assignee ? (
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold text-white">
                {memberInitials(assignee)}
              </span>
            ) : null}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={GLASS_ICON}
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
              className={GLASS_ICON}
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={GLASS_ICON}
              disabled={busy}
              aria-label={t.markDone}
              onClick={() => onAct("resolve")}
            >
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
            <div className="mt-3 space-y-2 rounded-[16px] bg-white/12 px-3.5 py-3">
              {detail ? <p className="text-[13px] text-white/85">{detail}</p> : null}
              {items.length > 0 ? (
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="text-[13px] leading-snug text-white">
                      <span className="font-medium">{item.title}</span>
                      {item.meta ? <span className="mt-0.5 block text-[11px] font-medium text-white/70">{item.meta}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {assignee ? (
                <p className="text-[13px] text-white/85">
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
                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/25 bg-white/95 px-2 text-sm text-zinc-900 outline-none"
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
                  <Button
                    type="submit"
                    size="icon-sm"
                    className="bg-white text-zinc-900 hover:bg-white/90"
                    disabled={busy || !assigneeUserId}
                    aria-label={t.assignTask}
                  >
                    <Check />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" className={GLASS_ICON} onClick={() => setAssignOpen(false)} aria-label={t.cancel}>
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
