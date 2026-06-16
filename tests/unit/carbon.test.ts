import { describe, it, expect } from "vitest";
import {
  assess,
  calculateEmissions,
  calculateScore,
  clamp,
  generateRecommendations,
  round1,
  simulateChange,
  type AssessmentInputs,
} from "../../src/lib/carbon";

const lowImpact: AssessmentInputs = {
  carKmPerWeek: 0, carType: "none", transitKmPerWeek: 30, flightHoursPerYear: 0,
  electricityKwhPerMonth: 100, renewableShare: 1, diet: "vegan",
  shopping: "minimal", waste: "low", recycles: true,
};
const highImpact: AssessmentInputs = {
  carKmPerWeek: 400, carType: "diesel", transitKmPerWeek: 0, flightHoursPerYear: 40,
  electricityKwhPerMonth: 900, renewableShare: 0, diet: "heavy_meat",
  shopping: "frequent", waste: "high", recycles: false,
};

describe("clamp / round1", () => {
  it("clamp bounds the value", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
  it("round1 rounds to 1 decimal", () => {
    expect(round1(1.234)).toBe(1.2);
    expect(round1(1.25)).toBe(1.3);
  });
});

describe("calculateEmissions", () => {
  it("returns 0 transport when carType is none and no transit/flights", () => {
    const e = calculateEmissions({ ...lowImpact, transitKmPerWeek: 0 });
    expect(e.transport).toBe(0);
  });
  it("ignores electricity when 100% renewable", () => {
    expect(calculateEmissions(lowImpact).electricity).toBe(0);
  });
  it("applies recycling discount to waste", () => {
    const r = calculateEmissions({ ...lowImpact, waste: "medium", recycles: true });
    const noR = calculateEmissions({ ...lowImpact, waste: "medium", recycles: false });
    expect(r.waste).toBeLessThan(noR.waste);
  });
  it("heavy diet emits more than vegan", () => {
    expect(calculateEmissions(highImpact).food).toBeGreaterThan(calculateEmissions(lowImpact).food);
  });
  it("handles negative inputs safely (no negative emissions)", () => {
    const e = calculateEmissions({ ...lowImpact, carKmPerWeek: -50, electricityKwhPerMonth: -100 });
    expect(e.transport).toBeGreaterThanOrEqual(0);
    expect(e.electricity).toBe(0);
  });
});

describe("calculateScore", () => {
  it("gives 100 for zero footprint", () => {
    expect(calculateScore(0)).toBe(100);
  });
  it("clamps to 0..100", () => {
    expect(calculateScore(100000)).toBe(0);
    expect(calculateScore(-5)).toBe(100);
  });
  it("monotonically decreases as emissions rise", () => {
    expect(calculateScore(100)).toBeGreaterThan(calculateScore(500));
    expect(calculateScore(500)).toBeGreaterThan(calculateScore(1500));
  });
});

describe("assess (integration of calc + score + recs)", () => {
  it("low-impact lifestyle scores high", () => {
    const r = assess(lowImpact);
    expect(r.score).toBeGreaterThan(80);
    expect(r.total).toBeLessThan(300);
  });
  it("high-impact lifestyle scores low and yields recommendations", () => {
    const r = assess(highImpact);
    expect(r.score).toBeLessThan(40);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.recommendations[0].estimatedSavingKg).toBeGreaterThan(0);
  });
  it("returns at most 5 recommendations sorted by impact", () => {
    const r = assess(highImpact);
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i - 1].estimatedSavingKg).toBeGreaterThanOrEqual(r.recommendations[i].estimatedSavingKg);
    }
  });
});

describe("generateRecommendations edge cases", () => {
  it("no recs for an already-optimized lifestyle", () => {
    const breakdown = calculateEmissions(lowImpact);
    expect(generateRecommendations(breakdown, lowImpact)).toEqual([]);
  });
  it("suggests renewable switch only with high consumption", () => {
    const inputs: AssessmentInputs = { ...lowImpact, electricityKwhPerMonth: 50, renewableShare: 0 };
    const recs = generateRecommendations(calculateEmissions(inputs), inputs);
    expect(recs.find((r) => r.category === "electricity")).toBeUndefined();
  });
});

describe("simulateChange", () => {
  it("reducing car km lowers total", () => {
    const base = assess(highImpact);
    const sim = simulateChange(highImpact, { carKmPerWeek: 0, carType: "none" });
    expect(sim.total).toBeLessThan(base.total);
  });
  it("returns identical result when patch is empty", () => {
    const base = assess(highImpact);
    const sim = simulateChange(highImpact, {});
    expect(sim.total).toBe(base.total);
  });
});
