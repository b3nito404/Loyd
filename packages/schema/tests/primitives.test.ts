// packages/schema/tests/primitives.test.ts
import { describe, expect, it } from "vitest";
import { bigint, boolean, date, literal, number, string } from "../src/index.js";

describe("string()", () => {
  it("accepts a valid string", () => {
    const r = string().safeParse("hello");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("hello");
  });
  it("rejects non-string types", () => {
    for (const val of [42, true, null, undefined, {}, []]) {
      const r = string().safeParse(val);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.code).toBe("ERR_STRING_INVALID_TYPE");
    }
  });
  it("parseOrThrow returns value on success", () => {
    expect(string().parseOrThrow("hello")).toBe("hello");
  });
  it("parseOrThrow throws on failure", () => {
    expect(() => string().parseOrThrow(42)).toThrow();
  });

  describe("minLength()", () => {
    it("passes when length >= min", () => {
      expect(string().minLength(3).safeParse("abc").success).toBe(true);
    });
    it("fails when length < min with correct meta", () => {
      const r = string().minLength(5).safeParse("abc");
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.issues[0]?.code).toBe("ERR_STRING_TOO_SHORT");
        expect(r.issues[0]?.meta).toEqual({ min: 5, actual: 3 });
      }
    });
    it("uses custom message", () => {
      const r = string().minLength(5, "Too short!").safeParse("ab");
      if (!r.success) expect(r.issues[0]?.message).toBe("Too short!");
    });
  });

  describe("maxLength()", () => {
    it("passes when length <= max", () => {
      expect(string().maxLength(5).safeParse("abc").success).toBe(true);
    });
    it("fails when length > max with correct meta", () => {
      const r = string().maxLength(3).safeParse("abcd");
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.issues[0]?.code).toBe("ERR_STRING_TOO_LONG");
        expect(r.issues[0]?.meta).toEqual({ max: 3, actual: 4 });
      }
    });
  });

  describe("email()", () => {
    it("accepts valid emails", () => {
      for (const email of ["user@example.com", "a@b.co", "test+tag@domain.org"]) {
        expect(string().email().safeParse(email).success).toBe(true);
      }
    });
    it("rejects invalid emails", () => {
      for (const email of ["notanemail", "@no-user.com", "no-at-sign", ""]) {
        const r = string().email().safeParse(email);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.issues[0]?.code).toBe("ERR_STRING_INVALID_EMAIL");
      }
    });
  });

  describe("url()", () => {
    it("accepts valid URLs", () => {
      expect(string().url().safeParse("https://example.com").success).toBe(true);
    });
    it("rejects invalid URLs", () => {
      const r = string().url().safeParse("not-a-url");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.code).toBe("ERR_STRING_INVALID_URL");
    });
  });

  describe("uuid()", () => {
    it("accepts valid UUIDs", () => {
      expect(string().uuid().safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
    });
    it("rejects invalid UUIDs", () => {
      expect(string().uuid().safeParse("not-a-uuid").success).toBe(false);
    });
  });

  describe("regex()", () => {
    it("accepts matching strings", () => {
      expect(string().regex(/^\d+$/).safeParse("12345").success).toBe(true);
    });
    it("rejects non-matching strings", () => {
      expect(string().regex(/^\d+$/).safeParse("abc").success).toBe(false);
    });
  });

  describe("nonempty()", () => {
    it("rejects empty string", () => {
      expect(string().nonempty().safeParse("").success).toBe(false);
    });
    it("accepts non-empty string", () => {
      expect(string().nonempty().safeParse("a").success).toBe(true);
    });
  });

  describe("trim()", () => {
    it("trims whitespace before validation", () => {
      const r = string().trim().safeParse("  hello  ");
      expect(r.success).toBe(true);
      if (r.success) expect(r.data).toBe("hello");
    });
    it("trim + minLength validates after trimming", () => {
      expect(string().trim().minLength(3).safeParse("  a  ").success).toBe(false);
    });
  });

  describe("toLowerCase() / toUpperCase()", () => {
    it("lowercases the string", () => {
      const r = string().toLowerCase().safeParse("HELLO");
      if (r.success) expect(r.data).toBe("hello");
    });
    it("uppercases the string", () => {
      const r = string().toUpperCase().safeParse("hello");
      if (r.success) expect(r.data).toBe("HELLO");
    });
  });

  describe("startsWith() / endsWith() / includes()", () => {
    it("startsWith works", () => {
      expect(string().startsWith("http").safeParse("https://x.com").success).toBe(true);
      expect(string().startsWith("http").safeParse("ftp://x.com").success).toBe(false);
    });
    it("endsWith works", () => {
      expect(string().endsWith(".ts").safeParse("index.ts").success).toBe(true);
      expect(string().endsWith(".ts").safeParse("index.js").success).toBe(false);
    });
    it("includes works", () => {
      expect(string().includes("world").safeParse("hello world").success).toBe(true);
      expect(string().includes("world").safeParse("hello").success).toBe(false);
    });
  });

  describe("chaining", () => {
    it("stops at first failing rule", () => {
      const r = string().minLength(5).email().safeParse("ab");
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.issues).toHaveLength(1);
        expect(r.issues[0]?.code).toBe("ERR_STRING_TOO_SHORT");
      }
    });
  });

  describe("immutability", () => {
    it("each method returns a new instance", () => {
      const base = string();
      const withMin = base.minLength(3);
      expect(base.safeParse("a").success).toBe(true);
      expect(withMin.safeParse("a").success).toBe(false);
    });
  });

  describe("describe()", () => {
    it("attaches description to meta", () => {
      const schema = string().describe("User email");
      expect(schema.meta().description).toBe("User email");
    });
  });
});

