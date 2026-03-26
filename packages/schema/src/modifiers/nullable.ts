import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface NullableSchema<T> extends BaseSchema<T | null> {
  readonly _type: "nullable";
  unwrap(): BaseSchema<T>;
}
export interface NullishSchema<T> extends BaseSchema<T | null | undefined> {
  readonly _type: "nullish";
  unwrap(): BaseSchema<T>;
}

class NullableSchemaImpl<T> extends BaseSchema<T | null> implements NullableSchema<T> {
  readonly _type = "nullable" as const;
  constructor(private readonly _inner: BaseSchema<T>) {
    super();
  }
  _validate(input: unknown): LoydResult<T | null> {
    if (input === null) return this._ok(null);
    return this._inner.safeParse(input) as LoydResult<T | null>;
  }
  unwrap(): BaseSchema<T> {
    return this._inner;
  }
}

class NullishSchemaImpl<T> extends BaseSchema<T | null | undefined> implements NullishSchema<T> {
  readonly _type = "nullish" as const;
  constructor(private readonly _inner: BaseSchema<T>) {
    super();
  }
  _validate(input: unknown): LoydResult<T | null | undefined> {
    if (input === null || input === undefined) return this._ok(input as null | undefined);
    return this._inner.safeParse(input) as LoydResult<T | null | undefined>;
  }
  unwrap(): BaseSchema<T> {
    return this._inner;
  }
}

export function nullable<T>(schema: BaseSchema<T>): NullableSchema<T> {
  return new NullableSchemaImpl(schema);
}
export function nullish<T>(schema: BaseSchema<T>): NullishSchema<T> {
  return new NullishSchemaImpl(schema);
}
