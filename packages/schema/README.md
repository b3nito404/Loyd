<div align="center">

<br/>

<h1>
  <img src="https://raw.githubusercontent.com/b3nito404/Loyd/main/assets/logo.svg" alt="Loyd" width="48" height="48" style="vertical-align:middle"/>
  Loyd
</h1>

<p><strong>The schema validation library that actually competes with AJV.</strong><br/>
TypeScript-first · JIT-compiled · Zero allocations on valid paths.</p>

<p>
  <a href="https://github.com/b3nito404/loyd/actions/workflows/ci.yml">
    <img src="https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg" alt="CI"/>
  </a>
  <a href="https://www.npmjs.com/package/@loydjs/schema">
    <img src="https://img.shields.io/npm/dm/@loydjs/schema?color=6366f1&label=downloads" alt="npm downloads"/>
  </a>
  <a href="https://bundlephobia.com/package/@loydjs/schema">
    <img src="https://img.shields.io/badge/bundle-0.8kb-brightgreen.svg" alt="Bundle size"/>
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg" alt="TypeScript"/>
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"/>
  </a>
  <a href="https://github.com/b3nito404/loyd/releases">
    <img src="https://img.shields.io/badge/version-1.0.0-6366f1.svg" alt="Version"/>
  </a>
</p>

<br/>

</div>

---

## Benchmarks

> Node.js 22 · ops/sec · higher is better  
> **Loyd compiled** = `compile(schema)` — JIT-compiled validator, cached per schema instance.

![Benchmarks](./packages/compiler/bench/bench.svg)

<details>
<summary><strong>Full results table</strong></summary>

| Benchmark | Loyd compiled | AJV | Valibot | Zod |
|:---|---:|---:|---:|---:|
| String · minLength + maxLength | **fastest** | 1.24× slower | 1.94× slower | 2.39× slower |
| Number · min + max + int | **fastest** | 1.08× slower | 3.53× slower | 2.65× slower |
| Object flat · 3 fields | **fastest** | 1.37× slower | 5.37× slower | 5.83× slower |
| Object flat · invalid input | **fastest** | 1.09× slower | 9.05× slower | 100× slower |
| Object deep · 5 levels | **fastest** | 1.71× slower | 12.21× slower | 19.78× slower |
| Object deep · invalid root | **fastest** | 1.01× slower | 2.56× slower | 81× slower |
| Array · 1 000 valid items | **fastest** | 1.43× slower | 12.35× slower | 14.66× slower |
| Array · 1 000 items (30% invalid) | **fastest** | 1.75× slower | 15.10× slower | 55× slower |
| Discriminated union · first variant | **fastest** | — | 1.21× slower | 1.57× slower |
| Discriminated union · last variant | **fastest** | — | 2.77× slower | 1.66× slower |
| Type check · string only | **fastest** | 1.14× slower | 1.73× slower | 3.56× slower |
| Stress · flat object × 10 000 | **fastest** | 1.17× slower | 6.70× slower | 9.99× slower |
| Stress · deep nested × 1 000 | **fastest** | 1.97× slower | 19.95× slower | 15.85× slower |

</details>

> Run it yourself: `pnpm --filter @loydjs/compiler exec vitest bench`

---

## How it works

Most TypeScript validators are slow because they traverse the schema tree on every call. Loyd doesn't.

When you call `compile(schema)`, Loyd's optimizer **fingerprints your validation closures** — it runs them against sentinel values to reverse-engineer their behavior, then emits a pure flat JS function:

```
UserSchema  ->  compile()  ->  function __loyd_v1__(input) {
                                if (typeof input !== "object") { ... }
                                const name = input["name"];
                                if (name.length < 2) { ... }   // <- inlined, no safeParse
                                if (name.length > 100) { ... } // <- inlined, no safeParse
                                const email = input["email"];
                                if (!/regex/.test(email)) { ... } // <- inlined
                                ...
                              }
```

Three optimizations AJV doesn't do:

**Static inline paths** - error paths are emitted as compile-time literals `["profile","address","city"]`. Zero heap allocation on the valid path.

**Side-effect-aware write-back** - fields that can never mutate (`number`, `boolean`, `literal`, pure `string`) skip the property write-back entirely.

**O(1) discriminated union lookup** - union variants are indexed into a `Map` at compile time. Resolution is a single `Map.get()` call regardless of how many variants exist.

---

## Installation

```sh
# Core - start here
npm install @loydjs/schema @loydjs/core @loydjs/types

# Performance
npm install @loydjs/compiler       # JIT compilation - compile(schema)
npm install @loydjs/runtime        # Zero-copy executor, freeze, strict mode

# Features
npm install @loydjs/async          # Two-pass async pipeline
npm install @loydjs/error-engine   # Structured i18n (en/fr/es/ar)
npm install @loydjs/react          # React hooks - useForm, useField
npm install @loydjs/graph          # Field dependency DAG

# Ecosystem
npm install @loydjs/zod-compat     # Migrate from Zod in minutes
npm install @loydjs/openapi        # OpenAPI 3.1 / JSON Schema export
npm install @loydjs/vite           # AOT compilation - zero runtime overhead
```

> **Requires** Node.js ≥ 20 · TypeScript ≥ 5.4 · `"strict": true` in `tsconfig.json`

---

## Quick start

### Define and validate

