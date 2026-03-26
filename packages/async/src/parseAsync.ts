import type { LoydSchema, LoydResult, AsyncSchema } from "@loyd/core";
import type { ParseAsyncOptions } from "./pipeline.js";


export declare function parseAsyncOrThrow<T>(
  schema: LoydSchema<T> | AsyncSchema<T>,
  input: unknown,
  options?: ParseAsyncOptions,
): Promise<T>;

export declare function safeParseAsync<T>(
  schema: LoydSchema<T> | AsyncSchema<T>,
  input: unknown,
  options?: ParseAsyncOptions,
): Promise<LoydResult<T>>;
