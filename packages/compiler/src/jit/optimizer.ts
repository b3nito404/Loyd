import type { LoydSchema } from "@loydjs/core";

export interface OptimizerResult {
  schema: LoydSchema<unknown>;
  appliedOptimizations: string[];
}

export type InlinedRule =
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
  | { kind: "num:min"; min: number; inclusive: boolean }
  | { kind: "num:max"; max: number; inclusive: boolean }
  | { kind: "num:int" }
  | { kind: "num:finite" }
  | { kind: "num:safe" }
  | { kind: "num:multipleOf"; factor: number }
  | { kind: "str:trim" }
  | { kind: "str:toLowerCase" }
  | { kind: "str:toUpperCase" }
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

const STR = {
  EMPTY: "",
  ONE: "a",
  TWO: "ab",
  FIVE: "abcde",
  LONG: "a".repeat(10000),
  EMAIL_VALID: "test@example.com",
  EMAIL_INVALID: "notanemail",
  EMAIL_INVALID2: "no-at-sign",
  URL_VALID: "https://example.com",
  URL_INVALID: "notaurl",
  UUID_VALID: "550e8400-e29b-41d4-a716-446655440000",
  UUID_INVALID: "not-a-uuid",
  UPPER: "HELLO",
  LOWER: "hello",
  SPACES: "  hello  ",
  STARTS_TEST: "hello world",
  NUMERIC: "12345",
};

const NUM = {
  ZERO: 0,
  ONE: 1,
  NEG_ONE: -1,
  HALF: 0.5,
  FLOAT: 1.5,
  FLOAT2: 2.5,
  LARGE: 1e15,
  NEG_LARGE: -1e15,
  INF: Number.POSITIVE_INFINITY,
  NEG_INF: Number.NEGATIVE_INFINITY,
  NAN: Number.NaN,
  MAX_SAFE: Number.MAX_SAFE_INTEGER,
  MIN_SAFE: Number.MIN_SAFE_INTEGER,
  TWO: 2,
  THREE: 3,
  TEN: 10,
  HUNDRED: 100,
  THOUSAND: 1000,
};

function callStringRule(
  rule: (v: string) => unknown,
  val: string,
): { failed: boolean; code: string; meta: Record<string, unknown> } | null {
  try {
    const r = rule(val) as {
      success?: boolean;
      issues?: Array<{ code: string; meta?: Record<string, unknown> }>;
    } | null;
    if (r === null || r === undefined) return null;
    if (r.success === true) return null;
    if (r.success === false && r.issues && r.issues.length > 0) {
      return {
        failed: true,
        code: r.issues[0].code,
        meta: r.issues[0].meta ?? {},
      };
    }
    return null;
  } catch {
    return null;
  }
}

function callNumberRule(
  rule: (v: number) => unknown,
  val: number,
): { failed: boolean; code: string; meta: Record<string, unknown> } | null {
  try {
    const r = rule(val) as {
      success?: boolean;
      issues?: Array<{ code: string; meta?: Record<string, unknown> }>;
    } | null;
    if (r === null || r === undefined) return null;
    if (r.success === true) return null;
    if (r.success === false && r.issues && r.issues.length > 0) {
      return {
        failed: true,
        code: r.issues[0].code,
        meta: r.issues[0].meta ?? {},
      };
    }
    return null;
  } catch {
    return null;
  }
}

