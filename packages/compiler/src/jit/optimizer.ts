import type { LoydSchema } from "@loyd/core";
export interface OptimizerResult {
  schema: LoydSchema<unknown>;
  appliedOptimizations: string[];
}
export function optimize(schema: LoydSchema<unknown>): OptimizerResult {
  return { schema, appliedOptimizations: [] };
}
