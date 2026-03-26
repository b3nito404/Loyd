import type { LoydIssue } from "@loyd/core";
import type { LoydErrorCode } from "./codes.js";

export type Locale = string;

export type MessageMap = {
  [K in LoydErrorCode]?: string | ((meta: Record<string, unknown>) => string);
};

export type FormatterFn = (issue: LoydIssue) => string;

export interface LoydFormatter {
  format(issue: LoydIssue): string;
  formatAll(issues: LoydIssue[]): string[];
  locale: Locale;
}

/**
 * Creates a formatter linked to a locale and a set of messages.
 * @example
 * const fmt = createFormatter("fr", frMessages);
 * const message = fmt.format(issue);
 */
export type CreateFormatterFn = (locale: Locale, messages?: Partial<MessageMap>) => LoydFormatter;
