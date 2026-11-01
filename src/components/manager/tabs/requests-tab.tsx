"use client";

import { ReportInbox } from "@/components/manager/report-inbox";
import { useLocale } from "@/providers/locale-provider";

export function RequestsTab({ workspaceId, canAssign }: { workspaceId: string; canAssign: boolean }) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-[26px] text-zinc-900 sm:text-2xl">{t.tabRequests}</h2>
      <ReportInbox workspaceId={workspaceId} canAssign={canAssign} emptyLabel={t.noReports} />
    </div>
  );
}