describe("number()", () => {
  it("accepts valid numbers", () => {
    expect(number().safeParse(42).success).toBe(true);
    expect(number().safeParse(0).success).toBe(true);
    expect(number().safeParse(-3.14).success).toBe(true);
  });
  it("rejects NaN", () => {
    const r = number().safeParse(Number.NaN);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues[0]?.code).toBe("ERR_NUMBER_NAN");
  });
  it("rejects non-numbers", () => {
    for (const val of ["42", true, null, undefined, {}]) {
      expect(number().safeParse(val).success).toBe(false);
    }
  });

  describe("min() / max()", () => {
    it("min inclusive", () => {
      expect(number().min(5).safeParse(5).success).toBe(true);
      const r = number().min(5).safeParse(4);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.meta).toMatchObject({ min: 5, actual: 4 });
    });
    it("max inclusive", () => {
      expect(number().max(10).safeParse(10).success).toBe(true);
      expect(number().max(10).safeParse(11).success).toBe(false);
    });
  });

  describe("gt() / lt()", () => {
    it("gt exclusive", () => {
      expect(number().gt(5).safeParse(5).success).toBe(false);
      expect(number().gt(5).safeParse(6).success).toBe(true);
    });
    it("lt exclusive", () => {
      expect(number().lt(5).safeParse(5).success).toBe(false);
      expect(number().lt(5).safeParse(4).success).toBe(true);
    });
  });

  describe("int()", () => {
    it("passes for integers", () => expect(number().int().safeParse(42).success).toBe(true));
    it("fails for floats", () => {
      const r = number().int().safeParse(3.14);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.code).toBe("ERR_NUMBER_NOT_INTEGER");
    });
  });

  describe("positive() / negative() / nonnegative()", () => {
    it("positive", () => {
      expect(number().positive().safeParse(1).success).toBe(true);
      expect(number().positive().safeParse(0).success).toBe(false);
    });
    it("negative", () => {
      expect(number().negative().safeParse(-1).success).toBe(true);
      expect(number().negative().safeParse(0).success).toBe(false);
    });
    it("nonnegative", () => {
      expect(number().nonnegative().safeParse(0).success).toBe(true);
      expect(number().nonnegative().safeParse(-1).success).toBe(false);
    });
  });

  describe("multipleOf()", () => {
    it("passes when divisible", () =>
      expect(number().multipleOf(3).safeParse(9).success).toBe(true));
    it("fails when not divisible", () => {
      const r = number().multipleOf(3).safeParse(10);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.code).toBe("ERR_NUMBER_NOT_MULTIPLE");
    });
  });

  describe("finite()", () => {
    it("rejects Infinity", () => {
      expect(number().finite().safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
    });
    it("accepts regular numbers", () => expect(number().finite().safeParse(42).success).toBe(true));
  });
});

describe("boolean()", () => {
  it("accepts true and false", () => {
    expect(boolean().safeParse(true).success).toBe(true);
    expect(boolean().safeParse(false).success).toBe(true);
  });
  it("rejects non-booleans", () => {
    for (const val of [0, 1, "true", null, undefined]) {
      const r = boolean().safeParse(val);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.code).toBe("ERR_BOOLEAN_INVALID_TYPE");
    }
  });
});

describe("date()", () => {
  it("accepts Date objects", () => {
    expect(date().safeParse(new Date()).success).toBe(true);
  });
  it("accepts coercible values", () => {
    expect(date().safeParse("2024-01-01").success).toBe(true);
    expect(date().safeParse(0).success).toBe(true);
  });
  it("rejects invalid dates", () => {
    expect(date().safeParse("not-a-date").success).toBe(false);
    expect(date().safeParse(null).success).toBe(false);
  });
  describe("min() / max()", () => {
    it("min rejects past dates", () => {
      const minDate = new Date("2024-01-01");
      expect(date().min(minDate).safeParse(new Date("2023-12-31")).success).toBe(false);
      expect(date().min(minDate).safeParse(new Date("2024-01-01")).success).toBe(true);
    });
    it("max rejects future dates", () => {
      const maxDate = new Date("2024-12-31");
      expect(date().max(maxDate).safeParse(new Date("2025-01-01")).success).toBe(false);
    });
  });
});

describe("bigint()", () => {
  it("accepts bigint values", () => {
    expect(bigint().safeParse(42n).success).toBe(true);
  });
  it("rejects non-bigint", () => {
    expect(bigint().safeParse(42).success).toBe(false);
  });
  describe("positive() / negative()", () => {
    it("positive", () => {
      expect(bigint().positive().safeParse(1n).success).toBe(true);
      expect(bigint().positive().safeParse(0n).success).toBe(false);
    });
    it("negative", () => {
      expect(bigint().negative().safeParse(-1n).success).toBe(true);
      expect(bigint().negative().safeParse(0n).success).toBe(false);
    });
  });
});

describe("literal()", () => {
  it("accepts the exact literal value", () => {
    expect(literal("admin").safeParse("admin").success).toBe(true);
    expect(literal(42).safeParse(42).success).toBe(true);
    expect(literal(true).safeParse(true).success).toBe(true);
    expect(literal(null).safeParse(null).success).toBe(true);
  });
  it("rejects different values with correct meta", () => {
    const r = literal("admin").safeParse("user");
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0]?.code).toBe("ERR_LITERAL_INVALID");
      expect(r.issues[0]?.meta).toEqual({ expected: "admin", actual: "user" });
    }
  });
  it("exposes value and type", () => {
    const schema = literal("admin");
    expect(schema.value).toBe("admin");
    expect(schema._type).toBe("literal");
  });
});