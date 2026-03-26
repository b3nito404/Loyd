import type { LoydSchema } from "@loyd/core";

/**
 * @example
 * await emit(UserSchema, {
 *   outFile: "./__loyd_compiled__/UserSchema.js",
 *   exportName: "validateUser",
 * });
 */
export interface EmitOptions {
  outFile: string;
  exportName?: string;
  format?: "esm" | "cjs";
  /** Include (.d.ts) */
  dts?: boolean;
}

export interface EmitResult {
  jsFile: string;
  dtsFile?: string;
  bytes: number;
}

export declare function emit(
  schema: LoydSchema<unknown>,
  options: EmitOptions,
): Promise<EmitResult>;
