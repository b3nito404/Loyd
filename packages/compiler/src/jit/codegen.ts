import type { LoydSchema } from "@loydjs/core";

// biome-ignore lint/suspicious/noExplicitAny: schema internals are untyped by design
type SchemaInternal = any;

import type { CodegenOptions, CodegenResult } from "./types.js";

const _state = { counter: 0 };

interface Ctx {
  lines: string[];
  issues: string;
  value: string;
  pathParts: string[];
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

function pathLiteral(ctx: Ctx): string {
  if (ctx.pathParts.length === 0) return "[]";
  return `[${ctx.pathParts.join(",")}]`;
}

function pathConcat(ctx: Ctx, issPath: string): string {
  if (ctx.pathParts.length === 0) return issPath;
  return `[${ctx.pathParts.join(",")}].concat(${issPath})`;
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
  if (t === "brand") {
    const inner = (schema as SchemaInternal)._inner;
    if (inner) gen(inner as LoydSchema<unknown>, ctx);
    return;
  }
  genDelegate(schema, ctx);
}

function genDelegate(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const id = reg(ctx, schema);
  const { value: v, issues: iss } = ctx;
  const r = tmpVar(ctx, "r");
  emit(
    ctx,
    `{ const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __di__ = 0; __di__ < ${r}.issues.length; __di__++) { const __diss__ = ${r}.issues[__di__]; ${iss}.push({ code: __diss__.code, path: ${pathConcat(ctx, "__diss__.path")}, meta: __diss__.meta }); } } else { ${v} = ${r}.data; } }`,
  );
}

function genStr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss } = ctx;
  const s = schema as SchemaInternal;
  const rules: Array<(v: string) => unknown> = s._rules ?? [];
  const hasTransforms = (s._transforms?.length ?? 0) > 0;
  const pl = pathLiteral(ctx);

  emit(ctx, `if (typeof ${v} !== "string") {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_STRING_INVALID_TYPE", path: ${pl} });`);
  emit(ctx, "} else {");

  const inlined = s._inlinedRules as Array<{ kind: string; [k: string]: unknown }> | undefined;

  if (inlined) {
    for (const rule of inlined) {
      emitStringInlinedRule(rule, v, iss, pl, ctx);
    }
    const transforms = s._inlinedTransforms as Array<{ kind: string }> | undefined;
    if (transforms) {
      for (const t of transforms) {
        emitStringTransformInlined(t, v, ctx);
      }
    }
    if (s._hasUnknownRules) {
      emitStringDelegate(schema, v, iss, ctx);
    }
  } else if (rules.length > 0 || hasTransforms) {
    emitStringDelegate(schema, v, iss, ctx);
  }

  emit(ctx, "}");
}

function emitStringInlinedRule(
  rule: { kind: string; [k: string]: unknown },
  v: string,
  iss: string,
  pl: string,
  ctx: Ctx,
): void {
  switch (rule.kind) {
    case "str:minLength":
      emit(
        ctx,
        `  if (${v}.length < ${rule.min}) { ${iss}.push({ code: "ERR_STRING_TOO_SHORT", path: ${pl}, meta: { min: ${rule.min}, actual: ${v}.length } }); }`,
      );
      break;
    case "str:maxLength":
      emit(
        ctx,
        `  if (${v}.length > ${rule.max}) { ${iss}.push({ code: "ERR_STRING_TOO_LONG", path: ${pl}, meta: { max: ${rule.max}, actual: ${v}.length } }); }`,
      );
      break;
    case "str:email":
      emit(
        ctx,
        `  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_EMAIL", path: ${pl} }); }`,
      );
      break;
    case "str:url":
      emit(
        ctx,
        `  if (!/^https?:\\/\\/[^\\s$.?#].[^\\s]*$/i.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_URL", path: ${pl} }); }`,
      );
      break;
    case "str:uuid":
      emit(
        ctx,
        `  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_UUID", path: ${pl} }); }`,
      );
      break;
    case "str:regex":
      emit(
        ctx,
        `  if (!/${rule.source}/${rule.flags}.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pl} }); }`,
      );
      break;
    case "str:startsWith":
      emit(
        ctx,
        `  if (!${v}.startsWith(${JSON.stringify(rule.prefix)})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pl}, meta: { prefix: ${JSON.stringify(rule.prefix)} } }); }`,
      );
      break;
    case "str:endsWith":
      emit(
        ctx,
        `  if (!${v}.endsWith(${JSON.stringify(rule.suffix)})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pl}, meta: { suffix: ${JSON.stringify(rule.suffix)} } }); }`,
      );
      break;
    case "str:includes":
      emit(
        ctx,
        `  if (!${v}.includes(${JSON.stringify(rule.sub)})) { ${iss}.push({ code: "ERR_STRING_INVALID_REGEX", path: ${pl}, meta: { substring: ${JSON.stringify(rule.sub)} } }); }`,
      );
      break;
    case "str:nonempty":
      emit(
        ctx,
        `  if (${v}.length === 0) { ${iss}.push({ code: "ERR_STRING_TOO_SHORT", path: ${pl}, meta: { min: 1, actual: 0 } }); }`,
      );
      break;
    default:
      break;
  }
}

