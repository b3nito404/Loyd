// packages/core/src/index.ts
// API publique de @loyd/core

export type {
  LoydResult,
  LoydIssue,
  LoydPath,
  LoydSchema,
  SchemaMeta,
  Branded,
  TransformSchema,
  AsyncSchema,
} from "./types.js";

export { LoydError } from "./errors.js";

export {
  safeParse,
  parse,
  ok,
  fail,
  failOne,
  isOk,
  isFail,
  mergeIssues,
  prefixPath,
} from "./parse.js";

export { asBranded, makeBrandCaster } from "./brand.js";

export { BaseSchema, getTypeName } from "./base.js";