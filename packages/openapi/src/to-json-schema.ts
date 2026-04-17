import type { LoydSchema } from "@loydjs/core";

export interface JsonSchema7 {
  $schema?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchema7>;
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema7>;
  required?: string[];
  items?: JsonSchema7;
  prefixItems?: JsonSchema7[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema7[];
  oneOf?: JsonSchema7[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: boolean | JsonSchema7;
  format?: string;
  nullable?: boolean;
  deprecated?: boolean;
  examples?: unknown[];
  [key: string]: unknown;
}

export interface ToJsonSchemaOptions {
  target?: "draft-07" | "draft-2020-12";
  $defs?: boolean;
  root?: Partial<JsonSchema7>;
}

interface Ctx {
  defs: Map<string, JsonSchema7>;
  useDefs: boolean;
  target: "draft-07" | "draft-2020-12";
}

type InternalSchema = LoydSchema<unknown> & {
  value?: unknown;
  _inner?: LoydSchema<unknown>;
  _rules?: Array<{ kind: string; value?: number; inclusive?: boolean; message?: string }>;
  shape?: Record<string, LoydSchema<unknown>>;
  _unknownKeys?: "strict" | "passthrough";
  element?: LoydSchema<unknown>;
  _minLen?: number;
  _maxLen?: number;
  _items?: LoydSchema<unknown>[];
  _value?: LoydSchema<unknown>;
  valueSchema?: LoydSchema<unknown>;
  _v?: LoydSchema<unknown>;
  _options?: LoydSchema<unknown>[];
  _map?: Map<unknown, LoydSchema<unknown>>;
  safeParse?: (input: unknown) => { success: boolean; issues: Array<{ code: string }> };
};

export function toJsonSchema(
  schema: LoydSchema<unknown>,
  options: ToJsonSchemaOptions = {},
): JsonSchema7 {
  const { target = "draft-07", $defs: useDefs = true, root = {} } = options;
  const ctx: Ctx = { defs: new Map(), useDefs, target };
  const result = conv(schema, ctx);
  if (useDefs && ctx.defs.size > 0) result.$defs = Object.fromEntries(ctx.defs);
  result.$schema =
    target === "draft-07"
      ? "http://json-schema.org/draft-07/schema#"
      : "https://json-schema.org/draft/2020-12/schema";
  return { ...result, ...root };
}

function conv(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const t = schema._type;
  const meta = schema.meta();
  let result: JsonSchema7;

  switch (t) {
    case "string":
      result = { type: "string" };
      break;
    case "number":
      result = convNum(schema);
      break;
    case "boolean":
      result = { type: "boolean" };
      break;
    case "date":
      result = { type: "string", format: "date-time" };
      break;
    case "bigint":
      result = { type: "integer" };
      break;
    case "literal":
      result = { const: (schema as InternalSchema).value };
      break;
    case "object":
      result = convObj(schema, ctx);
      break;
    case "array":
      result = convArr(schema, ctx);
      break;
    case "tuple":
      result = convTuple(schema, ctx);
      break;
    case "record":
    case "map":
      result = convRecord(schema, ctx);
      break;
    case "set":
      result = convSet(schema, ctx);
      break;
    case "union":
    case "discriminatedUnion":
      result = convUnion(schema, ctx);
      break;
    case "optional":
      return conv((schema as InternalSchema)._inner ?? schema, ctx);
    case "nullable":
      return {
        anyOf: [conv((schema as InternalSchema)._inner ?? schema, ctx), { type: "null" }],
      };
    case "nullish":
      return {
        anyOf: [conv((schema as InternalSchema)._inner ?? schema, ctx), { type: "null" }],
      };
    case "brand":
      return conv((schema as InternalSchema)._inner ?? schema, ctx);
    case "transform":
      return conv((schema as InternalSchema)._inner ?? schema, ctx);
    default:
      result = {};
  }

  if (meta.description) result.description = meta.description as string;
  if (meta.deprecated) result.deprecated = true;
  if (Array.isArray(meta.examples)) result.examples = meta.examples;

  return result;
}

function convNum(schema: LoydSchema<unknown>): JsonSchema7 {
  const result: JsonSchema7 = { type: "number" };
  const internal = schema as InternalSchema;
  const rules = internal._rules ?? [];

  if (rules.length > 0) {
    const tr = internal.safeParse?.(1.5);
    if (tr && !tr.success && tr.issues[0]?.code === "ERR_NUMBER_NOT_INTEGER") {
      result.type = "integer";
    }
  }

  return result;
}

function convObj(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const internal = schema as InternalSchema;
  const shape = internal.shape ?? {};
  const properties: Record<string, JsonSchema7> = {};
  const required: string[] = [];

  for (const [key, fs] of Object.entries(shape)) {
    properties[key] = conv(fs, ctx);
    const ft = fs._type;
    if (ft !== "optional" && ft !== "nullish") required.push(key);
  }

  const result: JsonSchema7 = { type: "object", properties };
  if (required.length > 0) result.required = required;
  if (internal._unknownKeys === "strict") result.additionalProperties = false;
  else if (internal._unknownKeys === "passthrough") result.additionalProperties = true;

  return result;
}

function convArr(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const internal = schema as InternalSchema;
  const el = internal.element;
  const result: JsonSchema7 = { type: "array", ...(el ? { items: conv(el, ctx) } : {}) };
  if (internal._minLen !== undefined) result.minItems = internal._minLen;
  if (internal._maxLen !== undefined) result.maxItems = internal._maxLen;
  return result;
}

function convTuple(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const internal = schema as InternalSchema;
  const items = internal._items ?? [];
  return {
    type: "array",
    prefixItems: items.map((i) => conv(i, ctx)),
    minItems: items.length,
    maxItems: items.length,
  };
}

function convRecord(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const internal = schema as InternalSchema;
  const vSchema = internal._value ?? internal.valueSchema;
  return { type: "object", additionalProperties: vSchema ? conv(vSchema, ctx) : true };
}

function convSet(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const internal = schema as InternalSchema;
  const v = internal._v;
  return { type: "array", uniqueItems: true, ...(v ? { items: conv(v, ctx) } : {}) };
}

function convUnion(schema: LoydSchema<unknown>, ctx: Ctx): JsonSchema7 {
  const internal = schema as InternalSchema;
  const opts = internal._options ?? (internal._map ? Array.from(internal._map.values()) : []);
  const allLiterals = opts.every((o) => o._type === "literal");
  if (allLiterals) {
    return { enum: opts.map((o) => (o as InternalSchema).value) };
  }
  return { anyOf: opts.map((o) => conv(o, ctx)) };
}
