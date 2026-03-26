import { BaseSchema } from "@loyd/core";
import type { LoydSchema, LoydResult, LoydIssue } from "@loyd/core";

export interface ArraySchema<T> extends BaseSchema<T[]> {
  readonly _type: "array";
  readonly element: LoydSchema<T>;
  min(length: number, message?: string): ArraySchema<T>;
  max(length: number, message?: string): ArraySchema<T>;
  length(exact: number, message?: string): ArraySchema<T>;
  nonempty(message?: string): ArraySchema<T>;
}

class ArraySchemaImpl<T> extends BaseSchema<T[]> implements ArraySchema<T> {
  readonly _type = "array" as const;
  readonly element: LoydSchema<T>;
  private readonly _minLen: number | undefined;
  private readonly _maxLen: number | undefined;
  private readonly _minMsg: string | undefined;
  private readonly _maxMsg: string | undefined;
  private readonly _baseMsg: string | undefined;

  constructor(element: LoydSchema<T>, opts: { min?: number; max?: number; minMsg?: string; maxMsg?: string; baseMsg?: string } = {}) {
    super();
    this.element = element;
    this._minLen = opts.min;
    this._maxLen = opts.max;
    this._minMsg = opts.minMsg;
    this._maxMsg = opts.maxMsg;
    this._baseMsg = opts.baseMsg;
  }

  _validate(input: unknown): LoydResult<T[]> {
    if (!Array.isArray(input)) return this._fail("ERR_ARRAY_INVALID_TYPE", [], { received: typeof input }, this._baseMsg);
    if (this._minLen !== undefined && input.length < this._minLen)
      return this._fail("ERR_ARRAY_TOO_SHORT", [], { min: this._minLen, actual: input.length }, this._minMsg);
    if (this._maxLen !== undefined && input.length > this._maxLen)
      return this._fail("ERR_ARRAY_TOO_LONG", [], { max: this._maxLen, actual: input.length }, this._maxMsg);

    const result: T[] = [];
    const issues: LoydIssue[] = [];
    for (let i = 0; i < input.length; i++) {
      const r = this.element.safeParse(input[i]);
      if (r.success) result.push(r.data);
      else for (const iss of r.issues) issues.push({ ...iss, path: [i, ...iss.path] });
    }
    if (issues.length > 0) return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result);
  }

  min(length: number, message?: string): ArraySchema<T> {
    return new ArraySchemaImpl(this.element, { min: length, max: this._maxLen, minMsg: message, maxMsg: this._maxMsg, baseMsg: this._baseMsg });
  }
  max(length: number, message?: string): ArraySchema<T> {
    return new ArraySchemaImpl(this.element, { min: this._minLen, max: length, minMsg: this._minMsg, maxMsg: message, baseMsg: this._baseMsg });
  }
  length(exact: number, message?: string): ArraySchema<T> { return this.min(exact, message).max(exact, message); }
  nonempty(message?: string): ArraySchema<T> { return this.min(1, message ?? "Array must not be empty"); }
}

export function array<T>(element: LoydSchema<T>, message?: string): ArraySchema<T> {
  return new ArraySchemaImpl(element, { baseMsg: message });
}
