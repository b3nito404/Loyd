# Contributing to Loyd

Thank you for taking the time to contribute. This document covers everything you need to get started - from setting up the repo to opening a pull request.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Making changes](#making-changes)
- [Tests](#tests)
- [Benchmarks](#benchmarks)
- [Commit conventions](#commit-conventions)
- [Pull requests](#pull-requests)
- [Release process](#release-process)

---

## Code of conduct

Be respectful. Critique code, not people. We welcome contributors of all experience levels.

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- TypeScript ≥ 5.4

### Setup

```sh
# Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/Loyd.git
cd Loyd

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to confirm everything works
pnpm test
```

---

## Project structure

```
packages/
├── core/          # BaseSchema, parse, safeParse, LoydError - no deps
├── schema/        # All schema types (string, number, object, array, ...)
├── types/         # Type-only utilities: Infer<>, InferInput<>, InferOutput<>
├── compiler/      # JIT compiler: compile(), optimize(), generateCode()
├── runtime/       # Zero-copy executor: createExecutor(), deepFreeze()
├── async/         # Two-pass async pipeline: parseAsync()
├── error-engine/  # i18n error formatting: configureFormatter(), locales
├── graph/         # Field dependency DAG: buildDag(), validateIncremental()
├── react/         # React hooks: useForm(), useField(), useFieldArray()
├── zod-compat/    # Zod migration: fromZod(), toZod(), runCodemod()
├── openapi/       # OpenAPI export: toOpenApi(), toJsonSchema()
└── vite/          # AOT Vite plugin: loydPlugin()
```

Each package is fully independent with its own `package.json`, `tsconfig.json`, `tsup.config.ts`, and `vitest.config.ts`.

**Dependency order** (never import a package that depends on you):

```
core -> schema -> compiler -> runtime
                           -> vite
     -> types
     -> async
     -> error-engine
     -> graph -> react
     -> zod-compat
     -> openapi
```

---

## Development workflow

### Build

```sh
# Build all packages (respects dependency order via Turbo)
pnpm build

# Build a single package
pnpm build --filter @loydjs/compiler

# Watch mode for a single package
pnpm --filter @loydjs/compiler dev
```

### Lint & format

We use [Biome](https://biomejs.dev/) for both linting and formatting.

```sh
# Check (CI mode - no writes)
pnpm biome ci .

# Fix all auto-fixable issues
pnpm biome check --write .

# Fix including unsafe fixes (template literals, etc.)
pnpm biome check --fix --unsafe .
```

### TypeScript

```sh
# Type-check all packages
pnpm typecheck

# Type-check a single package
pnpm --filter @loydjs/compiler typecheck
```

---

## Making changes

### Adding a new schema type

1. Create your schema class in `packages/schema/src/` - extend `BaseSchema` from `@loydjs/core`.
2. Export it from `packages/schema/src/index.ts`.
3. If the type can be JIT-compiled, add a `gen*` function in `packages/compiler/src/jit/codegen.ts` and register it in the `gen()` dispatch.
4. Add optimizer support in `packages/compiler/src/jit/optimizer.ts` if the type has fingerprint-able rules.
5. Add tests in `packages/schema/tests/` and `packages/compiler/tests/`.

### Adding a new string/number rule

1. Add the method to the schema class in `packages/schema/src/primitives/`.
2. Add fingerprint detection in `packages/compiler/src/jit/optimizer.ts` - add sentinels if needed.
3. Add codegen in `emitStringInlinedRule()` or `emitNumberInlinedRule()` in `codegen.ts`.
4. Add the new `InlinedRule` kind to the union type in `optimizer.ts`.
5. Test both the runtime behavior and the compiled behavior.

### Modifying the codegen

The JIT compiler (`packages/compiler/src/jit/`) is the most performance-critical code in the project. When modifying it:

- Always run the full test suite after changes: `pnpm --filter @loydjs/compiler test`
- Run benchmarks before and after to check for regressions: `pnpm --filter @loydjs/compiler exec vitest bench`
- Use `generateCode(schema, { mode: "development" })` to inspect generated code during development
- Never emit TypeScript syntax in generated code - it must be valid JS

---

## Tests

```sh
# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter @loydjs/compiler test

# Watch mode
pnpm --filter @loydjs/compiler test:watch

# With coverage
pnpm --filter @loydjs/compiler test --coverage
```

### Writing tests

- Tests live in `packages/*/tests/`
- Use `vitest` - `describe`, `it`, `expect`
- Test both the happy path and all error codes
- For compiler tests, always verify generated paths match expected `["field", "nested"]` literals
- Do not mock internal functions — test the public API

### Test naming

```ts
describe("compile() - string", () => {
  it("enforces minLength", () => { ... });
  it("fails on non-string", () => { ... });
});
```

---

## Benchmarks

Benchmarks live in `packages/compiler/tests/bench.bench.ts`.

```sh
# Run benchmarks
pnpm --filter @loydjs/compiler exec vitest bench --reporter=verbose

# Generate the SVG chart
npx tsx packages/compiler/bench/generate-bench-svg.ts
```

**Rules for benchmark contributions:**

- Never add a benchmark that makes Loyd look faster by using an unfair comparison (e.g. uncached AJV vs cached Loyd)
- All competitors must be initialized the same way - warm caches, same input data
- If you add a new scenario, add all four libraries (Loyd compiled, AJV, Valibot, Zod)

---

## Commit conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

**Types:**

| Type | When to use |
|:---|:---|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `chore` | Build, config, tooling |
| `refactor` | Refactoring without behavior change |

**Scopes** match package names: `compiler`, `schema`, `runtime`, `core`, `react`, `vite`, etc.

**Examples:**

```
feat(schema): add string().cuid() validator
fix(compiler): fix nullable path generation for nullish schemas
perf(compiler): skip write-back for fields without side effects
docs(react): add useFieldArray example to README
test(compiler): add edge case tests for nested optional objects
```

---

## Pull requests

1. **Fork** the repo and create a branch from `main`.
2. **Name your branch** descriptively: `feat/schema-cuid`, `fix/compiler-nullable-path`, `perf/object-early-exit`.
3. **Make your changes** - keep commits focused and atomic.
4. **Run the full check** before pushing:
   ```sh
   pnpm build && pnpm test && pnpm biome ci .
   ```
5. **Open the PR** against `main`. Fill in the template:
   - What does this change do?
   - How was it tested?
   - Any breaking changes?
   - Benchmark results if performance-related.
6. **Wait for CI** - all jobs (lint, typecheck, tests on Node 20 + 22) must pass.

### PR size

Keep PRs focused. A PR that adds a new schema type, rewrites the codegen, and updates the docs is hard to review. Split it into smaller PRs if possible.

### Breaking changes

If your change modifies a public API, adds a required parameter, or changes error codes — it's a breaking change. Breaking changes require:

- A `BREAKING CHANGE:` footer in the commit message
- A version bump to the next major (`2.0.0`)
- Documentation of the migration path

---

## Release process

Releases are managed with [Changesets](https://github.com/changesets/changesets).

### Adding a changeset

When your PR is ready, add a changeset describing the change:

```sh
pnpm changeset
```

Select the packages affected, the bump type (`patch` / `minor` / `major`), and write a short description. Commit the generated file in `.changeset/`.

### Bump types

| Change | Bump |
|:---|:---|
| Bug fix, docs, chore | `patch` -> `1.0.1` |
| New feature, new API | `minor` -> `1.1.0` |
| Breaking API change | `major` -> `2.0.0` |

### Publishing

Maintainers merge the Version PR created by the Changesets bot, which bumps all package versions and updates changelogs. Publishing to npm is then triggered manually.

---

## Questions

Open a [GitHub Discussion](https://github.com/b3nito404/Loyd/discussions) for questions, ideas, or design proposals. Use [Issues](https://github.com/b3nito404/Loyd/issues) for bugs only.