<div align="center">

<h1>@loydjs/types</h1>

<p><strong>TypeScript type utilities for Loyd schemas.</strong><br/>
Infer · InferInput · InferOutput · Zero runtime cost.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-0kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/types)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/types?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/types)

</div>

---

## Overview

`@loydjs/types` is a type-only package — it ships zero runtime code. It provides TypeScript utility types for inferring the input and output types of any Loyd schema, and helper types for building type-safe applications on top of Loyd.

---

## Installation

```sh
npm install @loydjs/types
```

> **Requires** `@loydjs/core` · TypeScript ≥ 5.4 · `"strict": true` in `tsconfig.json`

---

## API

### `Infer<TSchema>`

Infers the output type of a schema — the type of `result.data` after a successful `safeParse`.

```ts
import { object, string, number, array, optional } from "@loydjs/schema";
import type { Infer } from "@loydjs/types";

const UserSchema = object({
  id:      number().int().min(1),
  name:    string().minLength(2),
  email:   string().email(),
  age:     optional(number().int().min(0)),
  roles:   array(string()),
});

type User = Infer<typeof UserSchema>;
// {
//   id:    number
//   name:  string
//   email: string
//   age?:  number | undefined
//   roles: string[]
// }
```

### `InferOutput<TSchema>`

Alias for `Infer`. Explicit name for cases where you want to be clear about direction.

```ts
import type { InferOutput } from "@loydjs/types";

type UserOutput = InferOutput<typeof UserSchema>;
// same as Infer<typeof UserSchema>
```

### `InferInput<TSchema>`

Infers the input type — what the schema accepts before validation and transformation. Differs from the output type when transforms are applied (e.g. `.trim()`, `.toLowerCase()`).

```ts
import { string } from "@loydjs/schema";
import type { InferInput, InferOutput } from "@loydjs/types";

const NameSchema = string().trim().toLowerCase();

type NameInput  = InferInput<typeof NameSchema>;  // string
type NameOutput = InferOutput<typeof NameSchema>; // string (transformed)
```

### `SchemaMap`

The type used for `object()` shape definitions.

```ts
import type { SchemaMap } from "@loydjs/types";
import type { LoydSchema } from "@loydjs/core";

function buildForm<T extends SchemaMap>(shape: T) {
  return object(shape);
}
```

### `InferSchemaMap<TShape>`

Infers the output type of an object shape directly.

```ts
import type { InferSchemaMap } from "@loydjs/types";

const shape = {
  name:  string(),
  email: string().email(),
};

type FormData = InferSchemaMap<typeof shape>;
// { name: string; email: string }
```

---

## Usage patterns

### API route types

```ts
import type { Infer } from "@loydjs/types";

const CreatePostSchema = object({
  title:   string().minLength(3).maxLength(200),
  body:    string().minLength(10),
  tags:    array(string()).max(10),
  published: boolean(),
});

type CreatePostInput = Infer<typeof CreatePostSchema>;

async function createPost(data: CreatePostInput) {
  // data is fully typed
  const post = await db.posts.create(data);
  return post;
}
```

### Generic validators

```ts
import type { Infer } from "@loydjs/types";
import type { LoydSchema } from "@loydjs/core";
import { safeParse } from "@loydjs/core";

function validate<T extends LoydSchema<unknown>>(
  schema: T,
  input: unknown
): Infer<T> {
  const result = safeParse(schema, input);
  if (!result.success) throw new Error(result.issues[0].code);
  return result.data as Infer<T>;
}
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema` base type for type inference |

> `@loydjs/types` has zero runtime dependencies and ships no JavaScript.

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)