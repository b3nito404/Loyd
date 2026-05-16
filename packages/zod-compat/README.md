<div align="center">

<h1>@loydjs/zod-compat</h1>

<p><strong>Migrate from Zod to Loyd in minutes.</strong><br/>
fromZod · toZod · Automated codemod · Full schema coverage.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~5kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/zod-compat)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/zod-compat?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/zod-compat)

</div>

---

## Overview

`@loydjs/zod-compat` provides bidirectional conversion between Zod and Loyd schemas, plus an automated codemod that migrates your entire codebase in one command. If you have an existing Zod project and want Loyd's performance, this is your migration path.

---

## Installation

```sh
npm install @loydjs/zod-compat
```

> **Requires** `@loydjs/core` · `@loydjs/schema` · `zod` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `fromZod(zodSchema)`

Converts a Zod schema to a Loyd schema. Supports all common Zod types.

```ts
import { fromZod } from "@loydjs/zod-compat";
import { z } from "zod";

const ZodUser = z.object({
  name:  z.string().min(2).max(100),
  email: z.string().email(),
  age:   z.number().int().min(0).max(120),
  role:  z.enum(["admin", "user", "guest"]),
  tags:  z.array(z.string()),
  address: z.object({
    street: z.string(),
    city:   z.string(),
  }).optional(),
});

const LoydUser = fromZod(ZodUser);

// Use as a normal Loyd schema
const result = safeParse(LoydUser, req.body);
```

### `toZod(loydSchema)`

Converts a Loyd schema back to a Zod schema. Useful when you need to use a Zod-specific API (e.g. tRPC, OpenAPI generators that only support Zod).

```ts
import { toZod } from "@loydjs/zod-compat";

const ZodUser = toZod(LoydUser);

// Use with tRPC, Zod-specific libraries, etc.
const router = t.router({
  createUser: t.procedure
    .input(ZodUser)
    .mutation(({ input }) => db.users.create(input)),
});
```

### `runCodemod(path, options)`

Automated migration — scans your codebase and rewrites Zod imports and schema definitions to Loyd equivalents.

```ts
import { runCodemod } from "@loydjs/zod-compat";

await runCodemod("./src", {
  write:   true,    // write changes to disk (default: false = dry run)
  verbose: true,    // log each transformed file
});

// Output:
//  src/schemas/user.ts       (3 schemas migrated)
//  src/schemas/post.ts       (1 schema migrated)
//  src/api/validation.ts     (5 schemas migrated)
//  Migrated 47 files, 312 schemas
```

Or use the CLI directly:

```sh
npx loyd-codemod ./src --write
npx loyd-codemod ./src --write --verbose
npx loyd-codemod ./src --dry-run   # preview without writing
```

---

## Schema conversion table

| Zod | Loyd |
|:---|:---|
| `z.string()` | `string()` |
| `z.string().min(n)` | `string().minLength(n)` |
| `z.string().max(n)` | `string().maxLength(n)` |
| `z.string().email()` | `string().email()` |
| `z.string().uuid()` | `string().uuid()` |
| `z.string().url()` | `string().url()` |
| `z.number()` | `number()` |
| `z.number().min(n)` | `number().min(n)` |
| `z.number().max(n)` | `number().max(n)` |
| `z.number().int()` | `number().int()` |
| `z.boolean()` | `boolean()` |
| `z.literal(v)` | `literal(v)` |
| `z.object({})` | `object({})` |
| `z.array(s)` | `array(s)` |
| `z.union([...])` | `union([...])` |
| `z.discriminatedUnion(k, [...])` | `discriminatedUnion(k, [...])` |
| `z.optional(s)` | `optional(s)` |
| `z.nullable(s)` | `nullable(s)` |
| `z.enum([...])` | `union([literal("a"), literal("b"), ...])` |
| `z.tuple([...])` | `tuple([...])` |
| `z.record(s)` | `record(s)` |
| `z.map(k, v)` | `map(k, v)` |
| `z.set(s)` | `set(s)` |

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema` base types |
| `@loydjs/schema` | Target schema constructors |

## Peer dependencies

| Package | Version |
|:---|:---|
| `zod` | ≥ 3.0.0 |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)