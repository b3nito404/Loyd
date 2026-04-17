import type { LoydSchema } from "@loydjs/core";

// Internal helper type for schema introspection
// biome-ignore lint/suspicious/noExplicitAny: schema internals are untyped by design
type SchemaInternal = any;

import type { CodegenOptions, CodegenResult } from "./types.js";
let _counter = 0;
interface Ctx {
  lines: string[];
  issues: string;
  value: string;
  path: string;
  dev: boolean;
  schemaRefs: Record<string, LoydSchema<unknown>>;
}
function emit(ctx: Ctx, line: string): void {
  ctx.lines.push(line);
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
  if (t === "literal") {
    genLit(schema, ctx);
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
  const { value: v, issues: iss, path } = ctx;
  emit(
    ctx,
    `{ const __r__ = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!__r__.success) { for (const __i__ of __r__.issues) { ${iss}.push({ ...__i__, path: [...${path}, ...__i__.path] }); } } else { ${v} = __r__.data; } }`,
  );
}
function genStr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, path } = ctx;
  const hasRules =
    ((schema as SchemaInternal)._rules?.length ?? 0) > 0 ||
    ((schema as SchemaInternal)._transforms?.length ?? 0) > 0;
  emit(
    ctx,
    `if (typeof ${v} !== "string") { ${iss}.push({ code: "ERR_STRING_INVALID_TYPE", path: ${path} }); ${hasRules ? "} else {" : "}"}`,
  );
  if (hasRules) {
    const id = reg(ctx, schema);
    emit(
      ctx,
      `  const __sr__ = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!__sr__.success) { for (const __si__ of __sr__.issues) { ${iss}.push({ ...__si__, path: [...${path}, ...__si__.path] }); } } else { ${v} = __sr__.data; }}`,
    );
  }
}
function genNum(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, path } = ctx;
  const hasRules = ((schema as SchemaInternal)._rules?.length ?? 0) > 0;
  emit(
    ctx,
    `if (typeof ${v} !== "number") { ${iss}.push({ code: "ERR_NUMBER_INVALID_TYPE", path: ${path} }); } else if (Number.isNaN(${v})) { ${iss}.push({ code: "ERR_NUMBER_NAN", path: ${path} }); } ${hasRules ? "else {" : ""}`,
  );
  if (hasRules) {
    const id = reg(ctx, schema);
    emit(
      ctx,
      `  const __nr__ = __schemas__[${JSON.stringify(id)}].safeParse(${v}); if (!__nr__.success) { for (const __ni__ of __nr__.issues) { ${iss}.push({ ...__ni__, path: [...${path}, ...__ni__.path] }); } }}`,
    );
  }
}
function genBool(ctx: Ctx): void {
  const { value: v, issues: iss, path } = ctx;
  emit(
    ctx,
    `if (typeof ${v} !== "boolean") { ${iss}.push({ code: "ERR_BOOLEAN_INVALID_TYPE", path: ${path} }); }`,
  );
}
function genLit(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, path } = ctx;
  const exp = JSON.stringify((schema as SchemaInternal).value);
  emit(
    ctx,
    `if (${v} !== ${exp}) { ${iss}.push({ code: "ERR_LITERAL_INVALID", path: ${path}, meta: { expected: ${exp}, actual: ${v} } }); }`,
  );
}
function genObj(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, path } = ctx;
  const shape = (schema as SchemaInternal).shape ?? ({} as Record<string, LoydSchema<unknown>>);
  const keys = Object.keys(shape);
  emit(
    ctx,
    `if (typeof ${v} !== "object" || ${v} === null || Array.isArray(${v})) { ${iss}.push({ code: "ERR_OBJECT_INVALID_TYPE", path: ${path} }); } else {`,
  );
  emit(
    ctx,
    `  const __obj__ = ${v}; const __res__: Record<string, unknown> = {}; const __pl__ = ${iss}.length;`,
  );
  for (const key of keys) {
    const fv = `__f_${key.replace(/\W/g, "_")}__`;
    const fp = `[...${path}, ${JSON.stringify(key)}]`;
    emit(ctx, `  let ${fv} = __obj__[${JSON.stringify(key)}];`);
    const fc: Ctx = {
      lines: [],
      issues: iss,
      value: fv,
      path: fp,
      dev: ctx.dev,
      schemaRefs: ctx.schemaRefs,
    };
    gen(shape[key] as LoydSchema<unknown>, fc);
    for (const l of fc.lines) emit(ctx, `  ${l}`);
    emit(
      ctx,
      `  if (${iss}.length === __pl__) __res__[${JSON.stringify(key)}] = ${fv}; else __res__[${JSON.stringify(key)}] = ${fv};`,
    );
  }
  emit(ctx, `  if (${iss}.length === __pl__) ${v} = __res__ as typeof ${v};`);
  emit(ctx, "}");
}
function genArr(schema: LoydSchema<unknown>, ctx: Ctx): void {
  const { value: v, issues: iss, path } = ctx;
  // Utilisation d'un type plus précis pour éviter `any`
  type ArrSchemaInternal = LoydSchema<unknown> & {
    _minLen?: number;
    _maxLen?: number;
    element?: LoydSchema<unknown>;
  };
  const s = schema as ArrSchemaInternal;
  emit(
    ctx,
    `if (!Array.isArray(${v})) { ${iss}.push({ code: "ERR_ARRAY_INVALID_TYPE", path: ${path} }); } else {`,
  );
  if (s._minLen !== undefined)
    emit(
      ctx,
      `  if (${v}.length < ${s._minLen}) { ${iss}.push({ code: "ERR_ARRAY_TOO_SHORT", path: ${path}, meta: { min: ${s._minLen}, actual: ${v}.length } }); }`,
    );
  if (s._maxLen !== undefined)
    emit(
      ctx,
      `  if (${v}.length > ${s._maxLen}) { ${iss}.push({ code: "ERR_ARRAY_TOO_LONG", path: ${path}, meta: { max: ${s._maxLen}, actual: ${v}.length } }); }`,
    );
  emit(ctx, `  const __ar__: unknown[] = []; const __ap__ = ${iss}.length;`);
  emit(ctx, `  for (let __i__ = 0; __i__ < ${v}.length; __i__++) { let __el__ = ${v}[__i__];`);
  if (s.element) {
    const ec: Ctx = {
      lines: [],
      issues: iss,
      value: "__el__",
      path: `[...${path}, __i__]`,
      dev: ctx.dev,
      schemaRefs: ctx.schemaRefs,
    };
    gen(s.element, ec);
    for (const l of ec.lines) emit(ctx, `    ${l}`);
  }
  emit(ctx, "    __ar__.push(__el__); }");
  emit(ctx, `  if (${iss}.length === __ap__) ${v} = __ar__ as typeof ${v};`);
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
  const v = ctx.value;
  emit(ctx, `if (${v} !== null && ${v} !== undefined) {`);
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
  _counter++;
  const fnName = options.fnName ?? `__loyd_v${_counter}__`;
  const dev = options.mode === "development" || (options.comments ?? false);
  const ctx: Ctx = {
    lines: [],
    issues: "__issues__",
    value: "__input__",
    path: "[]",
    dev,
    schemaRefs: {},
  };
  gen(schema, ctx);
  const header = dev ? `// @loydjs/compiler — ${schema._type}\n` : "";
  const body = ctx.lines.map((l) => `  ${l}`).join("\n");
  const code = `${header}function ${fnName}(input) {\n  let __input__ = input;\n  const __issues__ = [];\n${body}\n  if (__issues__.length > 0) return { success: false, data: undefined, issues: __issues__ };\n  return { success: true, data: __input__, issues: [] };\n}`;
  return { code, fnName, imports: [], schemaRefs: ctx.schemaRefs };
}
