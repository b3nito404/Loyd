import { BaseSchema } from "@loyd/core";
import type { LoydResult } from "@loyd/core";

export interface BooleanSchema extends BaseSchema<boolean> {
  readonly _type: "boolean";
}

class BooleanSchemaImpl extends BaseSchema<boolean> implements BooleanSchema {
  readonly _type = "boolean" as const;
  constructor(private readonly _msg: string | undefined) {
    super();
  }

  _validate(input: unknown): LoydResult<boolean> {
    if (typeof input !== "boolean") {
      return this._fail(
        "ERR_BOOLEAN_INVALID_TYPE",
        [],
        { expected: "boolean", received: typeof input },
        this._msg
      );
    }
    return this._ok(input);
  }
}

export function boolean(message?: string): BooleanSchema {
  return new BooleanSchemaImpl(message);
}
