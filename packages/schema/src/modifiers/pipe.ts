import { BaseSchema } from "@loyd/core";
import type { LoydSchema, LoydResult } from "@loyd/core";

export interface PipeOptions { continueOnError?: boolean; }

class PipeSchemaImpl<T> extends BaseSchema<T> {
  readonly _type = "pipe" as const;
  constructor(private readonly _schemas: ReadonlyArray<LoydSchema<T>>, private readonly _opts?: PipeOptions) { super(); }
  _validate(input: unknown): LoydResult<T> {
    let current: unknown = input;
    for (const s of this._schemas) {
      const r = s.safeParse(current);
      if (!r.success) {
        if (this._opts?.continueOnError) continue;
        return r;
      }
      current = r.data;
    }
    return { success: true, data: current as T, issues: [] };
  }
}

export function pipe<T>(schema: LoydSchema<T>, ...rules: Array<LoydSchema<T>>): LoydSchema<T> {
  return new PipeSchemaImpl([schema, ...rules]);
}
export function pipeWith<T>(options: PipeOptions, schema: LoydSchema<T>, ...rules: Array<LoydSchema<T>>): LoydSchema<T> {
  return new PipeSchemaImpl([schema, ...rules], options);
}
