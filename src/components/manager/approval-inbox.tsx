"use client";

import { Check, FileWarning, Plus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import type { DashboardApproval } from "@/domain/dashboard/types";
import { parseIQD, type ApprovalAction } from "@/domain/finance/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIQD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT } from "@/theme/tones";

export function ApprovalInbox({
  packs,
  canSubmit,
  canAct,
  busy,
  onSubmit,
  onAct,
}: {
  packs: DashboardApproval[];
  canSubmit: boolean;
  canAct: boolean;
  busy: boolean;
  onSubmit: (input: { title: string; supplier: string; amount: number; evidence?: string }) => void;
  onAct: (id: string, input: { action?: ApprovalAction; amount?: number }) => void;
}) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", supplier: "", amount: "", evidence: "" });
  const [revise, setRevise] = useState<Record<string, string>>({});

  return (
    <WidgetCard
      title={t.pendingApprovals}
      icon={FileWarning}
      tone="violet"
      count={packs.length}
      actions={
        canSubmit ? (
          <Button size="icon-sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-label={t.newApproval}>
            <Plus />
          </Button>
        ) : null
      }
      testId="dashboard-approvals"
    >
      <p className="mb-3 text-[13px] text-zinc-500">{t.approvalDoesNotPay}</p>

      {open && canSubmit ? (
        <form
          className="mb-4 grid gap-2 rounded-[20px] bg-zinc-50/70 p-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = parseIQD(form.amount);
            if (!form.title.trim() || amount == null || amount <= 0) return;
            onSubmit({
              title: form.title.trim(),
              supplier: form.supplier.trim(),
              amount,
              evidence: form.evidence.trim() || undefined,
            });
            setForm({ title: "", supplier: "", amount: "", evidence: "" });
            setOpen(false);
          }}
        >
          <Input placeholder={t.title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input placeholder={t.supplier} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t.amount}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input placeholder={t.evidence} value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} />
          <Button type="submit" disabled={busy}>
            {t.save}
          </Button>
        </form>
      ) : null}

      {packs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center" data-testid="approvals-empty">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", TONE_GRADIENT.emerald)}>
            <ShieldCheck className="h-7 w-7" strokeWidth={2} />
          </span>
          <p className="text-[15px] font-semibold text-zinc-900">{t.noApprovals}</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {packs.map((pack) => (
            <li key={pack.id} className="rounded-[20px] px-2.5 py-2.5 hover:bg-zinc-50/90">
              <div className="flex items-center gap-3.5">
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", TONE_GRADIENT.violet)}>
                  <FileWarning className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold tracking-tight text-zinc-900">{pack.title}</p>
                  <p className="truncate text-[12px] font-medium text-zinc-500">
                    {pack.supplier || t.pendingApprovals} · {formatIQD(pack.amount, locale)}
                  </p>
                </div>
              </div>
              {canAct ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 ps-[58px]">
                  <Input
                    className="h-9 max-w-[140px] rounded-xl"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={t.amount}
                    value={revise[pack.id] ?? ""}
                    onChange={(e) => setRevise((prev) => ({ ...prev, [pack.id]: e.target.value }))}
                    aria-label={t.amount}
                  />
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      const amount = parseIQD(revise[pack.id] ?? "");
                      onAct(pack.id, amount != null && amount > 0 && amount !== pack.amount ? { amount } : { action: "approve" });
                    }}
                    aria-label={t.approve}
                  >
                    <Check />
                    {t.approve}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onAct(pack.id, { action: "request_evidence" })}>
                    {t.requestEvidence}
                  </Button>
                  <Button size="icon-sm" variant="ghost" disabled={busy} onClick={() => onAct(pack.id, { action: "reject" })} aria-label={t.reject}>
                    <X />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
