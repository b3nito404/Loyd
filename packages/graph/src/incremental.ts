import type { LoydIssue } from "@loydjs/core";
import type { FieldDag } from "./dag.js";
import type { DirtyTracker } from "./dirty.js";
export interface IncrementalValidationOptions {
  incrementalOnly?: boolean;
  preservePreviousErrors?: boolean;
}
export interface IncrementalValidationResult<T> {
  data: T | undefined;
  issues: LoydIssue[];
  issuesByPath: Map<string, LoydIssue[]>;
  revalidatedFields: string[][];
  preservedFields: string[][];
  revalidationRatio: number;
  isValid: boolean;
}
function getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
  let c: unknown = obj;
  for (const k of path) {
    if (c == null || typeof c !== "object") return undefined;
    c = (c as Record<string, unknown>)[k];
  }
  return c;
}
export function validateIncremental<T extends Record<string, unknown>>(
  dag: FieldDag,
  dirtyTracker: DirtyTracker,
  input: T,
  previousIssues: LoydIssue[],
  options: IncrementalValidationOptions = {},
): IncrementalValidationResult<T> {
  const { incrementalOnly = true, preservePreviousErrors = true } = options;
  const totalFields = dag.nodes.size;
  const revalidatedKeys = new Set<string>();
  const preservedKeys = new Set<string>();
  const fieldsToRevalidate = new Set<string>();
  if (incrementalOnly && dirtyTracker.hasDirtyFields) {
    for (const dp of dirtyTracker.getDirtyPaths()) {
      for (const n of dag.affectedBy(dp)) fieldsToRevalidate.add(n.key);
    }
  } else {
    for (const key of dag.nodes.keys()) fieldsToRevalidate.add(key);
  }
  const previousByPath = new Map<string, LoydIssue[]>();
  for (const issue of previousIssues) {
    if (issue.path.length === 0) continue;
    const key = issue.path[0] as string;
    const ex = previousByPath.get(key) ?? [];
    ex.push(issue);
    previousByPath.set(key, ex);
  }
  const newIssues: LoydIssue[] = [];
  const issuesByPath = new Map<string, LoydIssue[]>();
  for (const node of dag.topologicalOrder()) {
    if (!fieldsToRevalidate.has(node.key)) {
      if (preservePreviousErrors) {
        const prev = previousByPath.get(node.key) ?? [];
        for (const i of prev) {
          newIssues.push(i);
          const l = issuesByPath.get(node.key) ?? [];
          l.push(i);
          issuesByPath.set(node.key, l);
        }
        preservedKeys.add(node.key);
      }
      continue;
    }
    revalidatedKeys.add(node.key);
    const fv = getNestedValue(input, node.path);
    const r = node.schema.safeParse(fv);
    if (!r.success) {
      const fi = r.issues.map((i) => ({ ...i, path: [...node.path, ...i.path] }));
      for (const i of fi) {
        newIssues.push(i);
        const l = issuesByPath.get(node.key) ?? [];
        l.push(i);
        issuesByPath.set(node.key, l);
      }
    }
  }
  const isValid = newIssues.length === 0;
  const revalidationRatio = totalFields > 0 ? revalidatedKeys.size / totalFields : 0;
  return {
    data: isValid ? input : undefined,
    issues: newIssues,
    issuesByPath,
    revalidatedFields: [...revalidatedKeys].map((k) => k.split(".")),
    preservedFields: [...preservedKeys].map((k) => k.split(".")),
    revalidationRatio,
    isValid,
  };
}
