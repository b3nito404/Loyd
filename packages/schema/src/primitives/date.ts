import { BaseSchema } from "@loydjs/core";
import type { LoydResult } from "@loydjs/core";
export interface DateSchema extends BaseSchema<Date> {
  readonly _type: "date";
  min(d: Date, msg?: string): DateSchema;
  max(d: Date, msg?: string): DateSchema;
  past(msg?: string): DateSchema;
  future(msg?: string): DateSchema;
}
type Rule = (v: Date) => LoydResult<Date> | null;
class DateSchemaImpl extends BaseSchema<Date> implements DateSchema {
  readonly _type = "date" as const;
  constructor(
    private readonly _msg: string | undefined,
    private readonly _rules: Rule[],
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<Date> {
    const d =
      input instanceof Date
        ? input
        : typeof input === "string" || typeof input === "number"
          ? new Date(input)
          : null;
    if (!d || Number.isNaN(d.getTime()))
      return this._fail("ERR_DATE_INVALID_TYPE", [], { received: typeof input }, this._msg);
    for (const r of this._rules) {
      const res = r(d);
      if (res !== null) return res;
    }
    return this._ok(d);
  }
  private _c(rules: Rule[]) {
    return new DateSchemaImpl(this._msg, rules);
  }
  min(d: Date, msg?: string) {
    return this._c([
      ...this._rules,
      (v) => (v < d ? this._fail("ERR_DATE_TOO_EARLY", [], { min: d, actual: v }, msg) : null),
    ]);
  }
  max(d: Date, msg?: string) {
    return this._c([
      ...this._rules,
      (v) => (v > d ? this._fail("ERR_DATE_TOO_LATE", [], { max: d, actual: v }, msg) : null),
    ]);
  }
  past(msg?: string) {
    return this.max(new Date(), msg);
  }
  future(msg?: string) {
    return this.min(new Date(), msg);
  }
}
export function date(msg?: string): DateSchema {
  return new DateSchemaImpl(msg, []);
}
