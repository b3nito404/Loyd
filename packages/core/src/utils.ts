export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
export function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value !== "object" || value === null) return value;
  for (const name of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[name];
    if (typeof child === "object" && child !== null) deepFreeze(child);
  }
  return Object.freeze(value);
}
