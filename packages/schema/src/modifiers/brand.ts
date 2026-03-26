import { BaseSchema, asBranded } from "@loyd/core";
import type { Branded, LoydResult } from "@loyd/core";

export interface BrandedSchema<T, B extends string> extends BaseSchema<Branded<T, B>> {
  readonly _type: "brand";
  readonly brandName: B;
  unwrap(): BaseSchema<T>;
}

class BrandedSchemaImpl<T, B extends string> extends BaseSchema<Branded<T, B>> implements BrandedSchema<T, B> {
  readonly _type = "brand" as const;
  readonly brandName: B;
  constructor(private readonly _inner: BaseSchema<T>, name: B) { super(); this.brandName = name; }
  _validate(input: unknown): LoydResult<Branded<T, B>> {
    const r = this._inner.safeParse(input);
    if (!r.success) return r as unknown as LoydResult<Branded<T, B>>;
    return this._ok(asBranded<T, B>(r.data));
  }
  unwrap(): BaseSchema<T> { return this._inner; }
}
export function brand<T, B extends string>(schema: BaseSchema<T>, name: B): BrandedSchema<T, B> {
  return new BrandedSchemaImpl(schema, name);
}
