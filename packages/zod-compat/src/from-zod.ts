import type { LoydSchema } from "@loyd/core";
import type { BaseSchema } from "@loyd/core";
import {
  array,
  boolean,
  brand,
  date,
  literal,
  nullable,
  nullish,
  number,
  object,
  optional,
  record,
  string,
  transform,
  tuple,
  union,
} from "@loyd/schema";

type ZodAny = any;

function asBase<T>(s: LoydSchema<T>): BaseSchema<T> {
  return s as unknown as BaseSchema<T>;
}

export function fromZod<T>(zodSchema: ZodAny): LoydSchema<T> {
  return convertZod(zodSchema) as LoydSchema<T>;
}

function convertZod(zs: ZodAny): LoydSchema<unknown> {
  const typeName: string = zs?._def?.typeName ?? "";

  switch (typeName) {
    case "ZodString":
      return convertZodString(zs);

    case "ZodNumber":
      return convertZodNumber(zs);

    case "ZodBoolean":
      return boolean();

    case "ZodDate":
      return date();

    case "ZodLiteral":
      return literal(zs._def.value);

    case "ZodObject":
      return convertZodObject(zs);

    case "ZodArray":
      return convertZodArray(zs);

    case "ZodTuple":
      return convertZodTuple(zs);

    case "ZodRecord":
      return record(asBase(convertZod(zs._def.valueType)));

    case "ZodUnion":
      return union((zs._def.options as ZodAny[]).map((o) => asBase(convertZod(o))));

    case "ZodOptional":
      return optional(asBase(convertZod(zs._def.innerType)));

    case "ZodNullable":
      return nullable(asBase(convertZod(zs._def.innerType)));

    case "ZodNullish":
      return nullish(asBase(convertZod(zs._def.innerType)));

    case "ZodEnum": {
      const values = zs._def.values as string[];
      return union(values.map((v) => literal(v)));
    }

    case "ZodNativeEnum": {
      const values = Object.values(zs._def.values as Record<string, string | number>) as Array<
        string | number
      >;

      return union(values.map((v) => literal(v)));
    }

    case "ZodEffects":
      return convertZod(zs._def.schema);

    case "ZodBranded":
      return brand(asBase(convertZod(zs._def.type)), "Brand");

    case "ZodTransform":
      return transform(asBase(convertZod(zs._def.schema)), zs._def.transform);

    default:
      return wrapZodFallback(zs);
  }
}



function convertZodString(zs: ZodAny): LoydSchema<string> {
  let schema = string();

  const checks = zs._def.checks ?? [];

  for (const c of checks) {
    const msg = c.message;

    if (c.kind === "min") schema = schema.minLength(c.value, msg);
    else if (c.kind === "max") schema = schema.maxLength(c.value, msg);
    else if (c.kind === "email") schema = schema.email(msg);
    else if (c.kind === "url") schema = schema.url(msg);
    else if (c.kind === "uuid") schema = schema.uuid(msg);
    else if (c.kind === "regex") schema = schema.regex(c.regex, msg);
    else if (c.kind === "trim") schema = schema.trim();
  }

  return schema;
}


function convertZodNumber(zs: ZodAny): LoydSchema<number> {
  let schema = number();

  const checks = zs._def.checks ?? [];

  for (const c of checks) {
    const msg = c.message;

    if (c.kind === "min") {
      schema = c.inclusive ? schema.min(c.value, msg) : schema.gt(c.value, msg);
    } else if (c.kind === "max") {
      schema = c.inclusive ? schema.max(c.value, msg) : schema.lt(c.value, msg);
    } else if (c.kind === "int") {
      schema = schema.int(msg);
    } else if (c.kind === "multipleOf") {
      schema = schema.multipleOf(c.value, msg);
    }
  }

  return schema;
}



function convertZodObject(zs: ZodAny): LoydSchema<unknown> {
  const shape: Record<string, LoydSchema<unknown>> = {};

  const zShape = zs._def.shape();

  for (const key in zShape) {
    shape[key] = convertZod(zShape[key]);
  }

  let schema = object(shape);

  const uk = zs._def.unknownKeys;

  if (uk === "strict") schema = schema.strict();
  else if (uk === "passthrough") schema = schema.passthrough();

  return schema;
}


function convertZodArray(zs: ZodAny): LoydSchema<unknown> {
  let schema = array(asBase(convertZod(zs._def.type)));

  if (zs._def.minLength?.value !== undefined) {
    schema = schema.min(zs._def.minLength.value);
  }

  if (zs._def.maxLength?.value !== undefined) {
    schema = schema.max(zs._def.maxLength.value);
  }

  return schema;
}


function convertZodTuple(zs: ZodAny): LoydSchema<unknown> {
  const items = zs._def.items.map((i: ZodAny) => asBase(convertZod(i)));
  return tuple(items);
}


type CompatIssue = {
  code: string;
  path: Array<string | number>;
  message: string;
};

function wrapZodFallback(zodSchema: ZodAny): LoydSchema<unknown> {
  const fallback: LoydSchema<unknown> = {
    _type: "zod-compat-fallback",
    _meta: {},

    safeParse(input: unknown) {
      const z = zodSchema as unknown as {
        safeParse: (input: unknown) => {
          success: boolean;
          data?: unknown;
          error?: {
            issues: Array<{
              message: string;
              path: Array<string | number>;
            }>;
          };
        };
      };

      const r = z.safeParse(input);

      if (r.success) {
        return {
          success: true,
          data: r.data,
          issues: [],
        };
      }

      return {
        success: false,
        data: undefined,
        issues: (r.error?.issues ?? []).map((i) => ({
          code: "ERR_ZOD_COMPAT",
          path: i.path,
          message: i.message,
        })) as [CompatIssue, ...CompatIssue[]],
      };
    },

    parse(input: unknown) {
      return this.safeParse(input);
    },

    parseOrThrow(input: unknown) {
      const r = this.safeParse(input);
      if (r.success) return r.data;
      throw new Error(r.issues[0]?.message ?? "Zod compat validation failed");
    },

    meta() {
      return {
        description: `Zod compat fallback (${String(zodSchema?._def?.typeName ?? "unknown")})`,
      };
    },

    describe(description: string) {
      return wrapZodFallback({
        ...zodSchema,
        _meta_description: description,
      });
    },

    _output: undefined as unknown,
    _input: undefined as unknown,
  };

  return fallback;
}
