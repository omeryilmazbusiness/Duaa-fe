import { ensureUniqueMessageIds, MAX_STORED_MESSAGES, newMessageId } from "./ids";
import type { ChatMessage } from "./types";

export const MAX_CHAT_TABS = 3;
export const MAX_TAB_TITLE = 22;

export interface ChatTab {
  id: string;
  messages: ChatMessage[];
}

export interface ChatDesk {
  activeId: string;
  tabs: ChatTab[];
}

export function emptyTab(): ChatTab {
  return { id: newMessageId(), messages: [] };
}

export function emptyDesk(): ChatDesk {
  const tab = emptyTab();
  return { activeId: tab.id, tabs: [tab] };
}

export function normalizeDesk(desk: ChatDesk): ChatDesk {
  const seen = new Set<string>();
  const tabs: ChatTab[] = [];
  for (const raw of desk.tabs) {
    const id = raw.id.trim() || newMessageId();
    if (seen.has(id) || tabs.length >= MAX_CHAT_TABS) continue;
    seen.add(id);
    tabs.push({
      id,
      messages: ensureUniqueMessageIds(raw.messages ?? []).slice(-MAX_STORED_MESSAGES),
    });
  }
  if (tabs.length === 0) return emptyDesk();
  const activeId = tabs.some((t) => t.id === desk.activeId) ? desk.activeId : tabs[0]!.id;
  return { activeId, tabs };
}

export function parseDesk(raw: string | null | undefined): ChatDesk {
  if (!raw) return emptyDesk();
  try {
    const data = JSON.parse(raw) as unknown;
    if (Array.isArray(data)) {
      const tab: ChatTab = { id: newMessageId(), messages: parseMessageList(data) };
      return { activeId: tab.id, tabs: [tab] };
    }
    if (!data || typeof data !== "object") return emptyDesk();
    const row = data as Record<string, unknown>;
    const tabsIn = Array.isArray(row.tabs) ? row.tabs : [];
    const tabs: ChatTab[] = tabsIn.map((item) => {
      const t = (item ?? {}) as Record<string, unknown>;
      return {
        id: typeof t.id === "string" ? t.id : "",
        messages: parseMessageList(t.messages),
      };
    });
    return normalizeDesk({ activeId: typeof row.activeId === "string" ? row.activeId : "", tabs });
  } catch {
    return emptyDesk();
  }
}

function parseMessageList(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const role = row.role === "assistant" ? "assistant" : row.role === "user" ? "user" : null;
    const content = typeof row.content === "string" ? row.content.trim() : "";
    const id = typeof row.id === "string" ? row.id : "";
    if (!role || !id || !content) continue;
    out.push({ id, role, content });
  }
  return ensureUniqueMessageIds(out.slice(-MAX_STORED_MESSAGES));
}

export function serializeDesk(desk: ChatDesk): string {
  return JSON.stringify(normalizeDesk(desk));
}

export function canOpenTab(desk: ChatDesk): boolean {
  return normalizeDesk(desk).tabs.length < MAX_CHAT_TABS;
}

export function openTab(desk: ChatDesk): ChatDesk {
  const cur = normalizeDesk(desk);
  if (!canOpenTab(cur)) return cur;
  const tab = emptyTab();
  return { activeId: tab.id, tabs: [...cur.tabs, tab] };
}

export function selectTab(desk: ChatDesk, id: string): ChatDesk {
  const cur = normalizeDesk(desk);
  if (!cur.tabs.some((t) => t.id === id)) return cur;
  return { ...cur, activeId: id };
}

export function closeTab(desk: ChatDesk, id: string): ChatDesk {
  const cur = normalizeDesk(desk);
  if (cur.tabs.length <= 1) return cur;
  const tabs = cur.tabs.filter((t) => t.id !== id);
  const activeId = cur.activeId === id ? tabs[tabs.length - 1]!.id : cur.activeId;
  return { activeId, tabs };
}

export function clearAllDesk(): ChatDesk {
  return emptyDesk();
}

export function clearTab(desk: ChatDesk, id: string): ChatDesk {
  const cur = normalizeDesk(desk);
  return {
    ...cur,
    tabs: cur.tabs.map((t) => (t.id === id ? { ...t, messages: [] } : t)),
  };
}

export function setTabMessages(desk: ChatDesk, tabId: string, messages: ChatMessage[]): ChatDesk {
  const cur = normalizeDesk(desk);
  if (!cur.tabs.some((t) => t.id === tabId)) return cur;
  return {
    ...cur,
    tabs: cur.tabs.map((t) =>
      t.id === tabId ? { ...t, messages: ensureUniqueMessageIds(messages).slice(-MAX_STORED_MESSAGES) } : t,
    ),
  };
}

export function activeTab(desk: ChatDesk): ChatTab {
  const cur = normalizeDesk(desk);
  return cur.tabs.find((t) => t.id === cur.activeId) ?? cur.tabs[0]!;
}

export function chatTitle(messages: readonly ChatMessage[], untitled: string): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return untitled;
  const text = first.content.trim().replace(/\s+/g, " ");
  if (!text) return untitled;
  return text.length > MAX_TAB_TITLE ? `${text.slice(0, MAX_TAB_TITLE - 1)}…` : text;
}
