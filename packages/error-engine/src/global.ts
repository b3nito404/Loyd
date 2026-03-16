import type { LoydIssue } from "@loyd/core";
import { type Locale, type LoydFormatter, type MessageMap, createFormatter } from "./formatter.js";
import { en } from "./locales/en.js";
let _global: LoydFormatter = createFormatter("en", en);
export function setGlobalFormatter(f: LoydFormatter): void {
  _global = f;
}
export function getGlobalFormatter(): LoydFormatter {
  return _global;
}
export function configureFormatter(locale: Locale, messages?: Partial<MessageMap>): LoydFormatter {
  const f = createFormatter(locale, messages);
  setGlobalFormatter(f);
  return f;
}
export function applyFormatter(issue: LoydIssue): LoydIssue & { message: string } {
  return { ...issue, message: _global.format(issue) };
}
export function applyFormatterAll(
  issues: ReadonlyArray<LoydIssue>,
): Array<LoydIssue & { message: string }> {
  return issues.map(applyFormatter);
}
