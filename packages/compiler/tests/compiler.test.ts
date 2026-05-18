import {
  clearCache,
  compile,
  generateCode,
  globalCache,
  invalidateCache,
  isCompiled,
  optimize,
} from "@loydjs/compiler";
import type { LoydSchema } from "@loydjs/core";
import {
  array,
  boolean,
  discriminatedUnion,
  literal,
  nullable,
  nullish,
  number,
  object,
  optional,
  string,
  union,
} from "@loydjs/schema";
import { beforeEach, describe, expect, it } from "vitest";

interface TestResult {
  success: boolean;
  data?: unknown;
  issues?: Array<{
    code: string;
    path: ReadonlyArray<string | number>;
    meta?: Record<string, unknown>;
  }>;
}

function c<T>(schema: LoydSchema<T>): (input: unknown) => TestResult {
  return compile(schema) as (input: unknown) => TestResult;
}

function ok(result: TestResult): unknown {
  expect(result.success).toBe(true);
  return result.data;
}

function fail(
  result: TestResult,
): Array<{ code: string; path: ReadonlyArray<string | number>; meta?: Record<string, unknown> }> {
  expect(result.success).toBe(false);
  return result.issues ?? [];
}

beforeEach(() => {
  clearCache();
});

describe("compile() - string", () => {
  it("passes a valid string", () => {
    const fn = c(string());
    expect(ok(fn("hello"))).toBe("hello");
  });

  it("fails on non-string", () => {
    const fn = c(string());
    const issues = fail(fn(42));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_TYPE");
    expect(issues[0].path).toEqual([]);
  });

  it("fails on null", () => {
    const fn = c(string());
    const issues = fail(fn(null));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_TYPE");
  });

  it("enforces minLength", () => {
    const fn = c(string().minLength(3));
    expect(ok(fn("abc"))).toBe("abc");
    const issues = fail(fn("ab"));
    expect(issues[0].code).toBe("ERR_STRING_TOO_SHORT");
    expect(issues[0].path).toEqual([]);
  });

  it("enforces maxLength", () => {
    const fn = c(string().maxLength(5));
    expect(ok(fn("hello"))).toBe("hello");
    const issues = fail(fn("toolong"));
    expect(issues[0].code).toBe("ERR_STRING_TOO_LONG");
  });

  it("enforces email", () => {
    const fn = c(string().email());
    expect(ok(fn("user@example.com"))).toBe("user@example.com");
    const issues = fail(fn("notanemail"));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_EMAIL");
  });

  it("enforces uuid", () => {
    const fn = c(string().uuid());
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(ok(fn(validUuid))).toBe(validUuid);
    const issues = fail(fn("not-a-uuid"));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_UUID");
  });

  it("enforces url", () => {
    const fn = c(string().url());
    expect(ok(fn("https://example.com"))).toBe("https://example.com");
    const issues = fail(fn("notaurl"));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_URL");
  });

  it("enforces nonempty", () => {
    const fn = c(string().nonempty());
    expect(ok(fn("a"))).toBe("a");
    const issues = fail(fn(""));
    expect(issues[0].code).toBe("ERR_STRING_TOO_SHORT");
  });

  it("applies trim transform", () => {
    const fn = c(string().trim());
    expect(ok(fn("  hello  "))).toBe("hello");
  });

  it("applies toLowerCase transform", () => {
    const fn = c(string().toLowerCase());
    expect(ok(fn("HELLO"))).toBe("hello");
  });

  it("applies toUpperCase transform", () => {
    const fn = c(string().toUpperCase());
    expect(ok(fn("hello"))).toBe("HELLO");
  });

  it("combines minLength + maxLength + email", () => {
    const fn = c(string().minLength(2).maxLength(50).email());
    expect(ok(fn("a@b.com"))).toBe("a@b.com");
    const issues1 = fail(fn("a"));
    expect(issues1[0].code).toBe("ERR_STRING_TOO_SHORT");
    const issues2 = fail(fn("notanemail"));
    expect(issues2[0].code).toBe("ERR_STRING_INVALID_EMAIL");
  });
});

