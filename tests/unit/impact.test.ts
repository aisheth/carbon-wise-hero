import { describe, it, expect } from "vitest";
import { aggregateImpact, computeImpact } from "../../src/lib/impact";

describe("computeImpact", () => {
  it("returns zeros for zero or negative input", () => {
    expect(computeImpact(0)).toEqual({ co2Kg: 0, trees: 0, waterLitres: 0, energyKwh: 0 });
    expect(computeImpact(-10)).toEqual({ co2Kg: 0, trees: 0, waterLitres: 0, energyKwh: 0 });
  });
  it("scales linearly with input", () => {
    const a = computeImpact(21);
    expect(a.trees).toBe(1);
    expect(a.energyKwh).toBe(42);
    expect(a.waterLitres).toBe(63);
  });
  it("rounds to 1 decimal", () => {
    const r = computeImpact(1);
    expect(r.trees.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(1);
  });
});

describe("aggregateImpact", () => {
  it("sums positive items", () => {
    const r = aggregateImpact([{ co2Kg: 21 }, { co2Kg: 42 }]);
    expect(r.co2Kg).toBe(63);
    expect(r.trees).toBe(3);
  });
  it("ignores negative entries safely", () => {
    expect(aggregateImpact([{ co2Kg: -5 }, { co2Kg: 21 }]).trees).toBe(1);
  });
  it("returns zero impact for an empty list", () => {
    expect(aggregateImpact([])).toEqual({ co2Kg: 0, trees: 0, waterLitres: 0, energyKwh: 0 });
  });
});
