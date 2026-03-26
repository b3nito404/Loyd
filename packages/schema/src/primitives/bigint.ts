import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface BigIntSchema extends BaseSchema<bigint> {
  readonly _type: "bigint";
  min(value: bigint, message?: string): BigIntSchema;
  max(value: bigint, message?: string): BigIntSchema;
  positive(message?: string): BigIntSchema;
  negative(message?: string): BigIntSchema;
  nonnegative(message?: string): BigIntSchema;
  multipleOf(value: bigint, message?: string): BigIntSchema;
}

type BigIntRule = (value: bigint) => LoydResult<bigint> | null;

class BigIntSchemaImpl extends BaseSchema<bigint> implements BigIntSchema {
  readonly _type = "bigint" as const;
  private readonly _rules: BigIntRule[];
  constructor(private readonly _msg: string | undefined, rules: BigIntRule[]) { super(); this._rules = rules; }

  _validate(input: unknown): LoydResult<bigint> {
    if (typeof input !== "bigint") return this._fail("ERR_BIGINT_INVALID_TYPE", [], { received: typeof input }, this._msg);
    for (const rule of this._rules) { const r = rule(input); if (r !== null) return r; }
    return this._ok(input);
  }

  private _clone(rules: BigIntRule[]): BigIntSchema { return new BigIntSchemaImpl(this._msg, rules); }
  min(value: bigint, message?: string): BigIntSchema { return this._clone([...this._rules, (v) => v < value ? this._fail("ERR_NUMBER_TOO_SMALL", [], { min: value.toString(), actual: v.toString() }, message) : null]); }
  max(value: bigint, message?: string): BigIntSchema { return this._clone([...this._rules, (v) => v > value ? this._fail("ERR_NUMBER_TOO_LARGE", [], { max: value.toString(), actual: v.toString() }, message) : null]); }
  positive(message?: string): BigIntSchema { return this._clone([...this._rules, (v) => v <= 0n ? this._fail("ERR_NUMBER_NOT_POSITIVE", [], {}, message) : null]); }
  negative(message?: string): BigIntSchema { return this._clone([...this._rules, (v) => v >= 0n ? this._fail("ERR_NUMBER_NOT_NEGATIVE", [], {}, message) : null]); }
  nonnegative(message?: string): BigIntSchema { return this._clone([...this._rules, (v) => v < 0n ? this._fail("ERR_NUMBER_TOO_SMALL", [], { min: "0", actual: v.toString() }, message) : null]); }
  multipleOf(value: bigint, message?: string): BigIntSchema { return this._clone([...this._rules, (v) => v % value !== 0n ? this._fail("ERR_NUMBER_NOT_MULTIPLE", [], { multipleOf: value.toString(), actual: v.toString() }, message) : null]); }
}

export function bigint(message?: string): BigIntSchema { return new BigIntSchemaImpl(message, []); }
