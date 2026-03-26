import type { LoydSchema } from "@loyd/core";
import type { CompiledValidatorFn } from "./compiler.js";

/**
 * Use a WeakMap so as not to prevent the GC from collecting the schematics.
 */
export interface CompilerCache {
  get<T>(schema: LoydSchema<T>): CompiledValidatorFn<T> | undefined;
  set<T>(schema: LoydSchema<T>, fn: CompiledValidatorFn<T>): void;
  has(schema: LoydSchema<unknown>): boolean;
  delete(schema: LoydSchema<unknown>): boolean;
  clear(): void;
  readonly size: number;
}

export declare function createCache(): CompilerCache;

/*Default shared cache */
export declare const globalCache: CompilerCache;
