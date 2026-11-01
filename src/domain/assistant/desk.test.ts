import { describe, expect, it } from "vitest";
import {
  MAX_CHAT_TABS,
  activeTab,
  canOpenTab,
  chatTitle,
  clearAllDesk,
  closeTab,
  emptyDesk,
  openTab,
  parseDesk,
  selectTab,
  setTabMessages,
} from "./desk";

describe("assistant desk", () => {
  it("opens at most three tabs and keeps one after clear all", () => {
    let desk = emptyDesk();
    desk = openTab(desk);
    desk = openTab(desk);
    const full = openTab(desk);
    expect(full.tabs).toHaveLength(MAX_CHAT_TABS);
    expect(canOpenTab(full)).toBe(false);
    expect(openTab(full).tabs).toHaveLength(MAX_CHAT_TABS);
    const cleared = clearAllDesk();
    expect(cleared.tabs).toHaveLength(1);
    expect(activeTab(cleared).messages).toEqual([]);
  });

  it("never closes the last tab and writes to the tab that sent, not the visible one", () => {
    let desk = emptyDesk();
    const first = desk.activeId;
    desk = openTab(desk);
    const second = desk.activeId;
    expect(second).not.toBe(first);
    desk = setTabMessages(desk, first, [{ id: "u1", role: "user", content: "till" }]);
    desk = selectTab(desk, second);
    expect(activeTab(desk).messages).toEqual([]);
    expect(desk.tabs.find((t) => t.id === first)?.messages[0]?.content).toBe("till");
    const one = closeTab(closeTab(desk, first), second);
    expect(one.tabs).toHaveLength(1);
    expect(closeTab(one, one.activeId).tabs).toHaveLength(1);
  });

  it("migrates a legacy single thread and titles from the first guest line", () => {
    const desk = parseDesk(JSON.stringify([{ id: "u5", role: "user", content: "  late staff tonight  " }]));
    expect(desk.tabs).toHaveLength(1);
    expect(activeTab(desk).messages[0]?.content).toBe("late staff tonight");
    expect(chatTitle(activeTab(desk).messages, "Chat 1")).toBe("late staff tonight");
    expect(chatTitle([], "Chat 2")).toBe("Chat 2");
  });
});
