import { describe, expect, it } from "vitest";
import { mapBrief, mapDashboard, mapLogin, mapReport, mapRoutine, mapSession } from "./mappers";

describe("api mappers", () => {
  it("maps a cafe GM session from /v1/me", () => {
    const session = mapSession({
      user: { id: "u1", email: "duaa@example.com", firstName: "Duaa", lastName: "Al-Hayani" },
      membership: { id: "m1", role: "manager", staffDepartment: "" },
      workspace: { id: "w1", name: "Duaa Cafe", kind: "cafe", slug: "duaa-cafe" },
      scope: "general_manager",
      scopeLabel: "General Manager",
      tabs: ["today", "ops", "dashboard", "feedback", "not-a-tab"],
      defaultTab: "today",
      surface: "manager",
    });
    expect(session.tabs).toEqual(["today", "ops", "dashboard", "feedback"]);
    expect(session.workspace.kind).toBe("cafe");
    expect(session.surface).toBe("manager");
  });

  it("maps login workspace pick without a token", () => {
    const login = mapLogin({
      needsWorkspacePick: true,
      workspaces: [{ id: "w1", name: "Duaa Cafe", kind: "cafe", slug: "duaa-cafe" }],
    });
    expect(login.needsWorkspacePick).toBe(true);
    expect(login.token).toBeUndefined();
    expect(login.workspaces?.[0]?.slug).toBe("duaa-cafe");
  });

  it("normalizes PascalCase Go routine structs", () => {
    const routine = mapRoutine({
      ID: "r1",
      Title: "Open espresso",
      Description: "",
      AssigneeUserID: "u2",
      StartTime: "08:00",
      EndTime: "08:30",
      IsActive: true,
    });
    expect(routine).toEqual({
      id: "r1",
      title: "Open espresso",
      description: "",
      assigneeUserId: "u2",
      startTime: "08:00",
      endTime: "08:30",
      isActive: true,
    });
  });

  it("maps the executive brief without inventing review cards", () => {
    const brief = mapBrief({
      generatedAt: "2026-10-29T08:00:00Z",
      date: "2026-10-29",
      kind: "cafe",
      headline: { overdueTasks: 1, pendingDecisions: 1, assignedFollowups: 0 },
      pulse: { overdueTasks: 1, openTasks: 3, completedToday: 2 },
      cards: [
        {
          sourceKey: "late_staff",
          fingerprint: "overdue=1",
          kind: "late_staff",
          severity: "high",
          titleKey: "brief.overdueTasks",
          detail: "1",
          count: 1,
          priority: 10,
          targetTab: "ops",
          allowedActions: ["acknowledge", "assign", "resolve"],
          decision: null,
        },
      ],
      sources: [
        { kind: "late_staff", status: "live" },
        { kind: "customer_voice", status: "unavailable", reasonKey: "brief.sourceNotWired" },
      ],
      snoozedCount: 0,
      isClear: false,
    });
    expect(brief.pulse.overdueTasks).toBe(1);
    expect(brief.cards).toHaveLength(1);
    expect(brief.cards[0]?.targetTab).toBe("ops");
    expect(brief.sources[1]?.status).toBe("unavailable");
    expect(brief.cards.some((card) => card.kind === "customer_voice")).toBe(false);
  });

  it("maps an employee report without inventing QR review fields", () => {
    const report = mapReport({
      id: "r1",
      kind: "breakage",
      title: "Espresso machine jammed",
      detail: "won't grind",
      status: "open",
      reporterUserId: "u2",
      reporterName: "Ali Barista",
      reporterDepartment: "BAR",
      createdAt: "2026-10-29T08:00:00Z",
      updatedAt: "2026-10-29T08:00:00Z",
    });
    expect(report.kind).toBe("breakage");
    expect(report.status).toBe("open");
    expect(report.linkedTaskId).toBeUndefined();
  });

  it("maps the cafe dashboard without inventing POS sales", () => {
    const dash = mapDashboard({
      generatedAt: "2026-10-30T08:00:00Z",
      date: "2026-10-30",
      workspaceKind: "cafe",
      pulse: { employees: 1, openTasks: 2, overdueTasks: 0, completedToday: 0, openReports: 0, overloadedStaff: 0, pendingApprovals: 1 },
      tiles: [
        { module: "sales", status: "unavailable", reasonKey: "dash.posNotWired", value: 0, labelKey: "sales" },
        { module: "cash", status: "live", value: -2000, labelKey: "sourceCash" },
      ],
      cash: { status: "live", businessDate: "2026-10-30", countedAmount: 98000, expectedAmount: 100000, variance: -2000 },
      approvals: [{ id: "a1", title: "Milk invoice", supplier: "Al-Nahrain", amount: 250000, currency: "IQD", evidence: "photo", version: 2, status: "needs_evidence" }],
      workload: [],
    });
    expect(dash.tiles.find((tile) => tile.module === "sales")?.status).toBe("unavailable");
    expect(dash.cash?.status).toBe("live");
    expect(dash.cash?.variance).toBe(-2000);
    expect(dash.approvals?.[0]?.amount).toBe(250000);
    expect(dash.approvals?.[0]?.version).toBe(2);
    expect(dash.approvals?.[0]?.evidence).toBe("photo");
  });
});
