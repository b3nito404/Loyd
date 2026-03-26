export const LoydErrorCode = {
  STRING_REQUIRED:       "ERR_STRING_REQUIRED",
  STRING_TOO_SHORT:      "ERR_STRING_TOO_SHORT",
  STRING_TOO_LONG:       "ERR_STRING_TOO_LONG",
  STRING_INVALID_EMAIL:  "ERR_STRING_INVALID_EMAIL",
  STRING_INVALID_URL:    "ERR_STRING_INVALID_URL",
  STRING_INVALID_UUID:   "ERR_STRING_INVALID_UUID",
  STRING_INVALID_REGEX:  "ERR_STRING_INVALID_REGEX",
  STRING_INVALID_TYPE:   "ERR_STRING_INVALID_TYPE",

  NUMBER_REQUIRED:       "ERR_NUMBER_REQUIRED",
  NUMBER_TOO_SMALL:      "ERR_NUMBER_TOO_SMALL",
  NUMBER_TOO_LARGE:      "ERR_NUMBER_TOO_LARGE",
  NUMBER_NOT_INTEGER:    "ERR_NUMBER_NOT_INTEGER",
  NUMBER_NOT_POSITIVE:   "ERR_NUMBER_NOT_POSITIVE",
  NUMBER_NOT_NEGATIVE:   "ERR_NUMBER_NOT_NEGATIVE",
  NUMBER_NOT_MULTIPLE:   "ERR_NUMBER_NOT_MULTIPLE",
  NUMBER_INVALID_TYPE:   "ERR_NUMBER_INVALID_TYPE",
  NUMBER_NAN:            "ERR_NUMBER_NAN",
  NUMBER_NOT_FINITE:     "ERR_NUMBER_NOT_FINITE",

  BOOLEAN_INVALID_TYPE:  "ERR_BOOLEAN_INVALID_TYPE",

  DATE_INVALID_TYPE:     "ERR_DATE_INVALID_TYPE",
  DATE_INVALID:          "ERR_DATE_INVALID",
  DATE_TOO_EARLY:        "ERR_DATE_TOO_EARLY",
  DATE_TOO_LATE:         "ERR_DATE_TOO_LATE",

  BIGINT_INVALID_TYPE:   "ERR_BIGINT_INVALID_TYPE",

  LITERAL_INVALID:       "ERR_LITERAL_INVALID",

  OBJECT_INVALID_TYPE:   "ERR_OBJECT_INVALID_TYPE",
  OBJECT_UNKNOWN_KEYS:   "ERR_OBJECT_UNKNOWN_KEYS",
  OBJECT_MISSING_KEY:    "ERR_OBJECT_MISSING_KEY",

  ARRAY_INVALID_TYPE:    "ERR_ARRAY_INVALID_TYPE",
  ARRAY_TOO_SHORT:       "ERR_ARRAY_TOO_SHORT",
  ARRAY_TOO_LONG:        "ERR_ARRAY_TOO_LONG",
  ARRAY_NOT_NONEMPTY:    "ERR_ARRAY_NOT_NONEMPTY",

  TUPLE_INVALID_LENGTH:  "ERR_TUPLE_INVALID_LENGTH",
  TUPLE_INVALID_TYPE:    "ERR_TUPLE_INVALID_TYPE",

  RECORD_INVALID_TYPE:   "ERR_RECORD_INVALID_TYPE",
  MAP_INVALID_TYPE:      "ERR_MAP_INVALID_TYPE",
  SET_INVALID_TYPE:      "ERR_SET_INVALID_TYPE",

  UNION_NO_MATCH:        "ERR_UNION_NO_MATCH",
  DISCRIMINATED_UNION_NO_MATCH: "ERR_DISCRIMINATED_UNION_NO_MATCH",
  DISCRIMINATED_UNION_INVALID_KEY: "ERR_DISCRIMINATED_UNION_INVALID_KEY",

  CUSTOM_REFINEMENT:     "ERR_CUSTOM_REFINEMENT",
  ASYNC_REFINEMENT:      "ERR_ASYNC_REFINEMENT",

  REQUIRED:              "ERR_REQUIRED",
  INVALID_TYPE:          "ERR_INVALID_TYPE",
  UNKNOWN:               "ERR_UNKNOWN",
} as const;

export type LoydErrorCode = (typeof LoydErrorCode)[keyof typeof LoydErrorCode];
export interface ErrorMeta {
  [LoydErrorCode.STRING_TOO_SHORT]:  { min: number; actual: number };
  [LoydErrorCode.STRING_TOO_LONG]:   { max: number; actual: number };
  [LoydErrorCode.STRING_INVALID_REGEX]: { pattern: string };
  [LoydErrorCode.NUMBER_TOO_SMALL]:  { min: number; actual: number; inclusive: boolean };
  [LoydErrorCode.NUMBER_TOO_LARGE]:  { max: number; actual: number; inclusive: boolean };
  [LoydErrorCode.NUMBER_NOT_MULTIPLE]: { multipleOf: number; actual: number };
  [LoydErrorCode.DATE_TOO_EARLY]:    { min: Date; actual: Date };
  [LoydErrorCode.DATE_TOO_LATE]:     { max: Date; actual: Date };
  [LoydErrorCode.LITERAL_INVALID]:   { expected: unknown; actual: unknown };
  [LoydErrorCode.OBJECT_UNKNOWN_KEYS]: { keys: string[] };
  [LoydErrorCode.OBJECT_MISSING_KEY]:  { key: string };
  [LoydErrorCode.ARRAY_TOO_SHORT]:   { min: number; actual: number };
  [LoydErrorCode.ARRAY_TOO_LONG]:    { max: number; actual: number };
  [LoydErrorCode.TUPLE_INVALID_LENGTH]: { expected: number; actual: number };
  [LoydErrorCode.UNION_NO_MATCH]:    { issues: unknown[] };
  [LoydErrorCode.DISCRIMINATED_UNION_INVALID_KEY]: { key: string; received: unknown };
  [LoydErrorCode.INVALID_TYPE]:      { expected: string; received: string };
}
