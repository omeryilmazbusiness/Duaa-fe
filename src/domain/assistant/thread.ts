import { emptyDesk, parseDesk, serializeDesk, type ChatDesk } from "./desk";
import { ensureUniqueMessageIds, MAX_STORED_MESSAGES } from "./ids";
import type { ChatMessage } from "./types";

export { ensureUniqueMessageIds, MAX_STORED_MESSAGES, newMessageId } from "./ids";

export const THREAD_PREFIX = "duaos_ai_thread:";
export const DESK_PREFIX = "duaos_ai_desk:";

export function threadStorageKey(workspaceId: string): string {
  return THREAD_PREFIX + workspaceId;
}

export function deskStorageKey(workspaceId: string): string {
  return DESK_PREFIX + workspaceId;
}

export function parseThread(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: ChatMessage[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const role = row.role === "assistant" ? "assistant" : row.role === "user" ? "user" : null;
      const content = typeof row.content === "string" ? row.content : "";
      const id = typeof row.id === "string" ? row.id : "";
      if (!role || !id || !content.trim()) continue;
      out.push({ id, role, content });
    }
    return ensureUniqueMessageIds(out.slice(-MAX_STORED_MESSAGES));
  } catch {
    return [];
  }
}

export function serializeThread(messages: ChatMessage[]): string {
  return JSON.stringify(messages.slice(-MAX_STORED_MESSAGES));
}

export function loadThread(workspaceId: string): ChatMessage[] {
  if (typeof window === "undefined" || !workspaceId) return [];
  return parseThread(window.localStorage.getItem(threadStorageKey(workspaceId)));
}

export function saveThread(workspaceId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined" || !workspaceId) return;
  if (messages.length === 0) {
    window.localStorage.removeItem(threadStorageKey(workspaceId));
    return;
  }
  window.localStorage.setItem(threadStorageKey(workspaceId), serializeThread(messages));
}

export function clearThread(workspaceId: string): void {
  if (typeof window === "undefined" || !workspaceId) return;
  window.localStorage.removeItem(threadStorageKey(workspaceId));
}

export function loadDesk(workspaceId: string): ChatDesk {
  if (typeof window === "undefined" || !workspaceId) return emptyDesk();
  const live = window.localStorage.getItem(deskStorageKey(workspaceId));
  if (live) return parseDesk(live);
  const legacy = window.localStorage.getItem(threadStorageKey(workspaceId));
  if (!legacy) return emptyDesk();
  const desk = parseDesk(legacy);
  saveDesk(workspaceId, desk);
  window.localStorage.removeItem(threadStorageKey(workspaceId));
  return desk;
}

export function saveDesk(workspaceId: string, desk: ChatDesk): void {
  if (typeof window === "undefined" || !workspaceId) return;
  window.localStorage.setItem(deskStorageKey(workspaceId), serializeDesk(desk));
}

export function clearDesk(workspaceId: string): void {
  if (typeof window === "undefined" || !workspaceId) return;
  window.localStorage.removeItem(deskStorageKey(workspaceId));
  window.localStorage.removeItem(threadStorageKey(workspaceId));
}
