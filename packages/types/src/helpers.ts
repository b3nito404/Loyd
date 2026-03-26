import type { LoydSchema } from "@loyd/core";

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type DeepRequired<T> = T extends object ? { [P in keyof T]-?: DeepRequired<T[P]> } : T;

export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

export type Merge<A, B> = Omit<A, keyof B> & B;
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
export type SchemaMap = Record<string, LoydSchema<unknown>>;

/** Infers the output type of a SchemaMap (used by object())*/
export type InferSchemaMap<M extends SchemaMap> = {
  [K in keyof M]: M[K]["_output"];
};

export type InferSchemaMapInput<M extends SchemaMap> = {
  [K in keyof M]: M[K]["_input"];
};

export type UnionFromTuple<T extends ReadonlyArray<LoydSchema<unknown>>> = T[number]["_output"];

export type IntersectionFromTuple<T extends ReadonlyArray<LoydSchema<unknown>>> =
  UnionToIntersection<T[number]["_output"]>;

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never;
export type InferTuple<T extends ReadonlyArray<LoydSchema<unknown>>> = {
  [K in keyof T]: T[K] extends LoydSchema<unknown> ? T[K]["_output"] : never;
};

/** Ensure that T is not Never */
export type NoNever<T> = [T] extends [never] ? unknown : T;
export type Flatten<T> = T extends Array<infer U> ? U : T;
