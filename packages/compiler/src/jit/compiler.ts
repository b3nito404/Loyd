import type { LoydSchema } from "@loydjs/core";
import { globalCache } from "./cache.js";
import { generateCode } from "./codegen.js";
import { optimize } from "./optimizer.js";
import type { CompiledValidatorFn, CompilerOptions } from "./types.js";

export type { CompiledValidatorFn, CompilerOptions };

export function compile<T>(
  schema: LoydSchema<T>,
  options: CompilerOptions = {},
): CompiledValidatorFn<T> {
  // Cache check
  const cached = globalCache.get(schema);
  if (cached) return cached;

  const { schema: target } =
    options.optimize !== false
      ? optimize(schema as LoydSchema<unknown>)
      : { schema: schema as LoydSchema<unknown> };

  const { code, fnName, schemaRefs } = generateCode(target, {
    mode: options.mode ?? "production",
    comments: options.mode === "development",
  });

  //direct mutation
  schemaRefs.__schema_ref__ = target;

  // Expose _discriminatorMap for optimized union (lookup O(1))
  for (const [id, s] of Object.entries(schemaRefs)) {
    // biome-ignore lint/suspicious/noExplicitAny: schema internals
    const dm = (s as any)._discriminatorMap;
    if (dm) {
      schemaRefs[id] = s;
    }
  }

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