describe("compile() - number", () => {
  it("passes a valid number", () => {
    const fn = c(number());
    expect(ok(fn(42))).toBe(42);
  });

  it("passes zero", () => {
    const fn = c(number());
    expect(ok(fn(0))).toBe(0);
  });

  it("passes negative number", () => {
    const fn = c(number());
    expect(ok(fn(-1))).toBe(-1);
  });

  it("fails on non-number", () => {
    const fn = c(number());
    const issues = fail(fn("42"));
    expect(issues[0].code).toBe("ERR_NUMBER_INVALID_TYPE");
  });

  it("fails on NaN", () => {
    const fn = c(number());
    const issues = fail(fn(Number.NaN));
    expect(issues[0].code).toBe("ERR_NUMBER_NAN");
  });

  it("enforces min", () => {
    const fn = c(number().min(0));
    expect(ok(fn(0))).toBe(0);
    expect(ok(fn(100))).toBe(100);
    const issues = fail(fn(-1));
    expect(issues[0].code).toBe("ERR_NUMBER_TOO_SMALL");
  });

  it("enforces max", () => {
    const fn = c(number().max(100));
    expect(ok(fn(100))).toBe(100);
    const issues = fail(fn(101));
    expect(issues[0].code).toBe("ERR_NUMBER_TOO_LARGE");
  });

  it("enforces int", () => {
    const fn = c(number().int());
    expect(ok(fn(42))).toBe(42);
    const issues = fail(fn(1.5));
    expect(issues[0].code).toBe("ERR_NUMBER_NOT_INTEGER");
  });

  it("enforces positive", () => {
    const fn = c(number().positive());
    expect(ok(fn(1))).toBe(1);
    const issues = fail(fn(0));
    expect(issues[0].code).toBe("ERR_NUMBER_TOO_SMALL");
  });

  it("enforces multipleOf", () => {
    const fn = c(number().multipleOf(5));
    expect(ok(fn(10))).toBe(10);
    expect(ok(fn(0))).toBe(0);
    const issues = fail(fn(7));
    expect(issues[0].code).toBe("ERR_NUMBER_NOT_MULTIPLE");
  });

  it("combines min + max + int", () => {
    const fn = c(number().min(0).max(120).int());
    expect(ok(fn(42))).toBe(42);
    expect(ok(fn(0))).toBe(0);
    expect(ok(fn(120))).toBe(120);
    const issues1 = fail(fn(1.5));
    expect(issues1[0].code).toBe("ERR_NUMBER_NOT_INTEGER");
    const issues2 = fail(fn(-1));
    expect(issues2[0].code).toBe("ERR_NUMBER_TOO_SMALL");
    const issues3 = fail(fn(200));
    expect(issues3[0].code).toBe("ERR_NUMBER_TOO_LARGE");
  });
});

describe("compile() - boolean", () => {
  it("passes true", () => {
    const fn = c(boolean());
    expect(ok(fn(true))).toBe(true);
  });

  it("passes false", () => {
    const fn = c(boolean());
    expect(ok(fn(false))).toBe(false);
  });

  it("fails on number", () => {
    const fn = c(boolean());
    const issues = fail(fn(1));
    expect(issues[0].code).toBe("ERR_BOOLEAN_INVALID_TYPE");
  });

  it("fails on string", () => {
    const fn = c(boolean());
    const issues = fail(fn("true"));
    expect(issues[0].code).toBe("ERR_BOOLEAN_INVALID_TYPE");
  });
});

//literal
describe("compile() — literal", () => {
  it("passes matching string literal", () => {
    const fn = c(literal("admin"));
    expect(ok(fn("admin"))).toBe("admin");
  });

  it("fails on non-matching string literal", () => {
    const fn = c(literal("admin"));
    const issues = fail(fn("user"));
    expect(issues[0].code).toBe("ERR_LITERAL_INVALID");
  });

  it("passes matching numeric literal", () => {
    const fn = c(literal(42));
    expect(ok(fn(42))).toBe(42);
  });

  it("fails on non-matching numeric literal", () => {
    const fn = c(literal(42));
    const issues = fail(fn(43));
    expect(issues[0].code).toBe("ERR_LITERAL_INVALID");
  });

  it("passes matching boolean literal", () => {
    const fn = c(literal(true));
    expect(ok(fn(true))).toBe(true);
    const issues = fail(fn(false));
    expect(issues[0].code).toBe("ERR_LITERAL_INVALID");
  });
});

