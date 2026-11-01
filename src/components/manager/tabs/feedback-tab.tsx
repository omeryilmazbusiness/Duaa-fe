"use client";

import { MessageSquare } from "lucide-react";
import { ReportInbox } from "@/components/manager/report-inbox";
import { IconWell, ToneCard } from "@/components/manager/white-card";
import { useLocale } from "@/providers/locale-provider";

export function FeedbackTab({ workspaceId, canAssign }: { workspaceId: string; canAssign: boolean }) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-[26px] text-zinc-900 sm:text-2xl">{t.tabFeedback}</h2>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-900/45">{t.employeeReports}</p>
        <ReportInbox workspaceId={workspaceId} canAssign={canAssign} emptyLabel={t.noReports} />
      </div>
      <ToneCard tone="teal" className="relative flex flex-col items-center py-10 text-center">
        <IconWell icon={MessageSquare} size="lg" />
        <p className="mt-4 text-sm font-medium text-white/85">{t.cafeFeedbackEmpty}</p>
      </ToneCard>
    </div>
  );
}
