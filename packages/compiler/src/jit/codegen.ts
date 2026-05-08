import type { LoydSchema } from "@loydjs/core";
import type { InlinedRule, OptimizedNumberSchema, OptimizedStringSchema } from "./optimizer.js";

// biome-ignore lint/suspicious/noExplicitAny: schema internals are untyped by design
type S = any;

import type { CodegenOptions, CodegenResult } from "./types.js";
const _state = { counter: 0 };
interface Ctx {
  lines: string[];
  issues: string;
  value: string;
  pathVar: string;
  dev: boolean;
  schemaRefs: Record<string, LoydSchema<unknown>>;
  varCount: number;
}

function emit(ctx: Ctx, line: string): void {
  ctx.lines.push(line);
}

function tmpVar(ctx: Ctx, prefix: string): string {
  ctx.varCount += 1;
  return `__${prefix}${ctx.varCount}__`;
}

function reg(ctx: Ctx, schema: LoydSchema<unknown>): string {
  const id = `__s${Object.keys(ctx.schemaRefs).length + 1}__`;
  ctx.schemaRefs[id] = schema;
  return id;
}

function gen(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const t = schema._type;

  if (t === "string") {
    genStr(schema, ctx);
    return;
  }
  if (t === "number") {
    genNum(schema, ctx);
    return;
  }
  if (t === "boolean") {
    genBool(ctx);
    return;
  }
  if (t === "object") {
    genObj(schema, ctx);
    return;
  }
  if (t === "array") {
    genArr(schema, ctx);
    return;
  }
  if (t === "pipe") {
    genPipe(schema, ctx);
    return;
  }
  if (t === "optional") {
    genOpt(schema, ctx);
    return;
  }
  if (t === "literal") {
    genLit(schema, ctx);
    return;
  }
  if (t === "nullable" || t === "nullish") {
    genNullable(schema, ctx);
    return;
  }
  if (t === "union") {
    genUnion(schema, ctx);
    return;
  }
  if (t === "brand") {
    const inner = (schema as S)._inner;
    if (inner) gen(inner as LoydSchema<unknown>, ctx);
    return;
  }

  genDelegate(schema, ctx);
}

function genDelegate(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const id = reg(ctx, schema);
  const { value: v, issues: iss, pathVar } = ctx;
  const r = tmpVar(ctx, "r");
  emit(
    ctx,
    `{ const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __di__ = 0; __di__ < ${r}.issues.length; __di__++) { const __di2__ = ${r}.issues[__di__]; ${iss}.push({ code: __di2__.code, path: ${pathVar}.concat(__di2__.path), meta: __di2__.meta }); } } else { ${v} = ${r}.data; } }`,
  );
}