describe("compile() - object", () => {
  const UserSchema = object({
    name: string().minLength(2),
    email: string().email(),
    age: number().int().min(0),
  });

  it("passes a valid object", () => {
    const fn = c(UserSchema);
    const result = ok(fn({ name: "Alice", email: "alice@example.com", age: 30 })) as Record<
      string,
      unknown
    >;
    expect(result.name).toBe("Alice");
    expect(result.email).toBe("alice@example.com");
    expect(result.age).toBe(30);
  });

  it("fails on non-object", () => {
    const fn = c(UserSchema);
    const issues = fail(fn("not an object"));
    expect(issues[0].code).toBe("ERR_OBJECT_INVALID_TYPE");
    expect(issues[0].path).toEqual([]);
  });

  it("fails on null", () => {
    const fn = c(UserSchema);
    const issues = fail(fn(null));
    expect(issues[0].code).toBe("ERR_OBJECT_INVALID_TYPE");
  });

  it("fails on array", () => {
    const fn = c(UserSchema);
    const issues = fail(fn([]));
    expect(issues[0].code).toBe("ERR_OBJECT_INVALID_TYPE");
  });

  it("reports field errors with correct paths", () => {
    const fn = c(UserSchema);
    const issues = fail(fn({ name: "A", email: "bad", age: -1 }));
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("ERR_STRING_TOO_SHORT");
    expect(codes).toContain("ERR_STRING_INVALID_EMAIL");
    expect(codes).toContain("ERR_NUMBER_TOO_SMALL");

    expect(issues.find((i) => i.code === "ERR_STRING_TOO_SHORT")?.path).toEqual(["name"]);
    expect(issues.find((i) => i.code === "ERR_STRING_INVALID_EMAIL")?.path).toEqual(["email"]);
    expect(issues.find((i) => i.code === "ERR_NUMBER_TOO_SMALL")?.path).toEqual(["age"]);
  });

  it("deep nested paths are correct", () => {
    const DeepSchema = object({
      profile: object({
        address: object({
          city: string().minLength(1),
        }),
      }),
    });
    const fn = c(DeepSchema);
    const issues = fail(fn({ profile: { address: { city: "" } } }));
    expect(issues[0].path).toEqual(["profile", "address", "city"]);
  });

  it("strips unknown keys by default", () => {
    const fn = c(UserSchema);
    const result = ok(
      fn({
        name: "Alice",
        email: "alice@example.com",
        age: 30,
        extra: "should be stripped",
      }),
    ) as Record<string, unknown>;
    expect(result.extra).toBe("should be stripped");
  });

  it("empty object schema passes any object", () => {
    const fn = c(object({}));
    expect(ok(fn({}))).toEqual({});
    expect(ok(fn({ anything: true }))).toBeDefined();
  });
});

describe("compile() - array", () => {
  it("passes a valid array of strings", () => {
    const fn = c(array(string()));
    expect(ok(fn(["a", "b", "c"]))).toEqual(["a", "b", "c"]);
  });

  it("passes an empty array", () => {
    const fn = c(array(string()));
    expect(ok(fn([]))).toEqual([]);
  });

  it("fails on non-array", () => {
    const fn = c(array(string()));
    const issues = fail(fn("not an array"));
    expect(issues[0].code).toBe("ERR_ARRAY_INVALID_TYPE");
  });

  it("validates each element with correct index in path", () => {
    const fn = c(array(number().int().min(0)));
    const issues = fail(fn([1, -1, 2, 1.5]));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.find((i) => i.code === "ERR_NUMBER_TOO_SMALL")?.path).toEqual([1]);
    expect(issues.find((i) => i.code === "ERR_NUMBER_NOT_INTEGER")?.path).toEqual([3]);
  });

  it("enforces min length", () => {
    const fn = c(array(string()).min(2));
    expect(ok(fn(["a", "b"]))).toBeDefined();
    const issues = fail(fn(["a"]));
    expect(issues[0].code).toBe("ERR_ARRAY_TOO_SHORT");
  });

  it("enforces max length", () => {
    const fn = c(array(string()).max(2));
    expect(ok(fn(["a", "b"]))).toBeDefined();
    const issues = fail(fn(["a", "b", "c"]));
    expect(issues[0].code).toBe("ERR_ARRAY_TOO_LONG");
  });

  it("validates array of objects", () => {
    const fn = c(array(object({ id: number().int().min(1), name: string() })));
    expect(
      ok(
        fn([
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ]),
      ),
    ).toBeDefined();
    const issues = fail(fn([{ id: 0, name: "Alice" }]));
    expect(issues[0].path).toEqual([0, "id"]);
  });
});

