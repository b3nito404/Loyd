import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface TransformedSchema<TOut, TIn> extends BaseSchema<TOut, TIn> { readonly _type: "transform"; }

class TransformSchemaImpl<TOut, TIn> extends BaseSchema<TOut, TIn> implements TransformedSchema<TOut, TIn> {
  readonly _type = "transform" as const;
  constructor(private readonly _inner: BaseSchema<TIn>, private readonly _fn: (v: TIn) => TOut) { super(); }
  _validate(input: unknown): LoydResult<TOut> {
    const r = this._inner.safeParse(input);
    if (!r.success) return r as unknown as LoydResult<TOut>;
    try {
      return this._ok(this._fn(r.data));
    } catch (e) {
      return this._fail("ERR_UNKNOWN", [], {}, e instanceof Error ? e.message : String(e));
    }
  }
}
export function transform<TIn, TOut>(schema: BaseSchema<TIn>, fn: (v: TIn) => TOut): TransformedSchema<TOut, TIn> {
  return new TransformSchemaImpl(schema, fn);
}
