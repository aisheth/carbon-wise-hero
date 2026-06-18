/**
 * Shared domain types barrel.
 *
 * Re-exports the canonical domain types so feature code can import from a
 * single, stable location (`@/types`) instead of reaching into `@/lib/*`.
 */
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
export type { ImpactEquivalents } from "@/lib/impact";
export type { ReceiptItem } from "@/lib/receipt";
