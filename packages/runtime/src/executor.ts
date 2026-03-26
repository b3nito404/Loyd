import type { LoydSchema, LoydResult } from "@loyd/core";

export type RuntimeMode = "strict" | "strip" | "passthrough";

export interface ExecutorOptions {
  mode?: RuntimeMode;
  /**
   * @default false
   */
  freeze?: boolean;
  /**
   * @default false
   */
  zeroCopy?: boolean;
}

/**
 * Creates an optimized executor with fixed options.
 * More efficient than going through the options on every call.
 * @example
 * const executor = createExecutor({ mode: "strict", freeze: true });
 * const result = executor.run(UserSchema, rawInput);
 */
export interface Executor {
  run<T>(schema: LoydSchema<T>, input: unknown): LoydResult<T>;
  runOrThrow<T>(schema: LoydSchema<T>, input: unknown): T;
  readonly options: Required<ExecutorOptions>;
}

export declare function createExecutor(options?: ExecutorOptions): Executor;

/** Default executor (mode: "strip", freeze: false, zeroCopy: false) */
export declare const defaultExecutor: Executor;
