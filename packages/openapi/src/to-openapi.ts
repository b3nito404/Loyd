import type { LoydSchema } from "@loydjs/core";
import { type JsonSchema7, type ToJsonSchemaOptions, toJsonSchema } from "./to-json-schema.js";
export interface OpenApiSchemaObject extends JsonSchema7 {
  example?: unknown;
  readOnly?: boolean;
  writeOnly?: boolean;
  externalDocs?: { url: string; description?: string };
  "x-loyd-type"?: string;
}
export interface ToOpenApiOptions extends ToJsonSchemaOptions {
  componentName?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: unknown;
}
export function toOpenApi(
  schema: LoydSchema<unknown>,
  options: ToOpenApiOptions = {},
): OpenApiSchemaObject {
  const { readOnly, writeOnly, example, ...jsonOpts } = options;
  const js = toJsonSchema(schema, { ...jsonOpts, target: jsonOpts.target ?? "draft-2020-12" });
  js.$schema = undefined;
  const result: OpenApiSchemaObject = { ...js };
  if (readOnly !== undefined) result.readOnly = readOnly;
  if (writeOnly !== undefined) result.writeOnly = writeOnly;
  if (example !== undefined) result.example = example;
  result["x-loyd-type"] = schema._type;
  return result;
}
export function toOpenApiComponents(
  schemas: Record<string, LoydSchema<unknown>>,
  options: Omit<ToOpenApiOptions, "componentName"> = {},
) {
  const result: Record<string, OpenApiSchemaObject> = {};
  for (const [name, schema] of Object.entries(schemas))
    result[name] = toOpenApi(schema, { ...options, componentName: name });
  return { schemas: result };
}
