<div align="center">

<h1>@loydjs/runtime</h1>

<p><strong>Zero-copy execution engine for Loyd.</strong><br/>
createExecutor · zeroCopy · abortEarly · deepFreeze · strict mode.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~2kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/runtime)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/runtime?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/runtime)

</div>

---

## Overview

`@loydjs/runtime` provides a high-performance execution layer on top of `@loydjs/compiler`. Instead of calling `compile(schema)` and managing options manually, you create an `Executor` once with your desired options and reuse it across your entire application.

The key feature is **zero-copy mode** — on the success path, no result object is allocated. The input is returned directly, eliminating the `{ success, data, issues }` allocation that every other validation library performs on every call.

---

## Installation

```sh
npm install @loydjs/runtime
```

> **Requires** `@loydjs/core` · `@loydjs/compiler` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `createExecutor(options?)`

Creates a reusable executor with fixed options. More efficient than passing options on every call — options are resolved once at creation time.

```ts
import { createExecutor } from "@loydjs/runtime";

const executor = createExecutor({
  zeroCopy:   true,     // skip { success, data, issues } allocation on success
  abortEarly: true,     // stop validating after first error per object
  freeze:     true,     // deep-freeze validated output
  mode:       "strict", // "strip" | "strict" | "passthrough"
});

const result = executor.run(UserSchema, req.body);

if (result.success) {
  console.log(result.data); // typed as User, deep-frozen
}
```

### Pre-built executors

Three ready-to-use executors for the most common cases:

```ts
import {
  defaultExecutor,    // mode: "strip", no freeze, no zeroCopy
  zeroCopyExecutor,   // mode: "strip", zeroCopy: true
  strictExecutor,     // mode: "strict", rejects unknown keys
} from "@loydjs/runtime";

// Fastest possible — no result object allocated on success
const result = zeroCopyExecutor.run(UserSchema, input);

// Reject unknown keys
const result = strictExecutor.run(UserSchema, input);
```

### `executor.runOrThrow(schema, input)`

Throws a descriptive `Error` on failure instead of returning a result object.

```ts
const executor = createExecutor({ mode: "strict" });

try {
  const user = executor.runOrThrow(UserSchema, req.body);
  // user is typed as User
} catch (err) {
  console.error(err.message);
  // "Validation failed: ERR_STRING_INVALID_EMAIL at ["email"]"
}
```

### `deepFreeze(value)`

Recursively freezes an object. Skips already-frozen objects for performance.

```ts
import { deepFreeze, isDeepFrozen } from "@loydjs/runtime";

const frozen = deepFreeze({ name: "Alice", address: { city: "Paris" } });
isDeepFrozen(frozen); // true
frozen.name = "Bob";  // throws in strict mode
```

### `getModeConfig(mode)`

Returns the configuration object for a given mode.

```ts
import { getModeConfig } from "@loydjs/runtime";

getModeConfig("strict");
// { stripUnknownKeys: false, errorOnUnknownKeys: true, passthroughUnknownKeys: false }

getModeConfig("passthrough");
// { stripUnknownKeys: false, errorOnUnknownKeys: false, passthroughUnknownKeys: true }
```

---

## Executor options

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `mode` | `"strip" \| "strict" \| "passthrough"` | `"strip"` | How unknown keys are handled |
| `zeroCopy` | `boolean` | `false` | Skip result allocation on success |
| `abortEarly` | `boolean` | `false` | Stop at first validation error |
| `freeze` | `boolean` | `false` | Deep-freeze validated output |

---

## Mode comparison

| Mode | Unknown keys | Use case |
|:---|:---|:---|
| `strip` | Removed silently | APIs, form validation |
| `strict` | Error | Internal services, strict contracts |
| `passthrough` | Kept as-is | Proxies, partial validation |

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema`, `LoydResult` types |
| `@loydjs/compiler` | `compile()` for JIT validation |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)