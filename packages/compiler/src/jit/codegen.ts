import type { LoydSchema } from "@loyd/core";

export interface CodegenResult {
  code: string;
  fnName: string;
  imports: string[];
}

export interface CodegenOptions {
  fnName?: string;
  comments?: boolean;
  format?: "esm" | "cjs" | "iife";
}

/**
 * @example
 * const { code } = generateCode(UserSchema, { fnName: "validateUser" });
 * //"function validateUser(input) { ... }"
 */
export declare function generateCode(
  schema: LoydSchema<unknown>,
  options?: CodegenOptions,
): CodegenResult;
