import type { LoydSchema } from "@loydjs/core";
export interface OptimizerResult {
  schema: LoydSchema<unknown>;
  appliedOptimizations: string[];
}
export function optimize(schema: LoydSchema<unknown>): OptimizerResult {
  return { schema, appliedOptimizations: [] };
}
