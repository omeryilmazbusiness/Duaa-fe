import { describe, expect, it } from "vitest";
import { speakableText, speakerLangTag, trimSpeakerHistory, type SpeakerTurn } from "./speaker";

describe("speakerLangTag", () => {
  it("maps the screen locale to a speech tag", () => {
    expect(speakerLangTag("ar")).toBe("ar-SA");
    expect(speakerLangTag("tr")).toBe("tr-TR");
    expect(speakerLangTag("en")).toBe("en-US");
    expect(speakerLangTag("xx")).toBe("en-US");
  });
});

describe("speakableText", () => {
  it("removes markdown so speech never reads symbols", () => {
    const out = speakableText("## Today\n- **Sheraton** occupancy 82%\n- Cafe sales `1,200,000`\n[Open](https://x.test)");
    expect(out).not.toMatch(/[#*`[\]]/);
    expect(out).toContain("Sheraton occupancy 82%");
    expect(out).toContain("Cafe sales 1,200,000");
    expect(out).toContain("Open");
    expect(out).not.toContain("https://");
  });

  it("drops code blocks and joins lines into sentences", () => {
    expect(speakableText("Line one\n```\ncode\n```\nLine two")).toBe("Line one. Line two");
  });

  it("keeps Arabic text intact", () => {
    expect(speakableText("**الإشغال** ٨٢٪")).toBe("الإشغال ٨٢٪");
  });

  it("caps very long answers at a sentence boundary", () => {
    const long = Array.from({ length: 80 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const out = speakableText(long);
    expect(out.length).toBeLessThanOrEqual(1200);
    expect(out.endsWith(".")).toBe(true);
  });
});

describe("trimSpeakerHistory", () => {
  const turns: SpeakerTurn[] = [
    { role: "assistant", content: "hello" },
    { role: "user", content: "q1" },
    { role: "assistant", content: "a1" },
    { role: "user", content: "  " },
    { role: "user", content: "q2" },
    { role: "assistant", content: "a2" },
  ];

  it("drops empty turns and always starts on a user turn", () => {
    const out = trimSpeakerHistory(turns, 3);
    expect(out[0]?.role).toBe("user");
    expect(out.map((t) => t.content)).toEqual(["q1", "a1", "q2", "a2"]);
  });

  it("keeps only the last pairs", () => {
    expect(trimSpeakerHistory(turns, 1).map((t) => t.content)).toEqual(["q2", "a2"]);
  });
});
