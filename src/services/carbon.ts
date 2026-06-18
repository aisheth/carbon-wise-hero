/**
 * Carbon service — re-exports the carbon calculation engine from `@/lib/carbon`.
 *
 * This module exists so feature code can import calculations from a stable
 * service layer (`@/services/carbon`) without coupling to the underlying
 * implementation file. The actual pure functions live in `@/lib/carbon`.
 */
export {
  assess,
  calculateEmissions,
  calculateScore,
  generateRecommendations,
  simulateChange,
  clamp,
  round1,
} from "@/lib/carbon";
export type {
  AssessmentInputs,
  AssessmentResult,
  CategoryBreakdown,
  Recommendation,
  CarType,
  DietType,
  ShoppingHabit,
  WasteHabit,
} from "@/lib/carbon";
