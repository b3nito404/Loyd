// packages/core/tests/parse.test.ts
import { describe, it, expect } from "vitest";
import { ok, fail, failOne, isOk, isFail, prefixPath, LoydError } from "../src/index.js";

describe("ok()", () => {
  it("returns a success result", () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
    expect(result.issues).toHaveLength(0);
  });
});

describe("fail()", () => {
  it("returns a failure result with issues", () => {
    const issue = { code: "ERR_TEST", path: [] };
    const result = fail([issue]);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.issues).toHaveLength(1);
  });
});

describe("failOne()", () => {
  it("wraps a single issue", () => {
    const result = failOne({ code: "ERR_TEST", path: ["name"] });
    expect(result.success).toBe(false);
    expect(result.issues[0]?.code).toBe("ERR_TEST");
  });
});

describe("isOk() / isFail()", () => {
  it("correctly narrows types", () => {
    const success = ok("hello");
    const failure = failOne({ code: "ERR_TEST", path: [] });

    expect(isOk(success)).toBe(true);
    expect(isFail(success)).toBe(false);
    expect(isOk(failure)).toBe(false);
    expect(isFail(failure)).toBe(true);
  });
});

describe("prefixPath()", () => {
  it("prefixes path of all issues in a failed result", () => {
    const result = failOne({ code: "ERR_TEST", path: ["city"] });
    const prefixed = prefixPath(result, "address");
    expect(isFail(prefixed) && prefixed.issues[0]?.path).toEqual(["address", "city"]);
  });

  it("is a no-op on success results", () => {
    const result = ok(42);
    expect(prefixPath(result, "field")).toEqual(result);
  });
});

describe("LoydError", () => {
  it("contains the issues", () => {
    const issue = { code: "ERR_REQUIRED", path: ["email"], message: "Required" };
    const err = new LoydError([issue]);
    expect(err.issues).toHaveLength(1);
    expect(err.firstIssue.code).toBe("ERR_REQUIRED");
    expect(err.name).toBe("LoydError");
    expect(err instanceof Error).toBe(true);
  });

  it("formats a readable summary", () => {
    const err = new LoydError([
      { code: "ERR_STRING_TOO_SHORT", path: ["name"], message: "Too short" },
    ]);
    expect(err.format()).toContain("ERR_STRING_TOO_SHORT");
    expect(err.format()).toContain("name");
  });
});
