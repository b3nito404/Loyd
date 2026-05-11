export function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object") return value as Readonly<T>;
  if (Object.isFrozen(value)) return value as Readonly<T>;

  Object.freeze(value);

  for (const key of Object.keys(value as object)) {
    const v = (value as Record<string, unknown>)[key];
    if (v && typeof v === "object" && !Object.isFrozen(v)) {
      deepFreeze(v);
    }
  }

  return value as Readonly<T>;
}

export function isDeepFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;

  for (const key of Object.keys(value as object)) {
    const v = (value as Record<string, unknown>)[key];
    if (!isDeepFrozen(v)) return false;
  }

  return true;
}
