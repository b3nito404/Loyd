<div align="center">

<h1>@loydjs/schema</h1>

<p><strong>All schema types for Loyd.</strong><br/>
Primitives · Composites · Modifiers · Refinements · Fully tree-shakeable.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-tree--shakeable-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/schema)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/schema?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/schema)

</div>

---

## Overview

`@loydjs/schema` provides every schema type you need - primitives, composites, modifiers, and refinements. Every export is tree-shakeable: if you only use `string()` and `number()`, only those end up in your bundle.

---

## Installation

```sh
npm install @loydjs/schema @loydjs/core
```

> **Requires** `@loydjs/core` · Node.js ≥ 20 · TypeScript ≥ 5.4 · `"strict": true` in `tsconfig.json`

---

## Primitives

### `string()`

```ts
import { string } from "@loydjs/schema";

string()
  .minLength(2)
  .maxLength(100)
  .email()
  .url()
  .uuid()
  .regex(/^\d{4}$/)
  .startsWith("prefix_")
  .endsWith("_suffix")
  .includes("keyword")
  .nonempty()
  .trim()
  .toLowerCase()
  .toUpperCase()
```

### `number()`

```ts
import { number } from "@loydjs/schema";

number()
  .min(0)      // >= 0
  .max(120)    // <= 120
  .gt(0)       // > 0
  .gte(1)      // >= 1
  .lt(100)     // < 100
  .lte(99)     // <= 99
  .int()       // integer only
  .positive()  // > 0
  .negative()  // < 0
  .nonnegative() // >= 0
  .multipleOf(5)
  .finite()
  .safe()      // Number.isSafeInteger
```

### `boolean()`

```ts
import { boolean } from "@loydjs/schema";

const Active = boolean();
```

### `bigint()`

```ts
import { bigint } from "@loydjs/schema";

const Id = bigint();
```

### `date()`

```ts
import { date } from "@loydjs/schema";

const CreatedAt = date();
```

### `literal(value)`

```ts
import { literal } from "@loydjs/schema";

const Admin  = literal("admin");
const Active = literal(true);
const Zero   = literal(0);
```

---

## Composites

### `object(shape)`

```ts
import { object, string, number } from "@loydjs/schema";

const User = object({
  name:  string().minLength(2),
  email: string().email(),
  age:   number().int().min(0),
});

// Unknown key handling
User.strict();       // error on unknown keys
User.strip();        // remove unknown keys (default)
User.passthrough();  // keep unknown keys

// Shape operations
User.pick(["name", "email"]);
User.omit(["age"]);
User.partial();           // all fields optional
User.required();          // all fields required
User.extend({ role: string() });
User.merge(OtherSchema);
```

### `array(element)`

```ts
import { array, string } from "@loydjs/schema";

array(string())
  .min(1)
  .max(100)
  .length(5)
  .nonempty()
```

### `tuple(elements)`

```ts
import { tuple, string, number } from "@loydjs/schema";

const Point = tuple([number(), number()]);
// [number, number]
```

### `union(options)`

```ts
import { union, string, number } from "@loydjs/schema";

const StringOrNumber = union([string(), number()]);
```

### `discriminatedUnion(key, options)`

```ts
import { discriminatedUnion, object, literal, string, number } from "@loydjs/schema";

// O(1) variant lookup via Map - compiled to constant-time dispatch
const Shape = discriminatedUnion("kind", [
  object({ kind: literal("circle"),   radius: number().min(0) }),
  object({ kind: literal("rect"),     width: number().min(0), height: number().min(0) }),
  object({ kind: literal("triangle"), base: number().min(0),  height: number().min(0) }),
]);
```

### `record(valueSchema)`

```ts
import { record, number } from "@loydjs/schema";

const Scores = record(number().int().min(0).max(100));
// Record<string, number>
```

### `map(keySchema, valueSchema)`

```ts
import { map, string, number } from "@loydjs/schema";

const Cache = map(string(), number());
```

### `set(elementSchema)`

```ts
import { set, string } from "@loydjs/schema";

const Tags = set(string());
```

---

## Modifiers

### `optional(schema)`

```ts
import { optional, string } from "@loydjs/schema";

const MaybeEmail = optional(string().email());
// string | undefined
```

### `nullable(schema)`

```ts
import { nullable, string } from "@loydjs/schema";

const MaybeName = nullable(string());
// string | null
```

### `nullish(schema)`

```ts
import { nullish, string } from "@loydjs/schema";

const MaybeValue = nullish(string());
// string | null | undefined
```

### `brand(schema, brand)`

```ts
import { brand, string } from "@loydjs/schema";

const UserId = brand(string().uuid(), "UserId");
type UserId = Infer<typeof UserId>; // string & { readonly [brand]: "UserId" }
```

### `transform(schema, fn)`

```ts
import { transform, string } from "@loydjs/schema";

const TrimmedEmail = transform(
  string().email(),
  (email) => email.toLowerCase().trim()
);
```

### `pipe(schema, ...rules)`

```ts
import { pipe, string, minLength, email } from "@loydjs/schema";

// Compose rules functionally
const EmailField = pipe(string(), minLength(1), email());
```

---

## Refinements

### `refine(schema, predicate, options)`

```ts
import { refine, string } from "@loydjs/schema";

const StrongPassword = refine(
  string().minLength(8),
  (v) => /[A-Z]/.test(v) && /[0-9]/.test(v),
  { code: "ERR_PASSWORD_TOO_WEAK" }
);
```

### `refineAsync(schema, predicate, options)`

```ts
import { refineAsync, string } from "@loydjs/schema";

const UniqueUsername = refineAsync(
  string().minLength(3),
  async (username) => {
    const taken = await db.users.exists({ username });
    return !taken;
  },
  { code: "ERR_USERNAME_TAKEN" }
);
```

### `defineRule(definition, predicate)`

Define a reusable rule with a name and code that can be applied to any schema.

```ts
import { defineRule, string } from "@loydjs/schema";

const noEmoji = defineRule(
  { code: "ERR_STRING_HAS_EMOJI", description: "No emoji allowed" },
  (v: string) => !/\p{Emoji}/u.test(v)
);

const CleanString = noEmoji.apply(string());
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `BaseSchema`, `LoydResult` |
| `@loydjs/types` | `SchemaMap`, `InferSchemaMap` |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)