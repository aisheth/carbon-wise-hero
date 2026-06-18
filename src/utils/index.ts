/**
 * Generic utilities barrel.
 *
 * Pure helpers with no dependency on UI, services, or I/O. Re-exports the
 * shared `cn` class-name combinator plus numeric helpers used by the
 * carbon engine so non-business code can reuse them.
 */
export { cn } from "@/lib/utils";
export { clamp, round1 } from "@/lib/carbon";
