// packages/core/src/parse.ts
import { LoydError } from "./errors.js";
import type { LoydIssue, LoydResult, LoydSchema } from "./types.js";

export function safeParse<T>(schema: LoydSchema<T>, input: unknown): LoydResult<T> {
  return schema.safeParse(input);
}
export function parse<T>(schema: LoydSchema<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  throw new LoydError(r.issues);
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
export function isOk<T>(r: LoydResult<T>): r is { success: true; data: T; issues: [] } {
  return r.success;
}
export function isFail<T>(
  r: LoydResult<T>,
): r is { success: false; data: undefined; issues: [LoydIssue, ...LoydIssue[]] } {
  return !r.success;
}
export function mergeIssues(...groups: LoydIssue[][]): LoydIssue[] {
  const r: LoydIssue[] = [];
  for (const g of groups) for (const i of g) r.push(i);
  return r;
}
export function prefixPath<T>(result: LoydResult<T>, prefix: string | number): LoydResult<T> {
  if (result.success) return result;
  const prefixed: LoydIssue[] = result.issues.map((i) => ({ ...i, path: [prefix, ...i.path] }));
  return fail(prefixed as [LoydIssue, ...LoydIssue[]]);
}
