/**
 * Carbon Coach — emissions calculation engine.
 *
 * Pure functions only; all values returned as kg CO2e per month.
 * Emission factors are widely-published approximations (EPA, IPCC, Our World in Data).
 * They are intentionally conservative and meant for coaching/awareness, not certification.
 */

export type DietType = "vegan" | "vegetarian" | "pescatarian" | "omnivore" | "heavy_meat";
export type CarType = "none" | "ev" | "hybrid" | "gasoline" | "diesel";
export type ShoppingHabit = "minimal" | "average" | "frequent";
export type WasteHabit = "low" | "medium" | "high";

export interface AssessmentInputs {
  /** Weekly kilometers driven in a personal car */
  carKmPerWeek: number;
  carType: CarType;
  /** Weekly kilometers on public transport (bus/train) */
  transitKmPerWeek: number;
  /** Annual flight hours (short + long-haul aggregate) */
  flightHoursPerYear: number;
  /** Monthly home electricity in kWh */
  electricityKwhPerMonth: number;
  /** Share of electricity from renewables (0..1) */
  renewableShare: number;
  diet: DietType;
  shopping: ShoppingHabit;
  waste: WasteHabit;
  /** Whether the user recycles regularly */
  recycles: boolean;
}

export interface CategoryBreakdown {
  transport: number;
  electricity: number;
  food: number;
  shopping: number;
  waste: number;
}

export interface AssessmentResult extends CategoryBreakdown {
  total: number;
  /** 0..100 — higher is better (greener). */
  score: number;
  /** Per-category recommendations */
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: keyof CategoryBreakdown;
  title: string;
  detail: string;
  estimatedSavingKg: number;
}

// --- Emission factors (kg CO2e per unit) ----------------------------------
const CAR_FACTOR: Record<CarType, number> = {
  none: 0,
  ev: 0.05,
  hybrid: 0.12,
  gasoline: 0.21,
  diesel: 0.24,
};

const DIET_MONTHLY_KG: Record<DietType, number> = {
  vegan: 60,
  vegetarian: 110,
  pescatarian: 140,
  omnivore: 200,
  heavy_meat: 300,
};

const SHOPPING_MONTHLY_KG: Record<ShoppingHabit, number> = {
  minimal: 30,
  average: 90,
  frequent: 180,
};

const WASTE_MONTHLY_KG: Record<WasteHabit, number> = {
  low: 15,
  medium: 35,
  high: 70,
};

const GRID_FACTOR_KG_PER_KWH = 0.4; // global average
const FLIGHT_KG_PER_HOUR = 90;
const TRANSIT_FACTOR = 0.04;
const WEEKS_PER_MONTH = 4.345;

/** Clamp a number to [min, max]. */
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

/** Round to 1 decimal place. */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Calculates monthly CO2 emissions per category from raw inputs. */
export function calculateEmissions(inputs: AssessmentInputs): CategoryBreakdown {
  const carKmPerMonth = Math.max(0, inputs.carKmPerWeek) * WEEKS_PER_MONTH;
  const transitKmPerMonth = Math.max(0, inputs.transitKmPerWeek) * WEEKS_PER_MONTH;
  const flightMonthly = (Math.max(0, inputs.flightHoursPerYear) * FLIGHT_KG_PER_HOUR) / 12;

  const transport =
    carKmPerMonth * CAR_FACTOR[inputs.carType] + transitKmPerMonth * TRANSIT_FACTOR + flightMonthly;

  const electricity =
    Math.max(0, inputs.electricityKwhPerMonth) *
    GRID_FACTOR_KG_PER_KWH *
    (1 - clamp(inputs.renewableShare, 0, 1));

  const food = DIET_MONTHLY_KG[inputs.diet];
  const shopping = SHOPPING_MONTHLY_KG[inputs.shopping];
  const wasteBase = WASTE_MONTHLY_KG[inputs.waste];
  const waste = inputs.recycles ? wasteBase * 0.7 : wasteBase;

  return {
    transport: round1(transport),
    electricity: round1(electricity),
    food: round1(food),
    shopping: round1(shopping),
    waste: round1(waste),
  };
}

/**
 * Computes an eco score 0..100 from total monthly kg CO2e.
 * Anchor points: ~250kg/mo ≈ excellent (90), ~830kg/mo (10t/yr) ≈ global avg (50),
 * 2000kg/mo ≈ heavy footprint (10).
 */
export function calculateScore(totalKgPerMonth: number): number {
  if (totalKgPerMonth <= 0) return 100;
  const score = 100 - totalKgPerMonth / 20;
  return Math.round(clamp(score, 0, 100));
}

export function generateRecommendations(
  breakdown: CategoryBreakdown,
  inputs: AssessmentInputs,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (inputs.carType !== "none" && inputs.carType !== "ev" && inputs.carKmPerWeek > 50) {
    recs.push({
      category: "transport",
      title: "Swap two car trips for transit each week",
      detail: "Public transport per km emits about 80% less than driving solo.",
      estimatedSavingKg: round1(breakdown.transport * 0.15),
    });
  }
  if (inputs.flightHoursPerYear >= 10) {
    recs.push({
      category: "transport",
      title: "Replace one flight a year with a train trip",
      detail: "A single short-haul flight can outweigh a year of recycling.",
      estimatedSavingKg: round1(FLIGHT_KG_PER_HOUR * 3),
    });
  }
  if (inputs.renewableShare < 0.5 && inputs.electricityKwhPerMonth > 150) {
    recs.push({
      category: "electricity",
      title: "Switch to a renewable energy tariff",
      detail: "Many providers offer 100% green plans at little or no premium.",
      estimatedSavingKg: round1(breakdown.electricity * 0.7),
    });
  }
  if (inputs.diet === "omnivore" || inputs.diet === "heavy_meat") {
    recs.push({
      category: "food",
      title: "Try 3 plant-based dinners a week",
      detail: "Cutting beef just twice a week saves ~25kg CO₂e per month.",
      estimatedSavingKg: 25,
    });
  }
  if (inputs.shopping === "frequent") {
    recs.push({
      category: "shopping",
      title: "Pause fast-fashion for 30 days",
      detail: "Each new garment carries roughly 8kg CO₂e in embodied emissions.",
      estimatedSavingKg: round1(SHOPPING_MONTHLY_KG.frequent - SHOPPING_MONTHLY_KG.average),
    });
  }
  if (!inputs.recycles) {
    recs.push({
      category: "waste",
      title: "Start a basic recycling routine",
      detail: "Sorting paper, plastic, and metal at home cuts waste emissions ~30%.",
      estimatedSavingKg: round1(WASTE_MONTHLY_KG[inputs.waste] * 0.3),
    });
  }
  return recs.sort((a, b) => b.estimatedSavingKg - a.estimatedSavingKg).slice(0, 5);
}

export function assess(inputs: AssessmentInputs): AssessmentResult {
  const breakdown = calculateEmissions(inputs);
  const total = round1(
    breakdown.transport +
      breakdown.electricity +
      breakdown.food +
      breakdown.shopping +
      breakdown.waste,
  );
  return {
    ...breakdown,
    total,
    score: calculateScore(total),
    recommendations: generateRecommendations(breakdown, inputs),
  };
}

/**
 * Simulates the impact of a single lifestyle change on the user's footprint.
 * Returns the projected new breakdown and total.
 */
export function simulateChange(
  base: AssessmentInputs,
  patch: Partial<AssessmentInputs>,
): AssessmentResult {
  return assess({ ...base, ...patch });
}
