import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface DateSchema extends BaseSchema<Date> {
  readonly _type: "date";
  min(date: Date, message?: string): DateSchema;
  max(date: Date, message?: string): DateSchema;
  past(message?: string): DateSchema;
  future(message?: string): DateSchema;
}

type DateRule = (value: Date) => LoydResult<Date> | null;

class DateSchemaImpl extends BaseSchema<Date> implements DateSchema {
  readonly _type = "date" as const;
  private readonly _rules: DateRule[];

  constructor(private readonly _msg: string | undefined, rules: DateRule[]) {
    super();
    this._rules = rules;
  }

  _validate(input: unknown): LoydResult<Date> {
    const d = input instanceof Date ? input : (typeof input === "string" || typeof input === "number") ? new Date(input) : null;
    if (!d || isNaN(d.getTime())) {
      return this._fail("ERR_DATE_INVALID_TYPE", [], { received: typeof input }, this._msg);
    }
    for (const rule of this._rules) {
      const r = rule(d);
      if (r !== null) return r;
    }
    return this._ok(d);
  }

  private _clone(rules: DateRule[]): DateSchema { return new DateSchemaImpl(this._msg, rules); }

  min(date: Date, message?: string): DateSchema {
    return this._clone([...this._rules, (v) => v < date ? this._fail("ERR_DATE_TOO_EARLY", [], { min: date, actual: v }, message) : null]);
  }
  max(date: Date, message?: string): DateSchema {
    return this._clone([...this._rules, (v) => v > date ? this._fail("ERR_DATE_TOO_LATE", [], { max: date, actual: v }, message) : null]);
  }
  past(message?: string): DateSchema { return this.max(new Date(), message); }
  future(message?: string): DateSchema { return this.min(new Date(), message); }
}

export function date(message?: string): DateSchema { return new DateSchemaImpl(message, []); }
