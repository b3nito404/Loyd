import type { LoydSchema } from "@loydjs/core";
export interface OptimizerResult {
  schema: LoydSchema<unknown>;
  appliedOptimizations: string[];
}

export type InlinedRule =
  // String
  | { kind: "str:minLength"; min: number }
  | { kind: "str:maxLength"; max: number }
  | { kind: "str:email" }
  | { kind: "str:url" }
  | { kind: "str:uuid" }
  | { kind: "str:regex"; source: string; flags: string }
  | { kind: "str:startsWith"; prefix: string }
  | { kind: "str:endsWith"; suffix: string }
  | { kind: "str:includes"; sub: string }
  | { kind: "str:nonempty" }
  // Number
  | { kind: "num:min"; min: number; inclusive: boolean }
  | { kind: "num:max"; max: number; inclusive: boolean }
  | { kind: "num:int" }
  | { kind: "num:finite" }
  | { kind: "num:safe" }
  | { kind: "num:multipleOf"; factor: number }
  // Transform
  | { kind: "str:trim" }
  | { kind: "str:toLowerCase" }
  | { kind: "str:toUpperCase" }
  // Unknown
  | { kind: "unknown" };

export interface OptimizedStringSchema extends LoydSchema<unknown> {
  readonly _type: "string";
  readonly _inlinedRules: InlinedRule[];
  readonly _inlinedTransforms: InlinedRule[];
  readonly _hasUnknownRules: boolean;
}

export interface OptimizedNumberSchema extends LoydSchema<unknown> {
  readonly _type: "number";
  readonly _inlinedRules: InlinedRule[];
  readonly _hasUnknownRules: boolean;
}

export interface OptimizedObjectSchema extends LoydSchema<unknown> {
  readonly _type: "object";
  readonly shape: Record<string, LoydSchema<unknown>>;
  readonly _unknownKeys: "strip" | "strict" | "passthrough";
  readonly _precomputedKeys: string[];
}

export interface OptimizedArraySchema extends LoydSchema<unknown> {
  readonly _type: "array";
  readonly element: LoydSchema<unknown>;
  readonly _minLen: number | undefined;
  readonly _maxLen: number | undefined;
}

export interface OptimizedPipeSchema extends LoydSchema<unknown> {
  readonly _type: "pipe";
  readonly _flatSchemas: LoydSchema<unknown>[];
}

export interface OptimizedUnionSchema extends LoydSchema<unknown> {
  readonly _type: "union";
  readonly _options: ReadonlyArray<LoydSchema<unknown>>;
  readonly _discriminatorKey?: string;
  readonly _discriminatorMap?: Map<unknown, LoydSchema<unknown>>;
}

// biome-ignore lint/suspicious/noExplicitAny: schema internals
type S = any;

const SENTINELS = {
  EMPTY: "",
  ONE_CHAR: "a",
  LONG: "a".repeat(10000),
  VALID_EMAIL: "test@example.com",
  INVALID_EMAIL: "notanemail",
  VALID_URL: "https://example.com",
  INVALID_URL: "notaurl",
  VALID_UUID: "550e8400-e29b-41d4-a716-446655440000",
  INVALID_UUID: "not-a-uuid",
  ALL_UPPER: "HELLO",
  ALL_LOWER: "hello",
  WITH_SPACES: "  hello  ",
  // Numbers
  ZERO: 0,
  ONE: 1,
  NEG_ONE: -1,
  FLOAT: 1.5,
  LARGE: 1e20,
  NAN: Number.NaN,
  INF: Number.POSITIVE_INFINITY,
};

type StringRule = (
  v: string,
) => { success: boolean; issues?: Array<{ code: string; meta?: Record<string, unknown> }> } | null;
type NumberRule = (
  v: number,
) => { success: boolean; issues?: Array<{ code: string; meta?: Record<string, unknown> }> } | null;

