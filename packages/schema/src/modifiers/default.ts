import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface DefaultSchema<T> extends BaseSchema<T> {
  readonly _type: "default";
}

class DefaultSchemaImpl<T> extends BaseSchema<T> implements DefaultSchema<T> {
  readonly _type = "default" as const;
  constructor(
    private readonly _inner: BaseSchema<T | undefined>,
    private readonly _default: T | (() => T)
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<T> {
    const resolved =
      input === undefined
        ? typeof this._default === "function"
          ? (this._default as () => T)()
          : this._default
        : input;
    return this._inner.safeParse(resolved) as LoydResult<T>;
  }
}
export function withDefault<T>(
  schema: BaseSchema<T | undefined>,
  defaultValue: T | (() => T)
): DefaultSchema<T> {
  return new DefaultSchemaImpl(schema, defaultValue);
}