function emitInlinedRule(rule: InlinedRule, ctx: Ctx, isTransform = false): void {
  const { value: v, issues: iss, pathVar } = ctx;

  switch (rule.kind) {
    case "str:minLength":
      emit(
        ctx,
        `if (${v}.length < ${rule.min}) { ${iss}.push({ code: "ERR_STRING_TOO_SHORT", path: ${pathVar}.slice(), meta: { min: ${rule.min}, actual: ${v}.length } }); }`,
      );
      break;

    case "str:maxLength":
      emit(
        ctx,
        `if (${v}.length > ${rule.max}) { ${iss}.push({ code: "ERR_STRING_TOO_LONG", path: ${pathVar}.slice(), meta: { max: ${rule.max}, actual: ${v}.length } }); }`,
      );
      break;

    case "str:email":
      emit(
        ctx,
        `if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_EMAIL", path: ${pathVar}.slice() }); }`,
      );
      break;

    case "str:url":
      emit(
        ctx,
        `if (!/^https?:\\/\\/[^\\s$.?#].[^\\s]*$/i.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_URL", path: ${pathVar}.slice() }); }`,
      );
      break;

    case "str:uuid":
      emit(
        ctx,
        `if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_UUID", path: ${pathVar}.slice() }); }`,
      );
      break;

    case "str:regex":
      emit(
        ctx,
        `if (!/${rule.source}/${rule.flags}.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pathVar}.slice() }); }`,
      );
      break;

    case "str:startsWith":
      emit(
        ctx,
        `if (!${v}.startsWith(${JSON.stringify(rule.prefix)})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pathVar}.slice(), meta: { prefix: ${JSON.stringify(rule.prefix)} } }); }`,
      );
      break;

    case "str:endsWith":
      emit(
        ctx,
        `if (!${v}.endsWith(${JSON.stringify(rule.suffix)})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pathVar}.slice(), meta: { suffix: ${JSON.stringify(rule.suffix)} } }); }`,
      );
      break;

    case "str:includes":
      emit(
        ctx,
        `if (!${v}.includes(${JSON.stringify(rule.sub)})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pathVar}.slice(), meta: { substring: ${JSON.stringify(rule.sub)} } }); }`,
      );
      break;

    case "str:nonempty":
      emit(
        ctx,
        `if (${v}.length === 0) { ${iss}.push({ code: "ERR_STRING_TOO_SHORT", path: ${pathVar}.slice(), meta: { min: 1, actual: 0 } }); }`,
      );
      break;

    case "str:trim":
      emit(ctx, `${v} = ${v}.trim();`);
      break;

    case "str:toLowerCase":
      emit(ctx, `${v} = ${v}.toLowerCase();`);
      break;

    case "str:toUpperCase":
      emit(ctx, `${v} = ${v}.toUpperCase();`);
      break;

    case "num:min": {
      const op = rule.inclusive ? "<" : "<=";
      const code = rule.inclusive ? "ERR_NUMBER_TOO_SMALL" : "ERR_NUMBER_TOO_SMALL";
      emit(
        ctx,
        `if (${v} ${op} ${rule.min}) { ${iss}.push({ code: "${code}", path: ${pathVar}.slice(), meta: { min: ${rule.min}, actual: ${v}, inclusive: ${rule.inclusive} } }); }`,
      );
      break;
    }

    case "num:max": {
      const op = rule.inclusive ? ">" : ">=";
      emit(
        ctx,
        `if (${v} ${op} ${rule.max}) { ${iss}.push({ code: "ERR_NUMBER_TOO_LARGE", path: ${pathVar}.slice(), meta: { max: ${rule.max}, actual: ${v}, inclusive: ${rule.inclusive} } }); }`,
      );
      break;
    }

    case "num:int":
      emit(
        ctx,
        `if (!Number.isInteger(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_INTEGER", path: ${pathVar}.slice(), meta: { actual: ${v} } }); }`,
      );
      break;

    case "num:finite":
      emit(
        ctx,
        `if (!Number.isFinite(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_FINITE", path: ${pathVar}.slice(), meta: { actual: ${v} } }); }`,
      );
      break;

    case "num:safe":
      emit(
        ctx,
        `if (!Number.isSafeInteger(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_INTEGER", path: ${pathVar}.slice(), meta: { actual: ${v} } }); }`,
      );
      break;

    case "num:multipleOf":
      emit(
        ctx,
        `if (${v} % ${rule.factor} !== 0) { ${iss}.push({ code: "ERR_NUMBER_NOT_MULTIPLE", path: ${pathVar}.slice(), meta: { multipleOf: ${rule.factor}, actual: ${v} } }); }`,
      );
      break;

    case "unknown":
      break;
  }
}

function genStr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as OptimizedStringSchema & S;

  // Uses inline rules
  const hasInlined = s._inlinedRules !== undefined;
  const inlinedRules: InlinedRule[] = hasInlined ? s._inlinedRules : [];
  const inlinedTransforms: InlinedRule[] = hasInlined ? (s._inlinedTransforms ?? []) : [];
  const hasUnknownRules: boolean = hasInlined ? (s._hasUnknownRules ?? false) : false;

  // Fallback 
  const rawRules: unknown[] = (!hasInlined && (s._rules?.length ?? 0) > 0) ? (s._rules ?? []) : [];
  const rawTransforms: unknown[] = (!hasInlined && (s._transforms?.length ?? 0) > 0) ? (s._transforms ?? []) : [];

  emit(ctx, `if (typeof ${v} !== "string") {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_STRING_INVALID_TYPE", path: ${pathVar}.slice() });`);
  emit(ctx, "} else {");

  for (const t of inlinedTransforms) {
    if (t.kind !== "unknown") {
      emitInlinedRule(t, ctx, true);
    }
  }

  // inline rules
  for (const rule of inlinedRules) {
    if (rule.kind !== "unknown") {
      emitInlinedRule(rule, ctx);
    }
  }

  if (hasUnknownRules || rawRules.length > 0 || rawTransforms.length > 0) {
    const id = reg(ctx, schema);
    const r = tmpVar(ctx, "sr");
    emit(
      ctx,
      `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __si__ = 0; __si__ < ${r}.issues.length; __si__++) { const __siss__ = ${r}.issues[__si__]; ${iss}.push({ code: __siss__.code, path: ${pathVar}.concat(__siss__.path), meta: __siss__.meta }); } } else { ${v} = ${r}.data; }`,
    );
  }

  emit(ctx, "}");
}

