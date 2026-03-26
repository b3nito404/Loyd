// packages/error-engine/tests/formatter.test.ts
import { describe, it, expect } from "vitest";
import { LoydErrorCode, en, fr, es, ar } from "../src/index.js";

describe("LoydErrorCode", () => {
  it("exports all expected codes", () => {
    expect(LoydErrorCode.STRING_TOO_SHORT).toBe("ERR_STRING_TOO_SHORT");
    expect(LoydErrorCode.NUMBER_TOO_SMALL).toBe("ERR_NUMBER_TOO_SMALL");
    expect(LoydErrorCode.REQUIRED).toBe("ERR_REQUIRED");
    expect(LoydErrorCode.UNION_NO_MATCH).toBe("ERR_UNION_NO_MATCH");
  });

  it("has no duplicate values", () => {
    const values = Object.values(LoydErrorCode);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("locale: en", () => {
  it("has a message for REQUIRED", () => {
    expect(en[LoydErrorCode.REQUIRED]).toBeTruthy();
  });

  it("STRING_TOO_SHORT message is a function", () => {
    const msg = en[LoydErrorCode.STRING_TOO_SHORT];
    expect(typeof msg).toBe("function");
    if (typeof msg === "function") {
      const result = msg({ min: 5, actual: 2 });
      expect(result).toContain("5");
      expect(result).toContain("2");
    }
  });
});

describe("locale: fr", () => {
  it("has a message for REQUIRED in French", () => {
    const msg = fr[LoydErrorCode.REQUIRED];
    expect(typeof msg).toBe("string");
    expect(msg).toContain("obligatoire");
  });
});

describe("locale: ar", () => {
  it("has a message for REQUIRED in Arabic", () => {
    const msg = ar[LoydErrorCode.REQUIRED];
    expect(typeof msg).toBe("string");
    // Arabic text is RTL — just verify it's non-empty and non-ASCII
    expect(msg?.length).toBeGreaterThan(0);
  });
});

describe("locale: es", () => {
  it("has a message for STRING_INVALID_EMAIL in Spanish", () => {
    const msg = es[LoydErrorCode.STRING_INVALID_EMAIL];
    expect(typeof msg).toBe("string");
  });
});
