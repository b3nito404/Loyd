import { generateInlineValidator } from "@loydjs/compiler";
import type { LoydSchema } from "@loydjs/core";
import { parse as parseAcorn } from "acorn";
import type { CallExpression, Identifier, Node, Program, VariableDeclaration } from "acorn";
import MagicString from "magic-string";

export interface AotTransformOptions {
  outDir?: string;
  sourcemap?: boolean;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
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

const _moduleSchemas = new Map<string, Map<string, LoydSchema<unknown>>>();

export function registerModuleSchemas(
  moduleId: string,
  schemas: Map<string, LoydSchema<unknown>>,
): void {
  _moduleSchemas.set(moduleId, schemas);
}

export function hasLoydImports(source: string): boolean {
  return (
    source.includes("@loydjs/schema") ||
    source.includes("@loydjs/core") ||
    source.includes("@loydjs/compiler")
  );
}

export function transformLoydImports(
  source: string,
  filename: string,
  options: AotTransformOptions = {},
): AotTransformResult | null {
  if (!hasLoydImports(source)) return null;

  if (!source.includes("compile(")) return null;

  let ast: Program;

  try {
    ast = parseAcorn(source, {
      ecmaVersion: 2022,
      sourceType: "module",
    }) as Program;
  } catch {
    return transformLoydImportsFallback(source, filename, options);
  }

  const ms = new MagicString(source);
  const schemas = _moduleSchemas.get(filename) ?? new Map<string, LoydSchema<unknown>>();
  const generatedFiles: string[] = [];
  let modified = false;

  walkAst(ast, (node: Node) => {
    if (node.type !== "VariableDeclaration") return;

    const decl = node as VariableDeclaration;
    for (const declarator of decl.declarations) {
      if (
        declarator.type !== "VariableDeclarator" ||
        !declarator.init ||
        declarator.init.type !== "CallExpression"
      )
        continue;

      const call = declarator.init as CallExpression;
      const callee = call.callee as Identifier;

      if (callee.type !== "Identifier" || callee.name !== "compile") continue;
      if (call.arguments.length === 0) continue;

      const schemaArg = call.arguments[0] as Identifier;
      if (schemaArg.type !== "Identifier") continue;

      const schemaName = schemaArg.name;
      const schema = schemas.get(schemaName);

      if (!schema) {
        if (options.verbose) {
          console.log(
            `[@loydjs/vite] Cannot resolve schema "${schemaName}" statically in ${filename}, falling back to JIT`,
          );
        }
        continue;
      }

      const varNode = declarator.id as Identifier;
      if (varNode.type !== "Identifier") continue;

      const varName = varNode.name;

      try {
        const inlined = generateInlineValidator(schema, varName);

        ms.overwrite(
          (node as Node & { start: number }).start,
          (node as Node & { end: number }).end,
          inlined,
        );
        modified = true;

        if (options.verbose) {
          console.log(
            `[@loydjs/vite] AOT-inlined validator for "${varName}" (${schema._type}) in ${filename}`,
          );
        }
      } catch (err) {
        if (options.verbose) {
          console.warn(`[@loydjs/vite] Failed to inline "${varName}" in ${filename}:`, err);
        }
      }
    }
  });

  if (!modified) return null;

  if (!ms.toString().includes("compile(")) {
    removeCompileImport(ms, ast, source);
  }

  const result: AotTransformResult = {
    code: ms.toString(),
    generatedFiles,
  };

  if (options.sourcemap !== false) {
    result.map = ms.generateMap({ source: filename, includeContent: true }).toString();
  }

  return result;
}

function transformLoydImportsFallback(
  source: string,
  _filename: string,
  _options: AotTransformOptions,
): AotTransformResult | null {
  return {
    code: `/* @loydjs/vite: AOT-ready (JIT fallback) */\n${source}`,
    generatedFiles: [],
  };
}

//Remove compile import

function removeCompileImport(ms: MagicString, ast: Program, _source: string): void {
  walkAst(ast, (node: Node) => {
    if (node.type !== "ImportDeclaration") return;

    const imp = node as Node & {
      source: { value: string };
      specifiers: Array<Node & { imported: Identifier; local: Identifier }>;
      start: number;
      end: number;
    };

    if (imp.source.value !== "@loydjs/compiler") return;

    const remaining = imp.specifiers.filter((s) => s.imported?.name !== "compile");

    if (remaining.length === 0) {
      ms.remove(imp.start, imp.end + 1); // +1 pour le \n
    } else {
      const names = remaining
        .map((s) =>
          s.imported.name === s.local.name
            ? s.imported.name
            : `${s.imported.name} as ${s.local.name}`,
        )
        .join(", ");
      ms.overwrite(imp.start, imp.end, `import { ${names} } from "@loydjs/compiler"`);
    }
  });
}

function walkAst(node: Node, visitor: (node: Node) => void): void {
  visitor(node);

  for (const key of Object.keys(node)) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (child && typeof child === "object") {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && "type" in item) {
            walkAst(item as Node, visitor);
          }
        }
      } else if ("type" in child) {
        walkAst(child as Node, visitor);
      }
    }
  }
}