function fingerprintStringRule(rule: StringRule): InlinedRule {
  const tryRule = (v: string) => {
    try {
      return rule(v);
    } catch {
      return null;
    }
  };

  const onEmpty = tryRule(SENTINELS.EMPTY);
  if (onEmpty && !onEmpty.success) {
    const code = onEmpty.issues?.[0]?.code;
    const meta = onEmpty.issues?.[0]?.meta;

    if (code === "ERR_STRING_TOO_SHORT") {
      const min = (meta?.min as number) ?? 1;
      const onOne = tryRule(SENTINELS.ONE_CHAR);
      if (!onOne || onOne.success !== false || (onOne.issues?.[0]?.meta?.min as number) !== min) {
        return { kind: "str:minLength", min };
      }
    }
  }

  const onLong = tryRule(SENTINELS.LONG);
  if (onLong && !onLong.success) {
    const code = onLong.issues?.[0]?.code;
    const meta = onLong.issues?.[0]?.meta;
    if (code === "ERR_STRING_TOO_SHORT") {
      const min = (meta?.min as number) ?? 0;
      return { kind: "str:minLength", min };
    }
    if (code === "ERR_STRING_TOO_LONG") {
      const max = (meta?.max as number) ?? 0;
      return { kind: "str:maxLength", max };
    }
  }

  const onInvalidEmail = tryRule(SENTINELS.INVALID_EMAIL);
  const onValidEmail = tryRule(SENTINELS.VALID_EMAIL);
  if (
    onInvalidEmail &&
    !onInvalidEmail.success &&
    onInvalidEmail.issues?.[0]?.code === "ERR_STRING_INVALID_EMAIL" &&
    (!onValidEmail || onValidEmail.success !== false)
  ) {
    return { kind: "str:email" };
  }

  const onInvalidUrl = tryRule(SENTINELS.INVALID_URL);
  const onValidUrl = tryRule(SENTINELS.VALID_URL);
  if (
    onInvalidUrl &&
    !onInvalidUrl.success &&
    onInvalidUrl.issues?.[0]?.code === "ERR_STRING_INVALID_URL" &&
    (!onValidUrl || onValidUrl.success !== false)
  ) {
    return { kind: "str:url" };
  }

  // uuid
  const onInvalidUuid = tryRule(SENTINELS.INVALID_UUID);
  const onValidUuid = tryRule(SENTINELS.VALID_UUID);
  if (
    onInvalidUuid &&
    !onInvalidUuid.success &&
    onInvalidUuid.issues?.[0]?.code === "ERR_STRING_INVALID_UUID" &&
    (!onValidUuid || onValidUuid.success !== false)
  ) {
    return { kind: "str:uuid" };
  }

  const onOne = tryRule(SENTINELS.ONE_CHAR);
  if (onOne && !onOne.success) {
    const code = onOne.issues?.[0]?.code;
    const meta = onOne.issues?.[0]?.meta;

    if (code === "ERR_STRING_INVALID_REGEX") {
      if (meta?.prefix !== undefined) {
        return { kind: "str:startsWith", prefix: String(meta.prefix) };
      }
      // endsWith
      if (meta?.suffix !== undefined) {
        return { kind: "str:endsWith", suffix: String(meta.suffix) };
      }

      if (meta?.substring !== undefined) {
        return { kind: "str:includes", sub: String(meta.substring) };
      }

      if (meta?.pattern !== undefined) {
        return { kind: "str:regex", source: String(meta.pattern), flags: "" };
      }
    }

    if (code === "ERR_STRING_TOO_SHORT") {
      const min = (meta?.min as number) ?? 1;
      return { kind: "str:minLength", min };
    }
  }

  return { kind: "unknown" };
}

