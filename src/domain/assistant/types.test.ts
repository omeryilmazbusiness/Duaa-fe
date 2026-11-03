import { describe, expect, it } from "vitest";
import {
  assistantErrorKind,
  canSend,
  clampDailyLimit,
  defaultSelection,
  isListedModel,
  looksLikeAPIKey,
  maskStoredKey,
  modelsFor,
  parseSelection,
  pickerGroups,
  selectionValue,
  MAX_HISTORY,
  MAX_MESSAGE_CHARS,
  toWireMessages,
  usageRatio,
  type ChatMessage,
} from "./types";
import { parseThread, serializeThread } from "./thread";

describe("assistant chat rules", () => {
  it("blocks empty, oversized, pending and out-of-quota sends", () => {
    expect(canSend("  ", false, 5)).toBe(false);
    expect(canSend("hi", true, 5)).toBe(false);
    expect(canSend("hi", false, 0)).toBe(false);
    expect(canSend("x".repeat(MAX_MESSAGE_CHARS + 1), false, 5)).toBe(false);
    expect(canSend("x".repeat(MAX_MESSAGE_CHARS), false, 5)).toBe(true);
  });

  it("sends only recent turns and never client ids", () => {
    const history: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
      id: `m${i}`,
      role: i % 2 === 0 ? "user" : "assistant",
      content: `c${i}`,
    }));
    const wire = toWireMessages(history);
    expect(wire.length).toBeGreaterThan(0);
    expect(wire.length).toBeLessThanOrEqual(MAX_HISTORY);
    expect(wire[0]?.role).toBe("user");
    expect(wire.at(-1)).toEqual({ role: "user", content: "c28" });
    expect(Object.keys(wire[0]!)).toEqual(["role", "content"]);
  });

  it("clamps the daily limit and computes usage", () => {
    expect(clampDailyLimit(0)).toBe(1);
    expect(clampDailyLimit(9999)).toBe(500);
    expect(clampDailyLimit(Number.NaN)).toBe(1);
    expect(usageRatio({ used: 15, limit: 30, remaining: 15, resetsAt: "" })).toBe(0.5);
    expect(usageRatio({ used: 5, limit: 0, remaining: 0, resetsAt: "" })).toBe(1);
  });

  it("categorises backend error codes", () => {
    expect(assistantErrorKind("ai_daily_limit")).toBe("limit");
    expect(assistantErrorKind("ai_key_rejected")).toBe("key");
    expect(assistantErrorKind("ai_provider_timeout")).toBe("warming");
    expect(assistantErrorKind("ai_not_configured")).toBe("not_configured");
    expect(assistantErrorKind("whatever")).toBe("generic");
  });
});

describe("model picker", () => {
  const gemini = {
    id: "gemini" as const,
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    models: [
      { id: "gemini-2.5-flash", free: true },
      { id: "gemini-2.5-pro", free: true },
    ],
  };
  const openai = {
    id: "openai" as const,
    label: "OpenAI (GPT)",
    defaultModel: "gpt-4o-mini",
    models: [{ id: "gpt-4o-mini", free: false }],
  };

  it("detects listed vs custom models", () => {
    expect(isListedModel(gemini.models, "gemini-2.5-flash")).toBe(true);
    expect(isListedModel(gemini.models, "gemini-9-ultra")).toBe(false);
  });

  it("prefers the live list only for the key's own provider", () => {
    const live = [{ id: "gemini-3-pro-preview", free: false }];
    expect(modelsFor(gemini, live, "gemini")).toBe(live);
    expect(modelsFor(gemini, live, "openai")).toBe(gemini.models);
    expect(modelsFor(gemini, [], "gemini")).toBe(gemini.models);
    expect(modelsFor(gemini, undefined, "gemini")).toBe(gemini.models);
    expect(modelsFor(undefined, live, "gemini")).toEqual([]);
  });

  it("defaults first-time setup to the free Gemini model and lists Gemini before GPT", () => {
    const pick = defaultSelection([openai, gemini]);
    expect(pick).toEqual({ provider: "gemini", model: "gemini-2.5-flash" });
    const groups = pickerGroups([openai, gemini], undefined, "openai");
    expect(groups.map((g) => g.id)).toEqual(["gemini", "openai"]);
    expect(groups[0]?.models.map((m) => m.id)).toEqual(["gemini-2.5-flash", "gemini-2.5-pro"]);
    expect(groups[1]?.models.map((m) => m.id)).toEqual(["gpt-4o-mini"]);
  });

  it("masks a stored key and accepts a pasted secret", () => {
    expect(maskStoredKey("UK8w")).toBe("••••••••UK8w");
    expect(maskStoredKey("")).toBe("••••••••");
    expect(looksLikeAPIKey("AQ.Ab8RN6Luhk0zzttJ")).toBe(true);
    expect(looksLikeAPIKey("short")).toBe(false);
    expect(looksLikeAPIKey("sk-abc def")).toBe(false);
  });

  it("round-trips a chat thread without inventing messages", () => {
    const raw = serializeThread([
      { id: "u1", role: "user", content: "hi" },
      { id: "a1", role: "assistant", content: "hello" },
    ]);
    expect(parseThread(raw)).toEqual([
      { id: "u1", role: "user", content: "hi" },
      { id: "a1", role: "assistant", content: "hello" },
    ]);
    expect(parseThread("not-json")).toEqual([]);
    expect(parseThread('[{"role":"system","content":"x"}]')).toEqual([]);
  });

  it("round-trips a grouped selection", () => {
    expect(parseSelection(selectionValue("gemini", "gemini-2.5-flash"))).toEqual({
      provider: "gemini",
      model: "gemini-2.5-flash",
    });
    expect(parseSelection(selectionValue("openai", "gpt-4o"))).toEqual({ provider: "openai", model: "gpt-4o" });
    expect(parseSelection("not-a-selection")).toBeNull();
  });
});
