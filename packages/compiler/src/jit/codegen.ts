import type { LoydSchema } from "@loydjs/core";

// biome-ignore lint/suspicious/noExplicitAny: schema internals are untyped by design
type SchemaInternal = any;

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
  const { value: v, issues: iss, pathVar } = ctx;
  const r = tmpVar(ctx, "r");
  emit(
    ctx,
    `{ const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __di__ = 0; __di__ < ${r}.issues.length; __di__++) { const __diss__ = ${r}.issues[__di__]; ${iss}.push({ code: __diss__.code, path: ${pathVar}.concat(__diss__.path), meta: __diss__.meta }); } } else { ${v} = ${r}.data; } }`,
  );
}

function genStr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as SchemaInternal;
  const rules: Array<{ kind: string; [k: string]: unknown }> = s._rules ?? [];
  const hasTransforms = (s._transforms?.length ?? 0) > 0;

  // Type check always inlined
  emit(ctx, `if (typeof ${v} !== "string") {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_STRING_INVALID_TYPE", path: ${pathVar}.slice() });`);
  emit(ctx, "} else {");

  for (const rule of rules) {
    switch (rule.kind) {
      case "minLength": {
        const min = rule.min as number;
        emit(
          ctx,
          `  if (${v}.length < ${min}) { ${iss}.push({ code: "ERR_STRING_TOO_SHORT", path: ${pathVar}.slice(), meta: { min: ${min}, actual: ${v}.length } }); }`,
        );
        break;
      }
      case "maxLength": {
        const max = rule.max as number;
        emit(
          ctx,
          `  if (${v}.length > ${max}) { ${iss}.push({ code: "ERR_STRING_TOO_LONG", path: ${pathVar}.slice(), meta: { max: ${max}, actual: ${v}.length } }); }`,
        );
        break;
      }
      case "pattern": {
        const src = (rule.pattern as RegExp).source;
        const flags = (rule.pattern as RegExp).flags;
        emit(
          ctx,
          `  if (!/${src}/${flags}.test(${v})) { ${iss}.push({ code: "ERR_STRING_PATTERN_MISMATCH", path: ${pathVar}.slice() }); }`,
        );
        break;
      }
      case "email": {
        emit(
          ctx,
          `  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_EMAIL", path: ${pathVar}.slice() }); }`,
        );
        break;
      }
      case "url": {
        emit(
          ctx,
          `  try { new URL(${v}); } catch { ${iss}.push({ code: "ERR_STRING_INVALID_URL", path: ${pathVar}.slice() }); }`,
        );
        break;
      }
      case "uuid": {
        emit(
          ctx,
          `  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(${v})) { ${iss}.push({ code: "ERR_STRING_INVALID_UUID", path: ${pathVar}.slice() }); }`,
        );
        break;
      }
      default: {
        if (!hasTransforms) {
          const id = reg(ctx, schema);
          const r = tmpVar(ctx, "r");
          emit(
            ctx,
            `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __si__ = 0; __si__ < ${r}.issues.length; __si__++) { const __siss__ = ${r}.issues[__si__]; ${iss}.push({ code: __siss__.code, path: ${pathVar}.concat(__siss__.path), meta: __siss__.meta }); } } else { ${v} = ${r}.data; }`,
          );
          break;
        }
      }
    }
  }

  if (hasTransforms) {
    const id = reg(ctx, schema);
    const r = tmpVar(ctx, "r");
    emit(
      ctx,
      `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __si__ = 0; __si__ < ${r}.issues.length; __si__++) { const __siss__ = ${r}.issues[__si__]; ${iss}.push({ code: __siss__.code, path: ${pathVar}.concat(__siss__.path), meta: __siss__.meta }); } } else { ${v} = ${r}.data; }`,
    );
  }

  emit(ctx, "}");
}
function genNum(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const s = schema as SchemaInternal;
  const rules: Array<{ kind: string; [k: string]: unknown }> = s._rules ?? [];

  emit(ctx, `if (typeof ${v} !== "number") {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_NUMBER_INVALID_TYPE", path: ${pathVar}.slice() });`);
  emit(ctx, `} else if (Number.isNaN(${v})) {`);
  emit(ctx, `  ${iss}.push({ code: "ERR_NUMBER_NAN", path: ${pathVar}.slice() });`);
  emit(ctx, "} else {");

  for (const rule of rules) {
    switch (rule.kind) {
      case "min": {
        const min = rule.min as number;
        const excl = rule.exclusive as boolean | undefined;
        const op = excl ? "<=" : "<";
        const code = excl ? "ERR_NUMBER_TOO_SMALL_EXCLUSIVE" : "ERR_NUMBER_TOO_SMALL";
        emit(
          ctx,
          `  if (${v} ${op} ${min}) { ${iss}.push({ code: "${code}", path: ${pathVar}.slice(), meta: { min: ${min}, actual: ${v} } }); }`,
        );
        break;
      }
      case "max": {
        const max = rule.max as number;
        const excl = rule.exclusive as boolean | undefined;
        const op = excl ? ">=" : ">";
        const code = excl ? "ERR_NUMBER_TOO_BIG_EXCLUSIVE" : "ERR_NUMBER_TOO_BIG";
        emit(
          ctx,
          `  if (${v} ${op} ${max}) { ${iss}.push({ code: "${code}", path: ${pathVar}.slice(), meta: { max: ${max}, actual: ${v} } }); }`,
        );
        break;
      }
      case "int": {
        emit(
          ctx,
          `  if (!Number.isInteger(${v})) { ${iss}.push({ code: "ERR_NUMBER_NOT_INTEGER", path: ${pathVar}.slice(), meta: { actual: ${v} } }); }`,
        );
        break;
      }
      case "positive": {
        emit(
          ctx,
          `  if (${v} <= 0) { ${iss}.push({ code: "ERR_NUMBER_NOT_POSITIVE", path: ${pathVar}.slice(), meta: { actual: ${v} } }); }`,
        );
        break;
      }
      case "negative": {
        emit(
          ctx,
          `  if (${v} >= 0) { ${iss}.push({ code: "ERR_NUMBER_NOT_NEGATIVE", path: ${pathVar}.slice(), meta: { actual: ${v} } }); }`,
        );
        break;
      }
      case "multipleOf": {
        const factor = rule.factor as number;
        emit(
          ctx,
          `  if (${v} % ${factor} !== 0) { ${iss}.push({ code: "ERR_NUMBER_NOT_MULTIPLE", path: ${pathVar}.slice(), meta: { factor: ${factor}, actual: ${v} } }); }`,
        );
        break;
      }
      default: {
        const id = reg(ctx, schema);
        const r = tmpVar(ctx, "r");
        emit(
          ctx,
          `  const ${r} = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!${r}.success) { for (let __ni__ = 0; __ni__ < ${r}.issues.length; __ni__++) { const __niss__ = ${r}.issues[__ni__]; ${iss}.push({ code: __niss__.code, path: ${pathVar}.concat(__niss__.path), meta: __niss__.meta }); } }`,
        );
        break;
      }
    }
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
  const exp = JSON.stringify((schema as SchemaInternal).value);
  emit(
    ctx,
    `if (${v} !== ${exp}) { ${iss}.push({ code: "ERR_LITERAL_INVALID", path: ${pathVar}.slice(), meta: { expected: ${exp}, actual: ${v} } }); }`,
  );
}
function genObj(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;
  const shape = (schema as SchemaInternal).shape ?? ({} as Record<string, LoydSchema<unknown>>);
  const keys = Object.keys(shape);
  if (keys.length === 0) {
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
  emit(ctx, `  if (${iss}.length === ${pl}) ${v} = ${obj} as typeof ${v};`);
  emit(ctx, "}");
}

function genArr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, pathVar } = ctx;

  type ArrSchemaInternal = LoydSchema<unknown> & {
    _minLen?: number;
    _maxLen?: number;
    element?: LoydSchema<unknown>;
  };
  const s = schema as ArrSchemaInternal;
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
    gen(s.element, ec);
    for (const l of ec.lines) emit(ctx, `    ${l}`);

    emit(ctx, `    ${pathVar}.pop();`);
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

  // nullish = null | undefined, nullable = null
  const guard = t === "nullish" ? `${v} !== null && ${v} !== undefined` : `${v} !== null`;

  emit(ctx, `if (${guard}) {`);
  if (inner) {
    const ic: Ctx = { ...ctx, lines: [], schemaRefs: ctx.schemaRefs };
    gen(inner, ic);
    for (const l of ic.lines) emit(ctx, `  ${l}`);
  }
  emit(ctx, "}");
}

//Entry point
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
