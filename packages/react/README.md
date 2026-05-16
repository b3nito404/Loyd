<div align="center">

<h1>@loydjs/react</h1>

<p><strong>React form hooks for Loyd schemas.</strong><br/>
useForm · useField · useFieldArray · Zero external dependencies.</p>

[![CI](https://github.com/b3nito404/loyd/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nito404/loyd/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle](https://img.shields.io/badge/bundle-~8kb-brightgreen.svg)](https://bundlephobia.com/package/@loydjs/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org)
[![npm downloads](https://img.shields.io/npm/dm/@loydjs/react?color=6366f1&label=downloads)](https://www.npmjs.com/package/@loydjs/react)

</div>

---

## Overview

`@loydjs/react` brings Loyd's schema validation into React with a minimal, type-safe form API. It uses the field dependency DAG from `@loydjs/graph` to revalidate only the fields that need it, making it efficient for large, complex forms.

No external form libraries required. No `react-hook-form`, no `formik`. Just Loyd schemas and React hooks.

---

## Installation

```sh
npm install @loydjs/react @loydjs/graph
```

> **Requires** `@loydjs/core` · `@loydjs/schema` · `@loydjs/graph` · React ≥ 18 · TypeScript ≥ 5.4

---

## API

### `useForm(options)`

The main hook. Returns `register`, `handleSubmit`, `state`, `errors`, and `setValue`.

```tsx
import { useForm } from "@loydjs/react";
import { object, string, number } from "@loydjs/schema";
import type { Infer } from "@loydjs/types";

const SignupSchema = object({
  name:     string().minLength(2).maxLength(100),
  email:    string().email(),
  age:      number().int().min(18).max(120),
  password: string().minLength(8),
});

type Signup = Infer<typeof SignupSchema>;

function SignupForm() {
  const { register, handleSubmit, state, errors } = useForm<Signup>({
    schema: SignupSchema,
    defaultValues: { name: "", email: "", age: 18, password: "" },
    mode: "onChange", // "onBlur" | "onSubmit" | "onChange"
  });

  const onValid = (data: Signup) => console.log("Submitted:", data);
  const onInvalid = (issues) => console.log("Errors:", issues);

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <div>
        <input {...register("name")} placeholder="Name" />
        {errors.name && <p>{errors.name.message}</p>}
      </div>

      <div>
        <input {...register("email")} type="email" placeholder="Email" />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <div>
        <input {...register("age")} type="number" />
        {errors.age && <p>{errors.age.message}</p>}
      </div>

      <div>
        <input {...register("password")} type="password" placeholder="Password" />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={state.isSubmitting}>
        {state.isSubmitting ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
}
```

### `useField(name, form)`

Subscribes to a single field — re-renders only when that field changes.

```tsx
import { useField } from "@loydjs/react";

function EmailField({ form }) {
  const { value, error, onChange, onBlur } = useField("email", form);

  return (
    <div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        type="email"
      />
      {error && <span style={{ color: "red" }}>{error.message}</span>}
    </div>
  );
}
```

### `useFieldArray(name, form)`

Manages arrays of fields with `append`, `remove`, `move`, and `swap`.

```tsx
import { useFieldArray } from "@loydjs/react";

const OrderSchema = object({
  items: array(object({
    productId: number().int().min(1),
    quantity:  number().int().min(1),
  })),
});

function OrderForm() {
  const form = useForm({ schema: OrderSchema, defaultValues: { items: [] } });
  const { fields, append, remove } = useFieldArray("items", form);

  return (
    <form onSubmit={form.handleSubmit(onValid)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...form.register(`items.${index}.productId`)} type="number" />
          <input {...form.register(`items.${index}.quantity`)}  type="number" />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ productId: 0, quantity: 1 })}>
        Add item
      </button>
      <button type="submit">Place order</button>
    </form>
  );
}
```

### `FormProvider` + `useFormContext`

Share a form instance across a component tree without prop drilling.

```tsx
import { FormProvider, useFormContext } from "@loydjs/react";

function App() {
  const form = useForm({ schema: SignupSchema, defaultValues: { ... } });

  return (
    <FormProvider form={form}>
      <PersonalInfoSection />
      <AccountSection />
      <SubmitButton />
    </FormProvider>
  );
}

function SubmitButton() {
  const { state } = useFormContext();
  return <button disabled={state.isSubmitting}>Submit</button>;
}
```

---

## Form state

```ts
interface FormState {
  isSubmitting:  boolean;
  isValid:       boolean;
  isDirty:       boolean;
  submitCount:   number;
  touchedFields: Record<string, boolean>;
  dirtyFields:   Record<string, boolean>;
}
```

---

## Dependencies

| Package | Role |
|:---|:---|
| `@loydjs/core` | `LoydSchema`, `LoydIssue` types |
| `@loydjs/schema` | Schema definitions |
| `@loydjs/graph` | Field dependency DAG for incremental revalidation |

## Peer dependencies

| Package | Version |
|:---|:---|
| `react` | ≥ 18.0.0 |

---

## Documentation

**[loyddev-psi.vercel.app](https://loyddev-psi.vercel.app)**

---

## License

MIT © [b3nito404](https://github.com/b3nito404)