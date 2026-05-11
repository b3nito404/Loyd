import { compile } from "@loydjs/compiler";
import type { LoydResult, LoydSchema } from "@loydjs/core";

export type RuntimeMode = "strict" | "strip" | "passthrough";

export interface ExecutorOptions {
  mode?: RuntimeMode;
  /**
   * @default false
   */
  freeze?: boolean;
  /**
   * Skip creating a new result object on success  return input directly.
   * @default false
   */
  zeroCopy?: boolean;
  /**
   * Stop validation after first error per object.
   * @default false
   */
  abortEarly?: boolean;
}

export interface Executor {
  run<T>(schema: LoydSchema<T>, input: unknown): LoydResult<T>;
  runOrThrow<T>(schema: LoydSchema<T>, input: unknown): T;
  readonly options: Required<ExecutorOptions>;
}

const _EMPTY_ISSUES: [] = [];

function makeSuccessResult<T>(data: T): LoydResult<T> {
  return { success: true, data, issues: _EMPTY_ISSUES };
}

export function createExecutor(options: ExecutorOptions = {}): Executor {
  const resolved: Required<ExecutorOptions> = {
    mode: options.mode ?? "strip",
    freeze: options.freeze ?? false,
    zeroCopy: options.zeroCopy ?? false,
    abortEarly: options.abortEarly ?? false,
  };

  const { freeze: doFreeze, zeroCopy } = resolved;

  const maybeFreeze = doFreeze ? <T>(v: T): T => deepFreezeImpl(v) : <T>(v: T): T => v;

  return {
    options: resolved,

    run<T>(schema: LoydSchema<T>, input: unknown): LoydResult<T> {
      const validator = compile(schema);
      const result = validator(input);

      if (!result.success) return result;

      const data = maybeFreeze(result.data);

      if (zeroCopy && data === result.data) {
        return result;
      }

      return makeSuccessResult(data);
    },

    runOrThrow<T>(schema: LoydSchema<T>, input: unknown): T {
      const validator = compile(schema);
      const result = validator(input);

      if (!result.success) {
        const first = result.issues[0];
        throw new Error(
          first?.message ??
            `Validation failed: ${first?.code ?? "ERR_UNKNOWN"} at ${JSON.stringify(first?.path ?? [])}`,
        );
      }

      return maybeFreeze(result.data);
    },
  };
}

/**strip mode*/
export const defaultExecutor: Executor = createExecutor();

export const zeroCopyExecutor: Executor = createExecutor({ zeroCopy: true });

export const strictExecutor: Executor = createExecutor({ mode: "strict" });

function deepFreezeImpl<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;

  Object.freeze(value);

  for (const key of Object.keys(value as object)) {
    const v = (value as Record<string, unknown>)[key];
    if (v && typeof v === "object" && !Object.isFrozen(v)) {
      deepFreezeImpl(v);
    }
  }

  return value;
}
