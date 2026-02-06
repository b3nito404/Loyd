import { BaseSchema, ok } from "@loyd/core";
import type { LoydIssue, LoydResult, LoydSchema } from "@loyd/core";
import type { InferSchemaMap, InferSchemaMapInput, SchemaMap } from "@loyd/types";

export type ObjectUnknownKeys = "strip" | "strict" | "passthrough";

export interface ObjectSchema<TShape extends SchemaMap = Record<string, LoydSchema<unknown>>>
  extends BaseSchema<InferSchemaMap<TShape>, InferSchemaMapInput<TShape>> {
  readonly _type: "object";
  readonly shape: TShape;

  partial(): ObjectSchema;
  required(): ObjectSchema;

  pick(keys: readonly string[]): ObjectSchema;
  omit(keys: readonly string[]): ObjectSchema;

  extend(shape: SchemaMap): ObjectSchema;
  merge(other: ObjectSchema): ObjectSchema;

  unknownKeys(mode: ObjectUnknownKeys): ObjectSchema<TShape>;
  strict(msg?: string): ObjectSchema<TShape>;
  strip(): ObjectSchema<TShape>;
  passthrough(): ObjectSchema<TShape>;
}

function wrapOpt<T>(schema: LoydSchema<T>): LoydSchema<T | undefined> {
  return {
    _type: "optional",
    _meta: schema._meta,
    _output: undefined as unknown as T | undefined,
    _input: undefined as unknown as T | undefined,

    safeParse(input: unknown): LoydResult<T | undefined> {
      if (input === undefined) {
        return ok(undefined);
      }

      return schema.safeParse(input) as LoydResult<T | undefined>;
    },

    parse(input: unknown) {
      return this.safeParse(input);
    },

    parseOrThrow(input: unknown) {
      const r = this.safeParse(input);
      if (r.success) return r.data;
      throw new Error(r.issues[0]?.code ?? "ERR");
    },

    meta() {
      return schema.meta();
    },

    describe(description: string) {
      return schema.describe(description) as unknown as LoydSchema<T | undefined>;
    },
  };
}

class ObjectSchemaImpl<TShape extends SchemaMap>
  extends BaseSchema<InferSchemaMap<TShape>, InferSchemaMapInput<TShape>>
  implements ObjectSchema<TShape>
{
  readonly _type = "object" as const;
  readonly shape: TShape;

  readonly _unknownKeys: ObjectUnknownKeys;
  private readonly _strictMsg?: string;

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

    // validate fields
    for (const key of Object.keys(this.shape)) {
      const fieldSchema = this.shape[key as keyof TShape] as LoydSchema<unknown>;
      const fieldResult = fieldSchema.safeParse(raw[key]);

      if (fieldResult.success) {
        result[key] = fieldResult.data;
      } else {
        for (const issue of fieldResult.issues) {
          issues.push({
            ...issue,
            path: [key, ...issue.path],
          });
        }
      }
    }

    // unknown keys handling
    const unknownKeys = Object.keys(raw).filter((k) => !knownKeys.has(k));

    if (unknownKeys.length > 0) {
      if (this._unknownKeys === "strict") {
        issues.push({
          code: "ERR_OBJECT_UNKNOWN_KEYS",
          path: [],
          meta: { keys: unknownKeys },
          ...(this._strictMsg ? { message: this._strictMsg } : {}),
        });
      } else if (this._unknownKeys === "passthrough") {
        for (const key of unknownKeys) {
          result[key] = raw[key];
        }
      }
      // strip = do nothing
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

  partial(): ObjectSchema {
    const shape: Record<string, LoydSchema<unknown>> = {};

    for (const key of Object.keys(this.shape)) {
      shape[key] = wrapOpt(this.shape[key as keyof TShape] as LoydSchema<unknown>);
    }

    return new ObjectSchemaImpl(shape as SchemaMap, this._unknownKeys);
  }

  required(): ObjectSchema {
    return new ObjectSchemaImpl(this.shape, this._unknownKeys);
  }

  pick(keys: readonly string[]): ObjectSchema {
    const shape: Record<string, unknown> = {};

    for (const key of keys) {
      if (key in this.shape) {
        shape[key] = this.shape[key as keyof TShape];
      }
    }

    return new ObjectSchemaImpl(shape as SchemaMap, this._unknownKeys);
  }

  omit(keys: readonly string[]): ObjectSchema {
    const omitSet = new Set(keys);
    const shape: Record<string, unknown> = {};

    for (const key of Object.keys(this.shape)) {
      if (!omitSet.has(key)) {
        shape[key] = this.shape[key as keyof TShape];
      }
    }

    return new ObjectSchemaImpl(shape as SchemaMap, this._unknownKeys);
  }

  extend(shape: SchemaMap): ObjectSchema {
    return new ObjectSchemaImpl({ ...this.shape, ...shape }, this._unknownKeys);
  }

  merge(other: ObjectSchema<Record<string, LoydSchema<unknown>>>): ObjectSchema {
    return new ObjectSchemaImpl(
      { ...this.shape, ...other.shape },
      this._unknownKeys,
    ) as unknown as ObjectSchema;
  }

  unknownKeys(mode: ObjectUnknownKeys): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, mode);
  }

  strict(msg?: string): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, "strict", msg);
  }

  strip(): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, "strip");
  }

  passthrough(): ObjectSchema<TShape> {
    return new ObjectSchemaImpl(this.shape, "passthrough");
  }
}

export function object<T extends SchemaMap>(shape: T): ObjectSchema<T> {
  return new ObjectSchemaImpl(shape);
}
