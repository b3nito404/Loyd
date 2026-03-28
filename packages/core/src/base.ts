// packages/core/src/base.ts
// Classe de base concrète dont héritent tous les schémas Loyd.
// Elle implémente parse(), safeParse(), parseOrThrow(), meta(), describe()
// pour éviter la duplication dans chaque schéma.

import { LoydError } from "./errors.js";
import { ok } from "./parse.js";
import type { LoydResult, LoydSchema, SchemaMeta } from "./types.js";

export abstract class BaseSchema<TOutput, TInput = TOutput> implements LoydSchema<TOutput, TInput> {
  // Marques de type TypeScript — jamais accédées à l'exécution
  declare readonly _output: TOutput;
  declare readonly _input: TInput;

  abstract readonly _type: string;

  readonly _meta: SchemaMeta = {};

  // ── Méthode centrale à implémenter par chaque schéma ─────────────────────

  /**
   * Exécute la validation sur `input` et retourne un LoydResult.
   * C'est la seule méthode obligatoire à implémenter dans les sous-classes.
   */
  abstract _validate(input: unknown): LoydResult<TOutput>;

  // ── API publique ──────────────────────────────────────────────────────────

  safeParse(input: unknown): LoydResult<TOutput> {
    try {
      return this._validate(input);
    } catch (err) {
      // Isole les exceptions inattendues dans une issue générique
      return {
        success: false,
        data: undefined,
        issues: [
          {
            code: "ERR_UNKNOWN",
            path: [],
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  }

  parse(input: unknown): LoydResult<TOutput> {
    return this.safeParse(input);
  }

  parseOrThrow(input: unknown): TOutput {
    const result = this.safeParse(input);
    if (result.success) return result.data;
    throw new LoydError(result.issues);
  }

  meta(): SchemaMeta {
    return { ...this._meta, type: this._type };
  }

  describe(description: string): this {
    // Retourne une nouvelle instance pour préserver l'immutabilité
    const clone = Object.create(Object.getPrototypeOf(this) as object) as this;
    Object.assign(clone, this);
    (clone as { _meta: SchemaMeta })._meta = { ...this._meta, description };
    return clone;
  }

  // ── Helpers internes réutilisables ────────────────────────────────────────

  protected _ok(data: TOutput): LoydResult<TOutput> {
    return ok(data);
  }

  protected _fail(
    code: string,
    path: Array<string | number> = [],
    meta?: Record<string, unknown>,
    message?: string
  ): LoydResult<TOutput> {
    return {
      success: false,
      data: undefined,
      issues: [{ code, path, ...(meta ? { meta } : {}), ...(message ? { message } : {}) }],
    };
  }

  protected _typeError(expected: string, received: unknown): LoydResult<TOutput> {
    return this._fail("ERR_INVALID_TYPE", [], {
      expected,
      received: getTypeName(received),
    });
  }
}

// ── Utilitaire ────────────────────────────────────────────────────────────────

export function getTypeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}