import type { LoydSchema } from "@loyd/core";

export interface JsonSchema7 {
  $schema?: string;
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema7>;
  required?: string[];
  items?: JsonSchema7 | JsonSchema7[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema7[];
  oneOf?: JsonSchema7[];
  allOf?: JsonSchema7[];
  not?: JsonSchema7;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: boolean | JsonSchema7;
  format?: string;
  nullable?: boolean;
  $ref?: string;
  $defs?: Record<string, JsonSchema7>;
  [key: string]: unknown;
}

export interface ToJsonSchemaOptions {
  /**
   * @default "draft-07"
   */
  target?: "draft-07" | "draft-2020-12";
  /**
   * @default true
   */
  $defs?: boolean;
  root?: Partial<JsonSchema7>;
}

/**
 * Converts a Loyd schema to JSON Schema 7 or 2020-12.
 * @example
 * const jsonSchema = toJsonSchema(UserSchema);
 * // -> { type: "object", properties: { name: { type: "string" }, ... }, required: ["name"] }
 */
export declare function toJsonSchema(
  schema: LoydSchema<unknown>,
  options?: ToJsonSchemaOptions
): JsonSchema7;

//OpenAPI
export interface OpenApiSchemaObject extends JsonSchema7 {
  example?: unknown;
  examples?: unknown[];
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  externalDocs?: { url: string; description?: string };
}

export interface ToOpenApiOptions extends ToJsonSchemaOptions {
  componentName?: string;
}

/**
 * Converts a Loyd schema into an OpenAPI 3.1 Schema Object.
 * @example
 * const app = express();
 * app.get("/users", (req, res) => { ... });
 *
 * const spec = {
 *   components: {
 *     schemas: {
 *       User: toOpenApi(UserSchema, { componentName: "User" }),
 *     }
 *   }
 * };
 */
export declare function toOpenApi(
  schema: LoydSchema<unknown>,
  options?: ToOpenApiOptions
): OpenApiSchemaObject;
