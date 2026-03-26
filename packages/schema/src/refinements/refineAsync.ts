import { BaseSchema } from "@loyd/core";
import type { LoydResult, LoydSchema } from "@loyd/core";
import type { RefineOptions } from "./refine.js";

export function refineAsync<T>(
  schema: LoydSchema<T>,
  _pred: (v: T, signal?: unknown) => Promise<boolean>,
  _opts: RefineOptions
): LoydSchema<T> {
  return new (class extends BaseSchema<T> {
    readonly _type = "refineAsync" as const;
    _validate(input: unknown): LoydResult<T> {
      return schema.safeParse(input);
    }
  })();
}
