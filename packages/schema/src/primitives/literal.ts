import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export type Primitive = string | number | boolean | bigint | null | undefined;

export interface LiteralSchema<T extends Primitive> extends BaseSchema<T> {
  readonly _type: "literal";
  readonly value: T;
}

class LiteralSchemaImpl<T extends Primitive> extends BaseSchema<T> implements LiteralSchema<T> {
  readonly _type = "literal" as const;
  readonly value: T;
  constructor(
    value: T,
    private readonly _msg: string | undefined
  ) {
    super();
    this.value = value;
  }

  _validate(input: unknown): LoydResult<T> {
    if (input !== this.value) {
      return this._fail(
        "ERR_LITERAL_INVALID",
        [],
        { expected: this.value, actual: input },
        this._msg
      );
    }
    return this._ok(input as T);
  }
}

export function literal<T extends Primitive>(value: T, message?: string): LiteralSchema<T> {
  return new LiteralSchemaImpl(value, message);
}
