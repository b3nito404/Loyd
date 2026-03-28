// packages/schema/tests/recursive.test.ts
import { describe, it, expect } from "vitest";
import { object, array, optional, string, number, union, literal, lazy } from "../src/index.js";
import type { LoydSchema } from "@loyd/core";

describe("recursive schemas", () => {
  describe("linked list", () => {
    interface ListNode { value: number; next?: ListNode }
    const ListSchema: LoydSchema<ListNode> = object({
      value: number(),
      next: optional(lazy(() => ListSchema)),
    });

    it("accepts a single node", () => {
      expect(ListSchema.safeParse({ value: 1 }).success).toBe(true);
    });
    it("accepts a chain of nodes", () => {
      expect(
        ListSchema.safeParse({
          value: 1,
          next: { value: 2, next: { value: 3 } }
        }).success
      ).toBe(true);
    });
    it("rejects invalid values deep in the chain", () => {
      const r = ListSchema.safeParse({ value: 1, next: { value: "bad" } });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.issues[0]?.path).toContain("next");
    });
  });

  describe("tree structure", () => {
    interface TreeNode { label: string; children?: TreeNode[] }
    const TreeSchema: LoydSchema<TreeNode> = object({
      label: string(),
      children: optional(array(lazy(() => TreeSchema))),
    });

    it("accepts a leaf node", () => {
      expect(TreeSchema.safeParse({ label: "root" }).success).toBe(true);
    });
    it("accepts a tree with children", () => {
      expect(
        TreeSchema.safeParse({
          label: "root",
          children: [
            { label: "child1" },
            { label: "child2", children: [{ label: "grandchild" }] },
          ],
        }).success
      ).toBe(true);
    });
    it("rejects invalid children deep in the tree", () => {
      const r = TreeSchema.safeParse({
        label: "root",
        children: [{ label: 42 }],
      });
      expect(r.success).toBe(false);
    });
  });

  describe("recursive union (JSON-like)", () => {
    type JsonValue =
      | string
      | number
      | boolean
      | null
      | JsonValue[]
      | { [k: string]: JsonValue };

    const JsonSchema: LoydSchema<JsonValue> = union([
      string(),
      number(),
      literal(true),
      literal(false),
      literal(null),
      array(lazy(() => JsonSchema)),
      object({}).passthrough(),
    ]);

    it("accepts primitives", () => {
      expect(JsonSchema.safeParse("hello").success).toBe(true);
      expect(JsonSchema.safeParse(42).success).toBe(true);
      expect(JsonSchema.safeParse(null).success).toBe(true);
    });

    it("accepts nested arrays", () => {
      expect(JsonSchema.safeParse([1, "two", true]).success).toBe(true);
    });
  });
});