<div align="center">

# Loyd

**Tree-shakable schema validation for TypeScript.**

Loyd is a TypeScript-first validation library. Define schemas for anything from a simple `string` to a complex nested object. It is fast, modular, and gives you structured errors you can translate.

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-0.8kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/schema)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/b3nito404/loyd/releases)
[![npm downloads](https://img.shields.io/npm/dt/@loydjs/schema.svg)](https://www.npmjs.com/package/@loydjs/schema)
[![GitHub stars](https://img.shields.io/github/stars/b3nito404/loyd.svg?style=social)](https://github.com/b3nito404/loyd/stargazers)

</div>

## Quick start

Start with the three core packages:

```sh
npm install @loydjs/schema @loydjs/core @loydjs/types
```

Then create a schema, infer its TypeScript type, and validate data with `safeParse`.

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
    console.log(issue.code); // "ERR_STRING_INVALID_EMAIL"
    console.log(issue.path); // ["email"]
    console.log(issue.meta); // { expected: "email" }
  });
}
```

That is all you need for basic validation. Everything below is optional and tree-shakeable.

## Optional packages

Add these only when you need them:

```sh
npm install @loydjs/compiler       # JIT compilation
npm install @loydjs/runtime        # Zero-copy executor
npm install @loydjs/async          # Async validation
npm install @loydjs/error-engine   # i18n
npm install @loydjs/react          # React hooks
npm install @loydjs/graph          # Field dependency DAG
npm install @loydjs/zod-compat     # Zod migration
npm install @loydjs/openapi        # OpenAPI / JSON Schema
npm install @loydjs/vite           # Vite plugin
```

## Requirements

- Node.js 20+
- TypeScript 5.4+
- `"strict": true` in your `tsconfig.json`

## Defining schemas

Loyd's API is immutable. Every method returns a new instance, so schemas can be safely shared and composed.

```ts
import { object, string, number, array, union, literal } from "@loydjs/schema";

const PostSchema = object({
  id:       string().uuid(),
  title:    string().minLength(1).maxLength(200),
  tags:     array(string()).maxItems(10),
  status:   union([literal("draft"), literal("published")]),
  authorId: string().uuid(),
});
```

## JIT compilation

`compile(schema)` generates a pure JS function and caches it per schema instance. After the first call, validation hits the compiled function directly.

```ts
import { compile } from "@loydjs/compiler";

const validate = compile(UserSchema);

for (const item of largeDataset) {
  const result = validate(item); // LoydResult<User>
}
```

## Zero-copy executor

Skip result object allocation on the success path, or configure the executor to match your needs.

```ts
import { zeroCopyExecutor, createExecutor } from "@loydjs/runtime";

const result = zeroCopyExecutor.run(UserSchema, input);

const executor = createExecutor({
  zeroCopy: true,   // skip { success, data, issues } allocation on success
  abortEarly: true, // stop at first error per object
  freeze: true,     // deep-freeze validated output
  mode: "strict",   // reject unknown keys
});

const result = executor.run(UserSchema, input);
```

## Async validation

Sync rules run first. Async rules run only if sync passes, and they run in parallel.

```ts
import { parseAsync } from "@loydjs/async";
import { refineAsync } from "@loydjs/schema";

const UniqueEmailSchema = string().email().pipe(
  refineAsync(async (email) => {
    const exists = await db.users.exists({ email });
    return !exists;
  }, { code: "ERR_EMAIL_TAKEN" })
);

const result = await parseAsync(UniqueEmailSchema, formData.email);
```

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

## i18n error messages

Validators emit codes, not locale strings. You can swap locales at runtime.

```ts
import { configureFormatter, fr, es, ar } from "@loydjs/error-engine";

configureFormatter("fr", fr);

const result = safeParse(UserSchema, badInput);
// result.issues[0].message -> "Minimum 2 caractères (reçu : 1)"
```

## AOT Vite plugin

Replace `compile()` calls with inline validators at build time. No runtime compilation.

```ts
// vite.config.ts
import { loydPlugin } from "@loydjs/vite";

export default {
  plugins: [
    loydPlugin({
      schemas: { UserSchema, PostSchema },
    }),
  ],
};
```

## OpenAPI / JSON Schema export

```ts
import { toOpenApi, toJsonSchema } from "@loydjs/openapi";

const spec = toOpenApi(UserSchema, { title: "User", version: "1.0.0" });
const jsonSchema = toJsonSchema(UserSchema);
```

## Migrate from Zod

```ts
import { fromZod, runCodemod } from "@loydjs/zod-compat";

const LoydUser = fromZod(zodUserSchema);

await runCodemod("./src", { write: true, verbose: true });
```

## Packages

- `@loydjs/core`: `parse`, `safeParse`, `LoydError`, `BaseSchema` (3.9 kb)
- `@loydjs/schema`: Primitives, composites, modifiers, refinements (tree-shakeable)
- `@loydjs/types`: `Infer<>`, `InferInput<>`, `InferOutput<>` (0 kb runtime)
- `@loydjs/compiler`: `compile()`, JIT codegen, rule fingerprinting (~4 kb)
- `@loydjs/runtime`: `createExecutor`, zeroCopy, freeze, strict mode (~2 kb)
- `@loydjs/async`: `parseAsync`, two-pass pipeline, `AbortSignal` (~2 kb)
- `@loydjs/error-engine`: `createFormatter`, en/fr/es/ar locales (~3 kb)
- `@loydjs/graph`: `buildDag`, `validateIncremental`, dirty tracking (~3 kb)
- `@loydjs/react`: `useForm`, `useField`, `useFieldArray`, `FormProvider` (~8 kb)
- `@loydjs/zod-compat`: `fromZod`, `toZod`, `runCodemod` (~5 kb)
- `@loydjs/openapi`: `toOpenApi`, `toJsonSchema` (~4 kb)
- `@loydjs/vite`: `loydPlugin()`, AOT compilation (~2 kb)

## Documentation

Full API reference, guides, and examples:

https://loyddev-psi.vercel.app/docs

## License

MIT