//fingerPrinting rule
function fingerprintStringRule(rule: (v: string) => unknown): InlinedRule {
  const onEmpty = callStringRule(rule, STR.EMPTY);
  const onOne = callStringRule(rule, STR.ONE);
  const onTwo = callStringRule(rule, STR.TWO);
  const onFive = callStringRule(rule, STR.FIVE);
  const onLong = callStringRule(rule, STR.LONG);
  const onEmailValid = callStringRule(rule, STR.EMAIL_VALID);
  const onEmailInvalid = callStringRule(rule, STR.EMAIL_INVALID);
  const onUrlValid = callStringRule(rule, STR.URL_VALID);
  const onUrlInvalid = callStringRule(rule, STR.URL_INVALID);
  const onUuidValid = callStringRule(rule, STR.UUID_VALID);
  const onUuidInvalid = callStringRule(rule, STR.UUID_INVALID);
  const onStartsTest = callStringRule(rule, STR.STARTS_TEST);
  const onNumeric = callStringRule(rule, STR.NUMERIC);

  if (onEmpty?.code === "ERR_STRING_TOO_SHORT") {
    const min = (onEmpty.meta.min as number) ?? 1;
    const testPass = min <= 1 ? onOne : min <= 2 ? onTwo : min <= 5 ? onFive : null;
    if (testPass === null) {
      return { kind: "str:minLength", min };
    }
  }

  if (onOne?.code === "ERR_STRING_TOO_SHORT" && !onEmpty?.code) {
    const min = (onOne.meta.min as number) ?? 2;
    return { kind: "str:minLength", min };
  }

  if (onTwo?.code === "ERR_STRING_TOO_SHORT" && !onOne?.code) {
    const min = (onTwo.meta.min as number) ?? 3;
    return { kind: "str:minLength", min };
  }

  if (onFive?.code === "ERR_STRING_TOO_SHORT" && !onTwo?.code) {
    const min = (onFive.meta.min as number) ?? 6;
    return { kind: "str:minLength", min };
  }

  if (onLong?.code === "ERR_STRING_TOO_LONG" && !onEmpty?.code && !onOne?.code) {
    const max = (onLong.meta.max as number) ?? 0;
    return { kind: "str:maxLength", max };
  }

  if (onFive?.code === "ERR_STRING_TOO_LONG" && !onTwo?.code) {
    const max = (onFive.meta.max as number) ?? 0;
    return { kind: "str:maxLength", max };
  }

  if (onTwo?.code === "ERR_STRING_TOO_LONG" && !onOne?.code) {
    const max = (onTwo.meta.max as number) ?? 0;
    return { kind: "str:maxLength", max };
  }

  if (onEmailInvalid?.code === "ERR_STRING_INVALID_EMAIL" && onEmailValid === null) {
    return { kind: "str:email" };
  }

  if (onUrlInvalid?.code === "ERR_STRING_INVALID_URL" && onUrlValid === null) {
    return { kind: "str:url" };
  }

  if (onUuidInvalid?.code === "ERR_STRING_INVALID_UUID" && onUuidValid === null) {
    return { kind: "str:uuid" };
  }

  if (onOne?.code === "ERR_STRING_INVALID_REGEX") {
    const meta = onOne.meta;
    if (meta.prefix !== undefined) return { kind: "str:startsWith", prefix: String(meta.prefix) };
    if (meta.suffix !== undefined) return { kind: "str:endsWith", suffix: String(meta.suffix) };
    if (meta.substring !== undefined) return { kind: "str:includes", sub: String(meta.substring) };
    if (meta.pattern !== undefined)
      return { kind: "str:regex", source: String(meta.pattern), flags: "" };
  }

  if (onEmpty?.code === "ERR_STRING_INVALID_REGEX") {
    const meta = onEmpty.meta;
    if (meta.prefix !== undefined) return { kind: "str:startsWith", prefix: String(meta.prefix) };
    if (meta.suffix !== undefined) return { kind: "str:endsWith", suffix: String(meta.suffix) };
    if (meta.substring !== undefined) return { kind: "str:includes", sub: String(meta.substring) };
    if (meta.pattern !== undefined)
      return { kind: "str:regex", source: String(meta.pattern), flags: "" };
  }

  // startsWith/endsWith
  if (onStartsTest?.code === "ERR_STRING_INVALID_REGEX") {
    const meta = onStartsTest.meta;
    if (meta.prefix !== undefined) return { kind: "str:startsWith", prefix: String(meta.prefix) };
    if (meta.suffix !== undefined) return { kind: "str:endsWith", suffix: String(meta.suffix) };
  }

  if (onNumeric?.code === "ERR_STRING_INVALID_REGEX") {
    const meta = onNumeric.meta;
    if (meta.pattern !== undefined)
      return { kind: "str:regex", source: String(meta.pattern), flags: "" };
  }

  return { kind: "unknown" };
}

