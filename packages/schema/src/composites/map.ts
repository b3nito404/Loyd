import { BaseSchema } from "@loyd/core";
import type { LoydSchema, LoydResult, LoydIssue } from "@loyd/core";

export interface MapSchema<K, V> extends BaseSchema<Map<K, V>> { readonly _type: "map"; }

class MapSchemaImpl<K, V> extends BaseSchema<Map<K, V>> implements MapSchema<K, V> {
  readonly _type = "map" as const;
  constructor(private readonly _k: LoydSchema<K>, private readonly _v: LoydSchema<V>, private readonly _msg?: string) { super(); }

  _validate(input: unknown): LoydResult<Map<K, V>> {
    if (!(input instanceof Map)) return this._fail("ERR_MAP_INVALID_TYPE", [], { received: typeof input }, this._msg);
    const result = new Map<K, V>();
    const issues: LoydIssue[] = [];
    let i = 0;
    for (const [k, v] of input) {
      const kr = this._k.safeParse(k); const vr = this._v.safeParse(v);
      if (kr.success && vr.success) result.set(kr.data, vr.data);
      else {
        if (!kr.success) for (const iss of kr.issues) issues.push({ ...iss, path: [i, "key", ...iss.path] });
        if (!vr.success) for (const iss of vr.issues) issues.push({ ...iss, path: [i, "value", ...iss.path] });
      }
      i++;
    }
    if (issues.length > 0) return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result);
  }
}
export function map<K, V>(k: LoydSchema<K>, v: LoydSchema<V>, message?: string): MapSchema<K, V> { return new MapSchemaImpl(k, v, message); }
