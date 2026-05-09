import type { LoydSchema } from "@loydjs/core";
import { generateCode } from "../jit/codegen.js";
import { optimize } from "../jit/optimizer.js";

export interface AotTransformOptions {
  outDir?: string;
  sourcemap?: boolean;
  include?: string[];
  exclude?: string[];
}

export interface AotTransformResult {
  code: string;
  map?: string;
  generatedFiles: string[];
}

export type AotTransformFn = (
  source: string,
  filename: string,
  options?: AotTransformOptions,
) => AotTransformResult | null;

// suppored pattern :
//   compile(SomeSchema)
//   compile(SomeSchema, { mode: "production" })
//   const fn = compile(SomeSchema)
//   safeParse(SomeSchema, input)   -> repllaced by inlined fn(input)

// Regex to detect  @loydjs/compiler imports
const COMPILE_IMPORT_RE = /import\s+\{[^}]*\bcompile\b[^}]*\}\s+from\s+["']@loydjs\/compiler["']/;

const _schemaRegistry = new Map<string, LoydSchema<unknown>>();

export function registerSchema(key: string, schema: LoydSchema<unknown>): void {
  _schemaRegistry.set(key, schema);
}

export function clearSchemaRegistry(): void {
  _schemaRegistry.clear();
}

export function generateInlineValidator(schema: LoydSchema<unknown>, varName: string): string {
  const { schema: optimized } = optimize(schema);
  const { code, fnName, schemaRefs } = generateCode(optimized, {
    mode: "production",
    fnName: `__loyd_${varName.replace(/[^a-z0-9]/gi, "_")}__`,
  });

  const hasRefs = Object.keys(schemaRefs).filter((k) => k !== "__schema_ref__").length > 0;

  if (!hasRefs) {
    return [
      `/* @loydjs/compiler: AOT-inlined validator for ${varName} */`,
      code,
      `const ${varName} = ${fnName};`,
    ].join("\n");
  }

  // Case with references: we also generate the validators for inline references.
  const refParts: string[] = [];
  const registryEntries: string[] = [];

  for (const [id, refSchema] of Object.entries(schemaRefs)) {
    if (id === "__schema_ref__") continue;
    const refFnName = `__ref_${id.replace(/[^a-z0-9]/gi, "_")}__`;
    const { code: refCode } = generateCode(refSchema, {
      mode: "production",
      fnName: refFnName,
    });
    refParts.push(refCode);
    registryEntries.push(`  ${JSON.stringify(id)}: { safeParse: ${refFnName} }`);
  }

  return [
    `/* @loydjs/compiler: AOT-inlined validator for ${varName} (with refs) */`,
    ...refParts,
    `const __schemas_${varName}__ = {\n${registryEntries.join(",\n")}\n};`,
    code.replace(/__schemas__/g, `__schemas_${varName}__`),
    `const ${varName} = ${fnName};`,
  ].join("\n");
}

export function transformSource(
  source: string,
  _filename: string,
  registeredSchemas: Map<string, LoydSchema<unknown>>,
): AotTransformResult | null {
  if (!COMPILE_IMPORT_RE.test(source)) return null;

  let transformed = source;
  const generatedFiles: string[] = [];
  let modified = false;

  // Pattern: const validatorName = compile(SchemaName)
  // or:      const validatorName = compile(SchemaName, options)
  const COMPILE_ASSIGN_RE = /const\s+(\w+)\s*=\s*compile\s*\(\s*(\w+)\s*(?:,\s*[^)]+)?\s*\)/g;

  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
  while ((match = COMPILE_ASSIGN_RE.exec(source)) !== null) {
    const [fullMatch, varName, schemaName] = match;

    const schema = registeredSchemas.get(schemaName);
    if (!schema) {
      continue;
    }

    try {
      const inlined = generateInlineValidator(schema, varName);
      transformed = transformed.replace(fullMatch, inlined);
      modified = true;
    } catch {}
  }

  if (!modified) return null;

  // (checks that there are no more compile() calls remaining)
  if (!transformed.includes("compile(")) {
    transformed = transformed.replace(
      /import\s+\{([^}]*)\bcompile\b([^}]*)\}\s+from\s+["']@loydjs\/compiler["']/g,
      (_, before, after) => {
        const remaining = `${before}${after}`
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s !== "compile")
          .join(", ");
        return remaining ? `import { ${remaining} } from "@loydjs/compiler"` : "";
      },
    );
  }

  return {
    code: transformed,
    generatedFiles,
  };
}