function emitStringTransformInlined(rule: { kind: string }, v: string, ctx: Ctx): void {
  switch (rule.kind) {
    case "str:trim":
      emit(ctx, `  ${v} = ${v}.trim();`);
      break;
    case "str:toLowerCase":
      emit(ctx, `  ${v} = ${v}.toLowerCase();`);
      break;
    case "str:toUpperCase":
      emit(ctx, `  ${v} = ${v}.toUpperCase();`);
      break;
    default:
      break;
  }
}

function emitStringDelegate(schema: LoydSchema<unknown>, v: string, iss: string, ctx: Ctx): void {
  const id = reg(ctx, schema);
  const r = tmpVar(ctx, "sr");
  emit(
    ctx,
    `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __si__ = 0; __si__ < ${r}.issues.length; __si__++) { const __siss__ = ${r}.issues[__si__]; ${iss}.push({ code: __siss__.code, path: ${pathConcat(ctx, "__siss__.path")}, meta: __siss__.meta }); } } else { ${v} = ${r}.data; }`,
  );
}

function genNum(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss } = ctx;
  const s = schema as SchemaInternal;
  const rules: Array<(v: number) => unknown> = s._rules ?? [];
  const pl = pathLiteral(ctx);

  emit(ctx, `if (typeof ${v} !== "number") {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_NUMBER_INVALID_TYPE", path: ${pl} });`);
  emit(ctx, `} else if (Number.isNaN(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_NUMBER_NAN", path: ${pl} });`);
  emit(ctx, "} else {");

  const inlined = s._inlinedRules as Array<{ kind: string; [k: string]: unknown }> | undefined;

  if (inlined) {
    for (const rule of inlined) {
      emitNumberInlinedRule(rule, v, iss, pl, ctx);
    }
    if (s._hasUnknownRules) {
      emitNumberDelegate(schema, v, iss, ctx);
    }
  } else if (rules.length > 0) {
    emitNumberDelegate(schema, v, iss, ctx);
  }

  emit(ctx, "}");
}

function emitNumberInlinedRule(
  rule: { kind: string; [k: string]: unknown },
  v: string,
  iss: string,
  pl: string,
  ctx: Ctx,
): void {
  switch (rule.kind) {
    case "num:min": {
      const op = rule.inclusive ? "<" : "<=";
      emit(
        ctx,
        `  if (${v} ${op} ${rule.min}) { ${iss}.push({ code: "ERR_NUMBER_TOO_SMALL", path: ${pl}, meta: { min: ${rule.min}, actual: ${v}, inclusive: ${rule.inclusive} } }); }`,
      );
      break;
    }
    case "num:max": {
      const op = rule.inclusive ? ">" : ">=";
      emit(
        ctx,
        `  if (${v} ${op} ${rule.max}) { ${iss}.push({ code: "ERR_NUMBER_TOO_LARGE", path: ${pl}, meta: { max: ${rule.max}, actual: ${v}, inclusive: ${rule.inclusive} } }); }`,
      );
      break;
    }
    case "num:int":
      emit(
        ctx,
        `  if (!Number.isInteger(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_INTEGER", path: ${pl}, meta: { actual: ${v} } }); }`,
      );
      break;
    case "num:finite":
      emit(
        ctx,
        `  if (!Number.isFinite(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_FINITE", path: ${pl}, meta: { actual: ${v} } }); }`,
      );
      break;
    case "num:safe":
      emit(
        ctx,
        `  if (!Number.isSafeInteger(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_INTEGER", path: ${pl}, meta: { actual: ${v} } }); }`,
      );
      break;
    case "num:multipleOf":
      emit(
        ctx,
        `  if (${v} % ${rule.factor} !== 0) { ${iss}.push({ code: "ERR_NUMBER_NOT_MULTIPLE", path: ${pl}, meta: { multipleOf: ${rule.factor}, actual: ${v} } }); }`,
      );
      break;
    default:
      break;
  }
}

