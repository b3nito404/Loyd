# Loyd

**TypeScript-first form validator** — La DX de Zod, la vitesse d'Ajv, le bundle de Valibot.

[![CI](https://github.com/your-org/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/loyd/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Packages

| Package | Version | Description |
|---|---|---|
| `@loyd/core` | — | Fondations zero-dépendance (types, parse, errors) |
| `@loyd/schema` | — | DSL fonctionnel tree-shakeable |
| `@loyd/types` | — | Inférence TypeScript avancée (zero runtime) |
| `@loyd/compiler` | — | Compilateur JIT + AOT |
| `@loyd/error-engine` | — | Codes d'erreur structurés + i18n (en/fr/es/ar) |
| `@loyd/async` | — | Pipeline de validation asynchrone deux-passes |
| `@loyd/runtime` | — | Exécution zero-copy (strict/strip/passthrough) |
| `@loyd/graph` | — | DAG inter-champs pour validation incrémentale |
| `@loyd/react` | — | Hooks React natifs (useForm, useField, useFieldArray) |
| `@loyd/zod-compat` | — | Interop Zod + codemod de migration |
| `@loyd/openapi` | — | Export vers JSONSchema7 et OpenAPI 3.1 |
| `@loyd/vite` | — | Plugin Vite/Rollup pour compilation AOT |

---

## Démarrage rapide

```bash
pnpm add @loyd/schema @loyd/core
```

```typescript
import { object, string, number, pipe, email, minLength } from "@loyd/schema";
import { parse } from "@loyd/core";
import type { Infer } from "@loyd/types";

const UserSchema = object({
  email: pipe(string(), email()),
  name:  pipe(string(), minLength(2)),
  age:   number(),
});

type User = Infer<typeof UserSchema>;

const result = parse(UserSchema, { email: "a@b.com", name: "Alice", age: 30 });
```

---

## Développement

```bash
# Installation
pnpm install

# Build tous les packages
pnpm build

# Tests
pnpm test

# Lint
pnpm lint

# Typecheck
pnpm typecheck
```

### Structure du monorepo

```
loyd/
├── packages/        # 12 packages @loyd/*
├── docs/            # Site Astro/Starlight
├── benchmarks/      # Benchmarks vs Zod, Ajv, Valibot
├── examples/        # Exemples Next.js, Express, tRPC
└── scripts/         # Outils internes
```

---

## Contribuer

Les contributions sont les bienvenues. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT — voir [LICENSE](LICENSE).
