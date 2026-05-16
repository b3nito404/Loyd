<div align="center">

<h1>@loydjs/core</h1>

<p><strong>The runtime foundation of Loyd.</strong><br/>
Base schema class · parse · safeParse · LoydError · typed results.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-3.9kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)

</div>

---

## Overview

`@loydjs/core` is the runtime foundation that every other Loyd package builds on. It provides the base schema class, the `parse` / `safeParse` functions, the structured error type, and all shared TypeScript interfaces.

You rarely import from `@loydjs/core` directly in application code — use `@loydjs/schema` for schema building and `@loydjs/types` for type inference. Core is the layer you depend on when building custom schemas or extending Loyd.

---

## Installation

```sh
npm install @loydjs/core
```

> **Requires** Node.js ≥ 20 · TypeScript ≥ 5.4 · `"strict": true` in `tsconfig.json`

---

## API

### `safeParse(schema, input)`

Never throws. Returns a discriminated union — check `result.success` before accessing `result.data`.

```ts
import { safeParse } from "@loydjs/core";
import { UserSchema } from "./schemas";

const result = safeParse(UserSchema, req.body);

if (result.success) {
  console.log(result.data); // typed as User
} else {
  for (const issue of result.issues) {
    console.log(issue.code);    // "ERR_STRING_INVALID_EMAIL"
    console.log(issue.path);    // ["email"]
    console.log(issue.meta);    // { expected: "email" }
    console.log(issue.message); // optional - set by error-engine
  }
}
```

### `parse(schema, input)`

Throws `LoydError` on failure. Use when you want to let the error propagate (e.g. inside a try/catch at the API boundary).

```ts
import { parse } from "@loydjs/core";

try {
  const user = parse(UserSchema, req.body);
  // user is typed as User
} catch (err) {
  if (err instanceof LoydError) {
    console.log(err.issues); // LoydIssue[]
  }
}
```

### `LoydError`

Extends `Error`. Carries the full `issues` array.

```ts
import { LoydError } from "@loydjs/core";

const err = new LoydError(issues);
err.issues; // [LoydIssue, ...LoydIssue[]]
err.message; // first issue code as string
```

### `BaseSchema`

The abstract base class for all Loyd schemas. Extend it to build custom schema types.

```ts
import { BaseSchema } from "@loydjs/core";
import type { LoydResult } from "@loydjs/core";

class IpSchema extends BaseSchema<string> {
  readonly _type = "ip" as const;

  _validate(input: unknown): LoydResult<string> {
    if (typeof input !== "string")
      return this._fail("ERR_STRING_INVALID_TYPE", [], { received: typeof input });

    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(input))
      return this._fail("ERR_IP_INVALID", [], { actual: input });

    return this._ok(input);
  }
}

export const ip = () => new IpSchema();
```

---

## Types

```ts
// Result type - discriminated union
type LoydResult<T> =
  | { success: true;  data: T;         issues: [] }
  | { success: false; data: undefined; issues: [LoydIssue, ...LoydIssue[]] };

// Issue - structured, never a locale string
interface LoydIssue {
  code:     string;                          // "ERR_STRING_INVALID_EMAIL"
  path:     ReadonlyArray<string | number>;  // ["profile", "email"]
  message?: string;                          // set by @loydjs/error-engine
  meta?:    Record<string, unknown>;         // { min: 2, actual: 1 }
}

// Schema interface - implemented by all schema types
interface LoydSchema<TOutput, TInput = TOutput> {
  readonly _type: string;
  safeParse(input: unknown): LoydResult<TOutput>;
  parse(input: unknown): LoydResult<TOutput>;
  parseOrThrow(input: unknown): TOutput;
  meta(): SchemaMeta;
  describe(description: string): this;
}
```

---

## Dependencies

| Package | Role |
|:---|:---|
| none | `@loydjs/core` has zero runtime dependencies |

## Used by

| Package | Why |
|:---|:---|
| `@loydjs/schema` | Extends `BaseSchema` for all primitive and composite types |
| `@loydjs/compiler` | Imports `LoydSchema`, `LoydResult` for codegen types |
| `@loydjs/async` | Imports `LoydResult` for async pipeline |
| `@loydjs/runtime` | Imports `LoydSchema`, `LoydResult` for executor |
| `@loydjs/react` | Imports `LoydSchema` for form types |
| all other packages | Depend on core types and interfaces |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)