function fingerprintNumberRule(rule: (v: number) => unknown): InlinedRule {
  const onZero = callNumberRule(rule, NUM.ZERO);
  const onOne = callNumberRule(rule, NUM.ONE);
  const onNegOne = callNumberRule(rule, NUM.NEG_ONE);
  const onHalf = callNumberRule(rule, NUM.HALF);
  const onFloat = callNumberRule(rule, NUM.FLOAT);
  const _onFloat2 = callNumberRule(rule, NUM.FLOAT2);
  const onLarge = callNumberRule(rule, NUM.LARGE);
  const onNegLarge = callNumberRule(rule, NUM.NEG_LARGE);
  const onInf = callNumberRule(rule, NUM.INF);
  const onNegInf = callNumberRule(rule, NUM.NEG_INF);
  const onTwo = callNumberRule(rule, NUM.TWO);
  const onThree = callNumberRule(rule, NUM.THREE);
  const onTen = callNumberRule(rule, NUM.TEN);
  const onHundred = callNumberRule(rule, NUM.HUNDRED);
  const onThousand = callNumberRule(rule, NUM.THOUSAND);
  const onMaxSafe = callNumberRule(rule, NUM.MAX_SAFE);

  // ── int ───────────────────────────────────────────────────────────────────
  // Échoue sur les floats, passe sur les entiers
  if (onFloat?.code === "ERR_NUMBER_NOT_INTEGER" && onOne === null) {
    return { kind: "num:int" };
  }
  if (onHalf?.code === "ERR_NUMBER_NOT_INTEGER" && onOne === null) {
    return { kind: "num:int" };
  }

  // ── safe integer ──────────────────────────────────────────────────────────
  if (onMaxSafe?.code === "ERR_NUMBER_NOT_INTEGER" && onOne === null && onFloat === null) {
    return { kind: "num:safe" };
  }

  // ── finite ────────────────────────────────────────────────────────────────
  if (onInf?.code === "ERR_NUMBER_NOT_FINITE" && onOne === null) {
    return { kind: "num:finite" };
  }
  if (onNegInf?.code === "ERR_NUMBER_NOT_FINITE" && onOne === null) {
    return { kind: "num:finite" };
  }

  // ── multipleOf ────────────────────────────────────────────────────────────
  if (onOne?.code === "ERR_NUMBER_NOT_MULTIPLE" && onTwo === null) {
    const factor = (onOne.meta.multipleOf as number) ?? 2;
    return { kind: "num:multipleOf", factor };
  }
  if (onOne?.code === "ERR_NUMBER_NOT_MULTIPLE" && onThree === null) {
    const factor = (onOne.meta.multipleOf as number) ?? 3;
    return { kind: "num:multipleOf", factor };
  }
  if (onTwo?.code === "ERR_NUMBER_NOT_MULTIPLE" && onTen === null) {
    const factor = (onTwo.meta.multipleOf as number) ?? 5;
    return { kind: "num:multipleOf", factor };
  }

  // ── min ───────────────────────────────────────────────────────────────────
  // Pattern : échoue sur les petits nombres, passe sur les grands
  if (onZero?.code === "ERR_NUMBER_TOO_SMALL" && onOne === null) {
    const min = (onZero.meta.min as number) ?? 0;
    const inclusive = (onZero.meta.inclusive as boolean) ?? true;
    return { kind: "num:min", min, inclusive };
  }

  if (onNegOne?.code === "ERR_NUMBER_TOO_SMALL" && onOne === null) {
    const min = (onNegOne.meta.min as number) ?? 0;
    const inclusive = (onNegOne.meta.inclusive as boolean) ?? true;
    return { kind: "num:min", min, inclusive };
  }

  if (onZero?.code === "ERR_NUMBER_TOO_SMALL" && onTwo === null) {
    const min = (onZero.meta.min as number) ?? 0;
    const inclusive = (onZero.meta.inclusive as boolean) ?? true;
    return { kind: "num:min", min, inclusive };
  }

  if (onTen?.code === "ERR_NUMBER_TOO_SMALL" && onHundred === null) {
    const min = (onTen.meta.min as number) ?? 0;
    const inclusive = (onTen.meta.inclusive as boolean) ?? true;
    return { kind: "num:min", min, inclusive };
  }

  if (onHundred?.code === "ERR_NUMBER_TOO_SMALL" && onThousand === null) {
    const min = (onHundred.meta.min as number) ?? 0;
    const inclusive = (onHundred.meta.inclusive as boolean) ?? true;
    return { kind: "num:min", min, inclusive };
  }

  if (onFloat?.code === "ERR_NUMBER_TOO_SMALL" && onLarge === null) {
    const min = (onFloat.meta.min as number) ?? 0;
    const inclusive = (onFloat.meta.inclusive as boolean) ?? true;
    return { kind: "num:min", min, inclusive };
  }

  // gt(0) — échoue sur 0 et négatifs
  if (
    onZero?.code === "ERR_NUMBER_TOO_SMALL" &&
    onNegOne?.code === "ERR_NUMBER_TOO_SMALL" &&
    onOne === null
  ) {
    const min = (onZero.meta.min as number) ?? 0;
    const inclusive = (onZero.meta.inclusive as boolean) ?? false;
    return { kind: "num:min", min, inclusive };
  }

  // ── max ───────────────────────────────────────────────────────────────────
  if (onLarge?.code === "ERR_NUMBER_TOO_LARGE" && onOne === null) {
    const max = (onLarge.meta.max as number) ?? 0;
    const inclusive = (onLarge.meta.inclusive as boolean) ?? true;
    return { kind: "num:max", max, inclusive };
  }

  if (onThousand?.code === "ERR_NUMBER_TOO_LARGE" && onHundred === null) {
    const max = (onThousand.meta.max as number) ?? 0;
    const inclusive = (onThousand.meta.inclusive as boolean) ?? true;
    return { kind: "num:max", max, inclusive };
  }

  if (onHundred?.code === "ERR_NUMBER_TOO_LARGE" && onTen === null) {
    const max = (onHundred.meta.max as number) ?? 0;
    const inclusive = (onHundred.meta.inclusive as boolean) ?? true;
    return { kind: "num:max", max, inclusive };
  }

  if (onTen?.code === "ERR_NUMBER_TOO_LARGE" && onOne === null) {
    const max = (onTen.meta.max as number) ?? 0;
    const inclusive = (onTen.meta.inclusive as boolean) ?? true;
    return { kind: "num:max", max, inclusive };
  }

  if (onNegOne?.code === "ERR_NUMBER_TOO_LARGE" && onNegLarge === null) {
    const max = (onNegOne.meta.max as number) ?? 0;
    const inclusive = (onNegOne.meta.inclusive as boolean) ?? true;
    return { kind: "num:max", max, inclusive };
  }

  return { kind: "unknown" };
}

