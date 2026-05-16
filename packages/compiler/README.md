<div align="center">

<h1>@loydjs/compiler</h1>

<p><strong>JIT compilation for Loyd schemas.</strong><br/>
Rule fingerprinting · Static inline paths · Beats AJV on 13/15 benchmarks.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~4kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/compiler)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/compiler?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/compiler)

</div>

---

## Overview

`@loydjs/compiler` transforms Loyd schemas into pure JS validator functions at runtime. Instead of traversing the schema tree on every call, it generates flat inline code once and caches it — resulting in validators that beat AJV on 13 out of 15 benchmarks.

The compiler uses three techniques not found in any other TypeScript validation library:

**Rule fingerprinting** - closures are executed against sentinel values to reverse-engineer their behavior, then replaced with flat `if` statements in the generated code.

**Static inline paths** - error paths are emitted as compile-time literals. Zero heap allocation on the valid path.

**Side-effect-aware write-back** - fields that can't mutate their value skip the property write-back entirely.

---

## Installation

```sh
npm install @loydjs/compiler
```

> **Requires** `@loydjs/core` · `@loydjs/schema` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `compile(schema, options?)`

Compiles a schema into a cached validator function. Compilation happens once per schema instance.

```ts
import { compile } from "@loydjs/compiler";
import { object, string, number } from "@loydjs/schema";

const UserSchema = object({
  name:  string().minLength(2).maxLength(100),
  email: string().email(),
  age:   number().int().min(0).max(120),
});

const validate = compile(UserSchema);

// Zero schema traversal on subsequent calls
const result = validate(input); // LoydResult<User>
```

**Options:**

```ts
interface CompilerOptions {
  mode?:       "development" | "production"; // default: "production"
  optimize?:   boolean;                      // default: true - enable rule fingerprinting
  abortEarly?: boolean;                      // default: false - stop at first error
}
```

### `generateCode(schema, options?)`

Returns the generated JS code as a string without executing it. Useful for debugging or AOT pipelines.

```ts
import { generateCode, optimize } from "@loydjs/compiler";

const { schema: optimized } = optimize(UserSchema);
const { code, fnName } = generateCode(optimized, { mode: "development" });

console.log(code);
// function __loyd_v1__(input) {
//   "use strict";
//   if (typeof input !== "object" || input === null) { ... }
//   const __fname__ = input["name"];
//   if (typeof __fname__ !== "string") { ... }
//   if (__fname__.length < 2) { ... }
//   if (__fname__.length > 100) { ... }
//   ...
// }
```

### `optimize(schema)`

Runs the optimizer on a schema — fingerprints closures, precomputes keys, detects discriminated unions. Returns the optimized schema and a list of applied optimizations.

```ts
import { optimize } from "@loydjs/compiler";

const { schema, appliedOptimizations } = optimize(UserSchema);
// appliedOptimizations: [
//   "string:inline-2-rules",
//   "number:inline-3-rules",
//   "string:inline-1-rules",
//   "object:precompute-3-keys"
// ]
```

### Cache management

```ts
import { invalidateCache, clearCache, isCompiled, globalCache } from "@loydjs/compiler";

isCompiled(UserSchema);        // boolean
invalidateCache(UserSchema);   // removes one schema from cache
clearCache();                  // clears all compiled schemas
globalCache.size;              // number of compiled schemas
```

---

## Generated code example

For `object({ name: string().minLength(2), email: string().email(), age: number().int().min(0) })`:

```js
function __loyd_v1__(input) {
  "use strict";
  let __input__ = input;
  const __issues__ = [];
  if (typeof __input__ !== "object" || __input__ === null || Array.isArray(__input__)) {
    __issues__.push({ code: "ERR_OBJECT_INVALID_TYPE", path: [] });
  } else {
    const __obj1__ = __input__;
    const __pl2__ = __issues__.length;
    const __fname3__ = __obj1__["name"];
    if (typeof __fname3__ !== "string") {
      __issues__.push({ code: "ERR_STRING_INVALID_TYPE", path: ["name"] });
    } else {
      if (__fname3__.length < 2) { __issues__.push({ code: "ERR_STRING_TOO_SHORT", path: ["name"], meta: { min: 2, actual: __fname3__.length } }); }
    }
    const __femail4__ = __obj1__["email"];
    if (typeof __femail4__ !== "string") {
      __issues__.push({ code: "ERR_STRING_INVALID_TYPE", path: ["email"] });
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(__femail4__)) { __issues__.push({ code: "ERR_STRING_INVALID_EMAIL", path: ["email"] }); }
    }
    // ...
  }
  if (__issues__.length > 0) return { success: false, data: undefined, issues: __issues__ };
  return { success: true, data: __input__, issues: [] };
}
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema`, `LoydResult` types |

## Peer dependencies

| Package | Version |
|:---|:---|
| none | The compiler has no peer dependencies |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)