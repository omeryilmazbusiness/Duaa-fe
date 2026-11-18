"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Coffee, Layers, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAssistantStatus } from "@/components/assistant/use-assistant";
import { AiSpeakerCard } from "@/components/assistant/speaker/ai-speaker-card";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { GeneralPortfolioView } from "@/components/manager/portfolio/general-portfolio-view";
import { ApprovalsSection, SourcesSection, useDashboardActions } from "@/components/manager/tabs/dashboard-sections";
import { useSwitchBusiness } from "@/components/manager/use-switch-business";
import { CafeDashboard } from "@/components/manager/workspace-dashboard/cafe-dashboard";
import { HotelDashboard } from "@/components/manager/workspace-dashboard/hotel-dashboard";
import { ChannelsTable, TasksDonut, WorkloadTable } from "@/components/manager/workspace-dashboard/panels";
import { Skeleton } from "@/components/ui/skeleton";
import type { ManagerTab } from "@/domain/catalog";
import type { SessionPayload } from "@/domain/session/types";
import { settingsQuery } from "@/domain/settings/pane";
import { allows } from "@/domain/staff-scope/rbac";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_WELL, type Tone } from "@/theme/tones";

const KIND_ICON: Record<string, { icon: LucideIcon; tone: Tone }> = {
  hotel: { icon: Building2, tone: "indigo" },
  cafe: { icon: Coffee, tone: "amber" },
};

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="dashboard-loading">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-56 rounded-[26px]" />
      ))}
    </div>
  );
}

/** The signed-in business's own dashboard. Switching business in the menu swaps the whole screen. */
export function DashboardTab({ session }: { session: SessionPayload; onOpenTab: (tab: ManagerTab) => void }) {
  const { t } = useLocale();
  const router = useRouter();
  const wid = session.workspace.id;
  const slug = session.workspace.slug;
  const kind = session.workspace.kind;
  const canClose = allows(session.scope, "cash.close");
  const canRecordPOS = allows(session.scope, "pos.record");
  const canSubmit = allows(session.scope, "approval.submit");
  const canAct = allows(session.scope, "approval.act");
  const seeMoney = allows(session.scope, "finance.view");
  const isGm = session.scope === "general_manager";
  const workspaces = session.workspaces ?? [];

  const dash = useQuery({ queryKey: qk.dashboard(wid), queryFn: () => kernel.getDashboard(wid) });
  const portfolio = useQuery({ queryKey: qk.portfolio(), queryFn: () => kernel.getPortfolio(), staleTime: 20_000 });
  const assistant = useAssistantStatus(session);
  const actions = useDashboardActions(wid);
  const switchBusiness = useSwitchBusiness();

  const data = portfolio.data;
  const hotel = data?.hotels.hotels.find((h) => h.workspaceId === wid);
  const cafe = data?.cafes.cafes.find((c) => c.workspaceId === wid);
  const completeness = data?.completeness.byWorkspace.find((c) => c.workspaceId === wid);
  const loading = dash.isLoading || portfolio.isLoading;
  const identity = KIND_ICON[kind] ?? { icon: Store, tone: "zinc" as Tone };
  const Icon = identity.icon;

  return (
    <div className="space-y-3" data-testid="dashboard-board" data-workspace={wid}>
      {isGm ? (
        <AiSpeakerCard
          workspaceId={wid}
          ready={assistant.data?.available === true}
          onOpenSettings={() => router.replace(`/${slug}/manager?${settingsQuery("ai")}`)}
        />
      ) : null}

      <header className="flex items-center gap-3 px-1 pt-1" data-testid="dashboard-identity">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]", TONE_WELL[identity.tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{t.dashKicker}</p>
          <h2 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-zinc-950">{session.workspace.name}</h2>
        </div>
      </header>

      {dash.isError ? (
        <section className="rounded-[26px] border border-rose-100 bg-white px-5 py-5" data-testid="dashboard-error">
          <p className="text-sm text-rose-700">{dash.error instanceof Error ? dash.error.message : t.dashFailed}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[#007AFF]" onClick={() => void dash.refetch()}>
            {t.dashRetry}
          </button>
        </section>
      ) : null}

      {loading ? (
        <DashboardSkeleton />
      ) : kind === "hotel" ? (
        <HotelDashboard workspaceId={wid} hotel={hotel} completeness={completeness} pulse={dash.data?.pulse} />
      ) : kind === "cafe" ? (
        <CafeDashboard
          workspaceId={wid}
          cafe={cafe}
          completeness={completeness}
          dash={dash.data}
          seeMoney={seeMoney}
          canClose={canClose}
          canRecordPOS={canRecordPOS}
        />
      ) : (
        <div className="space-y-3" data-testid="dashboard-generic">
          <div className="grid gap-3 md:grid-cols-2">
            <TasksDonut pulse={dash.data?.pulse} />
            <ChannelsTable entry={completeness} />
          </div>
          <SourcesSection view={dash.data} />
        </div>
      )}

      {!loading && !dash.isError ? <WorkloadTable workload={dash.data?.workload ?? []} /> : null}

      {!loading && seeMoney ? <ApprovalsSection view={dash.data} actions={actions} canSubmit={canSubmit} canAct={canAct} /> : null}

      {isGm && data && workspaces.length > 1 ? (
        <CollapsibleSection persistId="dash:businesses" title={t.dashPortfolioTitle} icon={Layers} summary={t.dashBusinessesHint} testId="dashboard-businesses">
          <GeneralPortfolioView
            portfolio={data}
            workspaces={workspaces}
            defaultWorkspaceId={wid}
            overdueTasks={dash.data?.pulse.overdueTasks ?? 0}
            onOpenBusiness={(id) => {
              if (id !== wid) void switchBusiness(id);
            }}
          />
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