```ts
import { object, string, number, boolean } from "@loydjs/schema";
import { safeParse } from "@loydjs/core";
import type { Infer } from "@loydjs/types";

const UserSchema = object({
  name:    string().minLength(2).maxLength(100),
  email:   string().email(),
  age:     number().int().min(0).max(120),
  active:  boolean(),
  address: object({
    street:  string().minLength(1),
    city:    string().minLength(1),
    country: string().minLength(2).maxLength(2),
  }),
});

type User = Infer<typeof UserSchema>;
// {
//   name: string
//   email: string
//   age: number
//   active: boolean
//   address: { street: string; city: string; country: string }
// }

const result = safeParse(UserSchema, req.body);

if (result.success) {
  console.log(result.data.address.city); // fully typed
} else {
  for (const issue of result.issues) {
    console.log(issue.code);    // "ERR_STRING_INVALID_EMAIL"
    console.log(issue.path);    // ["email"]
    console.log(issue.meta);    // { expected: "email" }
  }
}
```

### JIT compilation — production hot paths

```ts
import { compile } from "@loydjs/compiler";

// Compiled once at startup, cached forever.
// The optimizer fingerprints each rule and emits flat inline code.
const validate = compile(UserSchema);

// Zero schema traversal, zero allocations on the valid path.
for (const item of largeDataset) {
  const result = validate(item); // LoydResult<User>
}
```

### Zero-copy executor - maximum throughput

```ts
import { createExecutor, zeroCopyExecutor } from "@loydjs/runtime";

// Skip { success, data, issues } allocation entirely on success
const result = zeroCopyExecutor.run(UserSchema, input);

// Custom executor - compose options freely
const executor = createExecutor({
  zeroCopy:   true,     // skip result object allocation on success
  abortEarly: true,     // stop at first error per object
  freeze:     true,     // deep-freeze validated output
  mode:       "strict", // reject unknown keys
});
```

### AOT Vite plugin — zero runtime overhead

```ts
// vite.config.ts
import { loydPlugin } from "@loydjs/vite";

export default {
  plugins: [
    loydPlugin({
      // Schemas are resolved at build time - compile() calls are replaced
      // with flat inline validators. Nothing runs at runtime.
      schemas: { UserSchema, PostSchema, CommentSchema },
    }),
  ],
};
```

### Async validation

```ts
import { parseAsync } from "@loydjs/async";
import { refineAsync } from "@loydjs/schema";

const UniqueEmail = string().email().pipe(
  refineAsync(async (email) => {
    const taken = await db.users.exists({ email });
    return !taken;
  }, { code: "ERR_EMAIL_TAKEN" })
);

// Sync rules run first - async only if sync passes.
// Multiple async rules run in parallel via Promise.all.
const result = await parseAsync(UniqueEmail, formData.email);
```

### React forms

```tsx
import { useForm } from "@loydjs/react";

function SignupForm() {
  const { register, handleSubmit, state, errors } = useForm({
    schema: UserSchema,
    defaultValues: { name: "", email: "", age: 0, active: true },
    mode: "onChange", // validate on every keystroke
  });

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <input {...register("name")} placeholder="Name" />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register("email")} type="email" placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit" disabled={state.isSubmitting}>
        Sign up
      </button>
    </form>
  );
}
```

### i18n error messages

```ts
import { configureFormatter, fr, es, ar } from "@loydjs/error-engine";

// One call at app startup - errors are now localized everywhere
configureFormatter("fr", fr);

const result = safeParse(UserSchema, badInput);
// result.issues[0].message -> "Minimum 2 caractères (reçu : 1)"
// result.issues[1].message -> "Format d'e-mail invalide"
```

### Discriminated unions

```ts
import { discriminatedUnion, object, literal, string, number } from "@loydjs/schema";

const Shape = discriminatedUnion("kind", [
  object({ kind: literal("circle"),   radius: number().min(0) }),
  object({ kind: literal("rect"),     width: number().min(0), height: number().min(0) }),
  object({ kind: literal("triangle"), base: number().min(0),  height: number().min(0) }),
]);

// Compiled: O(1) Map.get() lookup - constant time regardless of variant count
const validate = compile(Shape);
```

### Migrate from Zod

```ts
import { fromZod, runCodemod } from "@loydjs/zod-compat";

// Single schema - works with any Zod schema
const LoydUser = fromZod(z.object({ name: z.string().min(2) }));

// Automated codemod - migrate your entire codebase
await runCodemod("./src", { write: true, verbose: true });
//  Migrated 47 files, 312 schemas
```

### OpenAPI export

```ts
import { toOpenApi, toJsonSchema } from "@loydjs/openapi";

const spec = toOpenApi(UserSchema, { title: "User", version: "1.0.0" });
const jsonSchema = toJsonSchema(UserSchema);
```

---

## Packages

| Package | Description | Size |
|:---|:---|---:|
| `@loydjs/core` | `parse`, `safeParse`, `LoydError`, `BaseSchema` | 3.9 kb |
| `@loydjs/schema` | Primitives, composites, modifiers, refinements | tree-shakeable |
| `@loydjs/types` | `Infer<>`, `InferInput<>`, `InferOutput<>` | 0 kb runtime |
| `@loydjs/compiler` | `compile()`, JIT codegen, rule fingerprinting optimizer | ~4 kb |
| `@loydjs/runtime` | `createExecutor`, zeroCopy, freeze, abortEarly | ~2 kb |
| `@loydjs/async` | `parseAsync`, two-pass pipeline, `AbortSignal` | ~2 kb |
| `@loydjs/error-engine` | `createFormatter`, en/fr/es/ar locales | ~3 kb |
| `@loydjs/graph` | `buildDag`, `validateIncremental`, dirty tracking | ~3 kb |
| `@loydjs/react` | `useForm`, `useField`, `useFieldArray`, `FormProvider` | ~8 kb |
| `@loydjs/zod-compat` | `fromZod`, `toZod`, `runCodemod` | ~5 kb |
| `@loydjs/openapi` | `toOpenApi`, `toJsonSchema` | ~4 kb |
| `@loydjs/vite` | `loydPlugin()` — AOT compilation | ~2 kb |

---

## Documentation

Full API reference, guides, and examples:

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)