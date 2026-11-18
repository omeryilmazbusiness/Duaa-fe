import { describe, expect, it } from "vitest";
import { buildArcs, clampPct, fractionOf, ringRadius } from "./geometry";

describe("buildArcs", () => {
  it("draws nothing when there is no data", () => {
    expect(buildArcs([], 100, 2)).toEqual([]);
    expect(buildArcs([0, 0], 100, 2)).toEqual([]);
    expect(buildArcs([5], 0, 2)).toEqual([]);
  });

  it("fills the whole ring for a single value, without a gap", () => {
    const [arc] = buildArcs([0, 7, 0], 100, 4);
    expect(arc).toMatchObject({ index: 1, length: 100, offset: 0, fraction: 1 });
  });

  it("splits proportionally and keeps a gap between neighbours", () => {
    const arcs = buildArcs([1, 3], 100, 4);
    expect(arcs).toHaveLength(2);
    expect(arcs[0]?.fraction).toBeCloseTo(0.25);
    expect(arcs[0]?.length).toBeCloseTo(21);
    expect(arcs[0]?.offset).toBeCloseTo(2);
    expect(arcs[1]?.offset).toBeCloseTo(27);
    expect(arcs[1]?.length).toBeCloseTo(71);
  });

  it("never lets arcs overlap or run past the circumference", () => {
    const arcs = buildArcs([1, 1, 1, 1, 1, 1], 100, 3);
    for (let i = 0; i < arcs.length; i += 1) {
      const arc = arcs[i];
      const next = arcs[i + 1];
      if (!arc) continue;
      expect(arc.offset + arc.length).toBeLessThanOrEqual(100 + 1e-9);
      if (next) expect(arc.offset + arc.length).toBeLessThan(next.offset);
    }
  });

  it("keeps a tiny slice visible and ignores negative or non-finite values", () => {
    const arcs = buildArcs([1000, 1, -5, Number.NaN, Number.POSITIVE_INFINITY], 100, 4);
    expect(arcs.map((a) => a.index)).toEqual([0, 1]);
    expect(arcs[1]?.length).toBeGreaterThan(0);
  });
});

describe("clampPct / fractionOf / ringRadius", () => {
  it("clamps percentages", () => {
    expect(clampPct(-4)).toBe(0);
    expect(clampPct(142)).toBe(100);
    expect(clampPct(66.6)).toBe(67);
    expect(clampPct(Number.NaN)).toBe(0);
  });

  it("computes safe fractions", () => {
    expect(fractionOf(1, 4)).toBe(0.25);
    expect(fractionOf(9, 4)).toBe(1);
    expect(fractionOf(3, 0)).toBe(0);
    expect(fractionOf(-3, 4)).toBe(0);
  });

  it("keeps the stroke inside the box", () => {
    expect(ringRadius(100, 10)).toBe(45);
    expect(ringRadius(4, 10)).toBe(0);
  });
});
