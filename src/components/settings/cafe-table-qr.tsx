"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { parseTableNumber, tableHeading, type CafeQRCode } from "@/domain/cafe/qr";
import { IosField, IosGroup, IosLinkButton } from "@/components/ios/ios-settings";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

export function CafeTableQR({
  workspaceId,
  canIssue,
  canRotate,
}: {
  workspaceId: string;
  canIssue: boolean;
  canRotate: boolean;
}) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [number, setNumber] = useState("");
  const query = useQuery({
    queryKey: qk.cafeQR(workspaceId),
    queryFn: () => kernel.listCafeQR(workspaceId),
    staleTime: 15_000,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: qk.cafeQR(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.cafeDefinition(workspaceId) });
  };

  const issue = useMutation({
    mutationFn: (tableNumber: string) => kernel.issueCafeTable(workspaceId, tableNumber),
    onSuccess: () => {
      setNumber("");
      refresh();
      toast.success(t.qrIssued);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rename = useMutation({
    mutationFn: ({ siteId, tableNumber }: { siteId: string; tableNumber: string }) =>
      kernel.renameCafeTable(workspaceId, siteId, tableNumber),
    onSuccess: () => {
      refresh();
      toast.success(t.qrRenamed);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rotate = useMutation({
    mutationFn: (siteId: string) => kernel.rotateCafeQR(workspaceId, siteId),
    onSuccess: () => {
      refresh();
      toast.success(t.qrRotated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitIssue = () => {
    const parsed = parseTableNumber(number);
    if (!parsed) {
      toast.error(t.qrNeedNumber);
      return;
    }
    issue.mutate(parsed);
  };

  return (
    <div className="space-y-6" data-testid="cafe-table-qr">
      {canIssue ? (
        <IosGroup header={t.qrTableNumber} footer={t.qrPaneHint}>
          <div className="flex items-center gap-2 px-4 py-2">
            <IosField
              value={number}
              placeholder={t.qrTableNumber}
              inputMode="text"
              data-testid="cafe-table-number"
              onChange={(e) => setNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!issue.isPending) submitIssue();
                }
              }}
            />
          </div>
          <IosLinkButton type="button" disabled={issue.isPending} onClick={submitIssue} testId="cafe-table-issue">
            {issue.isPending ? t.qrIssuing : t.qrIssue}
          </IosLinkButton>
        </IosGroup>
      ) : null}

      {query.isPending ? (
        <IosGroup>
          <div className="flex items-center gap-2 px-4 py-3 text-[15px] text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.qrLoading}
          </div>
        </IosGroup>
      ) : query.isError ? (
        <IosGroup footer={t.qrLoadError}>
          <IosLinkButton onClick={() => void query.refetch()}>{t.aiRetry}</IosLinkButton>
        </IosGroup>
      ) : (query.data ?? []).length === 0 ? (
        <IosGroup header={t.qrDesk} footer={t.qrEmpty}>
          <p className="px-4 py-3 text-[14px] text-zinc-500">{t.cafeEmptyQR}</p>
        </IosGroup>
      ) : (
        <IosGroup header={t.qrDesk} footer={t.qrHint}>
          {(query.data ?? []).map((code) => (
            <TableQRRow
              key={code.siteId}
              code={code}
              canIssue={canIssue}
              canRotate={canRotate}
              renaming={rename.isPending}
              rotating={rotate.isPending}
              onRename={(tableNumber) => rename.mutate({ siteId: code.siteId, tableNumber })}
              onRotate={() => rotate.mutate(code.siteId)}
            />
          ))}
        </IosGroup>
      )}
    </div>
  );
}

function TableQRRow({
  code,
  canIssue,
  canRotate,
  renaming,
  rotating,
  onRename,
  onRotate,
}: {
  code: CafeQRCode;
  canIssue: boolean;
  canRotate: boolean;
  renaming: boolean;
  rotating: boolean;
  onRename: (tableNumber: string) => void;
  onRotate: () => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(code.label);
  const heading = tableHeading(code.label, code.area, t.qrTable);
  return (
    <article className="flex gap-4 px-4 py-3" data-testid="cafe-qr-code">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={code.imagePath}
        alt=""
        width={88}
        height={88}
        className="h-[88px] w-[88px] rounded-xl bg-white ring-1 ring-zinc-200"
      />
      <div className="min-w-0 flex-1">
        {canIssue && code.area === "table" ? (
          <IosField
            value={draft}
            aria-label={t.qrTableNumber}
            className="h-9 px-0 text-[15px] font-medium"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const next = parseTableNumber(draft);
              if (next && next !== code.label) onRename(next);
              else setDraft(code.label);
            }}
          />
        ) : (
          <p className="truncate text-[15px] font-medium text-zinc-950">{heading}</p>
        )}
        <p className="truncate text-[12px] text-zinc-500">
          {code.branch ? `${code.branch} · ` : ""}
          {code.area === "table" ? t.qrTable : code.area}
          {code.active ? "" : ` · ${t.qrRetired}`}
        </p>
        <p className="mt-1 break-all text-[12px] text-zinc-600">{code.publicUrl}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            className="text-[13px] font-medium text-[#007AFF]"
            onClick={() => void navigator.clipboard.writeText(code.publicUrl).then(() => toast.success(t.qrCopied))}
          >
            {t.qrCopy}
          </button>
          <a href={code.publicPath} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[#007AFF]">
            {t.qrOpen}
          </a>
          {canRotate ? (
            <button
              type="button"
              className="text-[13px] font-medium text-[#FF3B30]"
              disabled={rotating || renaming}
              onClick={onRotate}
            >
              {t.qrRotate}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
