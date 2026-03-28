import { BaseSchema } from "@loyd/core";
import type { LoydIssue, LoydResult, LoydSchema } from "@loyd/core";

export interface TupleSchema<T extends unknown[]> extends BaseSchema<T> {
  readonly _type: "tuple";
  rest<R>(schema: LoydSchema<R>): BaseSchema<[...T, ...R[]]>;
}

class TupleSchemaImpl<T extends unknown[]> extends BaseSchema<T> implements TupleSchema<T> {
  readonly _type = "tuple" as const;
  constructor(
    private readonly _items: ReadonlyArray<LoydSchema<unknown>>,
    private readonly _msg?: string
  ) {
    super();
  }

  _validate(input: unknown): LoydResult<T> {
    if (!Array.isArray(input))
      return this._fail("ERR_TUPLE_INVALID_TYPE", [], { received: typeof input }, this._msg);
    if (input.length !== this._items.length)
      return this._fail(
        "ERR_TUPLE_INVALID_LENGTH",
        [],
        { expected: this._items.length, actual: input.length },
        this._msg
      );
    const result: unknown[] = [];
    const issues: LoydIssue[] = [];
    for (let i = 0; i < this._items.length; i++) {
      const r = this._items[i]?.safeParse(input[i]);
      if (r.success) result.push(r.data);
      else for (const iss of r.issues) issues.push({ ...iss, path: [i, ...iss.path] });
    }
    if (issues.length > 0)
      return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result as T);
  }

  rest<R>(schema: LoydSchema<R>): BaseSchema<[...T, ...R[]]> {
    return new TupleWithRestSchemaImpl<T, R>(this._items, schema);
  }
}

class TupleWithRestSchemaImpl<T extends unknown[], R> extends BaseSchema<[...T, ...R[]]> {
  readonly _type = "tuple" as const;
  constructor(
    private readonly _items: ReadonlyArray<LoydSchema<unknown>>,
    private readonly _rest: LoydSchema<R>
  ) {
    super();
  }

  _validate(input: unknown): LoydResult<[...T, ...R[]]> {
    if (!Array.isArray(input))
      return this._fail("ERR_TUPLE_INVALID_TYPE", [], { received: typeof input });
    if (input.length < this._items.length)
      return this._fail("ERR_TUPLE_INVALID_LENGTH", [], {
        expected: this._items.length,
        actual: input.length,
      });
    const result: unknown[] = [];
    const issues: LoydIssue[] = [];
    for (let i = 0; i < this._items.length; i++) {
      const r = this._items[i]?.safeParse(input[i]);
      if (r.success) result.push(r.data);
      else for (const iss of r.issues) issues.push({ ...iss, path: [i, ...iss.path] });
    }
    for (let i = this._items.length; i < input.length; i++) {
      const r = this._rest.safeParse(input[i]);
      if (r.success) result.push(r.data);
      else for (const iss of r.issues) issues.push({ ...iss, path: [i, ...iss.path] });
    }
    if (issues.length > 0)
      return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result as [...T, ...R[]]);
  }
}

export function tuple<T extends unknown[]>(
  items: { [K in keyof T]: LoydSchema<T[K]> },
  message?: string
): TupleSchema<T> {
  return new TupleSchemaImpl<T>(items as ReadonlyArray<LoydSchema<unknown>>, message);
}
