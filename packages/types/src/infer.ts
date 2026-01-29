import type { LoydSchema } from "@loyd/core";
export type Infer<S extends LoydSchema<unknown>> = S["_output"];
export type InferInput<S extends LoydSchema<unknown, unknown>> = S["_input"];
export type InferOutput<S extends LoydSchema<unknown>> = S["_output"];
