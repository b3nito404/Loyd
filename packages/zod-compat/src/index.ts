//from zod
import type { LoydSchema } from "@loyd/core";

/**
 * Converts a Zod scheme to an equivalent Loyd scheme.
 * Supporte z.string, z.number, z.object, z.array, z.union,
 * z.optional, z.nullable, z.literal, z.enum, z.record, z.tuple.
 *
 * @example
 * import { z } from "zod";
 * import { fromZod } from "@loyd/zod-compat";
 *
 * const ZodSchema = z.object({ name: z.string().min(2), age: z.number().int() });
 * const LoydSchemaEquiv = fromZod(ZodSchema);
 */
export declare function fromZod<T>(zodSchema: unknown): LoydSchema<T>;

/**
 *  Converts a Zod scheme to an equivalent Loyd scheme.
 *  Useful for interoperability with libraries that expect Zod.
 *
 * @example
 * import { toZod } from "@loyd/zod-compat";
 * const zodSchema = toZod(UserSchema);
 * // Compatible with react-hook-form resolver Zod
 */
export declare function toZod<T>(loydSchema: LoydSchema<T>): unknown
export interface CodemodOptions {
  /**
   * @default false
   */
  write?: boolean;
  /**
   * @default ["**\/*.ts", "**\/*.tsx"]
   */
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
}

export interface CodemodResult {
  transformed: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
}

/**
 * Codemod AST, which automatically transforms a codebase
 * using Zod to the equivalent Loyd API.
 *
 * - import { z } from "zod" -> import * as L from "@loyd/schema"
 * - z.string() -> L.string()
 * - z.object({}) -> L.object({})
 * - z.string().min(n) -> L.pipe(L.string(), L.minLength(n))
 * - z.infer<typeof S> -> L.Infer<typeof S>
 * - schema.parse() -> L.parse(schema, ...)
 * - schema.safeParse() -> L.safeParse(schema, ...)
 *
 * @example
 * // CLI : loyd migrate --from zod --write
 * const result = await runCodemod("./src", { write: true, verbose: true });
 * console.log(`Transformed: ${result.transformed.length} files`);
 */
export declare function runCodemod(
  directory: string,
  options?: CodemodOptions,
): Promise<CodemodResult>;
