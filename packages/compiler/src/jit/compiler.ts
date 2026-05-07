import type { LoydSchema } from "@loydjs/core";
import { globalCache } from "./cache.js";
import { generateCode } from "./codegen.js";
import type { CompiledValidatorFn, CompilerOptions } from "./types.js";

export type { CompiledValidatorFn, CompilerOptions };

export function compile<T>(
  schema: LoydSchema<T>,
  options: CompilerOptions = {},
): CompiledValidatorFn<T> {
  const cached = globalCache.get(schema);
  if (cached) return cached;

  const { code, fnName, schemaRefs } = generateCode(schema, {
    mode: options.mode ?? "production",
    comments: options.mode === "development",
  });

  schemaRefs.__schema_ref__ = schema;

  const fn = new Function("__schemas__", `${code}\nreturn ${fnName};`)(
    schemaRefs,
  ) as CompiledValidatorFn<T>;

  globalCache.set(schema, fn);
  return fn;
}
export function invalidateCache(schema: LoydSchema<unknown>): void {
  globalCache.delete(schema);
}
export function clearCache(): void {
  globalCache.clear();
}
export function isCompiled(schema: LoydSchema<unknown>): boolean {
  return globalCache.has(schema);
}
