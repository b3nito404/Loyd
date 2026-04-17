import type { LoydResult } from "@loydjs/core";
export type CompiledValidatorFn<T> = (input: unknown) => LoydResult<T>;
export interface CompilerOptions {
  throwOnError?: boolean;
  optimize?: boolean;
  mode?: "development" | "production";
}
export interface CodegenOptions {
  fnName?: string;
  comments?: boolean;
  format?: "esm" | "cjs" | "iife";
  mode?: "development" | "production";
}
export interface CodegenResult {
  code: string;
  fnName: string;
  imports: string[];
}
