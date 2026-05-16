<div align="center">

<h1>@loydjs/openapi</h1>

<p><strong>OpenAPI 3.1 and JSON Schema export for Loyd.</strong><br/>
toOpenApi · toJsonSchema · Full schema coverage · No codegen required.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~4kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/openapi)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/openapi?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/openapi)

</div>

---

## Overview

`@loydjs/openapi` converts Loyd schemas to OpenAPI 3.1 specifications and JSON Schema drafts. Define your validation schemas once and export them for API documentation, client generation, or any JSON Schema-compatible tool.

---

## Installation

```sh
npm install @loydjs/openapi
```

> **Requires** `@loydjs/core` · `@loydjs/schema` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `toJsonSchema(schema, options?)`

Converts a Loyd schema to a JSON Schema draft-07 compatible object.

```ts
import { toJsonSchema } from "@loydjs/openapi";
import { object, string, number, array, optional } from "@loydjs/schema";

const UserSchema = object({
  id:      number().int().min(1),
  name:    string().minLength(2).maxLength(100),
  email:   string().email(),
  age:     optional(number().int().min(0).max(120)),
  tags:    array(string()),
});

const jsonSchema = toJsonSchema(UserSchema);
// {
//   type: "object",
//   properties: {
//     id:    { type: "integer", minimum: 1 },
//     name:  { type: "string", minLength: 2, maxLength: 100 },
//     email: { type: "string", format: "email" },
//     age:   { type: "integer", minimum: 0, maximum: 120 },
//     tags:  { type: "array", items: { type: "string" } }
//   },
//   required: ["id", "name", "email", "tags"]
// }
```

### `toOpenApi(schema, info)`

Generates a full OpenAPI 3.1 document from a schema.

```ts
import { toOpenApi } from "@loydjs/openapi";

const spec = toOpenApi(UserSchema, {
  title:       "User API",
  version:     "1.0.0",
  description: "User management endpoints",
});

// Write to file
import { writeFileSync } from "node:fs";
writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
```

### `toOpenApiComponents(schemas)`

Generates a reusable `#/components/schemas` block from multiple schemas.

```ts
import { toOpenApiComponents } from "@loydjs/openapi";
import { PostSchema, CommentSchema, UserSchema } from "./schemas";

const components = toOpenApiComponents({
  User:    UserSchema,
  Post:    PostSchema,
  Comment: CommentSchema,
});

// Merge into your existing OpenAPI spec
const spec = {
  openapi: "3.1.0",
  info: { title: "My API", version: "1.0.0" },
  components,
  paths: { ... },
};
```

---

## Schema to JSON Schema mapping

| Loyd | JSON Schema |
|:---|:---|
| `string()` | `{ type: "string" }` |
| `string().minLength(n)` | `{ type: "string", minLength: n }` |
| `string().email()` | `{ type: "string", format: "email" }` |
| `string().uuid()` | `{ type: "string", format: "uuid" }` |
| `string().url()` | `{ type: "string", format: "uri" }` |
| `number()` | `{ type: "number" }` |
| `number().int()` | `{ type: "integer" }` |
| `number().min(n)` | `{ type: "number", minimum: n }` |
| `boolean()` | `{ type: "boolean" }` |
| `literal("x")` | `{ const: "x" }` |
| `object({})` | `{ type: "object", properties: {}, required: [] }` |
| `array(s)` | `{ type: "array", items: s }` |
| `optional(s)` | removes field from `required` |
| `nullable(s)` | `{ oneOf: [s, { type: "null" }] }` |
| `union([...])` | `{ oneOf: [...] }` |

---

## Use with Express

```ts
import express from "express";
import { toOpenApi } from "@loydjs/openapi";
import { safeParse } from "@loydjs/core";
import { UserSchema, CreateUserSchema } from "./schemas";

const app = express();

// Serve OpenAPI spec
app.get("/openapi.json", (req, res) => {
  res.json(toOpenApi(UserSchema, { title: "User API", version: "1.0.0" }));
});

// Validate with the same schema
app.post("/users", (req, res) => {
  const result = safeParse(CreateUserSchema, req.body);
  if (!result.success) return res.status(400).json({ errors: result.issues });
  // create user...
});
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema` type |
| `@loydjs/schema` | Schema introspection |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)