// packages/graph/src/incremental.ts
import type { LoydResult, LoydIssue } from "@loyd/core";
import type { FieldDag } from "./dag.js";
import type { DirtyTracker } from "./dirty.js";

export interface IncrementalValidationOptions {
  /**
   * @default true
   */
  incrementalOnly?: boolean;
  /**
   * @default true
   */
  preservePreviousErrors?: boolean;
}

export interface IncrementalValidationResult<T> {
  result: LoydResult<T>;
  revalidatedFields: string[][];
  preservedFields: string[][];
  revalidationRatio: number;
}

/**
 * Incrementally validates an object using the DAG.
 * Only dirty fields and their dependents are revalidated.
 *
 * @example
 * const { result, revalidationRatio } = validateIncremental(
 *   dag,
 *   dirtyTracker,
 *   formValues,
 *   previousErrors,
 * );
 * // revalidationRatio: 0.15 -> only 15% fields revalidated
 */
export declare function validateIncremental<T>(
  dag: FieldDag,
  dirtyTracker: DirtyTracker,
  input: unknown,
  previousIssues: LoydIssue[],
  options?: IncrementalValidationOptions,
): IncrementalValidationResult<T>;
