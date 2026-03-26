import type { LoydResult, LoydSchema } from "@loyd/core";

export type CompiledValidatorFn<T> = (input: unknown) => LoydResult<T>;

export interface CompilerOptions {
  /**
   * If true, the compiler throws an exception instead of returning
   * a LoydResult on failure.
   * @default false
   */
  throwOnError?: boolean;

  /**
   * @default true
   */
  optimize?: boolean;

  /**
   * @default "production"
   */
  mode?: "development" | "production";
}

/**
 * The result is cached in a WeakMap<LoydSchema, CompiledValidatorFn>.
 *
 * @example
 * const validate = compile(UserSchema);
 * const result = validate({ name: "Benito", age: 19 });
 */
export declare function compile<T>(
  schema: LoydSchema<T>,
  options?: CompilerOptions
): CompiledValidatorFn<T>;

export declare function invalidateCache(schema: LoydSchema<unknown>): void;
export declare function clearCache(): void;
export declare function isCompiled(schema: LoydSchema<unknown>): boolean;
