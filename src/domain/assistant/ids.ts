import type { ChatMessage } from "./types";

export const MAX_STORED_MESSAGES = 20;

export function newMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Persisted threads used a length-based counter; a slice then minted `u5` twice. */
export function ensureUniqueMessageIds(messages: readonly ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  let dirty = false;
  const out = messages.map((m) => {
    if (m.id && !seen.has(m.id)) {
      seen.add(m.id);
      return m;
    }
    dirty = true;
    let id = newMessageId();
    while (seen.has(id)) id = newMessageId();
    seen.add(id);
    return { ...m, id };
  });
  return dirty ? out : (messages as ChatMessage[]);
}
