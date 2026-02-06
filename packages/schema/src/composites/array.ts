import { BaseSchema } from "@loyd/core";
import type { LoydIssue, LoydResult, LoydSchema } from "@loyd/core";
export interface ArraySchema<T> extends BaseSchema<T[]> {
  readonly _type: "array";
  readonly element: LoydSchema<T>;
  min(n: number, msg?: string): ArraySchema<T>;
  max(n: number, msg?: string): ArraySchema<T>;
  length(n: number, msg?: string): ArraySchema<T>;
  nonempty(msg?: string): ArraySchema<T>;
}
class ArraySchemaImpl<T> extends BaseSchema<T[]> implements ArraySchema<T> {
  readonly _type = "array" as const;
  readonly element: LoydSchema<T>;
  readonly _minLen?: number;
  readonly _maxLen?: number;
  constructor(
    element: LoydSchema<T>,
    private readonly _baseMsg?: string,
    minLen?: number,
    maxLen?: number,
  ) {
    super();
    this.element = element;
    this._minLen = minLen;
    this._maxLen = maxLen;
  }
  _validate(input: unknown): LoydResult<T[]> {
    if (!Array.isArray(input))
      return this._fail("ERR_ARRAY_INVALID_TYPE", [], { received: typeof input }, this._baseMsg);
    if (this._minLen !== undefined && input.length < this._minLen)
      return this._fail("ERR_ARRAY_TOO_SHORT", [], { min: this._minLen, actual: input.length });
    if (this._maxLen !== undefined && input.length > this._maxLen)
      return this._fail("ERR_ARRAY_TOO_LONG", [], { max: this._maxLen, actual: input.length });
    const result: T[] = [];
    const issues: LoydIssue[] = [];
    for (let i = 0; i < input.length; i++) {
      const r = this.element.safeParse(input[i]);
      if (r.success) result.push(r.data);
      else for (const iss of r.issues) issues.push({ ...iss, path: [i, ...iss.path] });
    }
    if (issues.length > 0)
      return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result);
  }
  min(n: number, msg?: string) {
    return new ArraySchemaImpl(this.element, msg ?? this._baseMsg, n, this._maxLen);
  }
  max(n: number, msg?: string) {
    return new ArraySchemaImpl(this.element, msg ?? this._baseMsg, this._minLen, n);
  }
  length(n: number, msg?: string) {
    return this.min(n, msg).max(n, msg);
  }
  nonempty(msg?: string) {
    return this.min(1, msg ?? "Array must not be empty");
  }
}
export function array<T>(element: LoydSchema<T>, msg?: string): ArraySchema<T> {
  return new ArraySchemaImpl(element, msg);
}
