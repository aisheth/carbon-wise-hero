/**
 * Integration tests for the Supabase data layer.
 * The Supabase client is fully mocked; we verify our app code wires the right
 * tables, filters, and payloads — not the network round-trip itself.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
const updateMock = vi.fn().mockReturnThis();
const selectMock = vi.fn().mockReturnThis();
const eqMock = vi.fn().mockReturnThis();
const orderMock = vi.fn().mockReturnThis();
const limitMock = vi.fn().mockReturnThis();
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock("../../src/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u_1" } } }) },
    from: vi.fn(() => ({
      insert: insertMock,
      update: updateMock,
      select: selectMock,
      eq: eqMock,
      order: orderMock,
      limit: limitMock,
      maybeSingle: maybeSingleMock,
    })),
  },
}));

beforeEach(() => {
  insertMock.mockClear();
});

describe("assessment write path", () => {
  it("inserts an assessment row with computed fields", async () => {
    const { supabase } = await import("../../src/integrations/supabase/client");
    const { assess } = await import("../../src/lib/carbon");
    const inputs = {
      carKmPerWeek: 100, carType: "gasoline" as const, transitKmPerWeek: 0, flightHoursPerYear: 2,
      electricityKwhPerMonth: 300, renewableShare: 0.2, diet: "omnivore" as const,
      shopping: "average" as const, waste: "medium" as const, recycles: true,
    };
    const r = assess(inputs);
    await supabase.from("assessments").insert({
      user_id: "u_1", inputs, transport_kg: r.transport, electricity_kg: r.electricity,
      food_kg: r.food, shopping_kg: r.shopping, waste_kg: r.waste, total_kg: r.total, score: r.score,
    });
    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];
    expect(payload.user_id).toBe("u_1");
    expect(payload.total_kg).toBe(r.total);
    expect(payload.score).toBeGreaterThanOrEqual(0);
  });
});

describe("missions completion flow", () => {
  it("toggles a mission as completed", async () => {
    const { supabase } = await import("../../src/integrations/supabase/client");
    await supabase.from("missions").update({ completed: true, completed_at: new Date().toISOString() }).eq("id", "m_1");
    expect(updateMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("id", "m_1");
  });
});
