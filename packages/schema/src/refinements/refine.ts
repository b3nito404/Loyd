import { BaseSchema } from "@loyd/core";
import type { LoydIssue, LoydResult, LoydSchema } from "@loyd/core";

export interface RefineOptions {
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
  path?: Array<string | number>;
}

class RefineSchemaImpl<T> extends BaseSchema<T> {
  readonly _type = "refine" as const;
  constructor(
    private readonly _inner: LoydSchema<T>,
    private readonly _pred: (v: T) => boolean,
    private readonly _opts: RefineOptions
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<T> {
    const r = this._inner.safeParse(input);
    if (!r.success) return r;
    if (!this._pred(r.data)) {
      return {
        success: false,
        data: undefined,
        issues: [
          {
            code: this._opts.code ?? "ERR_CUSTOM_REFINEMENT",
            path: this._opts.path ?? [],
            meta: this._opts.meta,
            message: this._opts.message,
          },
        ],
      };
    }
    return r;
  }
}

class RefineWithIssuesSchemaImpl<T> extends BaseSchema<T> {
  readonly _type = "refine" as const;
  constructor(
    private readonly _inner: LoydSchema<T>,
    private readonly _fn: (v: T) => LoydIssue[] | null | undefined
  ) {
    super();
  }
  _validate(input: unknown): LoydResult<T> {
    const r = this._inner.safeParse(input);
    if (!r.success) return r;
    const issues = this._fn(r.data);
    if (issues && issues.length > 0)
      return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return r;
  }
}

export function refine<T>(
  schema: LoydSchema<T>,
  pred: (v: T) => boolean,
  opts: RefineOptions
): LoydSchema<T> {
  return new RefineSchemaImpl(schema, pred, opts);
}
export function refineWithIssues<T>(
  schema: LoydSchema<T>,
  fn: (v: T) => LoydIssue[] | null | undefined
): LoydSchema<T> {
  return new RefineWithIssuesSchemaImpl(schema, fn);
}
