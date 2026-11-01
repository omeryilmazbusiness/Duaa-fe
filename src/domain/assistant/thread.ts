import type { ChatMessage } from "./types";

export const THREAD_PREFIX = "duaos_ai_thread:";
export const MAX_STORED_MESSAGES = 20;

export function threadStorageKey(workspaceId: string): string {
  return THREAD_PREFIX + workspaceId;
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
    return out.slice(-MAX_STORED_MESSAGES);
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
