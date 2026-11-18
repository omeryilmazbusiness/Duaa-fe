"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BareWidgetFrame } from "@/components/dashboard/widget-card";
import { CashPanel } from "@/components/manager/cash-panel";
import { POSPanel } from "@/components/manager/pos-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

/** Till and POS controls for one cafe. */
export function CafeMoney({ workspaceId, canClose, canRecordPOS }: { workspaceId: string; canClose: boolean; canRecordPOS: boolean }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const dash = useQuery({ queryKey: qk.dashboard(workspaceId), queryFn: () => kernel.getDashboard(workspaceId) });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: qk.dashboard(workspaceId) });
    void qc.invalidateQueries({ queryKey: qk.portfolio() });
  }
  const onError = (err: Error) => toast.error(err instanceof ApiError ? err.message : t.aiErrGeneric);

  const closeTill = useMutation({
    mutationFn: (input: { countedAmount: number; expectedAmount?: number }) => kernel.closeCash(workspaceId, input),
    onSuccess: () => {
      toast.success(t.tillClosed);
      invalidate();
    },
    onError,
  });
  const recordPOS = useMutation({
    mutationFn: (input: Parameters<typeof kernel.recordCafePOS>[1]) => kernel.recordCafePOS(workspaceId, input),
    onSuccess: () => {
      toast.success(t.posRecord);
      invalidate();
    },
    onError,
  });
  const closePOS = useMutation({
    mutationFn: () => kernel.closeCafePOS(workspaceId),
    onSuccess: () => {
      toast.success(t.posCloseDay);
      invalidate();
    },
    onError,
  });

  if (dash.isLoading) return <Skeleton className="h-40 rounded-[20px]" />;
  if (dash.isError) {
    return (
      <p className="text-[13px] text-rose-700">
        {dash.error instanceof Error ? dash.error.message : t.dashFailed}
        <button type="button" className="ms-2 font-semibold underline" onClick={() => void dash.refetch()}>
          {t.dashRetry}
        </button>
      </p>
    );
  }
  const busy = closeTill.isPending || recordPOS.isPending || closePOS.isPending;

  return (
    <BareWidgetFrame>
      <div className="space-y-5">
        <POSPanel sales={dash.data?.sales} canRecord={canRecordPOS} busy={busy} onRecord={(input) => recordPOS.mutate(input)} onClose={() => closePOS.mutate()} />
        <div className="border-t border-zinc-200/70 pt-4">
          <p className="mb-2 text-[13px] font-semibold text-zinc-900">{t.sourceCash}</p>
          <CashPanel key={dash.data?.cash?.status ?? "none"} cash={dash.data?.cash} canClose={canClose} busy={busy} onClose={(input) => closeTill.mutate(input)} />
        </div>
      </div>
    </BareWidgetFrame>
  );
}
