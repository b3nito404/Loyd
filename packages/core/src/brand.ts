import type { Branded } from "./types.js";

/**
 * Cast a value as a branded type.
 * @example
 * const EmailSchema = brand(string(), "Email");
 * type Email = Branded<string, "Email">;
 * const email = asBranded<string, "Email">("user@example.com");
 */
export function asBranded<T, B extends string>(value: T): Branded<T, B> {
  return value as Branded<T, B>;
}
/**
 * Create a cast helper for a specific brand.
 * @example
 * const asEmail = makeBrandCaster<string, "Email">();
 * const email: Email = asEmail("user@example.com");
 */
export function makeBrandCaster<T, B extends string>(): (value: T) => Branded<T, B> {
  return (value: T) => asBranded<T, B>(value);
}
