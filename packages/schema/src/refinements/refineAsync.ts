import { BaseSchema } from "@loyd/core";
import type { LoydSchema, LoydResult } from "@loyd/core";
import type { RefineOptions } from "./refine.js";

export function refineAsync<T>(
  schema: LoydSchema<T>,
  // AbortSignal comes from DOM / @types/node typed as unknown for Phase 0 stub
  pred: (v: T, signal?: unknown) => Promise<boolean>,
  opts: RefineOptions,
): LoydSchema<T> {
  const stub = new (class extends BaseSchema<T> {
    readonly _type = "refineAsync" as const;
    _validate(input: unknown): LoydResult<T> {
      return schema.safeParse(input);
    }
  })();
  return stub;
}
