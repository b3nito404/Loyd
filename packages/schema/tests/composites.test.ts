import { describe, it, expect } from "vitest";
import {
  object, array, tuple, record, map, set,
  union, discriminatedUnion,
  string, number, boolean, literal,
} from "../src/index.js";

//object()

describe("object()", () => {
  const UserSchema = object({ name: string(), age: number().int() });

  it("accepts valid objects", () => {
    const r = UserSchema.safeParse({ name: "Alice", age: 30 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Alice");
      expect(r.data.age).toBe(30);
    }
  });

  it("rejects non-objects", () => {
    for (const val of [null, "string", 42, []]) {
      expect(UserSchema.safeParse(val).success).toBe(false);
    }
  });

  it("reports all field errors", () => {
    const r = UserSchema.safeParse({ name: 42, age: "not a number" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues.length).toBeGreaterThanOrEqual(2);
      const paths = r.issues.map((i) => i.path[0]);
      expect(paths).toContain("name");
      expect(paths).toContain("age");
    }
  });

  it("prefixes issue paths with field name", () => {
    const r = UserSchema.safeParse({ name: 42, age: 30 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues[0]?.path[0]).toBe("name");
  });

  describe("strip mode (default)", () => {
    it("strips unknown keys", () => {
      const r = UserSchema.safeParse({ name: "Alice", age: 30, extra: "ignored" });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as Record<string, unknown>)["extra"]).toBeUndefined();
    });
  });

  describe("strict()", () => {
    it("errors on unknown keys", () => {
      const r = UserSchema.strict().safeParse({ name: "Alice", age: 30, extra: "bad" });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.code).toBe("ERR_OBJECT_UNKNOWN_KEYS");
    });
  });

  describe("passthrough()", () => {
    it("passes unknown keys through", () => {
      const r = UserSchema.passthrough().safeParse({ name: "Alice", age: 30, extra: "kept" });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as Record<string, unknown>)["extra"]).toBe("kept");
    });
  });
});
