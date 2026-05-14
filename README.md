<div align="center">

<h1>Loyd</h1>

<p><strong>The fastest schema validation library for TypeScript.</strong><br/>
JIT-compiled validators · Zero allocations on valid paths · Beats AJV on 13/15 benchmarks.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-0.8kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/schema)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/b3nito404/loyd/releases)

</div>

---

## Benchmarks

> Node.js 22 · ops/sec · higher is better  
> **Loyd compiled** uses `compile(schema)` - JIT-compiled validator, cached per schema instance.

![Benchmarks](./bench/bench.svg)

> Run locally: `pnpm --filter @loydjs/compiler exec vitest bench`

### Full results

| Benchmark | Loyd compiled | AJV | Valibot | Zod |
|:---|---:|---:|---:|---:|
| string valid | **fastest** | 5.36× slower | 1.94× slower | 2.39× slower |
| number valid | **fastest** | 1.08× slower | 3.53× slower | 2.65× slower |
| object flat valid | **fastest** | 1.37× slower | 5.37× slower | 5.83× slower |
| object flat invalid | **fastest** | 1.09× slower | 9.05× slower | 100× slower |
| object deep valid | **fastest** | 1.71× slower | 12.21× slower | 19.78× slower |
| object deep invalid | **fastest** | 1.01× slower | 2.56× slower | 81× slower |
| array 1000 valid | **fastest** | 1.43× slower | 12.35× slower | 14.66× slower |
| array 1000 invalid | **fastest** | 1.75× slower | 15.10× slower | 55× slower |
| union first variant | **fastest** | — | 1.21× slower | 1.57× slower |
| union last variant | **fastest** | — | 2.77× slower | 1.66× slower |
| type check string | **fastest** | 1.14× slower | 1.73× slower | 3.56× slower |
| stress flat 10k | **fastest** | 1.17× slower | 6.70× slower | 9.99× slower |
| stress deep 1k | **fastest** | 1.97× slower | 19.95× slower | 15.85× slower |

---

## Why Loyd is fast

Three techniques that no other TypeScript validation library combines:

**Static inline path** - error paths are emitted as compile-time literals `["profile","address","city"]`. Zero heap allocation on the valid path — paths only exist when an error actually occurs.

**Side-effect-aware codegen** - the compiler tracks which fields can mutate their value. Fields that can't (`number`, `boolean`, `literal`, pure `string`) skip the write-back entirely. No property writes on the valid path.

**Rule fingerprinting** - the optimizer runs each validation closure against sentinel values at compile time, identifies its behavior, then emits flat inline code (`if (v.length < 2)`) instead of calling `safeParse` recursively.

---

## Key features

- **0.8 kb minimal bundle** - `pipe()` composition enables full tree-shaking; import only what you use
- **JIT compiler** - `compile(schema)` generates a pure JS function via `new Function()`; beats AJV on 13/15 benchmarks
- **Zero-copy executor** - `zeroCopyExecutor.run()` skips result object allocation on the success path
- **Structured errors** - validators emit `{ code, path, meta }`, never locale strings; swap locales at runtime
- **Two-pass async pipeline** - sync rules first, async rules only if sync passes, parallel via `Promise.all`
- **Field dependency graph** - `buildDag(schema, deps)` enables incremental revalidation of dependent fields
- **Native React integration** - `useForm`, `useField`, `useFieldArray` with zero external dependencies
- **AOT Vite plugin** - `loydPlugin()` replaces `compile()` calls with flat inline code at build time

---

## Installation

```sh
# Core - start here
npm install @loydjs/schema @loydjs/core @loydjs/types

# Optional packages
npm install @loydjs/compiler       # JIT compilation - compile(schema)
npm install @loydjs/runtime        # Zero-copy executor, freeze, strict mode
npm install @loydjs/async          # Two-pass async pipeline
npm install @loydjs/error-engine   # Structured i18n (en/fr/es/ar)
npm install @loydjs/react          # React hooks (requires @loydjs/graph)
npm install @loydjs/graph          # Field dependency DAG
npm install @loydjs/zod-compat     # Zod migration utilities
npm install @loydjs/openapi        # OpenAPI 3.1 / JSON Schema export
npm install @loydjs/vite           # Vite / Rollup AOT plugin
```

> **Requires** Node.js ≥ 20, TypeScript ≥ 5.4, `"strict": true` in `tsconfig.json`.

---

## Quick start

```ts
import { object, string, number } from "@loydjs/schema";
import { safeParse } from "@loydjs/core";
import type { Infer } from "@loydjs/types";

const UserSchema = object({
  name:  string().minLength(2).maxLength(100),
  email: string().email(),
  age:   number().int().min(0).max(120),
});

type User = Infer<typeof UserSchema>;
// { name: string; email: string; age: number }

const result = safeParse(UserSchema, req.body);

if (result.success) {
  console.log(result.data.name); // typed as User
} else {
  result.issues.forEach(issue => {
    console.log(issue.code);  // "ERR_STRING_INVALID_EMAIL"
    console.log(issue.path);  // ["email"]
    console.log(issue.meta);  // { expected: "email" }
  });
}
```