function genNum(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as OptimizedNumberSchema & S;

  const hasInlined = s._inlinedRules !== undefined;
  const inlinedRules: InlinedRule[] = hasInlined ? s._inlinedRules : [];
  const hasUnknownRules: boolean = hasInlined ? (s._hasUnknownRules ?? false) : false;
  const rawRules: unknown[] = (!hasInlined && (s._rules?.length ?? 0) > 0) ? (s._rules ?? []) : [];

  emit(ctx, `if (typeof ${v} !== "number") {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_NUMBER_INVALID_TYPE", path: ${pathVar}.slice() });`);
  emit(ctx, `} else if (Number.isNaN(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_NUMBER_NAN", path: ${pathVar}.slice() });`);
  emit(ctx, "} else {");

  for (const rule of inlinedRules) {
    if (rule.kind !== "unknown") {
      emitInlinedRule(rule, ctx);
    }
  }

  if (hasUnknownRules || rawRules.length > 0) {
    const id = reg(ctx, schema);
    const r = tmpVar(ctx, "nr");
    emit(
      ctx,
      `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __ni__ = 0; __ni__ < ${r}.issues.length; __ni__++) { const __niss__ = ${r}.issues[__ni__]; ${iss}.push({ code: __niss__.code, path: ${pathVar}.concat(__niss__.path), meta: __niss__.meta }); } }`,
    );
  }

  emit(ctx, "}");
}

function genBool(ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  emit(
    ctx,
    `if (typeof ${v} !== "boolean") { ${iss}.push({ code: "ERR_BOOLEAN_INVALID_TYPE", path: ${pathVar}.slice() }); }`,
  );
}

function genLit(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const exp = JSON.stringify((schema as S).value);
  emit(
    ctx,
    `if (${v} !== ${exp}) { ${iss}.push({ code: "ERR_LITERAL_INVALID", path: ${pathVar}.slice(), meta: { expected: ${exp}, actual: ${v} } }); }`,
  );
}

function genObj(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as S;
  const shape = s.shape as Record<string, LoydSchema<unknown>>;

  const keys: string[] = s._precomputedKeys ?? (shape ? Object.keys(shape) : []);
  const unknownKeys: string = s._unknownKeys ?? "strip";

  if (keys.length === 0 && unknownKeys === "strip") {
    emit(
      ctx,
      `if (typeof ${v} !== "object" || ${v} === null || Array.isArray(${v})) { ${iss}.push({ code: "ERR_OBJECT_INVALID_TYPE", path: ${pathVar}.slice() }); }`,
    );
    return;
  }

  const obj = tmpVar(ctx, "obj");
  const pl = tmpVar(ctx, "pl");

  emit(ctx, `if (typeof ${v} !== "object" || ${v} === null || Array.isArray(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_OBJECT_INVALID_TYPE", path: ${pathVar}.slice() });`);
  emit(ctx, "} else {");
  emit(ctx, `  const ${obj} = ${v};`);
  emit(ctx, `  const ${pl} = ${iss}.length;`);

  for (const key of keys) {
    const fv = tmpVar(ctx, `f${key.replace(/\W/g, "_")}`);
    const keyLit = JSON.stringify(key);

    emit(ctx, `  let ${fv} = ${obj}[${keyLit}];`);
    emit(ctx, `  ${pathVar}.push(${keyLit});`);

    const fc: Ctx = {
      ...ctx,
      lines: [],
      value: fv,
      pathVar,
      schemaRefs: ctx.schemaRefs,
    };
    gen(shape[key] as LoydSchema<unknown>, fc);
    for (const l of fc.lines) emit(ctx, `  ${l}`);

    emit(ctx, `  ${pathVar}.pop();`);
    emit(ctx, `  ${obj}[${keyLit}] = ${fv};`);
  }

  if (unknownKeys === "strict") {
    const knownSet = tmpVar(ctx, "ks");
    const uk = tmpVar(ctx, "uk");
    const keysLiteral = JSON.stringify(keys);
    emit(ctx, `  const ${knownSet} = new Set(${keysLiteral});`);
    emit(
      ctx,
      `  const ${uk} = Object.keys(${obj}).filter(k => !${knownSet}.has(k));`,
    );
    emit(
      ctx,
      `  if (${uk}.length > 0) { ${iss}.push({ code: "ERR_OBJECT_UNKNOWN_KEYS", path: ${pathVar}.slice(), meta: { keys: ${uk} } }); }`,
    );
  } else if (unknownKeys === "passthrough") {
    const knownSet = tmpVar(ctx, "ks");
    const keysLiteral = JSON.stringify(keys);
    emit(ctx, `  const ${knownSet} = new Set(${keysLiteral});`);
    emit(
      ctx,
      `  for (const __pk__ of Object.keys(${obj})) { if (!${knownSet}.has(__pk__)) { ${obj}[__pk__] = (${v} as Record<string,unknown>)[__pk__]; } }`,
    );
  }

  emit(ctx, `  if (${iss}.length === ${pl}) ${v} = ${obj} as typeof ${v};`);
  emit(ctx, "}");
}

