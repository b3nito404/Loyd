import { BaseSchema } from "@loyd/core";
import type { LoydResult, LoydSchema } from "@loyd/core";

export interface LazySchema<T> extends BaseSchema<T> {
  readonly _type: "lazy";
  resolve(): LoydSchema<T>;
}

class LazySchemaImpl<T> extends BaseSchema<T> implements LazySchema<T> {
  readonly _type = "lazy" as const;
  private _resolved: LoydSchema<T> | undefined;
  constructor(private readonly _factory: () => LoydSchema<T>) {
    super();
  }
  resolve(): LoydSchema<T> {
    if (this._resolved === undefined) { this._resolved = this._factory(); }
    return this._resolved;
  }
  _validate(input: unknown): LoydResult<T> {
    return this.resolve().safeParse(input);
  }
}
export function lazy<T>(factory: () => LoydSchema<T>): LazySchema<T> {
  return new LazySchemaImpl(factory);
}
