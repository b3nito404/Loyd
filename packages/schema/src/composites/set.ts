import { BaseSchema } from "@loyd/core";
import type { LoydSchema, LoydResult, LoydIssue } from "@loyd/core";

export interface SetSchema<T> extends BaseSchema<Set<T>> {
  readonly _type: "set";
  min(size: number, message?: string): SetSchema<T>;
  max(size: number, message?: string): SetSchema<T>;
  nonempty(message?: string): SetSchema<T>;
}

class SetSchemaImpl<T> extends BaseSchema<Set<T>> implements SetSchema<T> {
  readonly _type = "set" as const;
  constructor(private readonly _v: LoydSchema<T>, private readonly _min?: number, private readonly _max?: number, private readonly _msg?: string) { super(); }

  _validate(input: unknown): LoydResult<Set<T>> {
    if (!(input instanceof Set)) return this._fail("ERR_SET_INVALID_TYPE", [], { received: typeof input }, this._msg);
    if (this._min !== undefined && input.size < this._min) return this._fail("ERR_ARRAY_TOO_SHORT", [], { min: this._min, actual: input.size }, this._msg);
    if (this._max !== undefined && input.size > this._max) return this._fail("ERR_ARRAY_TOO_LONG", [], { max: this._max, actual: input.size }, this._msg);
    const result = new Set<T>(); const issues: LoydIssue[] = []; let i = 0;
    for (const v of input) {
      const r = this._v.safeParse(v);
      if (r.success) result.add(r.data);
      else for (const iss of r.issues) issues.push({ ...iss, path: [i, ...iss.path] });
      i++;
    }
    if (issues.length > 0) return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result);
  }

  min(size: number, message?: string): SetSchema<T> { return new SetSchemaImpl(this._v, size, this._max, message); }
  max(size: number, message?: string): SetSchema<T> { return new SetSchemaImpl(this._v, this._min, size, message); }
  nonempty(message?: string): SetSchema<T> { return this.min(1, message); }
}
export function set<T>(v: LoydSchema<T>, message?: string): SetSchema<T> { return new SetSchemaImpl(v, undefined, undefined, message); }
