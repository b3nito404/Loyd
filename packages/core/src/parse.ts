import { LoydError } from "./errors.js";
import type { LoydIssue, LoydResult, LoydSchema } from "./types.js";

export function safeParse<T>(schema: LoydSchema<T>, input: unknown): LoydResult<T> {
  return schema.safeParse(input);
}

export function parse<T>(schema: LoydSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new LoydError(result.issues);
}

export function ok<T>(data: T): LoydResult<T> {
  return { success: true, data, issues: [] };
}

export function fail<T>(issues: [LoydIssue, ...LoydIssue[]]): LoydResult<T> {
  return { success: false, data: undefined, issues };
}

export function failOne<T>(issue: LoydIssue): LoydResult<T> {
  return fail([issue]);
}

export function isOk<T>(
  result: LoydResult<T>
): result is { success: true; data: T; issues: [] } {
  return result.success;
}

export function isFail<T>(
  result: LoydResult<T>
): result is { success: false; data: undefined; issues: [LoydIssue, ...LoydIssue[]] } {
  return !result.success;
}

export function mergeIssues(...groups: LoydIssue[][]): LoydIssue[] {
  const result: LoydIssue[] = [];
  for (const group of groups) {
    for (const issue of group) {
      result.push(issue);
    }
  }
  return result;
}

export function prefixPath<T>(result: LoydResult<T>, prefix: string | number): LoydResult<T> {
  if (result.success) return result;
  const prefixed: LoydIssue[] = result.issues.map((issue) => ({
    ...issue,
    path: [prefix, ...issue.path],
  }));
  return fail(prefixed as [LoydIssue, ...LoydIssue[]]);
}
