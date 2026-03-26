import type { LoydSchema } from "@loyd/core";
export interface FieldNode {
  path: string[];
  schema: LoydSchema<unknown>;
  dependsOn: string[][];
  dependents: string[][];
}

export interface FieldDag {
  nodes: Map<string, FieldNode>;
  affectedBy(fieldPath: string[]): FieldNode[];
  topologicalOrder(): FieldNode[];
}

/**
 * Constructs the DAG from an object schema.
 * @example
 * const UserSchema = object({
 *   password: string(),
 *   confirmPassword: string(),
 * });
 *
 * const dag = buildDag(UserSchema, {
 *   dependencies: {
 *     confirmPassword: ["password"], // confirmPassword depend on password
 *   }
 * });
 */
export interface DagBuildOptions {
  dependencies?: Record<string, string[]>;
}

export declare function buildDag(schema: LoydSchema<unknown>, options?: DagBuildOptions): FieldDag;
