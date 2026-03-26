export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function shallowClone<T extends Record<string, unknown>>(obj: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj) as object) as object, obj) as T;
}

export function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value !== "object" || value === null) return value;
  Object.getOwnPropertyNames(value).forEach((name) => {
    const child = (value as Record<string, unknown>)[name];
    if (typeof child === "object" && child !== null) {
      deepFreeze(child);
    }
  });
  return Object.freeze(value);
}

export function pathsEqual(
  a: ReadonlyArray<string | number>,
  b: ReadonlyArray<string | number>
): boolean {
  if (a.length !== b.length) return false;
  return a.every((segment, i) => segment === b[i]);
}
