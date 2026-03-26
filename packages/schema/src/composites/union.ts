import { BaseSchema } from "@loyd/core";
import type { LoydSchema, LoydResult, LoydIssue } from "@loyd/core";

export interface UnionSchema<T> extends BaseSchema<T> {
  readonly _type: "union";
}

export interface DiscriminatedUnionSchema<T> extends BaseSchema<T> {
  readonly _type: "discriminatedUnion";
  readonly discriminatorKey: string;
}

class UnionSchemaImpl<T> extends BaseSchema<T> implements UnionSchema<T> {
  readonly _type = "union" as const;
  constructor(private readonly _options: ReadonlyArray<LoydSchema<unknown>>, private readonly _msg?: string) { super(); }

  _validate(input: unknown): LoydResult<T> {
    const childIssues: LoydIssue[][] = [];
    for (const option of this._options) {
      const r = option.safeParse(input);
      if (r.success) return this._ok(r.data as T);
      childIssues.push([...r.issues]);
    }
    return this._fail("ERR_UNION_NO_MATCH", [], { issues: childIssues }, this._msg);
  }
}

class DiscriminatedUnionSchemaImpl<T> extends BaseSchema<T> implements DiscriminatedUnionSchema<T> {
  readonly _type = "discriminatedUnion" as const;
  readonly discriminatorKey: string;
  private readonly _map: Map<unknown, LoydSchema<unknown>>;

  constructor(key: string, options: ReadonlyArray<LoydSchema<unknown>>, private readonly _msg?: string) {
    super();
    this.discriminatorKey = key;
    this._map = new Map();
    for (const option of options) {
      // Try to get discriminator value from the schema shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shape = (option as any).shape as Record<string, LoydSchema<unknown>> | undefined;
      if (shape && shape[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const literalValue = (shape[key] as any).value;
        if (literalValue !== undefined) this._map.set(literalValue, option);
      }
    }
  }

  _validate(input: unknown): LoydResult<T> {
    if (typeof input !== "object" || input === null) {
      return this._fail("ERR_OBJECT_INVALID_TYPE", [], { received: typeof input });
    }
    const raw = input as Record<string, unknown>;
    const discriminatorValue = raw[this.discriminatorKey];
    const matchedSchema = this._map.get(discriminatorValue);
    if (!matchedSchema) {
      return this._fail("ERR_DISCRIMINATED_UNION_INVALID_KEY", [], { key: this.discriminatorKey, received: discriminatorValue }, this._msg);
    }
    return matchedSchema.safeParse(input) as LoydResult<T>;
  }
}

export function union<T>(options: ReadonlyArray<LoydSchema<unknown>>, message?: string): UnionSchema<T> {
  return new UnionSchemaImpl<T>(options, message);
}

export function discriminatedUnion<T>(key: string, options: ReadonlyArray<LoydSchema<unknown>>, message?: string): DiscriminatedUnionSchema<T> {
  return new DiscriminatedUnionSchemaImpl<T>(key, options, message);
}