describe("compile() — optional", () => {
  it("passes undefined", () => {
    const fn = c(optional(string()));
    expect(ok(fn(undefined))).toBeUndefined();
  });

  it("passes a valid value", () => {
    const fn = c(optional(string().email()));
    expect(ok(fn("user@example.com"))).toBe("user@example.com");
  });

  it("fails on invalid value that is not undefined", () => {
    const fn = c(optional(string().email()));
    const issues = fail(fn("notanemail"));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_EMAIL");
  });

  it("works inside object - missing field is undefined", () => {
    const Schema = object({ name: string(), email: optional(string().email()) });
    const fn = c(Schema);
    const result = ok(fn({ name: "Alice" })) as Record<string, unknown>;
    expect(result.email).toBeUndefined();
  });

  it("works inside object - present field is validated", () => {
    const Schema = object({ name: string(), email: optional(string().email()) });
    const fn = c(Schema);
    const result = ok(fn({ name: "Alice", email: "a@b.com" })) as Record<string, unknown>;
    expect(result.email).toBe("a@b.com");
  });
});

//nullable /nullish
describe("compile() - nullable", () => {
  it("passes null", () => {
    const fn = c(nullable(string()));
    expect(ok(fn(null))).toBeNull();
  });

  it("passes valid string", () => {
    const fn = c(nullable(string()));
    expect(ok(fn("hello"))).toBe("hello");
  });

  it("fails on undefined", () => {
    const fn = c(nullable(string()));
    const issues = fail(fn(undefined));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_TYPE");
  });
});

describe("compile() — nullish", () => {
  it("passes null", () => {
    const fn = c(nullish(string()));
    expect(ok(fn(null))).toBeNull();
  });

  it("passes undefined", () => {
    const fn = c(nullish(string()));
    expect(ok(fn(undefined))).toBeUndefined();
  });

  it("passes valid string", () => {
    const fn = c(nullish(string()));
    expect(ok(fn("hello"))).toBe("hello");
  });

  it("fails on invalid value", () => {
    const fn = c(nullish(string().email()));
    const issues = fail(fn("notanemail"));
    expect(issues[0].code).toBe("ERR_STRING_INVALID_EMAIL");
  });
});

describe("compile() - union", () => {
  it("passes first matching variant", () => {
    const fn = c(union([string(), number()]));
    expect(ok(fn("hello"))).toBe("hello");
    expect(ok(fn(42))).toBe(42);
  });

  it("fails when no variant matches", () => {
    const fn = c(union([string(), number()]));
    const issues = fail(fn(true));
    expect(issues[0].code).toBe("ERR_UNION_NO_MATCH");
  });
});

describe("compile() - discriminatedUnion", () => {
  const Shape = discriminatedUnion("kind", [
    object({ kind: literal("circle"), radius: number().min(0) }),
    object({ kind: literal("rect"), width: number().min(0), height: number().min(0) }),
    object({ kind: literal("triangle"), base: number().min(0), height: number().min(0) }),
  ]);

  it("resolves circle variant", () => {
    const fn = c(Shape);
    const result = ok(fn({ kind: "circle", radius: 5 })) as Record<string, unknown>;
    expect(result.kind).toBe("circle");
    expect(result.radius).toBe(5);
  });

  it("resolves rect variant", () => {
    const fn = c(Shape);
    const result = ok(fn({ kind: "rect", width: 10, height: 20 })) as Record<string, unknown>;
    expect(result.kind).toBe("rect");
  });

  it("resolves last variant", () => {
    const fn = c(Shape);
    const result = ok(fn({ kind: "triangle", base: 3, height: 4 })) as Record<string, unknown>;
    expect(result.kind).toBe("triangle");
  });

  it("fails on unknown discriminator key", () => {
    const fn = c(Shape);
    const issues = fail(fn({ kind: "unknown", radius: 5 }));
    expect(issues[0].code).toBe("ERR_DISCRIMINATED_UNION_INVALID_KEY");
  });

  it("fails on invalid field inside matched variant", () => {
    const fn = c(Shape);
    const issues = fail(fn({ kind: "circle", radius: -1 }));
    expect(issues[0].code).toBe("ERR_NUMBER_TOO_SMALL");
  });

  it("fails on non-object input", () => {
    const fn = c(Shape);
    const issues = fail(fn("not an object"));
    expect(issues[0].code).toBe("ERR_OBJECT_INVALID_TYPE");
  });
});