function genArr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as S;
  const ap = tmpVar(ctx, "ap");
  const i = tmpVar(ctx, "i");
  const el = tmpVar(ctx, "el");

  emit(ctx, `if (!Array.isArray(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_ARRAY_INVALID_TYPE", path: ${pathVar}.slice() });`);
  emit(ctx, "} else {");

  if (s._minLen !== undefined) {
    emit(
      ctx,
      `  if (${v}.length < ${s._minLen}) { ${iss}.push({ code: "ERR_ARRAY_TOO_SHORT", path: ${pathVar}.slice(), meta: { min: ${s._minLen}, actual: ${v}.length } }); }`,
    );
  }
  if (s._maxLen !== undefined) {
    emit(
      ctx,
      `  if (${v}.length > ${s._maxLen}) { ${iss}.push({ code: "ERR_ARRAY_TOO_LONG", path: ${pathVar}.slice(), meta: { max: ${s._maxLen}, actual: ${v}.length } }); }`,
    );
  }

  emit(ctx, `  const ${ap} = ${iss}.length;`);
  emit(ctx, `  for (let ${i} = 0; ${i} < ${v}.length; ${i}++) {`);
  emit(ctx, `    let ${el} = ${v}[${i}];`);

  if (s.element) {
    emit(ctx, `    ${pathVar}.push(${i});`);
    const ec: Ctx = {
      ...ctx,
      lines: [],
      value: el,
      pathVar,
      schemaRefs: ctx.schemaRefs,
    };
    gen(s.element as LoydSchema<unknown>, ec);
    for (const l of ec.lines) emit(ctx, `    ${l}`);
    emit(ctx, `    ${pathVar}.pop();`);
  }

  emit(ctx, `    ${v}[${i}] = ${el};`);
  emit(ctx, "  }");
  emit(ctx, "}");
}


function genPipe(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const s = schema as S;
  // Use _flatSchemas if the optimizer produced it, otherwise _schemas
  const schemas: ReadonlyArray<LoydSchema<unknown>> =
    s._flatSchemas ?? s._schemas ?? [];

  if (schemas.length === 0) return;

  const { issues: iss } = ctx;
  const pl = tmpVar(ctx, "pl");

  emit(ctx, `const ${pl} = ${iss}.length;`);

  for (let i = 0; i < schemas.length; i++) {
    if (i > 0) {
      emit(ctx, `if (${iss}.length === ${pl}) {`);
    }

    const sc: Ctx = {
      ...ctx,
      lines: [],
      schemaRefs: ctx.schemaRefs,
    };
    gen(schemas[i], sc);
    for (const l of sc.lines) emit(ctx, `  ${l}`);

    if (i > 0) {
      emit(ctx, "}");
    }
  }
}

function genOpt(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const inner = (schema as S)._inner as LoydSchema<unknown> | undefined;
  const v = ctx.value;
  emit(ctx, `if (${v} !== undefined) {`);
  if (inner) {
    const ic: Ctx = { ...ctx, lines: [], schemaRefs: ctx.schemaRefs };
    gen(inner, ic);
    for (const l of ic.lines) emit(ctx, `  ${l}`);
  }
  emit(ctx, "}");
}

