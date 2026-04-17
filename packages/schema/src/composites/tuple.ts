import { BaseSchema } from "@loydjs/core";
import type { LoydResult, LoydSchema } from "@loydjs/core";
export interface TupleSchema<T extends unknown[]> extends BaseSchema<T> {
  readonly _type: "tuple";
}
class TupleSchemaImpl<T extends unknown[]> extends BaseSchema<T> implements TupleSchema<T> {
  readonly _type = "tuple" as const;
  constructor(
    private readonly _items: ReadonlyArray<LoydSchema<unknown>>,
    private readonly _msg?: string,
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<T> {
    if (!Array.isArray(input)) {
      return this._fail("ERR_TUPLE_INVALID_TYPE", [], {
        expected: "tuple",
        received: typeof input,
      });
    }
    if (input.length !== this._items.length) {
      return this._fail("ERR_TUPLE_INVALID_LENGTH", [], {
        expected: this._items.length,
        actual: input.length,
      });
    }
    const data: unknown[] = [];
    const issues: import("@loydjs/core").LoydIssue[] = [];
    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];
      const val = input[i];
      if (!item) continue;
      const r = item.safeParse(val);
      if (!r.success) {
        for (const iss of r.issues) {
          issues.push({ ...iss, path: [i, ...iss.path] });
        }
      } else {
        data.push(r.data);
      }
    }
    if (issues.length > 0) {
      return {
        success: false as const,
        data: undefined,
        issues: issues as [import("@loydjs/core").LoydIssue, ...import("@loydjs/core").LoydIssue[]],
      };
    }
    return this._ok(data as never);
  }
}
export function tuple<T extends unknown[]>(
  items: { [K in keyof T]: LoydSchema<T[K]> },
  msg?: string,
): TupleSchema<T> {
  return new TupleSchemaImpl<T>(items as ReadonlyArray<LoydSchema<unknown>>, msg);
}
