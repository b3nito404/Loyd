import type { LoydSchema } from "@loyd/core";

/**
 * Infers the OUTPUT type of a Loyd scheme (after possible transformation).
 *
 * @example
 * const UserSchema = object({ name: string(), age: number() });
 * type User = Infer<typeof UserSchema>;
 * // -> { name: string; age: number }
 */
export type Infer<S extends LoydSchema<unknown>> = S["_output"];

/**
 * Infers the INTPUT type of a Loyd scheme (beforetransformation).
 * Differs from Infer<S> when the schema has a transform().
 *
 * @example
 * const DateSchema = transform(string(), (s) => new Date(s));
 * type DateInput  = InferInput<typeof DateSchema>;  // -> string
 * type DateOutput = Infer<typeof DateSchema>;        // -> Date
 */
export type InferInput<S extends LoydSchema<unknown, unknown>> = S["_input"];
export type InferOutput<S extends LoydSchema<unknown>> = S["_output"];
