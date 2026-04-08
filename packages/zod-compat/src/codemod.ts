// packages/zod-compat/src/codemod.ts
export interface CodemodOptions {
  write?: boolean;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
}

export interface CodemodResult {
  transformed: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
}

export const TRANSFORMATIONS: Array<{
  description: string;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    description: "Replace zod import with @loyd/schema",
    pattern: /import\s*\{\s*z\s*\}\s*from\s*["']zod["']/g,
    replacement: 'import * as L from "@loyd/schema"',
  },
  { description: "z.infer → L.Infer", pattern: /z\.infer</g, replacement: "L.Infer<" },
  { description: "z.string()", pattern: /\bz\.string\(\)/g, replacement: "L.string()" },
  { description: "z.number()", pattern: /\bz\.number\(\)/g, replacement: "L.number()" },
  { description: "z.boolean()", pattern: /\bz\.boolean\(\)/g, replacement: "L.boolean()" },
  { description: "z.date()", pattern: /\bz\.date\(\)/g, replacement: "L.date()" },
  { description: "z.bigint()", pattern: /\bz\.bigint\(\)/g, replacement: "L.bigint()" },
  { description: "z.literal()", pattern: /\bz\.literal\(/g, replacement: "L.literal(" },
  { description: "z.object()", pattern: /\bz\.object\(/g, replacement: "L.object(" },
  { description: "z.array()", pattern: /\bz\.array\(/g, replacement: "L.array(" },
  { description: "z.tuple()", pattern: /\bz\.tuple\(/g, replacement: "L.tuple(" },
  { description: "z.union()", pattern: /\bz\.union\(/g, replacement: "L.union(" },
  { description: "z.record()", pattern: /\bz\.record\(/g, replacement: "L.record(" },
  { description: "z.enum()", pattern: /\bz\.enum\(\[/g, replacement: "L.union([L.literal(" },
];

export function transformSource(source: string): string | null {
  if (!source.includes('from "zod"') && !source.includes("from 'zod'")) return null;
  let result = source;
  for (const { pattern, replacement } of TRANSFORMATIONS) {
    result = result.replace(pattern, replacement);
  }
  return result !== source ? result : null;
}

export async function runCodemod(
  directory: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> {
  const { write = false, verbose = false } = options;
  const result: CodemodResult = { transformed: [], skipped: [], errors: [] };

  const [{ default: nodeFs }, { default: nodePath }] = await Promise.all([
    import("node:fs"),
    import("node:path"),
  ]);

  function findTsFiles(dir: string): string[] {
    const files: string[] = [];
    try {
      const entries = nodeFs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = nodePath.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== "dist")
            files.push(...findTsFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          files.push(fullPath);
        }
      }
    } catch {
      // ignore
    }
    return files;
  }

  for (const file of findTsFiles(directory)) {
    try {
      const source = nodeFs.readFileSync(file, "utf8");
      const transformed = transformSource(source);
      if (transformed === null) {
        result.skipped.push(file);
        continue;
      }
      if (write) nodeFs.writeFileSync(file, transformed);
      result.transformed.push(file);
      if (verbose) console.log(`${write ? "✓" : "~"} ${file}`);
    } catch (err) {
      result.errors.push({
        file,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return result;
}
