import { describe, expect, it } from "vitest";
import { ensureUniqueMessageIds, newMessageId, parseThread } from "./thread";

describe("assistant thread ids", () => {
  it("mints distinct ids", () => {
    const a = newMessageId();
    const b = newMessageId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it("repairs a sliced thread that reused u5", () => {
    const raw = JSON.stringify([
      { id: "u5", role: "user", content: "first" },
      { id: "a6", role: "assistant", content: "ok" },
      { id: "u5", role: "user", content: "again" },
    ]);
    const loaded = parseThread(raw);
    const ids = loaded.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(loaded[0]?.content).toBe("first");
    expect(loaded[2]?.content).toBe("again");
  });

  it("leaves a unique thread untouched", () => {
    const rows = [
      { id: "u1", role: "user" as const, content: "hi" },
      { id: "a2", role: "assistant" as const, content: "hello" },
    ];
    expect(ensureUniqueMessageIds(rows)).toBe(rows);
  });
});
