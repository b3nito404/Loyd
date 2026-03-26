import { BaseSchema } from "@loyd/core";
import type { LoydIssue, LoydResult, LoydSchema } from "@loyd/core";
import type { InferSchemaMap, InferSchemaMapInput, SchemaMap } from "@loyd/types";

export type ObjectUnknownKeys = "strip" | "strict" | "passthrough";

// Interface with deliberately loose return types for builder methods
// to avoid recursive generic constraint issues in TypeScript DTS emit.
export interface ObjectSchema<TShape extends SchemaMap>
  extends BaseSchema<InferSchemaMap<TShape>, InferSchemaMapInput<TShape>> {
  readonly _type: "object";
  readonly shape: TShape;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  partial(): ObjectSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  required(): ObjectSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pick(keys: readonly string[]): ObjectSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  omit(keys: readonly string[]): ObjectSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extend(shape: SchemaMap): ObjectSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merge(other: ObjectSchema<any>): ObjectSchema<any>;
  unknownKeys(behavior: ObjectUnknownKeys): ObjectSchema<TShape>;
  strict(message?: string): ObjectSchema<TShape>;
  strip(): ObjectSchema<TShape>;
  passthrough(): ObjectSchema<TShape>;
}

class ObjectSchemaImpl<TShape extends SchemaMap>
  extends BaseSchema<InferSchemaMap<TShape>, InferSchemaMapInput<TShape>>
  implements ObjectSchema<TShape>
{
  readonly _type = "object" as const;
  readonly shape: TShape;
  private readonly _unknownKeys: ObjectUnknownKeys;
  private readonly _strictMsg: string | undefined;

  constructor(shape: TShape, unknownKeys: ObjectUnknownKeys = "strip", strictMsg?: string) {
    super();
    this.shape = shape;
    this._unknownKeys = unknownKeys;
    this._strictMsg = strictMsg;
  }

  _validate(input: unknown): LoydResult<InferSchemaMap<TShape>> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return this._fail("ERR_OBJECT_INVALID_TYPE", [], {
        expected: "object",
        received: typeof input,
      });
    }
    const raw = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const issues: LoydIssue[] = [];
    const knownKeys = new Set(Object.keys(this.shape));

    for (const key of Object.keys(this.shape)) {
      const fieldSchema = this.shape[key as keyof TShape] as LoydSchema<unknown>;
      const fieldResult = fieldSchema.safeParse(raw[key]);
      if (fieldResult.success) {
        result[key] = fieldResult.data;
      } else {
        for (const issue of fieldResult.issues) {
          issues.push({ ...issue, path: [key, ...issue.path] });
        }
      }
    }

    const unknownList = Object.keys(raw).filter((k) => !knownKeys.has(k));
    if (unknownList.length > 0) {
      if (this._unknownKeys === "strict") {
        issues.push({
          code: "ERR_OBJECT_UNKNOWN_KEYS",
          path: [],
          meta: { keys: unknownList },
          ...(this._strictMsg ? { message: this._strictMsg } : {}),
        });
      } else if (this._unknownKeys === "passthrough") {
        for (const k of unknownList) result[k] = raw[k];
      }
    }

    if (issues.length > 0) {
      return {
        success: false,
        data: undefined,
        issues: issues as [LoydIssue, ...LoydIssue[]],
      };
    }
    return this._ok(result as InferSchemaMap<TShape>);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  partial(): ObjectSchema<any> {
    const newShape: Record<string, LoydSchema<unknown>> = {};
    for (const k of Object.keys(this.shape)) {
      newShape[k] = wrapOptional(this.shape[k as keyof TShape] as LoydSchema<unknown>);
    }
    return new ObjectSchemaImpl(newShape as SchemaMap, this._unknownKeys);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  required(): ObjectSchema<any> {
    return new ObjectSchemaImpl(this.shape, this._unknownKeys);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pick(keys: readonly string[]): ObjectSchema<any> {
    const s: Record<string, unknown> = {};
    for (const k of keys) {
      if (k in this.shape) s[k] = this.shape[k as keyof TShape];
    }
    return new ObjectSchemaImpl(s as SchemaMap, this._unknownKeys);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  omit(keys: readonly string[]): ObjectSchema<any> {
    const omitSet = new Set(keys);
    const s: Record<string, unknown> = {};
    for (const k of Object.keys(this.shape)) {
      if (!omitSet.has(k)) s[k] = this.shape[k as keyof TShape];
    }
    return new ObjectSchemaImpl(s as SchemaMap, this._unknownKeys);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extend(shape: SchemaMap): ObjectSchema<any> {
    return new ObjectSchemaImpl({ ...this.shape, ...shape }, this._unknownKeys);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merge(other: ObjectSchema<any>): ObjectSchema<any> {
    return new ObjectSchemaImpl(
      { ...this.shape, ...(other as ObjectSchemaImpl<SchemaMap>).shape },
      this._unknownKeys
    );
  }

  unknownKeys(b: ObjectUnknownKeys): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, b);
  }
  strict(message?: string): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, "strict", message);
  }
  strip(): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, "strip");
  }
  passthrough(): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, "passthrough");
  }
}

function wrapOptional<T>(schema: LoydSchema<T>): LoydSchema<T | undefined> {
  return {
    _type: "optional",
    _meta: schema._meta,
    _output: undefined as unknown as T | undefined,
    _input: undefined as unknown as T | undefined,
    safeParse(input: unknown): LoydResult<T | undefined> {
      if (input === undefined) return { success: true, data: undefined, issues: [] };
      return schema.safeParse(input) as LoydResult<T | undefined>;
    },
    parse(input: unknown) {
      return this.safeParse(input);
    },
    parseOrThrow(input: unknown) {
      const r = this.safeParse(input);
      if (r.success) return r.data;
      throw new Error(r.issues[0]?.code ?? "ERR_UNKNOWN");
    },
    meta() {
      return schema.meta();
    },
    describe(d: string) {
      return schema.describe(d) as unknown as LoydSchema<T | undefined>;
    },
  };
}

export function object<T extends SchemaMap>(shape: T): ObjectSchema<T> {
  return new ObjectSchemaImpl(shape);
}