// ─── Fingerprint string transform ─────────────────────────────────────────────
function fingerprintStringTransform(transform: (s: string) => string): InlinedRule {
  try {
    if (transform(STR.SPACES) === STR.SPACES.trim()) return { kind: "str:trim" };
    if (transform(STR.LOWER) === STR.LOWER.toUpperCase()) return { kind: "str:toUpperCase" };
    if (transform(STR.UPPER) === STR.UPPER.toLowerCase()) return { kind: "str:toLowerCase" };
  } catch {
    // ignore
  }
  return { kind: "unknown" };
}

// ─── Flatten pipe ─────────────────────────────────────────────────────────────
function flattenPipe(schema: LoydSchema<unknown>): LoydSchema<unknown>[] {
  if (schema._type !== "pipe") return [schema];
  const schemas = (schema as S)._schemas as ReadonlyArray<LoydSchema<unknown>>;
  if (!schemas) return [schema];
  const result: LoydSchema<unknown>[] = [];
  for (const s of schemas) result.push(...flattenPipe(s));
  return result;
}

// Optimize schema
function optimizeSchema(schema: LoydSchema<unknown>, optimizations: string[]): LoydSchema<unknown> {
  const t = schema._type;

  if (t === "string") {
    const rules: Array<(v: string) => unknown> = (schema as S)._rules ?? [];
    const transforms: Array<(s: string) => string> = (schema as S)._transforms ?? [];

    if (rules.length === 0 && transforms.length === 0) return schema;

    const inlinedRules: InlinedRule[] = [];
    const inlinedTransforms: InlinedRule[] = [];
    let hasUnknownRules = false;

    for (const rule of rules) {
      const inlined = fingerprintStringRule(rule);
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

    if (inlinedCount > 0) optimizations.push(`string:inline-${inlinedCount}-rules`);

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
      const inlined = fingerprintNumberRule(rule);
      inlinedRules.push(inlined);
      if (inlined.kind === "unknown") hasUnknownRules = true;
    }

    const inlinedCount = inlinedRules.filter((r) => r.kind !== "unknown").length;
    if (inlinedCount > 0) optimizations.push(`number:inline-${inlinedCount}-rules`);

    return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
      _inlinedRules: inlinedRules,
      _hasUnknownRules: hasUnknownRules,
    }) as OptimizedNumberSchema;
  }

  if (t === "object") {
    const shape = (schema as S).shape as Record<string, LoydSchema<unknown>>;
    if (!shape) return schema;

    const precomputedKeys = Object.keys(shape);
    const optimizedShape: Record<string, LoydSchema<unknown>> = {};
    let shapeOptimized = false;

    for (const key of precomputedKeys) {
      const optimized = optimizeSchema(shape[key], optimizations);
      optimizedShape[key] = optimized;
      if (optimized !== shape[key]) shapeOptimized = true;
    }

    if (precomputedKeys.length > 0) {
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

    const flat = flattenPipe(schema);
    const wasNested = flat.length !== schemas.length;
    const optimizedFlat = flat.map((s) => optimizeSchema(s, optimizations));
    const anyOptimized = optimizedFlat.some((s, i) => s !== flat[i]);

    if (wasNested) optimizations.push("pipe:flatten-nested");
    if (anyOptimized) optimizations.push("pipe:optimize-schemas");

    return Object.assign(Object.create(Object.getPrototypeOf(schema) as object), schema, {
      _schemas: wasNested || anyOptimized ? optimizedFlat : flat,
      _flatSchemas: wasNested || anyOptimized ? optimizedFlat : flat,
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

//Discriminated union detection
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
        allLiteral = false;
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
