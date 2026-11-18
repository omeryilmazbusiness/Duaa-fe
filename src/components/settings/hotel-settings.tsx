"use client";

import { useQuery } from "@tanstack/react-query";
import { Info, PlugZap } from "lucide-react";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { HotelOhipPanel } from "@/components/manager/portfolio/hotel-ohip-panel";
import { HotelProfileForm } from "@/components/manager/portfolio/hotel-profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

/** Hotel details and the OHIP / OPERA connection for the open hotel. */
export function HotelSettings({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const pms = useQuery({ queryKey: qk.hotelPMS(workspaceId), queryFn: () => kernel.getHotelPMS(workspaceId), staleTime: 15_000 });

  if (pms.isLoading) return <Skeleton className="h-64 rounded-[26px]" />;
  if (pms.isError || !pms.data) {
    return (
      <p className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] text-rose-700" data-testid="hotel-settings-error">
        {pms.error instanceof Error ? pms.error.message : t.dashFailed}
        <button type="button" className="ms-2 font-semibold underline" onClick={() => void pms.refetch()}>
          {t.dashRetry}
        </button>
      </p>
    );
  }
  const view = pms.data;

  return (
    <div className="space-y-3" data-testid="hotel-settings">
      <CollapsibleSection persistId={`hotel:${workspaceId}:settings-info`} defaultOpen title={t.hotelInfoTitle} icon={Info} tone="sky" testId="hotel-settings-info">
        <HotelProfileForm key={`${workspaceId}:${view.profile.updatedAt ?? "seed"}`} workspaceId={workspaceId} profile={view.profile} />
      </CollapsibleSection>
      <CollapsibleSection
        persistId={`hotel:${workspaceId}:settings-ohip`}
        defaultOpen
        title={t.ohipTitle}
        icon={PlugZap}
        tone={view.connector.configured ? "teal" : "zinc"}
        testId="hotel-settings-ohip"
      >
        <HotelOhipPanel key={`${workspaceId}:${view.connector.lastSyncAt ?? "never"}`} view={view} />
      </CollapsibleSection>
    </div>
  );
}
