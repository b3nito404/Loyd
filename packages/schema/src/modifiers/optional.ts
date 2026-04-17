import { BaseSchema } from "@loydjs/core";
import type { LoydResult } from "@loydjs/core";
export interface OptionalSchema<T> extends BaseSchema<T | undefined> {
  readonly _type: "optional";
  readonly _inner: BaseSchema<T>;
  unwrap(): BaseSchema<T>;
}
class OptionalSchemaImpl<T> extends BaseSchema<T | undefined> implements OptionalSchema<T> {
  readonly _type = "optional" as const;
  readonly _inner: BaseSchema<T>;
  constructor(inner: BaseSchema<T>) {
    super();
    this._inner = inner;
  }
  _validate(input: unknown): LoydResult<T | undefined> {
    if (input === undefined) return this._ok(undefined);
    return this._inner.safeParse(input) as LoydResult<T | undefined>;
  }
  unwrap() {
    return this._inner;
  }
}
export function optional<T>(schema: BaseSchema<T>): OptionalSchema<T> {
  return new OptionalSchemaImpl(schema);
}
