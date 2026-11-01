import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  Gauge,
  LayoutDashboard,
  LayoutGrid,
  MessageCircle,
  MessageSquare,
  Repeat,
  Sun,
  Users,
} from "lucide-react";
import type { ManagerTab } from "@/domain/catalog";
import type { Messages } from "@/lib/i18n";
import type { Tone } from "@/theme/tones";

export interface NavDef {
  id: ManagerTab;
  icon: LucideIcon;
  tone: Tone;
  label: (t: Messages) => string;
}

export const NAV_DEFS: readonly NavDef[] = [
  { id: "today", icon: Sun, tone: "rose", label: (t) => t.tabToday },
  { id: "ops", icon: Gauge, tone: "amber", label: (t) => t.tabOps },
  { id: "dashboard", icon: LayoutGrid, tone: "teal", label: (t) => t.tabDashboard },
  { id: "overview", icon: LayoutDashboard, tone: "indigo", label: (t) => t.tabOverview },
  { id: "tasks_staff", icon: Users, tone: "sky", label: (t) => t.tabTasksStaff },
  { id: "tasks_detail", icon: ClipboardList, tone: "sky", label: (t) => t.tabTasksDetail },
  { id: "routines", icon: Repeat, tone: "amber", label: (t) => t.tabRoutines },
  { id: "team", icon: Briefcase, tone: "violet", label: (t) => t.tabTeam },
  { id: "reservations", icon: CalendarDays, tone: "indigo", label: (t) => t.tabReservations },
  { id: "guests", icon: Users, tone: "sky", label: (t) => t.tabGuests },
  { id: "rooms", icon: DoorOpen, tone: "amber", label: (t) => t.tabRooms },
  { id: "requests", icon: Bell, tone: "rose", label: (t) => t.tabRequests },
  { id: "live_chat", icon: MessageCircle, tone: "indigo", label: (t) => t.tabLiveChat },
  { id: "feedback", icon: MessageSquare, tone: "teal", label: (t) => t.tabFeedback },
];

export function navForTabs(tabs: readonly ManagerTab[]): NavDef[] {
  const allowed = new Set(tabs);
  return NAV_DEFS.filter((def) => allowed.has(def.id));
}
