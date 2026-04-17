import { BaseSchema } from "@loydjs/core";
import type { LoydResult } from "@loydjs/core";
export interface DefaultSchema<T> extends BaseSchema<T> {
  readonly _type: "default";
}
class DefaultSchemaImpl<T> extends BaseSchema<T> implements DefaultSchema<T> {
  readonly _type = "default" as const;
  constructor(
    private readonly _inner: BaseSchema<T | undefined>,
    private readonly _default: T | (() => T),
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<T> {
    const v =
      input === undefined
        ? typeof this._default === "function"
          ? (this._default as () => T)()
          : this._default
        : input;
    return this._inner.safeParse(v) as LoydResult<T>;
  }
}
export function withDefault<T>(
  schema: BaseSchema<T | undefined>,
  defaultValue: T | (() => T),
): DefaultSchema<T> {
  return new DefaultSchemaImpl(schema, defaultValue);
}