describe("cache management", () => {
  it("caches compiled function per schema instance", () => {
    const schema = string();
    const fn1 = compile(schema);
    const fn2 = compile(schema);
    expect(fn1).toBe(fn2);
  });

  it("different schema instances produce different functions", () => {
    const fn1 = compile(string());
    const fn2 = compile(string());
    expect(fn1).not.toBe(fn2);
  });

  it("isCompiled returns false before compile()", () => {
    const schema = string();
    expect(isCompiled(schema)).toBe(false);
  });

  it("isCompiled returns true after compile()", () => {
    const schema = string();
    compile(schema);
    expect(isCompiled(schema)).toBe(true);
  });

  it("invalidateCache removes schema from cache", () => {
    const schema = string();
    compile(schema);
    expect(isCompiled(schema)).toBe(true);
    invalidateCache(schema);
    expect(isCompiled(schema)).toBe(false);
  });

  it("clearCache removes all schemas", () => {
    compile(string());
    compile(number());
    compile(boolean());
    expect(globalCache.size).toBe(3);
    clearCache();
    expect(globalCache.size).toBe(0);
  });

  it("recompiles after cache invalidation", () => {
    const schema = string();
    const fn1 = compile(schema);
    invalidateCache(schema);
    const fn2 = compile(schema);
    expect(fn1).not.toBe(fn2);
    expect(fn2("hello")).toMatchObject({ success: true });
  });
});

//optimize
describe("optimize()", () => {
  it("returns schema and appliedOptimizations", () => {
    const result = optimize(string().minLength(2));
    expect(result.schema).toBeDefined();
    expect(Array.isArray(result.appliedOptimizations)).toBe(true);
  });

  it("inlines string rules", () => {
    const { appliedOptimizations } = optimize(string().minLength(2).maxLength(100));
    expect(appliedOptimizations.some((o) => o.startsWith("string:inline"))).toBe(true);
  });

  it("inlines number rules", () => {
    const { appliedOptimizations } = optimize(number().min(0).max(120).int());
    expect(appliedOptimizations.some((o) => o.startsWith("number:inline"))).toBe(true);
  });

  it("inlines email rule", () => {
    const { appliedOptimizations } = optimize(string().email());
    expect(appliedOptimizations.some((o) => o.startsWith("string:inline"))).toBe(true);
  });

  it("precomputes object keys", () => {
    const { appliedOptimizations } = optimize(object({ name: string(), age: number() }));
    expect(appliedOptimizations.some((o) => o.startsWith("object:precompute"))).toBe(true);
  });

  it("detects discriminated union key", () => {
    const { appliedOptimizations } = optimize(
      union([
        object({ kind: literal("a"), value: string() }),
        object({ kind: literal("b"), value: number() }),
      ]),
    );
    expect(appliedOptimizations.some((o) => o.startsWith("union:discriminate"))).toBe(true);
  });

  it("optimizes nested schemas recursively", () => {
    const { appliedOptimizations } = optimize(
      object({
        profile: object({
          name: string().minLength(2),
          email: string().email(),
        }),
      }),
    );
    const inlined = appliedOptimizations.filter((o) => o.startsWith("string:inline"));
    expect(inlined.length).toBeGreaterThanOrEqual(2);
  });

  it("optimizes array element schema", () => {
    const { appliedOptimizations } = optimize(array(string().minLength(1)));
    expect(appliedOptimizations.some((o) => o.startsWith("string:inline"))).toBe(true);
  });
});

