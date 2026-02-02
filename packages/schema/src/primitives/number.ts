import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";
export interface NumberSchema extends BaseSchema<number> {
  readonly _type: "number";
  min(v: number, msg?: string): NumberSchema;
  max(v: number, msg?: string): NumberSchema;
  gt(v: number, msg?: string): NumberSchema;
  gte(v: number, msg?: string): NumberSchema;
  lt(v: number, msg?: string): NumberSchema;
  lte(v: number, msg?: string): NumberSchema;
  int(msg?: string): NumberSchema;
  positive(msg?: string): NumberSchema;
  negative(msg?: string): NumberSchema;
  nonnegative(msg?: string): NumberSchema;
  multipleOf(v: number, msg?: string): NumberSchema;
  finite(msg?: string): NumberSchema;
  safe(msg?: string): NumberSchema;
}
type Rule = (v: number) => LoydResult<number> | null;
class NumberSchemaImpl extends BaseSchema<number> implements NumberSchema {
  readonly _type = "number" as const;
  constructor(
    private readonly _msg: string | undefined,
    readonly _rules: Rule[],
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<number> {
    if (typeof input !== "number")
      return this._fail(
        "ERR_NUMBER_INVALID_TYPE",
        [],
        { expected: "number", received: typeof input },
        this._msg,
      );
    if (Number.isNaN(input)) return this._fail("ERR_NUMBER_NAN", [], {}, this._msg);
    for (const r of this._rules) {
      const res = r(input);
      if (res !== null) return res;
    }
    return this._ok(input);
  }
  private _c(rules: Rule[]) {
    return new NumberSchemaImpl(this._msg, rules);
  }
  min(v: number, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n < v
          ? this._fail("ERR_NUMBER_TOO_SMALL", [], { min: v, actual: n, inclusive: true }, msg)
          : null,
    ]);
  }
  max(v: number, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n > v
          ? this._fail("ERR_NUMBER_TOO_LARGE", [], { max: v, actual: n, inclusive: true }, msg)
          : null,
    ]);
  }
  gt(v: number, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n <= v
          ? this._fail("ERR_NUMBER_TOO_SMALL", [], { min: v, actual: n, inclusive: false }, msg)
          : null,
    ]);
  }
  gte(v: number, msg?: string) {
    return this.min(v, msg);
  }
  lt(v: number, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n >= v
          ? this._fail("ERR_NUMBER_TOO_LARGE", [], { max: v, actual: n, inclusive: false }, msg)
          : null,
    ]);
  }
  lte(v: number, msg?: string) {
    return this.max(v, msg);
  }
  int(msg?: string) {
    return this._c([
      ...this._rules,
      (n) => (!Number.isInteger(n) ? this._fail("ERR_NUMBER_NOT_INTEGER", [], {}, msg) : null),
    ]);
  }
  positive(msg?: string) {
    return this.gt(0, msg);
  }
  negative(msg?: string) {
    return this.lt(0, msg);
  }
  nonnegative(msg?: string) {
    return this.min(0, msg);
  }
  multipleOf(v: number, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n % v !== 0
          ? this._fail("ERR_NUMBER_NOT_MULTIPLE", [], { multipleOf: v, actual: n }, msg)
          : null,
    ]);
  }
  finite(msg?: string) {
    return this._c([
      ...this._rules,
      (n) => (!Number.isFinite(n) ? this._fail("ERR_NUMBER_NOT_FINITE", [], {}, msg) : null),
    ]);
  }
  safe(msg?: string) {
    return this._c([
      ...this._rules,
      (n) => (!Number.isSafeInteger(n) ? this._fail("ERR_NUMBER_NOT_INTEGER", [], {}, msg) : null),
    ]);
  }
}
export function number(msg?: string): NumberSchema {
  return new NumberSchemaImpl(msg, []);
}
