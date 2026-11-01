"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

export function CafeQRDesk({
  workspaceId,
  canRotate,
}: {
  workspaceId: string;
  canRotate: boolean;
}) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeQR(workspaceId),
    queryFn: () => kernel.listCafeQR(workspaceId),
    staleTime: 15_000,
  });
  const rotate = useMutation({
    mutationFn: (siteId: string) => kernel.rotateCafeQR(workspaceId, siteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.cafeQR(workspaceId) });
      toast.success(t.qrRotated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-[14px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.qrLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button type="button" className="text-[14px] font-medium text-[#007AFF]" onClick={() => void query.refetch()}>
        {t.qrLoadError}
      </button>
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return <p className="py-4 text-[14px] text-zinc-500">{t.cafeEmptyQR}</p>;
  }
  return (
    <div className="space-y-1">
      <p className="mb-3 text-[13px] text-zinc-500">{t.qrHint}</p>
      {items.map((code) => (
        <article key={code.siteId} className="flex gap-4 rounded-2xl px-1 py-3 hover:bg-zinc-50/80" data-testid="cafe-qr-code">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={code.imagePath} alt="" width={88} height={88} className="h-[88px] w-[88px] rounded-xl bg-white ring-1 ring-zinc-200/70" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-zinc-950">{code.label}</p>
            <p className="truncate text-[12px] text-zinc-500">
              {code.branch ? `${code.branch} · ` : ""}
              {code.area}
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
                  className="text-[13px] font-medium text-rose-600"
                  disabled={rotate.isPending}
                  onClick={() => rotate.mutate(code.siteId)}
                >
                  {t.qrRotate}
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