function fingerprintNumberRule(rule: NumberRule): InlinedRule {
  const tryRule = (v: number) => {
    try {
      return rule(v);
    } catch {
      return null;
    }
  };

  // int : fail on float
  const onFloat = tryRule(SENTINELS.FLOAT);
  if (onFloat && !onFloat.success) {
    const code = onFloat.issues?.[0]?.code;
    const meta = onFloat.issues?.[0]?.meta;

    if (code === "ERR_NUMBER_NOT_INTEGER") {
      return { kind: "num:int" };
    }

    // min with value > 1.5
    if (code === "ERR_NUMBER_TOO_SMALL") {
      const min = (meta?.min as number) ?? 0;
      const inclusive = (meta?.inclusive as boolean) ?? true;
      const onLarge = tryRule(SENTINELS.LARGE);
      if (!onLarge || onLarge.success !== false) {
        return { kind: "num:min", min, inclusive };
      }
    }

    if (code === "ERR_NUMBER_TOO_LARGE") {
      const max = (meta?.max as number) ?? 0;
      const inclusive = (meta?.inclusive as boolean) ?? true;
      return { kind: "num:max", max, inclusive };
    }
  }

  const onZero = tryRule(SENTINELS.ZERO);
  const onNegOne = tryRule(SENTINELS.NEG_ONE);
  const onLarge = tryRule(SENTINELS.LARGE);

  if (onZero && !onZero.success) {
    const code = onZero.issues?.[0]?.code;
    const meta = onZero.issues?.[0]?.meta;

    if (code === "ERR_NUMBER_TOO_SMALL") {
      const min = (meta?.min as number) ?? 0;
      const inclusive = (meta?.inclusive as boolean) ?? true;
      return { kind: "num:min", min, inclusive };
    }
    if (code === "ERR_NUMBER_TOO_LARGE") {
      const max = (meta?.max as number) ?? 0;
      const inclusive = (meta?.inclusive as boolean) ?? true;
      return { kind: "num:max", max, inclusive };
    }
    if (code === "ERR_NUMBER_NOT_MULTIPLE") {
      const factor = (meta?.multipleOf as number) ?? 1;
      return { kind: "num:multipleOf", factor };
    }
  }

  if (onNegOne && !onNegOne.success) {
    const code = onNegOne.issues?.[0]?.code;
    const meta = onNegOne.issues?.[0]?.meta;

    if (code === "ERR_NUMBER_TOO_SMALL") {
      const min = (meta?.min as number) ?? 0;
      const inclusive = (meta?.inclusive as boolean) ?? true;
      return { kind: "num:min", min, inclusive };
    }
  }

  if (onLarge && !onLarge.success) {
    const code = onLarge.issues?.[0]?.code;
    const meta = onLarge.issues?.[0]?.meta;

    if (code === "ERR_NUMBER_TOO_LARGE") {
      const max = (meta?.max as number) ?? 0;
      const inclusive = (meta?.inclusive as boolean) ?? true;
      return { kind: "num:max", max, inclusive };
    }
    if (code === "ERR_NUMBER_NOT_FINITE") {
      return { kind: "num:finite" };
    }
    if (code === "ERR_NUMBER_NOT_INTEGER") {
      return { kind: "num:safe" };
    }
  }

  const onInf = tryRule(SENTINELS.INF);
  if (onInf && !onInf.success && onInf.issues?.[0]?.code === "ERR_NUMBER_NOT_FINITE") {
    return { kind: "num:finite" };
  }

  if (
    onZero &&
    !onZero.success &&
    onNegOne &&
    !onNegOne.success &&
    (!onLarge || onLarge.success !== false)
  ) {
    const code = onZero.issues?.[0]?.code;
    if (code === "ERR_NUMBER_TOO_SMALL") {
      const min = (onZero.issues?.[0]?.meta?.min as number) ?? 0;
      const inclusive = (onZero.issues?.[0]?.meta?.inclusive as boolean) ?? false;
      return { kind: "num:min", min, inclusive };
    }
  }

  return { kind: "unknown" };
}

function fingerprintStringTransform(transform: (s: string) => string): InlinedRule {
  try {
    const withSpaces = transform(SENTINELS.WITH_SPACES);
    if (withSpaces === SENTINELS.WITH_SPACES.trim()) return { kind: "str:trim" };

    const upper = transform(SENTINELS.ALL_LOWER);
    if (upper === SENTINELS.ALL_LOWER.toUpperCase()) return { kind: "str:toUpperCase" };

    const lower = transform(SENTINELS.ALL_UPPER);
    if (lower === SENTINELS.ALL_UPPER.toLowerCase()) return { kind: "str:toLowerCase" };
  } catch {
    // ignore
  }
  return { kind: "unknown" };
}

