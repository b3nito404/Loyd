import { describe, it, expect } from "vitest";
import {
  optional, nullable, nullish, withDefault, transform,
  pipe, lazy, brand,
  refine, refineWithIssues, defineRule,
  string, number, object, array,
} from "../src/index.js";
import type { LoydSchema } from "@loyd/core";

//optional()

describe("optional()", () => {
  it("accepts undefined", () => {
    const r = optional(string()).safeParse(undefined);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBeUndefined();
  });
  it("accepts valid inner values", () => {
    const r = optional(string()).safeParse("hello");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("hello");
  });
  it("still rejects invalid inner values", () => {
    expect(optional(string()).safeParse(42).success).toBe(false);
  });
  it("unwrap() returns the inner schema", () => {
    const inner = string();
    const schema = optional(inner);
    expect(schema.unwrap()).toBe(inner);
  });
});

//nullable()

describe("nullable()", () => {
  it("accepts null", () => {
    const r = nullable(string()).safeParse(null);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBeNull();
  });
  it("accepts valid inner values", () => {
    expect(nullable(string()).safeParse("hello").success).toBe(true);
  });
  it("rejects undefined (unlike nullish)", () => {
    expect(nullable(string()).safeParse(undefined).success).toBe(false);
  });
  it("still rejects invalid inner values", () => {
    expect(nullable(string()).safeParse(42).success).toBe(false);
  });
});


describe("nullish()", () => {
  it("accepts null", () => {
    expect(nullish(string()).safeParse(null).success).toBe(true);
  });
  it("accepts undefined", () => {
    expect(nullish(string()).safeParse(undefined).success).toBe(true);
  });
  it("accepts valid inner values", () => {
    expect(nullish(string()).safeParse("hello").success).toBe(true);
  });
  it("rejects invalid inner values", () => {
    expect(nullish(string()).safeParse(42).success).toBe(false);
  });
});

// withD()

describe("withDefault()", () => {
  it("uses default when input is undefined", () => {
    const r = withDefault(optional(string()), "default").safeParse(undefined);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("default");
  });
  it("uses the provided value when not undefined", () => {
    const r = withDefault(optional(string()), "default").safeParse("hello");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("hello");
  });
  it("accepts a factory function as default", () => {
    const r = withDefault(optional(number()), () => 42).safeParse(undefined);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe(42);
  });
});

//transform

describe("transform()", () => {
  it("applies transformation on success", () => {
    const DateSchema = transform(string(), (s) => new Date(s));
    const r = DateSchema.safeParse("2024-01-01");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBeInstanceOf(Date);
  });
  it("does not apply transformation on failure", () => {
    const fn = transform(number(), (n) => n * 2);
    expect(fn.safeParse("not a number").success).toBe(false);
  });
  it("transform to number", () => {
    const r = transform(string(), (s) => s.length).safeParse("hello");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe(5);
  });
});

describe("pipe()", () => {
  it("runs schemas in sequence", () => {
    const Schema = pipe(string(), string().minLength(3), string().email());
    expect(Schema.safeParse("a@b.com").success).toBe(true);
    expect(Schema.safeParse("ab").success).toBe(false);
  });
  it("stops at first failure", () => {
    const Schema = pipe(string(), string().minLength(10), string().email());
    const r = Schema.safeParse("ab");
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues).toHaveLength(1);
      expect(r.issues[0]?.code).toBe("ERR_STRING_TOO_SHORT");
    }
  });
  it("passes value through each schema", () => {
    const Schema = pipe(string(), string().trim(), string().toLowerCase());
    const r = Schema.safeParse("  HELLO  ");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("hello");
  });
});

