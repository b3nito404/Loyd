import { BaseSchema } from "@loydjs/core";
import type { LoydResult } from "@loydjs/core";
export interface BigIntSchema extends BaseSchema<bigint> {
  readonly _type: "bigint";
  min(v: bigint, msg?: string): BigIntSchema;
  max(v: bigint, msg?: string): BigIntSchema;
  positive(msg?: string): BigIntSchema;
  negative(msg?: string): BigIntSchema;
  nonnegative(msg?: string): BigIntSchema;
  multipleOf(v: bigint, msg?: string): BigIntSchema;
}
type Rule = (v: bigint) => LoydResult<bigint> | null;
class BigIntSchemaImpl extends BaseSchema<bigint> implements BigIntSchema {
  readonly _type = "bigint" as const;
  constructor(
    private readonly _msg: string | undefined,
    private readonly _rules: Rule[],
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<bigint> {
    if (typeof input !== "bigint")
      return this._fail("ERR_BIGINT_INVALID_TYPE", [], { received: typeof input }, this._msg);
    for (const r of this._rules) {
      const res = r(input);
      if (res !== null) return res;
    }
    return this._ok(input);
  }
  private _c(rules: Rule[]) {
    return new BigIntSchemaImpl(this._msg, rules);
  }
  min(v: bigint, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n < v
          ? this._fail("ERR_NUMBER_TOO_SMALL", [], { min: v.toString(), actual: n.toString() }, msg)
          : null,
    ]);
  }
  max(v: bigint, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n > v
          ? this._fail("ERR_NUMBER_TOO_LARGE", [], { max: v.toString(), actual: n.toString() }, msg)
          : null,
    ]);
  }
  positive(msg?: string) {
    return this._c([
      ...this._rules,
      (n) => (n <= 0n ? this._fail("ERR_NUMBER_NOT_POSITIVE", [], {}, msg) : null),
    ]);
  }
  negative(msg?: string) {
    return this._c([
      ...this._rules,
      (n) => (n >= 0n ? this._fail("ERR_NUMBER_NOT_NEGATIVE", [], {}, msg) : null),
    ]);
  }
  nonnegative(msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n < 0n
          ? this._fail("ERR_NUMBER_TOO_SMALL", [], { min: "0", actual: n.toString() }, msg)
          : null,
    ]);
  }
  multipleOf(v: bigint, msg?: string) {
    return this._c([
      ...this._rules,
      (n) =>
        n % v !== 0n
          ? this._fail(
              "ERR_NUMBER_NOT_MULTIPLE",
              [],
              { multipleOf: v.toString(), actual: n.toString() },
              msg,
            )
          : null,
    ]);
  }
}
export function bigint(msg?: string): BigIntSchema {
  return new BigIntSchemaImpl(msg, []);
}