function emitNumberDelegate(schema: LoydSchema<unknown>, v: string, iss: string, ctx: Ctx): void {
  const id = reg(ctx, schema);
  const r = tmpVar(ctx, "nr");
  emit(
    ctx,
    `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __ni__ = 0; __ni__ < ${r}.issues.length; __ni__++) { const __niss__ = ${r}.issues[__ni__]; ${iss}.push({ code: __niss__.code, path: ${pathConcat(ctx, "__niss__.path")}, meta: __niss__.meta }); } }`,
  );
}

function genBool(ctx: Ctx): void {
  const { value: v, issues: iss } = ctx;
  const pl = pathLiteral(ctx);
  emit(
    ctx,
    `if (typeof ${v} !== "boolean") { ${iss}.push({ code: "ERR_BOOLEAN_INVALID_TYPE", path: ${pl} }); }`,
  );
}

function genLit(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss } = ctx;
  const exp = JSON.stringify((schema as SchemaInternal).value);
  const pl = pathLiteral(ctx);
  emit(
    ctx,
    `if (${v} !== ${exp}) { ${iss}.push({ code: "ERR_LITERAL_INVALID", path: ${pl}, meta: { expected: ${exp}, actual: ${v} } }); }`,
  );
}

function genObj(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss } = ctx;
  const s = schema as SchemaInternal;
  const shape = s.shape ?? ({} as Record<string, LoydSchema<unknown>>);
  const keys: string[] = s._precomputedKeys ?? Object.keys(shape);
  const pl = pathLiteral(ctx);
  const unknownKeys: string = s._unknownKeys ?? "strip";

  if (keys.length === 0) {
    emit(
      ctx,
      `if (typeof ${v} !== "object" || ${v} === null || Array.isArray(${v})) { ${iss}.push({ code: "ERR_OBJECT_INVALID_TYPE", path: ${pl} }); }`,
    );
    return;
  }

  const obj = tmpVar(ctx, "obj");
  const pl2 = tmpVar(ctx, "pl");

  emit(ctx, `if (typeof ${v} !== "object" || ${v} === null || Array.isArray(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_OBJECT_INVALID_TYPE", path: ${pl} });`);
  emit(ctx, "} else {");
  emit(ctx, `  const ${obj} = ${v};`);
  emit(ctx, `  const ${pl2} = ${iss}.length;`);

  for (const key of keys) {
    const fv = tmpVar(ctx, `f${key.replace(/\W/g, "_")}`);
    const keyLit = JSON.stringify(key);

    emit(ctx, `  let ${fv} = ${obj}[${keyLit}];`);

    const childCtx: Ctx = {
      ...ctx,
      lines: [],
      value: fv,
      pathParts: [...ctx.pathParts, keyLit],
      schemaRefs: ctx.schemaRefs,
    };
    gen(shape[key] as LoydSchema<unknown>, childCtx);
    for (const l of childCtx.lines) emit(ctx, `  ${l}`);

    emit(ctx, `  ${obj}[${keyLit}] = ${fv};`);
  }

  if (unknownKeys === "strict") {
    const ks = tmpVar(ctx, "ks");
    const uk = tmpVar(ctx, "uk");
    emit(ctx, `  const ${ks} = new Set(${JSON.stringify(keys)});`);
    emit(ctx, `  const ${uk} = Object.keys(${obj}).filter(k => !${ks}.has(k));`);
    emit(
      ctx,
      `  if (${uk}.length > 0) { ${iss}.push({ code: "ERR_OBJECT_UNKNOWN_KEYS", path: ${pl}, meta: { keys: ${uk} } }); }`,
    );
  } else if (unknownKeys === "passthrough") {
    const ks = tmpVar(ctx, "ks");
    emit(ctx, `  const ${ks} = new Set(${JSON.stringify(keys)});`);
    emit(
      ctx,
      `  for (const __pk__ of Object.keys(${obj})) { if (!${ks}.has(__pk__)) { ${obj}[__pk__] = ${v}[__pk__]; } }`,
    );
  }

  emit(ctx, `  if (${iss}.length === ${pl2}) ${v} = ${obj};`);
  emit(ctx, "}");
}

