import { BaseSchema } from "@loydjs/core";
import type { LoydResult } from "@loydjs/core";
export interface NullableSchema<T> extends BaseSchema<T | null> {
  readonly _type: "nullable";
  readonly _inner: BaseSchema<T>;
  unwrap(): BaseSchema<T>;
}
export interface NullishSchema<T> extends BaseSchema<T | null | undefined> {
  readonly _type: "nullish";
  readonly _inner: BaseSchema<T>;
  unwrap(): BaseSchema<T>;
}
class NullableSchemaImpl<T> extends BaseSchema<T | null> implements NullableSchema<T> {
  readonly _type = "nullable" as const;
  readonly _inner: BaseSchema<T>;
  constructor(inner: BaseSchema<T>) {
    super();
    this._inner = inner;
  }
  _validate(input: unknown): LoydResult<T | null> {
    if (input === null) return this._ok(null);
    return this._inner.safeParse(input) as LoydResult<T | null>;
  }
  unwrap() {
    return this._inner;
  }
}
class NullishSchemaImpl<T> extends BaseSchema<T | null | undefined> implements NullishSchema<T> {
  readonly _type = "nullish" as const;
  readonly _inner: BaseSchema<T>;
  constructor(inner: BaseSchema<T>) {
    super();
    this._inner = inner;
  }
  _validate(input: unknown): LoydResult<T | null | undefined> {
    if (input === null || input === undefined) return this._ok(input as null | undefined);
    return this._inner.safeParse(input) as LoydResult<T | null | undefined>;
  }
  unwrap() {
    return this._inner;
  }
}
export function nullable<T>(schema: BaseSchema<T>): NullableSchema<T> {
  return new NullableSchemaImpl(schema);
}
export function nullish<T>(schema: BaseSchema<T>): NullishSchema<T> {
  return new NullishSchemaImpl(schema);
}
