import type { LoydIssue } from "@loydjs/core";
import type { LoydErrorCode } from "./codes.js";
export type Locale = string;
export type MessageMap = {
  [K in LoydErrorCode]?: string | ((meta: Record<string, unknown>) => string);
};
export type FormatterFn = (issue: LoydIssue) => string;
export interface LoydFormatter {
  format(issue: LoydIssue): string;
  formatAll(issues: LoydIssue[]): string[];
  formatPath(path: ReadonlyArray<string | number>): string;
  locale: Locale;
}
export type CreateFormatterFn = (locale: Locale, messages?: Partial<MessageMap>) => LoydFormatter;
export function formatPath(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) return "(root)";
  return path.reduce<string>(
    (acc, seg, i) => (typeof seg === "number" ? `${acc}[${seg}]` : i === 0 ? seg : `${acc}.${seg}`),
    "",
  );
}
export function createFormatter(locale: Locale, messages?: Partial<MessageMap>): LoydFormatter {
  const map: Partial<MessageMap> = messages ?? {};
  function format(issue: LoydIssue): string {
    const entry = map[issue.code as LoydErrorCode];
    if (typeof entry === "function") return entry(issue.meta ?? {});
    if (typeof entry === "string") return entry;
    if (issue.message) return issue.message;
    return `Validation failed: ${issue.code} at ${formatPath(issue.path)}`;
  }
  return { locale, format, formatAll: (issues) => issues.map(format), formatPath };
}
