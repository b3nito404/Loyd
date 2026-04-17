<div align="center">

<h1>Loyd</h1>


**High-performance, tree-shakable schema validation for TypeScript.**

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-0.8kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/schema)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/b3nito404/loyd/releases)

</div>

---

## Key features

- **0.8 kb minimal bundle** : functional `pipe()` composition enables full tree-shaking; import only what you use
- **JIT compiler** : `compile(schema)` generates a pure JavaScript function via `new Function()`; subsequent calls are **2× faster** than `safeParse` on hot paths
- **Structured i18n** : validators emit `{ code, path, meta }`, never locale strings; swap locales at runtime without touching your schemas
- **Two-pass async pipeline** : sync rules execute first; async rules only if sync passes; multiple async rules run in parallel via `Promise.all`
- **Field dependency graph** : `buildDag(schema, deps)` enables incremental revalidation; change one field -> revalidate only it and its dependents
- **Native React integration** : `useForm`, `useField`, `useFieldArray` with zero external dependencies, backed by the DAG

---

## Installation

```sh
# Core  start here
npm install @loydjs/schema @loydjs/core @loydjs/types

# Optional packages
npm install @loydjs/async          # two-pass async pipeline
npm install @loydjs/compiler       # JIT compilation
npm install @loydjs/error-engine   # structured i18n
npm install @loydjs/react          # React hooks (requires @loydjs/graph)
npm install @loydjs/graph          # field dependency DAG
npm install @loydjs/zod-compat     # Zod migration utilities
npm install @loydjs/openapi        # OpenAPI 3.1 / JSON Schema export
npm install @loydjs/vite           # Vite / Rollup AOT plugin
```
> **Requires** Node.js ≥ 20, TypeScript ≥ 5.4, and `"strict": true` in your `tsconfig.json`.

---

## Quick start

```ts
import { object, pipe, string, number, email, minLength } from "@loydjs/schema";
import { parse, safeParse } from "@loydjs/core";
import type { Infer } from "@loydjs/types";

// 1. Define your schema
const UserSchema = object({
  name:  pipe(string(), minLength(2)),
  email: pipe(string(), email()),
  age:   number().int().min(0),
});

// 2. Infer the TypeScript type - zero runtime cost
type User = Infer<typeof UserSchema>;
// -> { name: string; email: string; age: number }

// 3a. parse()  throws LoydError on failure
const user = parse(UserSchema, req.body);

// 3b. safeParse()  never throws
const result = safeParse(UserSchema, formData);
if (result.success) {
  console.log(result.data.name); // typed as User 
} else {
  result.issues.forEach(issue => {
    console.log(issue.code);  // "ERR_STRING_TOO_SHORT"
    console.log(issue.path);  // ["name"]
    console.log(issue.meta);  // { min: 2, actual: 1 }
  });
}
```

### React forms

```tsx
import { useForm } from "@loydjs/react";

function LoginForm() {
  const { register, handleSubmit, state } = useForm({
    schema: LoginSchema,
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <input {...register("email")} type="email" />
      <input {...register("password")} type="password" />
      <button type="submit" disabled={state.isSubmitting}>Sign in</button>
    </form>
  );
}
```

### JIT compilation

```ts
import { compile } from "@loydjs/compiler";

const validate = compile(UserSchema);

// 2× faster on hot paths - compiled once, cached per schema instance
const result = validate(input); // LoydResult<User>
```

### i18n error formatting

```ts
import { configureFormatter, fr } from "@loydjs/error-engine";

// Call once at app startup
configureFormatter("fr", fr);

// Issues are now formatted in French
const result = safeParse(UserSchema, badInput);
// result.issues[0].message -> "Minimum 2 caractères (reçu : 1)"
```

### Migrate from Zod

```ts
import { fromZod, runCodemod } from "@loydjs/zod-compat";

// Convert a single schema
const LoydUser = fromZod(zodUserSchema);

// Or run the automated codemod across your entire codebase
await runCodemod("./src", { write: true, verbose: true });
```

---

## Packages

| Package | Description | Size |
|---|---|---|
| `@loydjs/core` | `parse`, `safeParse`, `LoydError`, `BaseSchema` | 3.9 kb |
| `@loydjs/schema` | All primitives, composites, modifiers, refinements | tree-shakeable |
| `@loydjs/types` | `Infer<>`, `InferInput<>`, `InferOutput<>` | 0 kb runtime |
| `@loydjs/async` | `parseAsync`, two-pass pipeline, `AbortSignal` | ~2 kb |
| `@loydjs/compiler` | `compile()`, JIT codegen, cache management | ~4 kb |
| `@loydjs/error-engine` | `createFormatter`, en/fr/es/ar locales | ~3 kb |
| `@loydjs/graph` | `buildDag`, `validateIncremental`, dirty tracking | ~3 kb |
| `@loydjs/react` | `useForm`, `useField`, `useFieldArray`, `FormProvider` | ~8 kb |
| `@loydjs/zod-compat` | `fromZod`, `toZod`, `runCodemod` | ~5 kb |
| `@loydjs/openapi` | `toOpenApi`, `toJsonSchema`, `toOpenApiComponents` | ~4 kb |
| `@loydjs/vite` | `loydPlugin()` - Vite/Rollup AOT compilation | ~2 kb |

---

## Documentation

For the full API reference, guides, and examples, visit the official documentation:

**[https://loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT 
