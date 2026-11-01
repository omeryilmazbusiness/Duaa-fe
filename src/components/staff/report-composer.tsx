"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, Send, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReportKind } from "@/domain/report/types";
import { WhiteCard } from "@/components/manager/white-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

export function ReportComposer({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [kind, setKind] = useState<ReportKind>("breakage");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const submit = useMutation({
    mutationFn: () => kernel.submitReport(workspaceId, { kind, title, detail }),
    onSuccess: () => {
      toast.success(t.reportSent);
      setTitle("");
      setDetail("");
      qc.invalidateQueries({ queryKey: qk.reports(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  return (
    <WhiteCard>
      <div className="mb-3 flex items-center gap-2 text-zinc-900/45">
        <Wrench className="h-4 w-4" />
        <h2 className="text-sm font-semibold text-zinc-900">{t.sendReport}</h2>
      </div>
      <p className="mb-3 text-[12px] text-zinc-900/50">{t.reportHint}</p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border text-[12px] font-semibold uppercase tracking-[0.08em]",
            kind === "breakage"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sand-line bg-white text-zinc-500",
          )}
          onClick={() => setKind("breakage")}
        >
          <Wrench className="h-4 w-4" />
          {t.reportBreakage}
        </button>
        <button
          type="button"
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border text-[12px] font-semibold uppercase tracking-[0.08em]",
            kind === "request"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-sand-line bg-white text-zinc-500",
          )}
          onClick={() => setKind("request")}
        >
          <Bell className="h-4 w-4" />
          {t.reportRequest}
        </button>
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          submit.mutate();
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.title}
          required
          aria-label={t.title}
        />
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t.description}
          aria-label={t.description}
          rows={3}
          className="flex w-full rounded-2xl border border-sand-line bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
        />
        <Button type="submit" className="w-full" disabled={submit.isPending || !title.trim()}>
          {submit.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          {t.sendReport}
        </Button>
      </form>
    </WhiteCard>
  );
}
