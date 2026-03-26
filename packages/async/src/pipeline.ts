import type { AsyncSchema, LoydResult, LoydSchema } from "@loyd/core";

export interface ParseAsyncOptions {
  // AbortSignal is a DOM/Node global typed loosely here for Phase 0 stub
  signal?: { aborted: boolean };
  timeoutMs?: number;
}

export interface AsyncPipelineResult<T> {
  result: LoydResult<T>;
  syncIssues: LoydResult<T>["issues"];
  asyncIssues: LoydResult<T>["issues"];
  asyncExecuted: boolean;
}

export declare function parseAsync<T>(
  schema: LoydSchema<T> | AsyncSchema<T>,
  input: unknown,
  options?: ParseAsyncOptions
): Promise<LoydResult<T>>;

export declare function parseAsyncDetailed<T>(
  schema: LoydSchema<T> | AsyncSchema<T>,
  input: unknown,
  options?: ParseAsyncOptions
): Promise<AsyncPipelineResult<T>>;
