// packages/zod-compat/src/to-zod.ts
import type { LoydSchema } from "@loydjs/core";

// biome-ignore lint/suspicious/noExplicitAny: Zod has no public TypeScript API we can depend on
type ZodAny = any;

/**
 * Converts a Loyd schema to a Zod schema.
 * Requires 'zod' to be installed as a peer dependency.
 *
 * @example
 * import { toZod } from "@loydjs/zod-compat";
 * const zodSchema = toZod(UserSchema);
 */
export function toZod<T>(loydSchema: LoydSchema<T>): ZodAny {
  let z: ZodAny;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    z = require("zod");
  } catch {
    throw new Error("@loydjs/zod-compat: toZod() requires 'zod' to be installed. Run: pnpm add zod");
  }
  return convertLoyd(loydSchema, z);
}

function convertLoyd(schema: LoydSchema<unknown>, z: ZodAny): ZodAny {
  const t = schema._type;
  const s = schema as unknown as Record<string, unknown>;

  switch (t) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "date":
      return z.date();
    case "bigint":
      return z.bigint();
    case "literal":
      return z.literal(s.value);
    case "optional":
      return convertLoyd(s._inner as LoydSchema<unknown>, z).optional();
    case "nullable":
      return convertLoyd(s._inner as LoydSchema<unknown>, z).nullable();
    case "nullish":
      return convertLoyd(s._inner as LoydSchema<unknown>, z).nullish();
    case "brand":
      return convertLoyd(s._inner as LoydSchema<unknown>, z).brand();
    case "object": {
      const shape: Record<string, ZodAny> = {};
      const raw = (s.shape ?? {}) as Record<string, LoydSchema<unknown>>;
      for (const [k, v] of Object.entries(raw)) {
        shape[k] = convertLoyd(v, z);
      }
      return z.object(shape);
    }
    case "array":
      return z.array(convertLoyd(s.element as LoydSchema<unknown>, z));
    case "union": {
      const opts = (s._options ?? []) as LoydSchema<unknown>[];
      return z.union(opts.map((o) => convertLoyd(o, z)));
    }
    case "record":
      return z.record(convertLoyd(s._value as LoydSchema<unknown>, z));
    case "tuple": {
      const items = (s._items ?? []) as LoydSchema<unknown>[];
      return z.tuple(items.map((i) => convertLoyd(i, z)));
    }
    default:
      return z.any();
  }
}
