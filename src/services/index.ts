/**
 * Service layer barrel.
 *
 * Services encapsulate business logic (calculations, generators, parsers)
 * and are UI-agnostic. UI components should import from here rather than
 * from the underlying `@/lib/*` modules so the implementation can evolve
 * without touching feature code.
 */
export * as CarbonService from "./carbon";
export * as RecommendationService from "./recommendations";
export * as MissionService from "./missions";
export * as ImpactService from "./impact";
export * as ReceiptService from "./receipt";
