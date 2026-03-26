import type { LoydSchema } from "@loyd/core";

export interface ExtendedSchemaMeta {
  type: string;
  description?: string;
  isAsync?: boolean;
  hasTransform?: boolean;
  rules?: Array<{ code: string; description?: string; params?: Record<string, unknown> }>;
  [key: string]: unknown;
}
export type SchemaDiffEntry = {
  type:
    | "field_added"
    | "field_removed"
    | "type_changed"
    | "constraint_tightened"
    | "constraint_relaxed";
  path: Array<string | number>;
  before?: unknown;
  after?: unknown;
  breaking: boolean;
};

export function getMeta(schema: LoydSchema<unknown>): ExtendedSchemaMeta {
  return { type: schema._type, ...schema.meta() };
}

export function diff(_before: LoydSchema<unknown>, _after: LoydSchema<unknown>): SchemaDiffEntry[] {
  return [];
}
