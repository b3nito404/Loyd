import type { Branded } from "./types.js";
export function asBranded<T, B extends string>(value: T): Branded<T, B> {
  return value as Branded<T, B>;
}
export function makeBrandCaster<T, B extends string>(): (value: T) => Branded<T, B> {
  return (v: T) => asBranded<T, B>(v);
}
