"use client";

import type { ManagerTab } from "@/domain/catalog";
import type { SessionPayload } from "@/domain/session/types";
import { ComingSoonPanel } from "@/components/manager/tabs/coming-soon";
import { DashboardTab } from "@/components/manager/tabs/dashboard-tab";
import { FeedbackTab } from "@/components/manager/tabs/feedback-tab";
import { OpsTab } from "@/components/manager/tabs/ops-tab";
import { OverviewTab } from "@/components/manager/tabs/overview-tab";
import { RequestsTab } from "@/components/manager/tabs/requests-tab";
import { RoutinesTab } from "@/components/manager/tabs/routines-tab";
import { TasksTab } from "@/components/manager/tabs/tasks-tab";
import { TeamTab } from "@/components/manager/tabs/team-tab";
import { TodayTab } from "@/components/manager/tabs/today-tab";
import { useLocale } from "@/providers/locale-provider";

/**
 * OCP tab registry: hotel/supply screens register here without changing the shell.
 * Unwired tabs render ComingSoonPanel until their HTTP surface exists.
 */
export function ManagerTabBody({
  tab,
  session,
  onOpenTab,
}: {
  tab: ManagerTab;
  session: SessionPayload;
  onOpenTab: (tab: ManagerTab) => void;
}) {
  const { t } = useLocale();
  const wid = session.workspace.id;

  switch (tab) {
    case "today":
      return <TodayTab session={session} onOpenTab={onOpenTab} />;
    case "ops":
      return <OpsTab session={session} onOpenTab={onOpenTab} />;
    case "dashboard":
      return <DashboardTab session={session} onOpenTab={onOpenTab} />;
    case "overview":
      return <OverviewTab workspaceId={wid} onOpenTab={onOpenTab} />;
    case "feedback":
      return (
        <FeedbackTab
          workspaceId={wid}
          canAssign={session.scope === "general_manager" || session.scope === "department_manager"}
          canRotate={session.scope === "general_manager" || session.scope === "floor_ops"}
          onOpenTab={onOpenTab}
        />
      );
    case "requests":
      return (
        <RequestsTab
          workspaceId={wid}
          canAssign={session.scope === "general_manager" || session.scope === "department_manager"}
        />
      );
    case "team":
      return <TeamTab session={session} />;
    case "tasks_staff":
      return <TasksTab session={session} perspective="staff" />;
    case "tasks_detail":
      return <TasksTab session={session} perspective="detail" />;
    case "routines":
      return <RoutinesTab session={session} />;
    case "reservations":
      return <ComingSoonPanel title={t.tabReservations} />;
    case "guests":
      return <ComingSoonPanel title={t.tabGuests} />;
    case "rooms":
      return <ComingSoonPanel title={t.tabRooms} />;
    case "live_chat":
      return <ComingSoonPanel title={t.tabLiveChat} />;
    default:
      return <ComingSoonPanel title={tab} />;
  }
}