---

## JIT compilation

The compiler runs once per schema instance and caches the result. Subsequent calls hit the compiled function directly - no schema traversal, no dispatch, no allocations on the valid path.

```ts
import { compile } from "@loydjs/compiler";

const validate = compile(UserSchema);
// Generates and caches a pure JS function:
//   function __loyd_v1__(input) {
//     if (typeof input !== "object" || input === null) { ... }
//     const name = input["name"];
//     if (typeof name !== "string") { ... }
//     if (name.length < 2) { ... }
//     ...
//   }

for (const item of largeDataset) {
  const result = validate(item); // LoydResult<User>
}
```

---

## Zero-copy executor

```ts
import { zeroCopyExecutor, createExecutor } from "@loydjs/runtime";

// Skip result object allocation on success
const result = zeroCopyExecutor.run(UserSchema, input);

// Custom executor
const executor = createExecutor({
  zeroCopy: true,   // skip { success, data, issues } allocation on success
  abortEarly: true, // stop at first error per object
  freeze: true,     // deep-freeze validated output
  mode: "strict",   // reject unknown keys
});

const result = executor.run(UserSchema, input);
```

---

## AOT Vite plugin

Replaces `compile()` calls with flat inline validators at build time - zero runtime compilation overhead.

```ts
// vite.config.ts
import { loydPlugin } from "@loydjs/vite";

export default {
  plugins: [
    loydPlugin({
      schemas: { UserSchema, PostSchema }, // resolved statically at build time
    }),
  ],
};
```

```ts
// Your app code - untouched
const validate = compile(UserSchema);

// After AOT transform - what ships in your bundle:
// function __loyd_UserSchema__(input) {
//   if (typeof input !== "object" || ...) { ... }
//   const name = input["name"];
//   if (name.length < 2) { ... }
//   ...
// }
// const validate = __loyd_UserSchema__;
```

---

## Async validation

```ts
import { parseAsync } from "@loydjs/async";
import { refineAsync } from "@loydjs/schema";

const UniqueEmailSchema = string().email().pipe(
  refineAsync(async (email) => {
    const exists = await db.users.exists({ email });
    return !exists;
  }, { code: "ERR_EMAIL_TAKEN" })
);

// Sync rules run first, async only if sync passes
const result = await parseAsync(UniqueEmailSchema, formData.email);
```

---

## React forms

```tsx
import { useForm } from "@loydjs/react";

function SignupForm() {
  const { register, handleSubmit, state } = useForm({
    schema: UserSchema,
    defaultValues: { name: "", email: "", age: 0 },
    mode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <input {...register("name")} />
      <input {...register("email")} type="email" />
      <input {...register("age")}  type="number" />
      <button type="submit" disabled={state.isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

---

## i18n error messages

```ts
import { configureFormatter, fr, es, ar } from "@loydjs/error-engine";

// Call once at app startup
configureFormatter("fr", fr);

const result = safeParse(UserSchema, badInput);
// result.issues[0].message -> "Minimum 2 caractères (reçu : 1)"
```

---

## OpenAPI / JSON Schema export

```ts
import { toOpenApi, toJsonSchema } from "@loydjs/openapi";

const spec = toOpenApi(UserSchema, { title: "User", version: "1.0.0" });
const jsonSchema = toJsonSchema(UserSchema);
```

---

## Migrate from Zod

```ts
import { fromZod, runCodemod } from "@loydjs/zod-compat";

// Single schema
const LoydUser = fromZod(zodUserSchema);

// Entire codebase - automated migration
await runCodemod("./src", { write: true, verbose: true });
```

---

## Packages

| Package | Description | Size |
|:---|:---|---:|
| `@loydjs/core` | `parse`, `safeParse`, `LoydError`, `BaseSchema` | 3.9 kb |
| `@loydjs/schema` | Primitives, composites, modifiers, refinements | tree-shakeable |
| `@loydjs/types` | `Infer<>`, `InferInput<>`, `InferOutput<>` | 0 kb runtime |
| `@loydjs/compiler` | `compile()`, JIT codegen, rule fingerprinting | ~4 kb |
| `@loydjs/runtime` | `createExecutor`, zeroCopy, freeze, strict mode | ~2 kb |
| `@loydjs/async` | `parseAsync`, two-pass pipeline, `AbortSignal` | ~2 kb |
| `@loydjs/error-engine` | `createFormatter`, en/fr/es/ar locales | ~3 kb |
| `@loydjs/graph` | `buildDag`, `validateIncremental`, dirty tracking | ~3 kb |
| `@loydjs/react` | `useForm`, `useField`, `useFieldArray`, `FormProvider` | ~8 kb |
| `@loydjs/zod-compat` | `fromZod`, `toZod`, `runCodemod` | ~5 kb |
| `@loydjs/openapi` | `toOpenApi`, `toJsonSchema` | ~4 kb |
| `@loydjs/vite` | `loydPlugin()` - AOT compilation | ~2 kb |

---

## Documentation

Full API reference, guides, and examples:

**[https://loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT