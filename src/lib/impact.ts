/**
 * Real-world impact equivalents for a given amount of CO₂ avoided (kg).
 *
 * Pure functions, no I/O. All factors are widely-published approximations:
 * - 1 mature tree absorbs ~21 kg CO₂ per year (USDA / Arbor Day Foundation).
 * - Producing 1 kg CO₂ from grid electricity uses ~2 kWh and ~3 L of cooling water
 *   (rough average across thermal generation per IEA/EIA datasets).
 * Tuned for coaching/awareness messaging — NOT certification-grade reporting.
 */

export interface ImpactEquivalents {
  /** kg of CO₂e avoided (input, echoed back for downstream display). */
  co2Kg: number;
  /** Mature-tree-years equivalent. */
  trees: number;
  /** Litres of water saved by skipping the avoided generation. */
  waterLitres: number;
  /** kWh of grid electricity equivalent to the CO₂ avoided. */
  energyKwh: number;
}

const TREE_KG_PER_YEAR = 21;
const KWH_PER_KG_CO2 = 2;
const LITRES_WATER_PER_KG_CO2 = 3;

/** Round to 1 decimal — matches the rest of the carbon module. */
const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Convert avoided/reduced CO₂ (kg) into intuitive equivalents.
 * Negative inputs are clamped to zero so the UI never shows negative impact.
 */
export function computeImpact(co2Kg: number): ImpactEquivalents {
  const safe = Math.max(0, co2Kg);
  return {
    co2Kg: round1(safe),
    trees: round1(safe / TREE_KG_PER_YEAR),
    waterLitres: round1(safe * LITRES_WATER_PER_KG_CO2),
    energyKwh: round1(safe * KWH_PER_KG_CO2),
  };
}

/**
 * Sum CO₂ reductions across many sources (e.g. completed missions, challenges)
 * and return aggregated equivalents in a single call.
 */
export function aggregateImpact(items: ReadonlyArray<{ co2Kg: number }>): ImpactEquivalents {
  const total = items.reduce((sum, i) => sum + Math.max(0, i.co2Kg), 0);
  return computeImpact(total);
}
