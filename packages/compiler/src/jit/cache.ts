import type { LoydSchema } from "@loyd/core";
import type { CompiledValidatorFn } from "./types.js";
export interface CompilerCache {
  get<T>(s: LoydSchema<T>): CompiledValidatorFn<T> | undefined;
  set<T>(s: LoydSchema<T>, fn: CompiledValidatorFn<T>): void;
  has(s: LoydSchema<unknown>): boolean;
  delete(s: LoydSchema<unknown>): boolean;
  clear(): void;
  readonly size: number;
}
export function createCache(): CompilerCache {
  const store = new Map<LoydSchema<unknown>, CompiledValidatorFn<unknown>>();
  return {
    get<T>(s: LoydSchema<T>) {
      return store.get(s) as CompiledValidatorFn<T> | undefined;
    },
    set<T>(s: LoydSchema<T>, fn: CompiledValidatorFn<T>) {
      store.set(s, fn as CompiledValidatorFn<unknown>);
    },
    has(s) {
      return store.has(s);
    },
    delete(s) {
      return store.delete(s);
    },
    clear() {
      store.clear();
    },
    get size() {
      return store.size;
    },
  };
}
export const globalCache: CompilerCache = createCache();