function genArr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss } = ctx;
  const s = schema as SchemaInternal;
  const pl = pathLiteral(ctx);
  const i = tmpVar(ctx, "i");
  const el = tmpVar(ctx, "el");

  emit(ctx, `if (!Array.isArray(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_ARRAY_INVALID_TYPE", path: ${pl} });`);
  emit(ctx, "} else {");

  if (s._minLen !== undefined) {
    emit(
      ctx,
      `  if (${v}.length < ${s._minLen}) { ${iss}.push({ code: "ERR_ARRAY_TOO_SHORT", path: ${pl}, meta: { min: ${s._minLen}, actual: ${v}.length } }); }`,
    );
  }
  if (s._maxLen !== undefined) {
    emit(
      ctx,
      `  if (${v}.length > ${s._maxLen}) { ${iss}.push({ code: "ERR_ARRAY_TOO_LONG", path: ${pl}, meta: { max: ${s._maxLen}, actual: ${v}.length } }); }`,
    );
  }

  emit(ctx, `  for (let ${i} = 0; ${i} < ${v}.length; ${i}++) {`);
  emit(ctx, `    let ${el} = ${v}[${i}];`);

  if (s.element) {
    const childCtx: Ctx = {
      ...ctx,
      lines: [],
      value: el,
      pathParts: [...ctx.pathParts, i],
      schemaRefs: ctx.schemaRefs,
    };
    gen(s.element as LoydSchema<unknown>, childCtx);
    for (const l of childCtx.lines) emit(ctx, `    ${l}`);
  }

  emit(ctx, `    ${v}[${i}] = ${el};`);
  emit(ctx, "  }");
  emit(ctx, "}");
}

function genOpt(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const inner = (schema as SchemaInternal)._inner as LoydSchema<unknown> | undefined;
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
  const inner = (schema as SchemaInternal)._inner as LoydSchema<unknown> | undefined;
  const t = schema._type;
  const v = ctx.value;
  const guard = t === "nullish" ? `${v} !== null && ${v} !== undefined` : `${v} !== null`;
  emit(ctx, `if (${guard}) {`);
  if (inner) {
    const ic: Ctx = { ...ctx, lines: [], schemaRefs: ctx.schemaRefs };
    gen(inner, ic);
    for (const l of ic.lines) emit(ctx, `  ${l}`);
  }
  emit(ctx, "}");
}

export function generateCode(
  schema: LoydSchema<unknown>,
  options: CodegenOptions = {},
): CodegenResult & { schemaRefs: Record<string, LoydSchema<unknown>> } {
  _state.counter += 1;
  const fnName = options.fnName ?? `__loyd_v${_state.counter}__`;
  const dev = options.mode === "development" || (options.comments ?? false);

  const ctx: Ctx = {
    lines: [],
    issues: "__issues__",
    value: "__input__",
    pathParts: [],
    dev,
    schemaRefs: {},
    varCount: 0,
  };

  gen(schema, ctx);

  const header = dev ? `// @loydjs/compiler — ${schema._type}\n` : "";
  const body = ctx.lines.map((l) => `  ${l}`).join("\n");
  const code = `${header}function ${fnName}(input) {\n  "use strict";\n  let __input__ = input;\n  const __issues__ = [];\n${body}\n  if (__issues__.length > 0) return { success: false, data: undefined, issues: __issues__ };\n  return { success: true, data: __input__, issues: [] };\n}`;

  return { code, fnName, imports: [], schemaRefs: ctx.schemaRefs };
}
