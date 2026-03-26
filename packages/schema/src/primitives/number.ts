import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface NumberSchema extends BaseSchema<number> {
  readonly _type: "number";
  min(value: number, message?: string): NumberSchema;
  max(value: number, message?: string): NumberSchema;
  gt(value: number, message?: string): NumberSchema;
  gte(value: number, message?: string): NumberSchema;
  lt(value: number, message?: string): NumberSchema;
  lte(value: number, message?: string): NumberSchema;
  int(message?: string): NumberSchema;
  positive(message?: string): NumberSchema;
  negative(message?: string): NumberSchema;
  nonnegative(message?: string): NumberSchema;
  multipleOf(value: number, message?: string): NumberSchema;
  finite(message?: string): NumberSchema;
  safe(message?: string): NumberSchema;
}

type NumberRule = (value: number) => LoydResult<number> | null;

class NumberSchemaImpl extends BaseSchema<number> implements NumberSchema {
  readonly _type = "number" as const;
  private readonly _rules: NumberRule[];

  constructor(
    private readonly _msg: string | undefined,
    rules: NumberRule[]
  ) {
    super();
    this._rules = rules;
  }

  _validate(input: unknown): LoydResult<number> {
    if (typeof input !== "number") {
      return this._fail(
        "ERR_NUMBER_INVALID_TYPE",
        [],
        { expected: "number", received: typeof input },
        this._msg
      );
    }
    if (Number.isNaN(input)) return this._fail("ERR_NUMBER_NAN", [], {}, this._msg);
    for (const rule of this._rules) {
      const r = rule(input);
      if (r !== null) return r;
    }
    return this._ok(input);
  }

  private _clone(newRules: NumberRule[]): NumberSchema {
    return new NumberSchemaImpl(this._msg, newRules);
  }

  min(value: number, message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) =>
        v < value
          ? this._fail(
              "ERR_NUMBER_TOO_SMALL",
              [],
              { min: value, actual: v, inclusive: true },
              message
            )
          : null,
    ]);
  }
  max(value: number, message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) =>
        v > value
          ? this._fail(
              "ERR_NUMBER_TOO_LARGE",
              [],
              { max: value, actual: v, inclusive: true },
              message
            )
          : null,
    ]);
  }
  gt(value: number, message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) =>
        v <= value
          ? this._fail(
              "ERR_NUMBER_TOO_SMALL",
              [],
              { min: value, actual: v, inclusive: false },
              message
            )
          : null,
    ]);
  }
  gte(value: number, message?: string): NumberSchema {
    return this.min(value, message);
  }
  lt(value: number, message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) =>
        v >= value
          ? this._fail(
              "ERR_NUMBER_TOO_LARGE",
              [],
              { max: value, actual: v, inclusive: false },
              message
            )
          : null,
    ]);
  }
  lte(value: number, message?: string): NumberSchema {
    return this.max(value, message);
  }
  int(message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) => (!Number.isInteger(v) ? this._fail("ERR_NUMBER_NOT_INTEGER", [], {}, message) : null),
    ]);
  }
  positive(message?: string): NumberSchema {
    return this.gt(0, message);
  }
  negative(message?: string): NumberSchema {
    return this.lt(0, message);
  }
  nonnegative(message?: string): NumberSchema {
    return this.min(0, message);
  }
  multipleOf(value: number, message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) =>
        v % value !== 0
          ? this._fail("ERR_NUMBER_NOT_MULTIPLE", [], { multipleOf: value, actual: v }, message)
          : null,
    ]);
  }
  finite(message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) => (!Number.isFinite(v) ? this._fail("ERR_NUMBER_NOT_FINITE", [], {}, message) : null),
    ]);
  }
  safe(message?: string): NumberSchema {
    return this._clone([
      ...this._rules,
      (v) =>
        !Number.isSafeInteger(v) ? this._fail("ERR_NUMBER_NOT_INTEGER", [], {}, message) : null,
    ]);
  }
}

export function number(message?: string): NumberSchema {
  return new NumberSchemaImpl(message, []);
}
