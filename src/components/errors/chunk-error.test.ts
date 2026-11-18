import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./chunk-error";

describe("isChunkLoadError", () => {
  it("recognises stale chunk failures", () => {
    const named = new Error("boom");
    named.name = "ChunkLoadError";
    expect(isChunkLoadError(named)).toBe(true);
    expect(isChunkLoadError(new Error("Loading chunk 123 failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Failed to fetch dynamically imported module: /x.js"))).toBe(true);
  });

  it("ignores ordinary errors and non-errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError("Loading chunk 1 failed")).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});
