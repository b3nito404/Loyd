import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface StringSchema extends BaseSchema<string> {
  readonly _type: "string";
  minLength(min: number, message?: string): StringSchema;
  maxLength(max: number, message?: string): StringSchema;
  length(exact: number, message?: string): StringSchema;
  email(message?: string): StringSchema;
  url(message?: string): StringSchema;
  uuid(message?: string): StringSchema;
  regex(pattern: RegExp, message?: string): StringSchema;
  startsWith(prefix: string, message?: string): StringSchema;
  endsWith(suffix: string, message?: string): StringSchema;
  includes(substring: string, message?: string): StringSchema;
  trim(): StringSchema;
  toLowerCase(): StringSchema;
  toUpperCase(): StringSchema;
  nonempty(message?: string): StringSchema;
}

type StringRule = (value: string) => LoydResult<string> | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class StringSchemaImpl extends BaseSchema<string> implements StringSchema {
  readonly _type = "string" as const;
  private readonly _rules: StringRule[];
  private readonly _transforms: Array<(s: string) => string>;

  constructor(
    private readonly _requiredMessage: string | undefined,
    rules: StringRule[],
    transforms: Array<(s: string) => string>,
  ) {
    super();
    this._rules = rules;
    this._transforms = transforms;
  }

  _validate(input: unknown): LoydResult<string> {
    if (typeof input !== "string") {
      return this._fail("ERR_STRING_INVALID_TYPE", [], { expected: "string", received: typeof input }, this._requiredMessage);
    }
    let value = input;
    for (const t of this._transforms) value = t(value);
    for (const rule of this._rules) {
      const result = rule(value);
      if (result !== null) return result;
    }
    return this._ok(value);
  }

  private _clone(newRules?: StringRule[], newTransforms?: Array<(s: string) => string>): StringSchema {
    return new StringSchemaImpl(this._requiredMessage, newRules ?? [...this._rules], newTransforms ?? [...this._transforms]);
  }

  minLength(min: number, message?: string): StringSchema {
    return this._clone([...this._rules, (v) => v.length < min ? this._fail("ERR_STRING_TOO_SHORT", [], { min, actual: v.length }, message) : null]);
  }
  maxLength(max: number, message?: string): StringSchema {
    return this._clone([...this._rules, (v) => v.length > max ? this._fail("ERR_STRING_TOO_LONG", [], { max, actual: v.length }, message) : null]);
  }
  length(exact: number, message?: string): StringSchema { return this.minLength(exact, message).maxLength(exact, message); }
  email(message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !EMAIL_REGEX.test(v) ? this._fail("ERR_STRING_INVALID_EMAIL", [], {}, message) : null]);
  }
  url(message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !URL_REGEX.test(v) ? this._fail("ERR_STRING_INVALID_URL", [], {}, message) : null]);
  }
  uuid(message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !UUID_REGEX.test(v) ? this._fail("ERR_STRING_INVALID_UUID", [], {}, message) : null]);
  }
  regex(pattern: RegExp, message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !pattern.test(v) ? this._fail("ERR_STRING_INVALID_REGEX", [], { pattern: pattern.source }, message) : null]);
  }
  startsWith(prefix: string, message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !v.startsWith(prefix) ? this._fail("ERR_STRING_INVALID_REGEX", [], { prefix }, message ?? `Must start with "${prefix}"`) : null]);
  }
  endsWith(suffix: string, message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !v.endsWith(suffix) ? this._fail("ERR_STRING_INVALID_REGEX", [], { suffix }, message ?? `Must end with "${suffix}"`) : null]);
  }
  includes(substring: string, message?: string): StringSchema {
    return this._clone([...this._rules, (v) => !v.includes(substring) ? this._fail("ERR_STRING_INVALID_REGEX", [], { substring }, message ?? `Must include "${substring}"`) : null]);
  }
  nonempty(message?: string): StringSchema { return this.minLength(1, message ?? "Must not be empty"); }
  trim(): StringSchema { return this._clone(undefined, [...this._transforms, (s) => s.trim()]); }
  toLowerCase(): StringSchema { return this._clone(undefined, [...this._transforms, (s) => s.toLowerCase()]); }
  toUpperCase(): StringSchema { return this._clone(undefined, [...this._transforms, (s) => s.toUpperCase()]); }
}

export function string(message?: string): StringSchema {
  return new StringSchemaImpl(message, [], []);
}
