import { BaseSchema } from "@loyd/core";
import type { LoydResult, LoydSchema } from "@loyd/core";

export interface UnionSchema<T> extends BaseSchema<T> {
  readonly _type: "union";
}

export interface DiscriminatedUnionSchema<T> extends BaseSchema<T> {
  readonly _type: "discriminatedUnion";
  readonly discriminatorKey: string;
}

class UnionSchemaImpl<T> extends BaseSchema<T> implements UnionSchema<T> {
  readonly _type = "union" as const;
  readonly _options: ReadonlyArray<LoydSchema<unknown>>;

  constructor(
    options: ReadonlyArray<LoydSchema<unknown>>,
    private readonly _msg?: string,
  ) {
    super();
    this._options = options;
  }

  _validate(input: unknown): LoydResult<T> {
    for (const o of this._options) {
      const r = o.safeParse(input);
      if (r.success) return this._ok(r.data as T);
    }
    return this._fail("ERR_UNION_NO_MATCH", [], {}, this._msg);
  }
}

// Type utilitaire pour accéder aux propriétés internes d'un schéma littéral
type LiteralSchemaInternal = LoydSchema<unknown> & { value?: unknown };

class DiscriminatedUnionSchemaImpl<T> extends BaseSchema<T> implements DiscriminatedUnionSchema<T> {
  readonly _type = "discriminatedUnion" as const;
  readonly discriminatorKey: string;
  private readonly _map: Map<unknown, LoydSchema<unknown>>;

  constructor(
    key: string,
    options: ReadonlyArray<LoydSchema<unknown>>,
    private readonly _msg?: string,
  ) {
    super();
    this.discriminatorKey = key;
    this._map = new Map();

    for (const o of options) {
      // Assertion plus précise : un objet avec une shape optionnelle
      const shape = (o as LoydSchema<unknown> & { shape?: Record<string, LoydSchema<unknown>> })
        .shape;
      if (shape?.[key]) {
        // On suppose que le champ est un littéral, donc on récupère sa valeur
        const literalSchema = shape[key] as LiteralSchemaInternal;
        const lv = literalSchema.value;
        if (lv !== undefined) this._map.set(lv, o);
      }
    }
  }

  _validate(input: unknown): LoydResult<T> {
    if (typeof input !== "object" || input === null)
      return this._fail("ERR_OBJECT_INVALID_TYPE", [], { received: typeof input });

    const disc = (input as Record<string, unknown>)[this.discriminatorKey];
    const matched = this._map.get(disc);
    if (!matched)
      return this._fail(
        "ERR_DISCRIMINATED_UNION_INVALID_KEY",
        [],
        { key: this.discriminatorKey, received: disc },
        this._msg,
      );

    return matched.safeParse(input) as LoydResult<T>;
  }
}

export function union<T>(
  options: ReadonlyArray<LoydSchema<unknown>>,
  msg?: string,
): UnionSchema<T> {
  return new UnionSchemaImpl<T>(options, msg);
}

export function discriminatedUnion<T>(
  key: string,
  options: ReadonlyArray<LoydSchema<unknown>>,
  msg?: string,
): DiscriminatedUnionSchema<T> {
  return new DiscriminatedUnionSchemaImpl<T>(key, options, msg);
}