describe("lazy()", () => {
  it("resolves the schema on first use", () => {
    const Schema = lazy(() => string());
    expect(Schema.safeParse("hello").success).toBe(true);
    expect(Schema.safeParse(42).success).toBe(false);
  });

  it("supports recursive schemas", () => {
    interface TreeNode { value: number; children?: TreeNode[] }
    const TreeSchema: LoydSchema<TreeNode> = object({
      value: number(),
      children: optional(array(lazy(() => TreeSchema))),
    });
    expect(TreeSchema.safeParse({ value: 1 }).success).toBe(true);
    expect(TreeSchema.safeParse({ value: 1, children: [{ value: 2 }] }).success).toBe(true);
    expect(TreeSchema.safeParse({ value: "bad" }).success).toBe(false);
    expect(
      TreeSchema.safeParse({ value: 1, children: [{ value: "bad" }] }).success
    ).toBe(false);
  });
});

//brand()

describe("brand()", () => {
  it("returns a branded type on success", () => {
    const EmailSchema = brand(string().email(), "Email");
    const r = EmailSchema.safeParse("user@example.com");
    expect(r.success).toBe(true);
    if (r.success) expect(typeof r.data).toBe("string");
  });
  it("still validates the inner schema", () => {
    const EmailSchema = brand(string().email(), "Email");
    expect(EmailSchema.safeParse("not-an-email").success).toBe(false);
    expect(EmailSchema.safeParse(42).success).toBe(false);
  });
  it("exposes brandName", () => {
    const schema = brand(string(), "UserId");
    expect(schema.brandName).toBe("UserId");
    expect(schema._type).toBe("brand");
  });
  it("unwrap() returns inner schema", () => {
    const inner = string().email();
    const schema = brand(inner, "Email");
    expect(schema.unwrap()).toBe(inner);
  });
});

//refine()

describe("refine()", () => {
  it("passes when predicate returns true", () => {
    const EvenSchema = refine(number(), (n) => n % 2 === 0, { code: "ERR_NOT_EVEN" });
    expect(EvenSchema.safeParse(4).success).toBe(true);
  });
  it("fails when predicate returns false", () => {
    const EvenSchema = refine(number(), (n) => n % 2 === 0, {
      code: "ERR_NOT_EVEN",
      message: "Must be even",
    });
    const r = EvenSchema.safeParse(3);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0]?.code).toBe("ERR_NOT_EVEN");
      expect(r.issues[0]?.message).toBe("Must be even");
    }
  });
  it("does not run refinement when base validation fails", () => {
    let called = false;
    const Schema = refine(string(), () => { called = true; return true; }, { code: "ERR_X" });
    Schema.safeParse(42);
    expect(called).toBe(false);
  });
});

//refineWithIssues()

describe("refineWithIssues()", () => {
  it("passes when fn returns null", () => {
    const Schema = refineWithIssues(string(), () => null);
    expect(Schema.safeParse("hello").success).toBe(true);
  });
  it("fails with all returned issues", () => {
    const Schema = refineWithIssues(string(), (s) => {
      const issues = [];
      if (s.length < 3) issues.push({ code: "ERR_TOO_SHORT", path: [] });
      if (!s.includes("@")) issues.push({ code: "ERR_NO_AT", path: [] });
      return issues;
    });
    const r = Schema.safeParse("ab");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues.length).toBe(2);
  });
});

//defineRule()

describe("defineRule()", () => {
  const evenRule = defineRule<number>(
    { code: "ERR_NOT_EVEN", description: "Must be an even number" },
    (n) => n % 2 === 0
  );

  it("apply() returns a schema that validates with the rule", () => {
    const Schema = evenRule.apply(number());
    expect(Schema.safeParse(4).success).toBe(true);
    expect(Schema.safeParse(3).success).toBe(false);
  });

  it("exposes the rule definition", () => {
    expect(evenRule.definition.code).toBe("ERR_NOT_EVEN");
    expect(evenRule.definition.description).toBe("Must be an even number");
  });

  it("can be reused across schemas", () => {
    const Schema1 = evenRule.apply(number().min(0));
    const Schema2 = evenRule.apply(number().max(100));
    expect(Schema1.safeParse(4).success).toBe(true);
    expect(Schema2.safeParse(4).success).toBe(true);
    expect(Schema1.safeParse(3).success).toBe(false);
    expect(Schema2.safeParse(3).success).toBe(false);
  });
});