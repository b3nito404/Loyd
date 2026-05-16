<div align="center">

<h1>@loydjs/error-engine</h1>

<p><strong>Structured i18n error formatting for Loyd.</strong><br/>
Locale-aware messages · en / fr / es / ar · Runtime locale switching.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~3kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/error-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/error-engine?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/error-engine)

</div>

---

## Overview

Loyd validators emit structured `{ code, path, meta }` issues — never locale strings. `@loydjs/error-engine` sits on top and converts those structured issues into human-readable messages in any supported language.

Decoupling error codes from messages means you can swap languages at runtime without touching your schemas, and you can add custom codes without modifying the library.

---

## Installation

```sh
npm install @loydjs/error-engine
```

> **Requires** `@loydjs/core` · Node.js ≥ 20 · TypeScript ≥ 5.4

---

## API

### `configureFormatter(locale, messages)`

Call once at app startup. Sets the active locale globally.

```ts
import { configureFormatter, fr } from "@loydjs/error-engine";

configureFormatter("fr", fr);
```

### `formatIssues(issues, locale?)`

Formats an array of issues into human-readable messages.

```ts
import { formatIssues } from "@loydjs/error-engine";
import { safeParse } from "@loydjs/core";

const result = safeParse(UserSchema, badInput);

if (!result.success) {
  const messages = formatIssues(result.issues);
  // [
  //   { code: "ERR_STRING_INVALID_EMAIL", path: ["email"], message: "Invalid email address" },
  //   { code: "ERR_STRING_TOO_SHORT",     path: ["name"],  message: "Minimum 2 characters (received: 1)" }
  // ]
}
```

### Built-in locales

```ts
import { en, fr, es, ar } from "@loydjs/error-engine";

// English (default)
configureFormatter("en", en);
// result.issues[0].message → "Minimum 2 characters (received: 1)"

// French
configureFormatter("fr", fr);
// result.issues[0].message → "Minimum 2 caractères (reçu : 1)"

// Spanish
configureFormatter("es", es);
// result.issues[0].message → "Mínimo 2 caracteres (recibido: 1)"

// Arabic
configureFormatter("ar", ar);
// result.issues[0].message → "الحد الأدنى ٢ أحرف (تم استلام: ١)"
```

### Custom locale

```ts
import { createFormatter } from "@loydjs/error-engine";

const pt = createFormatter({
  ERR_STRING_INVALID_TYPE:  () => "Deve ser uma string",
  ERR_STRING_TOO_SHORT:     ({ min, actual }) => `Mínimo ${min} caracteres (recebido: ${actual})`,
  ERR_STRING_TOO_LONG:      ({ max, actual }) => `Máximo ${max} caracteres (recebido: ${actual})`,
  ERR_STRING_INVALID_EMAIL: () => "Endereço de e-mail inválido",
  ERR_NUMBER_INVALID_TYPE:  () => "Deve ser um número",
  ERR_NUMBER_TOO_SMALL:     ({ min, actual }) => `Mínimo ${min} (recebido: ${actual})`,
  // ... all codes
});

configureFormatter("pt", pt);
```

### Custom error codes

```ts
import { createFormatter, en } from "@loydjs/error-engine";

// Extend an existing locale with your own codes
const customEn = createFormatter({
  ...en,
  ERR_EMAIL_TAKEN:       () => "This email address is already in use",
  ERR_USERNAME_RESERVED: ({ username }) => `"${username}" is a reserved username`,
  ERR_AGE_UNDERAGE:      ({ min }) => `You must be at least ${min} years old`,
});

configureFormatter("en", customEn);
```

---

## Error codes reference

| Code | Meta fields | Default message (en) |
|:---|:---|:---|
| `ERR_STRING_INVALID_TYPE` | `received` | Must be a string |
| `ERR_STRING_TOO_SHORT` | `min`, `actual` | Minimum N characters |
| `ERR_STRING_TOO_LONG` | `max`, `actual` | Maximum N characters |
| `ERR_STRING_INVALID_EMAIL` | — | Invalid email address |
| `ERR_STRING_INVALID_URL` | — | Invalid URL |
| `ERR_STRING_INVALID_UUID` | — | Invalid UUID |
| `ERR_NUMBER_INVALID_TYPE` | `received` | Must be a number |
| `ERR_NUMBER_TOO_SMALL` | `min`, `actual` | Must be ≥ N |
| `ERR_NUMBER_TOO_LARGE` | `max`, `actual` | Must be ≤ N |
| `ERR_NUMBER_NOT_INTEGER` | `actual` | Must be an integer |
| `ERR_OBJECT_INVALID_TYPE` | `received` | Must be an object |
| `ERR_OBJECT_UNKNOWN_KEYS` | `keys` | Unknown keys: ... |
| `ERR_ARRAY_INVALID_TYPE` | `received` | Must be an array |
| `ERR_ARRAY_TOO_SHORT` | `min`, `actual` | Minimum N items |
| `ERR_ARRAY_TOO_LONG` | `max`, `actual` | Maximum N items |
| `ERR_UNION_NO_MATCH` | — | No variant matched |

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydIssue` type |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)