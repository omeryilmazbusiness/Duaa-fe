"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioRecentDoc } from "@/domain/portfolio/types";
import type { WorkspaceOption } from "@/domain/session/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export function DocumentSimplifierCard({
  workspaces,
  defaultWorkspaceId,
  recentDocuments,
}: {
  workspaces: readonly WorkspaceOption[];
  defaultWorkspaceId: string;
  recentDocuments: readonly PortfolioRecentDoc[];
}) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState(() => (workspaces.some((w) => w.id === defaultWorkspaceId) ? defaultWorkspaceId : (workspaces[0]?.id ?? defaultWorkspaceId)));
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");

  const ingest = useMutation({
    mutationFn: (payload: FormData | { fileName: string; content: string; locale: string }) =>
      kernel.ingestWorkspaceDoc(targetWorkspaceId, payload),
    onSuccess: (doc) => {
      if (doc.replayed) {
        toast.info(t.docReplayed);
      } else {
        toast.success(doc.summary.headline || t.docTitle);
      }
      setFileName("");
      setContent("");
      void qc.invalidateQueries({ queryKey: qk.portfolio() });
      void qc.invalidateQueries({ queryKey: qk.workspaceDocs(targetWorkspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  function onFilePicked(file: File | undefined) {
    if (!file || ingest.isPending) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("locale", locale);
    ingest.mutate(fd);
  }

  return (
    <WidgetCard title={t.docTitle} icon={FileSpreadsheet} tone="violet" testId="portfolio-doc-simplifier">
      <p className="mb-3 text-[13px] text-zinc-500">{t.docSubtitle}</p>

      <div className="space-y-2.5 rounded-[22px] bg-zinc-50/80 p-3.5 ring-1 ring-inset ring-zinc-900/[0.04]">
        <div className="flex flex-wrap items-center gap-2">
          {workspaces.length > 1 ? (
            <select
              className="h-10 flex-1 rounded-2xl border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-900"
              value={targetWorkspaceId}
              onChange={(e) => setTargetWorkspaceId(e.target.value)}
              aria-label={t.switchBusiness}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.json,.txt,.md,.log"
            className="hidden"
            onChange={(e) => {
              onFilePicked(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={ingest.isPending}
            onClick={() => fileRef.current?.click()}
            className="h-10 rounded-2xl"
          >
            <Upload className="me-1.5 h-4 w-4" />
            {t.docUpload}
          </Button>
        </div>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim() || ingest.isPending) return;
            ingest.mutate({
              fileName: fileName.trim() || "executive-report.txt",
              content: content.trim(),
              locale,
            });
          }}
        >
          <Input
            placeholder={t.docFileName}
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="h-10 rounded-2xl bg-white"
          />
          <textarea
            rows={3}
            placeholder={t.docPasteLabel}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-y rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-[13px] text-zinc-900 outline-none focus:border-violet-300"
          />
          <Button type="submit" disabled={!content.trim() || ingest.isPending} className="w-full rounded-2xl sm:w-auto">
            <Sparkles className="me-1.5 h-4 w-4" />
            {ingest.isPending ? t.docAnalyzing : t.docAnalyze}
          </Button>
        </form>
      </div>

      {recentDocuments.length === 0 ? (
        <p className="mt-4 text-center text-[13px] text-zinc-500">{t.docEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {recentDocuments.slice(0, 5).map((doc) => (
            <li key={doc.id} className="rounded-[20px] border border-zinc-200/70 bg-white p-3.5 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold tracking-tight text-zinc-950">{doc.summary.headline || doc.fileName}</p>
                  <p className="truncate text-[11.5px] font-medium text-zinc-500">
                    {doc.workspaceName} · {doc.fileName} · {doc.businessDate}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                      doc.aiUsed ? "bg-violet-50 text-violet-700" : "bg-zinc-100 text-zinc-700",
                    )}
                  >
                    {doc.aiUsed ? t.docAiSimplified : t.docStructured}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums text-emerald-700">
                    {t.docCoverage} {doc.dataCoveragePct}%
                  </span>
                </div>
              </div>

              {doc.summary.keyMetrics.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {doc.summary.keyMetrics.slice(0, 5).map((m, idx) => (
                    <span key={`${m.label}:${idx}`} className="rounded-xl bg-zinc-50 px-2.5 py-1 text-[11.5px] text-zinc-700 ring-1 ring-zinc-200/60">
                      <span className="text-zinc-500">{m.label}: </span>
                      <span className="font-semibold tabular-nums text-zinc-950">{m.value}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              {doc.summary.takeaways.length > 0 ? (
                <ul className="mt-2.5 space-y-1 text-[12.5px] leading-snug text-zinc-700">
                  {doc.summary.takeaways.slice(0, 3).map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              ) : null}

              {doc.summary.risks.length > 0 ? (
                <div className="mt-2 rounded-xl bg-amber-50/70 px-2.5 py-1.5 text-[12px] text-amber-900">
                  {doc.summary.risks.map((r, idx) => (
                    <p key={idx}>! {r}</p>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
