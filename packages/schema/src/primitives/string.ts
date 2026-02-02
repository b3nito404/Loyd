import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";
export interface StringSchema extends BaseSchema<string> {
  readonly _type: "string";
  minLength(min: number, msg?: string): StringSchema;
  maxLength(max: number, msg?: string): StringSchema;
  length(exact: number, msg?: string): StringSchema;
  email(msg?: string): StringSchema;
  url(msg?: string): StringSchema;
  uuid(msg?: string): StringSchema;
  regex(p: RegExp, msg?: string): StringSchema;
  startsWith(prefix: string, msg?: string): StringSchema;
  endsWith(suffix: string, msg?: string): StringSchema;
  includes(sub: string, msg?: string): StringSchema;
  trim(): StringSchema;
  toLowerCase(): StringSchema;
  toUpperCase(): StringSchema;
  nonempty(msg?: string): StringSchema;
}
type Rule = (v: string) => LoydResult<string> | null;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class StringSchemaImpl extends BaseSchema<string> implements StringSchema {
  readonly _type = "string" as const;
  constructor(
    private readonly _msg: string | undefined,
    readonly _rules: Rule[],
    readonly _transforms: Array<(s: string) => string>,
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<string> {
    if (typeof input !== "string")
      return this._fail(
        "ERR_STRING_INVALID_TYPE",
        [],
        { expected: "string", received: typeof input },
        this._msg,
      );
    let v = input;
    for (const t of this._transforms) v = t(v);
    for (const r of this._rules) {
      const res = r(v);
      if (res !== null) return res;
    }
    return this._ok(v);
  }
  private _c(rules?: Rule[], transforms?: Array<(s: string) => string>): StringSchema {
    return new StringSchemaImpl(
      this._msg,
      rules ?? [...this._rules],
      transforms ?? [...this._transforms],
    );
  }
  minLength(min: number, msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) =>
        v.length < min
          ? this._fail("ERR_STRING_TOO_SHORT", [], { min, actual: v.length }, msg)
          : null,
    ]);
  }
  maxLength(max: number, msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) =>
        v.length > max
          ? this._fail("ERR_STRING_TOO_LONG", [], { max, actual: v.length }, msg)
          : null,
    ]);
  }
  length(exact: number, msg?: string): StringSchema {
    return this.minLength(exact, msg).maxLength(exact, msg);
  }
  email(msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) => (!EMAIL_RE.test(v) ? this._fail("ERR_STRING_INVALID_EMAIL", [], {}, msg) : null),
    ]);
  }
  url(msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) => (!URL_RE.test(v) ? this._fail("ERR_STRING_INVALID_URL", [], {}, msg) : null),
    ]);
  }
  uuid(msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) => (!UUID_RE.test(v) ? this._fail("ERR_STRING_INVALID_UUID", [], {}, msg) : null),
    ]);
  }
  regex(p: RegExp, msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) =>
        !p.test(v) ? this._fail("ERR_STRING_INVALID_REGEX", [], { pattern: p.source }, msg) : null,
    ]);
  }
  startsWith(prefix: string, msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) =>
        !v.startsWith(prefix)
          ? this._fail(
              "ERR_STRING_INVALID_REGEX",
              [],
              { prefix },
              msg ?? `Must start with "${prefix}"`,
            )
          : null,
    ]);
  }
  endsWith(suffix: string, msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) =>
        !v.endsWith(suffix)
          ? this._fail(
              "ERR_STRING_INVALID_REGEX",
              [],
              { suffix },
              msg ?? `Must end with "${suffix}"`,
            )
          : null,
    ]);
  }
  includes(sub: string, msg?: string): StringSchema {
    return this._c([
      ...this._rules,
      (v) =>
        !v.includes(sub)
          ? this._fail("ERR_STRING_INVALID_REGEX", [], { substring: sub }, msg)
          : null,
    ]);
  }
  nonempty(msg?: string): StringSchema {
    return this.minLength(1, msg ?? "Must not be empty");
  }
  trim(): StringSchema {
    return this._c(undefined, [...this._transforms, (s) => s.trim()]);
  }
  toLowerCase(): StringSchema {
    return this._c(undefined, [...this._transforms, (s) => s.toLowerCase()]);
  }
  toUpperCase(): StringSchema {
    return this._c(undefined, [...this._transforms, (s) => s.toUpperCase()]);
  }
}
export function string(msg?: string): StringSchema {
  return new StringSchemaImpl(msg, [], []);
}
