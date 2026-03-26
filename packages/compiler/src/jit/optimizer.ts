import type { LoydSchema } from "@loyd/core";

export interface OptimizerResult {
  /** Optimized schema (may be the same if no optimization is applicable) */
  schema: LoydSchema<unknown>;
  appliedOptimizations: string[];
}
/**
 * Optimise un schéma avant compilation :
 * - Merges redundant minLength and maxLength functions
 * - Eliminates unnecessary nested optional() functions
 * - Inlines lazy() functions that are only resolved once
 * - Reorders rules from least expensive to most expensive
 *
 * @example
 * // pipe(string(), minLength(3), minLength(5)) -> pipe(string(), minLength(5))
 * const { schema, appliedOptimizations } = optimize(rawSchema);
 */
export declare function optimize(schema: LoydSchema<unknown>): OptimizerResult;
