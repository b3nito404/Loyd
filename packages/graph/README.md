<div align="center">

<h1>@loydjs/graph</h1>

<p><strong>Field dependency graph for Loyd schemas.</strong><br/>
Incremental revalidation · DAG-based dirty tracking · Change one field, revalidate only what depends on it.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~3kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/graph)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/graph?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/graph)

</div>

---

## Overview

`@loydjs/graph` enables incremental revalidation by tracking field dependencies as a directed acyclic graph (DAG). When a field changes, only that field and its dependents are revalidated — not the entire schema.

This is particularly useful in large forms where validating all fields on every keystroke would be expensive. It is also the foundation for `@loydjs/react`'s `useForm` hook.

---

## Installation

```sh
npm install @loydjs/graph
```

> **Requires** `@loydjs/core` · `@loydjs/schema` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `buildDag(schema, dependencies)`

Builds a dependency graph from a schema and an explicit dependency map.

```ts
import { buildDag } from "@loydjs/graph";
import { object, string, number } from "@loydjs/schema";

const CheckoutSchema = object({
  country:    string(),
  state:      string(),     // depends on country
  zipCode:    string(),     // depends on country + state
  totalPrice: number(),
  discount:   number(),     // depends on totalPrice
  finalPrice: number(),     // depends on totalPrice + discount
});

const dag = buildDag(CheckoutSchema, {
  state:      ["country"],
  zipCode:    ["country", "state"],
  discount:   ["totalPrice"],
  finalPrice: ["totalPrice", "discount"],
});
```

### `validateIncremental(dag, changedFields, values)`

Revalidates only the changed fields and their dependents.

```ts
import { validateIncremental } from "@loydjs/graph";

// User changes the country field
const result = validateIncremental(dag, ["country"], {
  country:    "FR",
  state:      "IDF",
  zipCode:    "75001",
  totalPrice: 99.99,
  discount:   10,
  finalPrice: 89.99,
});

// Only country, state, and zipCode were revalidated
// totalPrice, discount, finalPrice were skipped
console.log(result.revalidated); // ["country", "state", "zipCode"]
console.log(result.issues);      // LoydIssue[]
```

### `markDirty(dag, changedFields)`

Marks fields as dirty without revalidating — useful for tracking touched state in forms.

```ts
import { markDirty, getDirtyFields } from "@loydjs/graph";

markDirty(dag, ["email", "name"]);
getDirtyFields(dag); // ["email", "name"]
```

### `getDependents(dag, field)`

Returns all fields that depend on a given field (direct and transitive).

```ts
import { getDependents } from "@loydjs/graph";

getDependents(dag, "country");   // ["state", "zipCode"]
getDependents(dag, "totalPrice"); // ["discount", "finalPrice"]
```

---

## Use with React

`@loydjs/graph` powers `@loydjs/react` — the DAG is built automatically from your schema and dependency map when you call `useForm`.

```tsx
import { useForm } from "@loydjs/react";

const { register, handleSubmit } = useForm({
  schema: CheckoutSchema,
  dependencies: {
    state:   ["country"],
    zipCode: ["country", "state"],
  },
  mode: "onChange",
});
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema`, `LoydIssue` types |
| `@loydjs/schema` | Schema traversal for DAG construction |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)