import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface OptionalSchema<T> extends BaseSchema<T | undefined> { readonly _type: "optional"; unwrap(): BaseSchema<T>; }

class OptionalSchemaImpl<T> extends BaseSchema<T | undefined> implements OptionalSchema<T> {
  readonly _type = "optional" as const;
  constructor(private readonly _inner: BaseSchema<T>) { super(); }
  _validate(input: unknown): LoydResult<T | undefined> {
    if (input === undefined) return this._ok(undefined);
    return this._inner.safeParse(input) as LoydResult<T | undefined>;
  }
  unwrap(): BaseSchema<T> { return this._inner; }
}
export function optional<T>(schema: BaseSchema<T>): OptionalSchema<T> { return new OptionalSchemaImpl(schema); }