function genNullable(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const inner = (schema as S)._inner as LoydSchema<unknown> | undefined;
  const t = schema._type;
  const v = ctx.value;

  const guard =
    t === "nullish" ? `${v} !== null && ${v} !== undefined` : `${v} !== null`;

  emit(ctx, `if (${guard}) {`);
  if (inner) {
    const ic: Ctx = { ...ctx, lines: [], schemaRefs: ctx.schemaRefs };
    gen(inner, ic);
    for (const l of ic.lines) emit(ctx, `  ${l}`);
  }
  emit(ctx, "}");
}

function genUnion(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as S;

  //O(1) lookup
  if (s._discriminatorKey && s._discriminatorMap) {
    const key = JSON.stringify(s._discriminatorKey);
    const mapId = reg(ctx, schema);
    const disc = tmpVar(ctx, "disc");
    const matched = tmpVar(ctx, "matched");
    const r = tmpVar(ctx, "ur");

    emit(
      ctx,
      `if (typeof ${v} !== "object" || ${v} === null) { ${iss}.push({ code: "ERR_OBJECT_INVALID_TYPE", path: ${pathVar}.slice() }); } else {`,
    );
    emit(ctx, `  const ${disc} = (${v} as Record<string,unknown>)[${key}];`);
    emit(
      ctx,
      `  const ${matched} = __schemas__[${JSON.stringify(mapId)}]._discriminatorMap?.get(${disc});`,
    );
    emit(
      ctx,
      `  if (!${matched}) { ${iss}.push({ code: "ERR_DISCRIMINATED_UNION_INVALID_KEY", path: ${pathVar}.slice(), meta: { key: ${key}, received: ${disc} } }); } else {`,
    );
    emit(
      ctx,
      `    const ${r} = ${matched}.safeParse(${v}); if (!${r}.success) { for (let __ui__ = 0; __ui__ < ${r}.issues.length; __ui__++) { const __uiss__ = ${r}.issues[__ui__]; ${iss}.push({ code: __uiss__.code, path: ${pathVar}.concat(__uiss__.path), meta: __uiss__.meta }); } } else { ${v} = ${r}.data; }`,
    );
    emit(ctx, "  }");
    emit(ctx, "}");
    return;
  }

  const options = s._options as ReadonlyArray<LoydSchema<unknown>>;
  if (!options || options.length === 0) {
    emit(ctx, `${iss}.push({ code: "ERR_UNION_NO_MATCH", path: ${pathVar}.slice() });`);
    return;
  }

  const matched = tmpVar(ctx, "um");
  emit(ctx, `let ${matched} = false;`);

  for (const option of options) {
    const id = reg(ctx, option);
    const r = tmpVar(ctx, "ur");
    emit(
      ctx,
      `if (!${matched}) { const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (${r}.success) { ${v} = ${r}.data; ${matched} = true; } }`,
    );
  }

  emit(
    ctx,
    `if (!${matched}) { ${iss}.push({ code: "ERR_UNION_NO_MATCH", path: ${pathVar}.slice() }); }`,
  );
}

//entry point
export function generateCode(
  schema: LoydSchema<unknown>,
  options: CodegenOptions = {},
): CodegenResult & { schemaRefs: Record<string, LoydSchema<unknown>> } {
  _state.counter += 1;
  const fnName = options.fnName ?? `__loyd_v${_state.counter}__`;
  const dev = options.mode === "development" || (options.comments ?? false);

  const pathVar = "__path__";

  const ctx: Ctx = {
    lines: [],
    issues: "__issues__",
    value: "__input__",
    pathVar,
    dev,
    schemaRefs: {},
    varCount: 0,
  };

  gen(schema, ctx);

  const header = dev ? `// @loydjs/compiler — ${schema._type}\n` : "";
  const body = ctx.lines.map((l) => `  ${l}`).join("\n");

  const code = `${header}function ${fnName}(input) {\n  "use strict";\n  let __input__ = input;\n  const __issues__ = [];\n  const ${pathVar} = [];\n${body}\n  if (__issues__.length > 0) return { success: false, data: undefined, issues: __issues__ };\n  return { success: true, data: __input__, issues: [] };\n}`;

  return { code, fnName, imports: [], schemaRefs: ctx.schemaRefs };
}