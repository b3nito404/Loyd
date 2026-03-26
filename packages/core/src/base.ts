import { LoydError } from "./errors.js";
import { ok } from "./parse.js";
import type { LoydResult, LoydSchema, SchemaMeta } from "./types.js";

export abstract class BaseSchema<TOutput, TInput = TOutput>
  implements LoydSchema<TOutput, TInput>
{
  declare readonly _output: TOutput;
  declare readonly _input: TInput;

  abstract readonly _type: string;
  readonly _meta: SchemaMeta = {};

  abstract _validate(input: unknown): LoydResult<TOutput>;

  //Public API
  safeParse(input: unknown): LoydResult<TOutput> {
    try {
      return this._validate(input);
    } catch (err) {
      return {
        success: false,
        data: undefined,
        issues: [
          {
            code: "ERR_UNKNOWN",
            path: [],
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  }

  parse(input: unknown): LoydResult<TOutput> {
    return this.safeParse(input);
  }

  parseOrThrow(input: unknown): TOutput {
    const result = this.safeParse(input);
    if (result.success) return result.data;
    throw new LoydError(result.issues);
  }

  meta(): SchemaMeta {
    return { ...this._meta, type: this._type };
  }

  describe(description: string): this {
    const clone = Object.create(Object.getPrototypeOf(this) as object) as this;
    Object.assign(clone, this);
    (clone as { _meta: SchemaMeta })._meta = { ...this._meta, description };
    return clone;
  }

  protected _ok(data: TOutput): LoydResult<TOutput> {
    return ok(data);
  }

  protected _fail(
    code: string,
    path: Array<string | number> = [],
    meta?: Record<string, unknown>,
    message?: string,
  ): LoydResult<TOutput> {
    return {
      success: false,
      data: undefined,
      issues: [{ code, path, ...(meta ? { meta } : {}), ...(message ? { message } : {}) }],
    };
  }

  protected _typeError(expected: string, received: unknown): LoydResult<TOutput> {
    return this._fail("ERR_INVALID_TYPE", [], {
      expected,
      received: getTypeName(received),
    });
  }
}

export function getTypeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