function flattenPipe(schema: LoydSchema<unknown>): LoydSchema<unknown>[] {
  if (schema._type !== "pipe") return [schema];
  const schemas = (schema as S)._schemas as ReadonlyArray<LoydSchema<unknown>>;
  if (!schemas) return [schema];
  const result: LoydSchema<unknown>[] = [];
  for (const s of schemas) {
    result.push(...flattenPipe(s));
  }
  return result;
}

function optimizeSchema(schema: LoydSchema<unknown>, optimizations: string[]): LoydSchema<unknown> {
  const t = schema._type;

  if (t === "string") {
    const rules: Array<(v: string) => unknown> = (schema as S)._rules ?? [];
    const transforms: Array<(s: string) => string> = (schema as S)._transforms ?? [];

    if (rules.length === 0 && transforms.length === 0) {
      return schema;
    }

    const inlinedRules: InlinedRule[] = [];
    const inlinedTransforms: InlinedRule[] = [];
    let hasUnknownRules = false;

    for (const rule of rules) {
      const inlined = fingerprintStringRule(rule as StringRule);
      inlinedRules.push(inlined);
      if (inlined.kind === "unknown") hasUnknownRules = true;
    }

    for (const transform of transforms) {
      const inlined = fingerprintStringTransform(transform);
      inlinedTransforms.push(inlined);
      if (inlined.kind === "unknown") hasUnknownRules = true;
    }

    const inlinedCount =
      inlinedRules.filter((r) => r.kind !== "unknown").length +
      inlinedTransforms.filter((r) => r.kind !== "unknown").length;

    if (inlinedCount > 0) {
      optimizations.push(`string:inline-${inlinedCount}-rules`);
    }

    // Return  schema with structured rules
    return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
      _inlinedRules: inlinedRules,
      _inlinedTransforms: inlinedTransforms,
      _hasUnknownRules: hasUnknownRules,
    }) as OptimizedStringSchema;
  }

  if (t === "number") {
    const rules: Array<(v: number) => unknown> = (schema as S)._rules ?? [];

    if (rules.length === 0) return schema;

    const inlinedRules: InlinedRule[] = [];
    let hasUnknownRules = false;

    for (const rule of rules) {
      const inlined = fingerprintNumberRule(rule as NumberRule);
      inlinedRules.push(inlined);
      if (inlined.kind === "unknown") hasUnknownRules = true;
    }

    const inlinedCount = inlinedRules.filter((r) => r.kind !== "unknown").length;
    if (inlinedCount > 0) {
      optimizations.push(`number:inline-${inlinedCount}-rules`);
    }

    return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
      _inlinedRules: inlinedRules,
      _hasUnknownRules: hasUnknownRules,
    }) as OptimizedNumberSchema;
  }

  if (t === "object") {
    const shape = (schema as S).shape as Record<string, LoydSchema<unknown>>;
    if (!shape) return schema;

    //avoid Object.keys() at runtime
    const precomputedKeys = Object.keys(shape);

    const optimizedShape: Record<string, LoydSchema<unknown>> = {};
    let shapeOptimized = false;

    for (const key of precomputedKeys) {
      const optimized = optimizeSchema(shape[key], optimizations);
      optimizedShape[key] = optimized;
      if (optimized !== shape[key]) shapeOptimized = true;
    }

    if (shapeOptimized || precomputedKeys.length > 0) {
      optimizations.push(`object:precompute-${precomputedKeys.length}-keys`);
    }

    return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
      shape: shapeOptimized ? optimizedShape : shape,
      _precomputedKeys: precomputedKeys,
    }) as OptimizedObjectSchema;
  }

  if (t === "array") {
    const element = (schema as S).element as LoydSchema<unknown>;
    if (!element) return schema;

    const optimizedElement = optimizeSchema(element, optimizations);

    if (optimizedElement !== element) {
      optimizations.push("array:optimize-element");
      return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
        element: optimizedElement,
      }) as OptimizedArraySchema;
    }

    return schema;
  }

  if (t === "pipe") {
    const schemas = (schema as S)._schemas as ReadonlyArray<LoydSchema<unknown>>;
    if (!schemas) return schema;

    // Flatten for nested pipes : pipe(pipe(a, b), c) - > [a, b, c]
    const flat = flattenPipe(schema);
    const wasNested = flat.length !== schemas.length;

    const optimizedFlat = flat.map((s) => optimizeSchema(s, optimizations));
    const anyOptimized = optimizedFlat.some((s, i) => s !== flat[i]);

    if (wasNested) optimizations.push("pipe:flatten-nested");
    if (anyOptimized) optimizations.push("pipe:optimize-schemas");

    if (wasNested || anyOptimized) {
      return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
        _schemas: optimizedFlat,
        _flatSchemas: optimizedFlat,
      }) as OptimizedPipeSchema;
    }

    // _flatSchemas
    return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
      _flatSchemas: flat,
    }) as OptimizedPipeSchema;
  }

  if (t === "optional" || t === "nullable" || t === "nullish") {
    const inner = (schema as S)._inner as LoydSchema<unknown>;
    if (!inner) return schema;

    const optimizedInner = optimizeSchema(inner, optimizations);
    if (optimizedInner !== inner) {
      return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
        _inner: optimizedInner,
      });
    }
    return schema;
  }

  if (t === "union") {
    const options = (schema as S)._options as ReadonlyArray<LoydSchema<unknown>>;
    if (!options) return schema;
    const optimizedOptions = options.map((o) => optimizeSchema(o, optimizations));
    const anyOptimized = optimizedOptions.some((o, i) => o !== options[i]);

    // (all options are objects with a common field literal)
    const discriminatorKey = detectDiscriminatorKey(options);
    if (discriminatorKey) {
      optimizations.push(`union:discriminate-on-${discriminatorKey}`);
      const map = buildDiscriminatorMap(options, discriminatorKey);

      return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
        _options: anyOptimized ? optimizedOptions : options,
        _discriminatorKey: discriminatorKey,
        _discriminatorMap: map,
      }) as OptimizedUnionSchema;
    }

    if (anyOptimized) {
      optimizations.push("union:optimize-options");
      return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
        _options: optimizedOptions,
      }) as OptimizedUnionSchema;
    }

    return schema;
  }

  if (t === "brand") {
    const inner = (schema as S)._inner as LoydSchema<unknown>;
    if (!inner) return schema;
    const optimizedInner = optimizeSchema(inner, optimizations);
    if (optimizedInner !== inner) {
      return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
        _inner: optimizedInner,
      });
    }
    return schema;
  }

  return schema;
}

