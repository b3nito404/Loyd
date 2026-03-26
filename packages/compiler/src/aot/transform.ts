/**
 * @example
 * import { object, string, number } from "@loyd/schema";
 * const UserSchema = object({ name: string(), age: number() });
 *
 * (compilé AOT)
 * import { __compiled_abc123 as UserSchema } from "./__loyd_compiled__/UserSchema.js";
 */
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
