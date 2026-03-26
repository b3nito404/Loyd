import { LoydErrorCode } from "../codes.js";
import type { MessageMap } from "../formatter.js";

export const en: MessageMap = {
  [LoydErrorCode.REQUIRED]: "This field is required",
  [LoydErrorCode.INVALID_TYPE]: ({ expected, received }) =>
    `Expected ${expected}, received ${received}`,
  [LoydErrorCode.STRING_TOO_SHORT]: ({ min, actual }) =>
    `Must be at least ${min} characters (got ${actual})`,
  [LoydErrorCode.STRING_TOO_LONG]: ({ max, actual }) =>
    `Must be at most ${max} characters (got ${actual})`,
  [LoydErrorCode.STRING_INVALID_EMAIL]: "Invalid email address",
  [LoydErrorCode.STRING_INVALID_URL]: "Invalid URL",
  [LoydErrorCode.STRING_INVALID_UUID]: "Invalid UUID",
  [LoydErrorCode.STRING_INVALID_REGEX]: "Invalid format",
  [LoydErrorCode.NUMBER_TOO_SMALL]: ({ min, inclusive }) =>
    `Must be ${inclusive ? ">=" : ">"} ${min}`,
  [LoydErrorCode.NUMBER_TOO_LARGE]: ({ max, inclusive }) =>
    `Must be ${inclusive ? "<=" : "<"} ${max}`,
  [LoydErrorCode.NUMBER_NOT_INTEGER]: "Must be an integer",
  [LoydErrorCode.NUMBER_NOT_POSITIVE]: "Must be a positive number",
  [LoydErrorCode.NUMBER_NAN]: "Not a number",
  [LoydErrorCode.ARRAY_TOO_SHORT]: ({ min }) => `Must contain at least ${min} item(s)`,
  [LoydErrorCode.ARRAY_TOO_LONG]: ({ max }) => `Must contain at most ${max} item(s)`,
  [LoydErrorCode.UNION_NO_MATCH]: "Value does not match any of the allowed types",
};
