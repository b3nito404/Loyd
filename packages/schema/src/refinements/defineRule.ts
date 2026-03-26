import type { LoydSchema } from "@loyd/core";
import { refine } from "./refine.js";

export interface RuleDefinition<TMeta extends Record<string, unknown> = Record<string, unknown>> {
  code: string;
  description?: string;
  params?: TMeta;
}

export interface CustomRule<T, TMeta extends Record<string, unknown> = Record<string, unknown>> {
  definition: RuleDefinition<TMeta>;
  apply(schema: LoydSchema<T>): LoydSchema<T>;
}

export function defineRule<T, TMeta extends Record<string, unknown> = Record<string, unknown>>(
  definition: RuleDefinition<TMeta>,
  predicate: (value: T) => boolean
): CustomRule<T, TMeta> {
  return {
    definition,
    apply: (schema: LoydSchema<T>) =>
      refine(schema, predicate, {
        code: definition.code,
        meta: definition.params as Record<string, unknown>,
      }),
  };
}