describe("generateCode()", () => {
  it("returns code, fnName, and schemaRefs", () => {
    const result = generateCode(string());
    expect(typeof result.code).toBe("string");
    expect(typeof result.fnName).toBe("string");
    expect(result.code.length).toBeGreaterThan(0);
    expect(result.fnName.startsWith("__loyd_v")).toBe(true);
  });

  it("generated code contains use strict", () => {
    const { code } = generateCode(string());
    expect(code).toContain('"use strict"');
  });

  it("generated code is valid executable JS", () => {
    const { code, fnName, schemaRefs } = generateCode(string().minLength(2));
    const fn = new Function("__schemas__", `${code}\nreturn ${fnName};`)(schemaRefs) as (
      input: unknown,
    ) => TestResult;
    expect(fn("hello").success).toBe(true);
    expect(fn("a").success).toBe(false);
  });

  it("generated object code validates correctly", () => {
    const schema = object({ name: string(), age: number() });
    const { schema: optimized } = optimize(schema);
    const { code, fnName, schemaRefs } = generateCode(optimized);
    schemaRefs.__schema_ref__ = optimized;
    const fn = new Function("__schemas__", `${code}\nreturn ${fnName};`)(schemaRefs) as (
      input: unknown,
    ) => TestResult;
    expect(fn({ name: "Alice", age: 30 }).success).toBe(true);
    expect(fn({ name: "A", age: "bad" }).success).toBe(false);
  });

  it("static path literals are emitted for nested fields", () => {
    const { code } = generateCode(object({ profile: object({ name: string().minLength(2) }) }));
    expect(code).toContain('["profile","name"]');
  });

  it("generates unique fnName on each call", () => {
    const { fnName: fn1 } = generateCode(string());
    const { fnName: fn2 } = generateCode(string());
    expect(fn1).not.toBe(fn2);
  });

  it("custom fnName option is respected", () => {
    const { fnName } = generateCode(string(), { fnName: "myValidator" });
    expect(fnName).toBe("myValidator");
  });
});

//edge case
describe("edge cases", () => {
  it("array of literals validates correctly", () => {
    const fn = c(array(literal("admin")));
    expect(ok(fn(["admin", "admin"]))).toEqual(["admin", "admin"]);
    const issues = fail(fn(["admin", "user"]));
    expect(issues[0].code).toBe("ERR_LITERAL_INVALID");
    expect(issues[0].path).toEqual([1]);
  });

  it("object with nullable field", () => {
    const fn = c(object({ name: nullable(string()) }));
    const r1 = ok(fn({ name: null })) as Record<string, unknown>;
    expect(r1.name).toBeNull();
    const r2 = ok(fn({ name: "Alice" })) as Record<string, unknown>;
    expect(r2.name).toBe("Alice");
  });

  it("deeply nested optional fields", () => {
    const fn = c(
      object({
        settings: optional(object({ theme: optional(string()) })),
      }),
    );
    expect(ok(fn({}))).toBeDefined();
    expect(ok(fn({ settings: {} }))).toBeDefined();
    expect(ok(fn({ settings: { theme: "dark" } }))).toBeDefined();
  });

  it("compiled result matches safeParse result", () => {
    const schema = object({
      name: string().minLength(2),
      email: string().email(),
      age: number().int().min(0),
    });
    const compiled = compile(schema);
    const input = { name: "Alice", email: "alice@example.com", age: 30 };

    const r1 = compiled(input);
    const r2 = schema.safeParse(input);

    expect(r1.success).toBe(r2.success);
    expect(r1.data).toEqual(r2.data);
  });

  it("compiled invalid result matches safeParse issues codes", () => {
    const schema = object({ name: string().minLength(2), age: number().int() });
    const compiled = compile(schema);
    const input = { name: "A", age: 1.5 };

    const r1 = compiled(input) as TestResult;
    const r2 = schema.safeParse(input);

    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
    const codes1 = r1.issues?.map((i) => i.code).sort();
    const codes2 = r2.issues?.map((i) => i.code).sort();
    expect(codes1).toEqual(codes2);
  });

  it("large object with many fields", () => {
    const schema = object({
      f1: string(),
      f2: number(),
      f3: boolean(),
      f4: string(),
      f5: number(),
      f6: boolean(),
      f7: string(),
      f8: number(),
      f9: boolean(),
      f10: string(),
    });
    const fn = c(schema);
    const valid = {
      f1: "a",
      f2: 1,
      f3: true,
      f4: "b",
      f5: 2,
      f6: false,
      f7: "c",
      f8: 3,
      f9: true,
      f10: "d",
    };
    expect(ok(fn(valid))).toEqual(valid);
  });
});
