import { BaseSchema } from "@loyd/core";
import type { LoydResult, LoydSchema } from "@loyd/core";
import type { RefineOptions } from "./refine.js";
class RefineAsyncSchema<T> extends BaseSchema<T> {
  readonly _type = "refineAsync" as const;
  readonly _isAsync = true as const;
  readonly _pred: (v: T, signal?: AbortSignal) => Promise<boolean>;
  readonly _opts: RefineOptions;
  constructor(
    private readonly _inner: LoydSchema<T>,
    pred: (v: T, signal?: AbortSignal) => Promise<boolean>,
    opts: RefineOptions,
  ) {
    super();
    this._pred = pred;
    this._opts = opts;
  }
  _validate(input: unknown): LoydResult<T> {
    return this._inner.safeParse(input);
  }
}
export function refineAsync<T>(
  schema: LoydSchema<T>,
  pred: (v: T, signal?: AbortSignal) => Promise<boolean>,
  opts: RefineOptions,
): LoydSchema<T> & { readonly _isAsync: true } {
  return new RefineAsyncSchema(schema, pred, opts);
}
