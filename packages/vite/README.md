<div align="center">

<h1>@loydjs/vite</h1>

<p><strong>AOT compilation plugin for Vite and Rollup.</strong><br/>
Replaces compile() calls with flat inline validators at build time · Zero runtime overhead.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~2kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/vite)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/vite?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/vite)

</div>

---

## Overview

`@loydjs/vite` is a Vite and Rollup plugin that performs Ahead-of-Time (AOT) compilation of Loyd schemas. When enabled, it replaces `compile(schema)` calls in your source code with the flat inline validator functions at build time — so your production bundle contains zero compilation overhead and no dependency on `@loydjs/compiler` at runtime.

In development, the plugin is a no-op — JIT compilation runs as normal for fast HMR.

---

## Installation

```sh
npm install @loydjs/vite
```

> **Requires** `@loydjs/core` · `@loydjs/compiler` · Vite ≥ 5.0.0 · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## Setup

### Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { loydPlugin } from "@loydjs/vite";

export default defineConfig({
  plugins: [
    loydPlugin({
      // Schemas to resolve statically at build time.
      // Key = variable name as it appears in your source code.
      schemas: {
        UserSchema,
        PostSchema,
        CommentSchema,
      },
    }),
  ],
});
```

### Rollup

```js
// rollup.config.js
import { loydPlugin } from "@loydjs/vite";

export default {
  input: "src/index.ts",
  plugins: [
    loydPlugin({ schemas: { UserSchema } }),
  ],
};
```

---

## How it works

Your source code, untouched:

```ts
import { compile } from "@loydjs/compiler";
import { UserSchema } from "./schemas";

const validate = compile(UserSchema);
const result = validate(req.body);
```

After AOT transform — what ships in your production bundle:

```js
// @loydjs/compiler: AOT-inlined validator for UserSchema
function __loyd_UserSchema__(input) {
  "use strict";
  let __input__ = input;
  const __issues__ = [];
  if (typeof __input__ !== "object" || __input__ === null || Array.isArray(__input__)) {
    __issues__.push({ code: "ERR_OBJECT_INVALID_TYPE", path: [] });
  } else {
    const __fname__ = __input__["name"];
    if (typeof __fname__ !== "string") {
      __issues__.push({ code: "ERR_STRING_INVALID_TYPE", path: ["name"] });
    } else {
      if (__fname__.length < 2) { __issues__.push({ code: "ERR_STRING_TOO_SHORT", path: ["name"], meta: { min: 2, actual: __fname__.length } }); }
      if (__fname__.length > 100) { __issues__.push({ code: "ERR_STRING_TOO_LONG", path: ["name"], meta: { max: 100, actual: __fname__.length } }); }
    }
    // ...
  }
  if (__issues__.length > 0) return { success: false, data: undefined, issues: __issues__ };
  return { success: true, data: __input__, issues: [] };
}
const validate = __loyd_UserSchema__;
const result = validate(req.body);
```

---

## Plugin options

```ts
interface LoydVitePluginOptions {
  /**
   * Schemas to resolve statically at build time.
   * Key = variable name as it appears in source code.
   */
  schemas?: Record<string, LoydSchema<unknown>>;

  /**
   * Enable/disable the plugin entirely.
   * @default true
   */
  enabled?: boolean;

  /**
   * Log transformed files.
   * @default false
   */
  verbose?: boolean;

  /**
   * Force AOT even in development mode.
   * By default, AOT is only active during production builds.
   * @default false
   */
  forceAot?: boolean;

  /**
   * Generate sourcemaps for transformed files.
   * @default true
   */
  sourcemap?: boolean;
}
```

---

## Emit standalone validators

Use the `emit()` function from `@loydjs/compiler` to generate standalone `.js` + `.d.ts` validator files, independent of the Vite plugin.

```ts
import { emit } from "@loydjs/compiler";
import { UserSchema } from "./schemas";

await emit(UserSchema, {
  outFile:    "./dist/validators/user.js",
  exportName: "validateUser",
  format:     "esm",
  dts:        true,
});

// dist/validators/user.js    — flat inline validator, no imports
// dist/validators/user.d.ts  — TypeScript declarations
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema` type |
| `@loydjs/compiler` | `generateCode`, `optimize` for AOT codegen |

## Peer dependencies

| Package | Version |
|:---|:---|
| `vite` | ≥ 5.0.0 |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)