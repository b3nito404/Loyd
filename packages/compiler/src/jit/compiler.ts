import type { LoydSchema } from "@loyd/core";
import { globalCache } from "./cache.js";
import { generateCode } from "./codegen.js";
import { optimize } from "./optimizer.js";
import type { CompiledValidatorFn, CompilerOptions } from "./types.js";
export type { CompiledValidatorFn, CompilerOptions };
export function compile<T>(
  schema: LoydSchema<T>,
  options: CompilerOptions = {},
): CompiledValidatorFn<T> {
  const cached = globalCache.get(schema);
  if (cached) return cached;
  const target = options.optimize !== false ? optimize(schema).schema : schema;
  const { code, fnName, schemaRefs } = generateCode(target, {
    mode: options.mode ?? "production",
    comments: options.mode === "development",
  });
  const schemasRegistry = { ...schemaRefs, __schema_ref__: target };
  // eslint-disable-next-line no-new-func
  const fn = new Function("__schemas__", `${code}\nreturn ${fnName};`)(
    schemasRegistry,
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