//discriminator detection for union

function detectDiscriminatorKey(options: ReadonlyArray<LoydSchema<unknown>>): string | null {
  if (options.length < 2) return null;

  for (const o of options) {
    if (o._type !== "object") return null;
  }

  const firstShape = (options[0] as S).shape as Record<string, LoydSchema<unknown>> | undefined;
  if (!firstShape) return null;

  for (const key of Object.keys(firstShape)) {
    const fieldSchema = firstShape[key];
    if (fieldSchema?._type !== "literal") continue;

    let allLiteral = true;
    const values = new Set<unknown>();
    values.add((fieldSchema as S).value);

    for (let i = 1; i < options.length; i++) {
      const shape = (options[i] as S).shape as Record<string, LoydSchema<unknown>> | undefined;
      if (!shape?.[key] || shape[key]._type !== "literal") {
        allLiteral = false;
        break;
      }
      const val = (shape[key] as S).value;
      if (values.has(val)) {
        allLiteral = false; // duplicated value
        break;
      }
      values.add(val);
    }

    if (allLiteral) return key;
  }

  return null;
}

function buildDiscriminatorMap(
  options: ReadonlyArray<LoydSchema<unknown>>,
  key: string,
): Map<unknown, LoydSchema<unknown>> {
  const map = new Map<unknown, LoydSchema<unknown>>();
  for (const o of options) {
    const shape = (o as S).shape as Record<string, LoydSchema<unknown>> | undefined;
    if (!shape?.[key]) continue;
    const val = (shape[key] as S).value;
    if (val !== undefined) map.set(val, o);
  }
  return map;
}

//entry point

export function optimize(schema: LoydSchema<unknown>): OptimizerResult {
  const appliedOptimizations: string[] = [];
  const optimized = optimizeSchema(schema, appliedOptimizations);
  return { schema: optimized, appliedOptimizations };
}
