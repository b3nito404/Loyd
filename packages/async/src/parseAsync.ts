import { LoydError } from "@loydjs/core";
import type { LoydResult, LoydSchema } from "@loydjs/core";
import { type ParseAsyncOptions, parseAsync } from "./pipeline.js";

export async function parseAsyncOrThrow<T>(
  schema: LoydSchema<T>,
  input: unknown,
  options?: ParseAsyncOptions,
): Promise<T> {
  const result = await parseAsync(schema, input, options);
  if (result.success) return result.data;
  throw new LoydError(result.issues);
}

export async function safeParseAsync<T>(
  schema: LoydSchema<T>,
  input: unknown,
  options?: ParseAsyncOptions,
): Promise<LoydResult<T>> {
  return parseAsync(schema, input, options);
}
