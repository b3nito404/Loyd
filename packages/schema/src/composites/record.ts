import { BaseSchema } from "@loyd/core";
import type { LoydIssue, LoydResult, LoydSchema } from "@loyd/core";

export interface RecordSchema<K extends string, V> extends BaseSchema<Record<K, V>> {
  readonly _type: "record";
}

class RecordSchemaImpl<K extends string, V>
  extends BaseSchema<Record<K, V>>
  implements RecordSchema<K, V>
{
  readonly _type = "record" as const;
  constructor(
    private readonly _key: LoydSchema<K> | null,
    private readonly _value: LoydSchema<V>,
    private readonly _msg?: string
  ) {
    super();
  }

  _validate(input: unknown): LoydResult<Record<K, V>> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return this._fail("ERR_RECORD_INVALID_TYPE", [], { received: typeof input }, this._msg);
    }
    const raw = input as Record<string, unknown>;
    const result: Record<string, V> = {};
    const issues: LoydIssue[] = [];
    for (const k of Object.keys(raw)) {
      if (this._key) {
        const kr = this._key.safeParse(k);
        if (!kr.success) {
          for (const iss of kr.issues) issues.push({ ...iss, path: [k, ...iss.path] });
          continue;
        }
      }
      const vr = this._value.safeParse(raw[k]);
      if (vr.success) result[k] = vr.data;
      else for (const iss of vr.issues) issues.push({ ...iss, path: [k, ...iss.path] });
    }
    if (issues.length > 0)
      return { success: false, data: undefined, issues: issues as [LoydIssue, ...LoydIssue[]] };
    return this._ok(result as Record<K, V>);
  }
}

export function record<K extends string, V>(
  keyOrValue: LoydSchema<K> | LoydSchema<V>,
  value?: LoydSchema<V>
): RecordSchema<K, V> {
  if (value) return new RecordSchemaImpl(keyOrValue as LoydSchema<K>, value);
  return new RecordSchemaImpl(null, keyOrValue as LoydSchema<V>) as unknown as RecordSchema<K, V>;
}
