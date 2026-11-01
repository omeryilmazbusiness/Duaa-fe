import { describe, expect, it } from "vitest";
import { mapAssistantSettings } from "./mappers";

describe("mapAssistantSettings", () => {
  it("keeps Gemini as the first-time default and lists both catalogues", () => {
    const view = mapAssistantSettings({
      configured: false,
      enabled: true,
      provider: "gemini",
      model: "gemini-2.5-flash",
      dailyLimit: 30,
      providers: [
        {
          id: "gemini",
          label: "Google Gemini",
          defaultModel: "gemini-2.5-flash",
          models: [
            { id: "gemini-2.5-flash", free: true },
            { id: "gemini-2.5-pro", free: true },
          ],
        },
        {
          id: "openai",
          label: "OpenAI (GPT)",
          defaultModel: "gpt-4o-mini",
          models: [{ id: "gpt-4o-mini", free: false }],
        },
      ],
    });
    expect(view.provider).toBe("gemini");
    expect(view.model).toBe("gemini-2.5-flash");
    expect(view.providers.map((p) => p.id)).toEqual(["gemini", "openai"]);
    expect(view.providers[0]?.models[0]).toEqual({ id: "gemini-2.5-flash", free: true });
    expect(view.providers[1]?.models[0]?.id).toBe("gpt-4o-mini");
  });

  it("keeps a stored key as configured with a hint, never the secret", () => {
    const view = mapAssistantSettings({
      configured: true,
      enabled: true,
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      keyHint: "UK8w",
      dailyLimit: 30,
      providers: [],
    });
    expect(view.configured).toBe(true);
    expect(view.keyHint).toBe("UK8w");
    expect(JSON.stringify(view)).not.toContain("AQ.");
  });

  it("never invents Gemini when the payload is OpenAI", () => {
    const view = mapAssistantSettings({ provider: "openai", model: "gpt-4o", providers: [] });
    expect(view.provider).toBe("openai");
    expect(view.model).toBe("gpt-4o");
  });
});
