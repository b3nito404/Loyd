import type { LoydIssue } from "./types.js";

export class LoydError extends Error {
  public readonly issues: [LoydIssue, ...LoydIssue[]];

  constructor(issues: [LoydIssue, ...LoydIssue[]]) {
    const first = issues[0];
    const summary =
      issues.length === 1
        ? `Validation failed at ${formatPath(first.path)}: ${first.code}`
        : `Validation failed with ${issues.length} errors`;
    super(summary);
    this.name = "LoydError";
    this.issues = issues;

    Object.setPrototypeOf(this, LoydError.prototype);
  }

  get firstIssue(): LoydIssue {
    return this.issues[0];
  }

  format(): string {
    return this.issues
      .map(
        (issue) =>
          `  • ${formatPath(issue.path)}: [${issue.code}]${issue.message ? ` — ${issue.message}` : ""}`
      )
      .join("\n");
  }
}

function formatPath(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) return "(root)";
  return path
    .map((segment, i) =>
      typeof segment === "number" ? `[${segment}]` : i === 0 ? segment : `.${segment}`
    )
    .join("");
}
