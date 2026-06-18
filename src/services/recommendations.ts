/**
 * Recommendation service — thin facade over the recommendation generator in
 * the carbon engine. Exposes `generateRecommendations` and a convenience
 * helper for picking the top-N highest-impact actions.
 */
import { generateRecommendations, type Recommendation } from "@/lib/carbon";

export { generateRecommendations };
export type { Recommendation };

/**
 * Return the top `n` recommendations ranked by estimated CO₂ saving (desc).
 * Pure — does not mutate the input array.
 */
export function topRecommendations(recs: Recommendation[], n = 3): Recommendation[] {
  return [...recs].sort((a, b) => b.estimatedSavingKg - a.estimatedSavingKg).slice(0, n);
}
