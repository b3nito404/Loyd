// packages/core/src/errors.ts
import type { LoydIssue } from "./types.js";

export class LoydError extends Error {
  public readonly issues: [LoydIssue, ...LoydIssue[]];
  constructor(issues: [LoydIssue, ...LoydIssue[]]) {
    const first = issues[0];
    super(
      issues.length === 1
        ? `Validation failed at ${formatPath(first.path)}: ${first.code}`
        : `Validation failed with ${issues.length} errors`,
    );
    this.name = "LoydError";
    this.issues = issues;
    Object.setPrototypeOf(this, LoydError.prototype);
  }
  get firstIssue(): LoydIssue {
    return this.issues[0];
  }
  format(): string {
    return this.issues
      .map((i) => `  • ${formatPath(i.path)}: [${i.code}]${i.message ? ` — ${i.message}` : ""}`)
      .join("\n");
  }
}

function formatPath(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) return "(root)";
  return path.map((s, i) => (typeof s === "number" ? `[${s}]` : i === 0 ? s : `.${s}`)).join("");
}
