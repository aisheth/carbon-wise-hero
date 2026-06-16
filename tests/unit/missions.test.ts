import { describe, it, expect } from "vitest";
import { generateWeeklyMissions, weekStart, isoDate, MISSION_LIBRARY } from "@/lib/missions";

describe("weekStart", () => {
  it("returns a Monday", () => {
    const d = weekStart(new Date("2026-06-18T15:00:00Z")); // Thursday
    expect(d.getUTCDay()).toBe(1);
  });
  it("returns the same date when called twice in the same week", () => {
    expect(isoDate(weekStart(new Date("2026-06-15")))).toBe(isoDate(weekStart(new Date("2026-06-19"))));
  });
});

describe("generateWeeklyMissions", () => {
  const heavyFood = { transport: 50, electricity: 30, food: 250, shopping: 20, waste: 10 };
  it("returns the requested number of missions", () => {
    expect(generateWeeklyMissions(heavyFood, "2026-06-15", 3)).toHaveLength(3);
  });
  it("prioritizes the heaviest category", () => {
    const missions = generateWeeklyMissions(heavyFood, "2026-06-15", 3);
    expect(missions[0].category).toBe("food");
  });
  it("is deterministic for the same input", () => {
    const a = generateWeeklyMissions(heavyFood, "2026-06-15", 3);
    const b = generateWeeklyMissions(heavyFood, "2026-06-15", 3);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });
  it("varies across weeks", () => {
    const a = generateWeeklyMissions(heavyFood, "2026-06-15", 3);
    const b = generateWeeklyMissions(heavyFood, "2026-06-22", 3);
    expect(a.map((m) => m.id).join()).not.toBe(b.map((m) => m.id).join());
  });
  it("never returns duplicates", () => {
    const missions = generateWeeklyMissions(heavyFood, "2026-06-15", 5);
    const ids = missions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("MISSION_LIBRARY", () => {
  it("every mission has positive points and CO2", () => {
    for (const m of MISSION_LIBRARY) {
      expect(m.points).toBeGreaterThan(0);
      expect(m.estimatedCo2Kg).toBeGreaterThan(0);
    }
  });
});
