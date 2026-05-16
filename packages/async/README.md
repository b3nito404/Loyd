<div align="center">

<h1>@loydjs/async</h1>

<p><strong>Two-pass async validation pipeline for Loyd.</strong><br/>
Sync rules first · Async rules in parallel · AbortSignal support.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~2kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/async)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/async?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/async)

</div>

---

## Overview

`@loydjs/async` adds async validation to Loyd schemas using a two-pass pipeline. Synchronous rules execute first - if any fail, async rules are skipped entirely. This avoids unnecessary database queries or network calls when the input is structurally invalid.

Multiple async rules on the same schema run in parallel via `Promise.all`, minimizing total latency.

---

## Installation

```sh
npm install @loydjs/async
```

> **Requires** `@loydjs/core` · `@loydjs/schema` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `parseAsync(schema, input, options?)`

```ts
import { parseAsync } from "@loydjs/async";
import { string } from "@loydjs/schema";
import { refineAsync } from "@loydjs/schema";

const UniqueEmail = string()
  .email()
  .pipe(
    refineAsync(async (email) => {
      const exists = await db.users.exists({ email });
      return !exists;
    }, { code: "ERR_EMAIL_TAKEN" })
  );

// Sync check (.email()) runs first.
// If it fails, the async DB query is never made.
const result = await parseAsync(UniqueEmail, formData.email);

if (result.success) {
  console.log(result.data); // "alice@example.com"
} else {
  console.log(result.issues[0].code); // "ERR_EMAIL_TAKEN"
}
```

### `safeParseAsync(schema, input, options?)`

Alias for `parseAsync` — same behavior, different name for symmetry with `safeParse`.

```ts
import { safeParseAsync } from "@loydjs/async";

const result = await safeParseAsync(schema, input);
```

### With `AbortSignal`

Cancel an in-flight validation when a request is aborted.

```ts
const controller = new AbortController();

// Cancel after 2 seconds
setTimeout(() => controller.abort(), 2000);

const result = await parseAsync(HeavySchema, input, {
  signal: controller.signal,
});

if (!result.success && result.issues[0]?.code === "ERR_ABORTED") {
  console.log("Validation was cancelled");
}
```

### `refineAsync(predicate, options)`

Adds an async refinement to any schema.

```ts
import { object, string, number } from "@loydjs/schema";
import { refineAsync } from "@loydjs/schema";

const CreatePostSchema = object({
  title:    string().minLength(3).maxLength(200),
  authorId: number().int().pipe(
    refineAsync(async (id) => {
      const exists = await db.users.exists({ id });
      return exists;
    }, { code: "ERR_AUTHOR_NOT_FOUND" })
  ),
  categoryId: number().int().pipe(
    refineAsync(async (id) => {
      const exists = await db.categories.exists({ id });
      return exists;
    }, { code: "ERR_CATEGORY_NOT_FOUND" })
  ),
});

// authorId and categoryId async checks run in parallel
const result = await parseAsync(CreatePostSchema, req.body);
```

---

## Pipeline behavior

```
Input
  │
[Sync rules]  -> fail -> return immediately, skip async
  │
  pass
  │
[Async rules] -> all run in parallel via Promise.all
  │
Result
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema`, `LoydResult` types |
| `@loydjs/schema` | `refineAsync` schema modifier |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)