"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, Send, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReportKind } from "@/domain/report/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_SOLID } from "@/theme/tones";

export function ReportComposer({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [kind, setKind] = useState<ReportKind>("breakage");
  const [title, setTitle] = useState("");

  const submit = useMutation({
    mutationFn: () => kernel.submitReport(workspaceId, { kind, title, detail: "" }),
    onSuccess: () => {
      toast.success(t.reportSent);
      setTitle("");
      qc.invalidateQueries({ queryKey: qk.reports(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl"
      data-testid="staff-report"
    >
      <div className="mb-3 grid grid-cols-2 gap-2">
        <KindPill
          active={kind === "breakage"}
          label={t.reportBreakage}
          icon={Wrench}
          tone="rose"
          onClick={() => setKind("breakage")}
        />
        <KindPill
          active={kind === "request"}
          label={t.reportRequest}
          icon={Bell}
          tone="amber"
          onClick={() => setKind("request")}
        />
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          submit.mutate();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.title}
          required
          aria-label={t.title}
          className="h-12 min-w-0 flex-1 rounded-[16px] border border-zinc-200/80 bg-zinc-50/80 px-3.5 text-[14px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
        />
        <button
          type="submit"
          disabled={submit.isPending || !title.trim()}
          aria-label={t.sendReport}
          className={cn(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-white transition active:scale-95 disabled:opacity-40",
            TONE_SOLID.zinc,
          )}
        >
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={2.2} />}
        </button>
      </form>
    </section>
  );
}

function KindPill({
  active,
  label,
  icon: Icon,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Wrench;
  tone: "rose" | "amber";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-[16px] text-[13px] font-semibold tracking-tight transition active:scale-[0.98]",
        active
          ? tone === "rose"
            ? "bg-rose-500 text-white shadow-[0_10px_20px_-12px_rgba(244,63,94,0.7)]"
            : "bg-amber-500 text-white shadow-[0_10px_20px_-12px_rgba(245,158,11,0.7)]"
          : "bg-zinc-100 text-zinc-500",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.1} />
      {label}
    </button>
  );
}
