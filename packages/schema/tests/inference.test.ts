import { describe, it, expectTypeOf } from "vitest";
import {
  string, number, boolean, literal,
  object, array, tuple, union,
  optional, nullable, nullish, withDefault, transform,
  pipe, brand,
} from "../src/index.js";
import type { Infer, InferInput, InferOutput } from "@loyd/types";

describe("TypeScript inference Infer<>", () => {
  it("string() -> string", () => {
    type T = Infer<typeof string>;
    const schema = string();
    const r = schema.safeParse("hello");
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string>();
  });

  it("number() -> number", () => {
    const schema = number();
    const r = schema.safeParse(42);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<number>();
  });

  it("boolean() -> boolean", () => {
    const schema = boolean();
    const r = schema.safeParse(true);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<boolean>();
  });

  it("literal('admin') -> 'admin'", () => {
    const schema = literal("admin");
    const r = schema.safeParse("admin");
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<"admin">();
  });

  it("object() -> infers shape correctly", () => {
    const schema = object({ name: string(), age: number() });
    const r = schema.safeParse({ name: "Alice", age: 30 });
    if (r.success) {
      expectTypeOf(r.data.name).toEqualTypeOf<string>();
      expectTypeOf(r.data.age).toEqualTypeOf<number>();
    }
  });

  it("array(string()) -> string[]", () => {
    const schema = array(string());
    const r = schema.safeParse(["a", "b"]);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string[]>();
  });

  it("tuple([string(), number()]) -> [string, number]", () => {
    const schema = tuple([string(), number()] as const);
    const r = schema.safeParse(["hello", 42]);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<[string, number]>();
  });

  it("union([string(), number()]) -> string | number", () => {
    const schema = union([string(), number()]);
    const r = schema.safeParse("hello");
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string | number>();
  });

  it("optional(string()) -> string | undefined", () => {
    const schema = optional(string());
    const r = schema.safeParse(undefined);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string | undefined>();
  });

  it("nullable(string()) -> string | null", () => {
    const schema = nullable(string());
    const r = schema.safeParse(null);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string | null>();
  });

  it("nullish(string()) -> string | null | undefined", () => {
    const schema = nullish(string());
    const r = schema.safeParse(null);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string | null | undefined>();
  });

  it("withDefault(optional(string()), 'x') -> string", () => {
    const schema = withDefault(optional(string()), "x");
    const r = schema.safeParse(undefined);
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<string>();
  });
});

describe("TypeScript inference transform", () => {
  it("InferInput and InferOutput differ after transform", () => {
    const schema = transform(string(), (s) => s.length);
    type Input = InferInput<typeof schema>;
    type Output = InferOutput<typeof schema>;
    expectTypeOf<Input>().toEqualTypeOf<string>();
    expectTypeOf<Output>().toEqualTypeOf<number>();
  });

  it("transform result has the correct output type", () => {
    const schema = transform(string(), (s) => new Date(s));
    const r = schema.safeParse("2024-01-01");
    if (r.success) expectTypeOf(r.data).toEqualTypeOf<Date>();
  });
});

describe("TypeScript inference — brand", () => {
  it("brand produces a branded type", () => {
    const EmailSchema = brand(string(), "Email");
    const r = EmailSchema.safeParse("user@example.com");
    if (r.success) {
      expectTypeOf(r.data).toMatchTypeOf<string>();
    }
  });
});

describe("TypeScript inference — nested objects", () => {
  it("deeply nested object types are correct", () => {
    const Schema = object({
      user: object({
        name: string(),
        address: object({
          city: string(),
          zip: number(),
        }),
      }),
    });

    const r = Schema.safeParse({
      user: { name: "Alice", address: { city: "Paris", zip: 75001 } },
    });

    if (r.success) {
      expectTypeOf(r.data.user.name).toEqualTypeOf<string>();
      expectTypeOf(r.data.user.address.city).toEqualTypeOf<string>();
      expectTypeOf(r.data.user.address.zip).toEqualTypeOf<number>();
    }
  });
});

describe("TypeScript inference  Infer<> helper", () => {
  it("Infer<> extracts the output type", () => {
    const UserSchema = object({ name: string(), age: number() });
    type User = Infer<typeof UserSchema>;

    const user: User = { name: "Alice", age: 30 };

    expectTypeOf(user.name).toEqualTypeOf<string>();
    expectTypeOf(user.age).toEqualTypeOf<number>();
  });
});