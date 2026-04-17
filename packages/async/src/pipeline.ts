import type { LoydIssue, LoydResult, LoydSchema } from "@loydjs/core";
import { signalToPromise } from "./abort.js";

export interface ParseAsyncOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AsyncPipelineResult<T> {
  result: LoydResult<T>;
  syncIssues: LoydIssue[];
  asyncIssues: LoydIssue[];
  asyncExecuted: boolean;
}

function schemaIsAsync(schema: LoydSchema<unknown>): boolean {
  // biome-ignore lint/suspicious/noExplicitAny: internal schema introspection
  const s = schema as any;
  if (s._isAsync === true) return true;
  if (s._type === "refineAsync") return true;
  if (s._inner) return schemaIsAsync(s._inner as LoydSchema<unknown>);
  if (s.shape) {
    for (const field of Object.values(s.shape as Record<string, LoydSchema<unknown>>)) {
      if (schemaIsAsync(field)) return true;
    }
  }
  return false;
}

interface AsyncRule {
  // biome-ignore lint/suspicious/noExplicitAny: internal
  predicate: (value: any, signal?: AbortSignal) => Promise<boolean>;
  // biome-ignore lint/suspicious/noExplicitAny: internal
  value: any;
  code: string;
  message?: string;
  path: Array<string | number>;
}

function collectAsyncRules(
  schema: LoydSchema<unknown>,
  value: unknown,
  path: Array<string | number> = [],
): AsyncRule[] {
  const rules: AsyncRule[] = [];
  // biome-ignore lint/suspicious/noExplicitAny: internal
  const s = schema as any;
  if (s._type === "refineAsync" && typeof s._pred === "function") {
    rules.push({
      predicate: s._pred as AsyncRule["predicate"],
      value,
      code: s._opts?.code ?? "ERR_ASYNC_REFINEMENT",
      message: s._opts?.message,
      path: [...path, ...(s._opts?.path ?? [])],
    });
  }
  if (s._inner) rules.push(...collectAsyncRules(s._inner as LoydSchema<unknown>, value, path));
  return rules;
}

export async function parseAsync<T>(
  schema: LoydSchema<T>,
  input: unknown,
  options: ParseAsyncOptions = {},
): Promise<LoydResult<T>> {
  const { result } = await parseAsyncDetailed(schema, input, options);
  return result;
}

export async function parseAsyncDetailed<T>(
  schema: LoydSchema<T>,
  input: unknown,
  options: ParseAsyncOptions = {},
): Promise<AsyncPipelineResult<T>> {
  const { signal, timeoutMs } = options;
  let effectiveSignal: AbortSignal | undefined = signal;
  let internalController: AbortController | undefined;

  if (timeoutMs !== undefined && !signal) {
    internalController = new AbortController();
    const timer = setTimeout(
      () => internalController?.abort(new Error(`Timeout after ${timeoutMs}ms`)),
      timeoutMs,
    );
    internalController.signal.addEventListener("abort", () => clearTimeout(timer), {
      once: true,
    });
    effectiveSignal = internalController.signal;
  }

  try {
    const syncResult = schema.safeParse(input);
    const syncIssues: LoydIssue[] = syncResult.success ? [] : [...syncResult.issues];

    if (!syncResult.success)
      return { result: syncResult, syncIssues, asyncIssues: [], asyncExecuted: false };
    if (!schemaIsAsync(schema))
      return { result: syncResult, syncIssues: [], asyncIssues: [], asyncExecuted: false };

    const asyncRules = collectAsyncRules(schema, syncResult.data);
    if (asyncRules.length === 0)
      return { result: syncResult, syncIssues: [], asyncIssues: [], asyncExecuted: false };

    const asyncResults = await Promise.all(
      asyncRules.map(async (rule): Promise<LoydIssue | null> => {
        try {
          const passed = await (effectiveSignal
            ? Promise.race([
                rule.predicate(rule.value, effectiveSignal),
                signalToPromise(effectiveSignal),
              ])
            : rule.predicate(rule.value));
          if (!passed) {
            return {
              code: rule.code,
              path: rule.path,
              ...(rule.message ? { message: rule.message } : {}),
            };
          }
          return null;
        } catch (err) {
          return {
            code: effectiveSignal?.aborted ? "ERR_ASYNC_ABORTED" : "ERR_ASYNC_REFINEMENT",
            path: rule.path,
            message: err instanceof Error ? err.message : "Async error",
          };
        }
      }),
    );

    const asyncIssues = asyncResults.filter((i): i is LoydIssue => i !== null);
    if (asyncIssues.length > 0) {
      return {
        result: {
          success: false,
          data: undefined,
          issues: asyncIssues as [LoydIssue, ...LoydIssue[]],
        },
        syncIssues: [],
        asyncIssues,
        asyncExecuted: true,
      };
    }
    return { result: syncResult, syncIssues: [], asyncIssues: [], asyncExecuted: true };
  } finally {
    if (internalController && !internalController.signal.aborted) {
      internalController.abort();
    }
  }
}
