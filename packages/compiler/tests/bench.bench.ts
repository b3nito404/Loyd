import { compile } from "@loydjs/compiler";
import { array, boolean, number, object, string } from "@loydjs/schema";
import { literal, union } from "@loydjs/schema";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as v from "valibot";
import { bench, describe } from "vitest";
import { z } from "zod";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const VALID_EMAIL = "user@example.com";
const _VALID_URL = "https://example.com";
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const simpleUser = { name: "Alice", age: 30, email: VALID_EMAIL };
const invalidUser = { name: 123, age: "thirty", email: "notanemail" };

const deepObject = {
  id: VALID_UUID,
  profile: {
    name: "Alice",
    age: 30,
    email: VALID_EMAIL,
    address: {
      street: "123 Main St",
      city: "Springfield",
      zip: "12345",
      country: "US",
    },
  },
  settings: {
    theme: "dark",
    language: "en",
    notifications: true,
  },
  tags: ["admin", "user", "moderator"],
  score: 9500,
};

const largeArray = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  active: i % 2 === 0,
}));

const invalidLargeArray = Array.from({ length: 1000 }, (_, i) => ({
  id: i % 3 === 0 ? "not-a-number" : i,
  name: i % 5 === 0 ? null : `User ${i}`,
  email: i % 7 === 0 ? "invalid" : `user${i}@example.com`,
  active: i % 2 === 0,
}));

// ─── Schema definitions ───────────────────────────────────────────────────────

// ── 1. Simple string ──────────────────────────────────────────────────────────

const LoydSimpleString = string().minLength(1).maxLength(100);
const LoydSimpleStringCompiled = compile(LoydSimpleString);

const ValibotSimpleString = v.pipe(v.string(), v.minLength(1), v.maxLength(100));
const ZodSimpleString = z.string().min(1).max(100);
const AjvSimpleString = ajv.compile({ type: "string", minLength: 1, maxLength: 100 });

// ── 2. Simple number ──────────────────────────────────────────────────────────

const LoydNumber = number().min(0).max(120).int();
const LoydNumberCompiled = compile(LoydNumber);

const ValibotNumber = v.pipe(v.number(), v.minValue(0), v.maxValue(120), v.integer());
const ZodNumber = z.number().min(0).max(120).int();
const AjvNumber = ajv.compile({ type: "integer", minimum: 0, maximum: 120 });

// ── 3. Flat object ────────────────────────────────────────────────────────────

const LoydUser = object({
  name: string().minLength(1).maxLength(100),
  age: number().min(0).max(120).int(),
  email: string().email(),
});
const LoydUserCompiled = compile(LoydUser);

const ValibotUser = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120), v.integer()),
  email: v.pipe(v.string(), v.email()),
});
const ZodUser = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(120).int(),
  email: z.string().email(),
});
const AjvUser = ajv.compile({
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 100 },
    age: { type: "integer", minimum: 0, maximum: 120 },
    email: { type: "string", format: "email" },
  },
  required: ["name", "age", "email"],
});

// ── 4. Deep nested object ─────────────────────────────────────────────────────

const LoydDeep = object({
  id: string().uuid(),
  profile: object({
    name: string().minLength(1).maxLength(100),
    age: number().min(0).max(120).int(),
    email: string().email(),
    address: object({
      street: string().minLength(1),
      city: string().minLength(1),
      zip: string().minLength(4).maxLength(10),
      country: string().minLength(2).maxLength(2),
    }),
  }),
  settings: object({
    theme: string(),
    language: string().minLength(2).maxLength(5),
    notifications: boolean(),
  }),
  tags: array(string().minLength(1)),
  score: number().min(0),
});
const LoydDeepCompiled = compile(LoydDeep);
const ValibotDeep = v.object({
  id: v.pipe(v.string(), v.uuid()),
  profile: v.object({
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
    age: v.pipe(v.number(), v.minValue(0), v.maxValue(120), v.integer()),
    email: v.pipe(v.string(), v.email()),
    address: v.object({
      street: v.pipe(v.string(), v.minLength(1)),
      city: v.pipe(v.string(), v.minLength(1)),
      zip: v.pipe(v.string(), v.minLength(4), v.maxLength(10)),
      country: v.pipe(v.string(), v.minLength(2), v.maxLength(2)),
    }),
  }),
  settings: v.object({
    theme: v.string(),
    language: v.pipe(v.string(), v.minLength(2), v.maxLength(5)),
    notifications: v.boolean(),
  }),
  tags: v.array(v.pipe(v.string(), v.minLength(1))),
  score: v.pipe(v.number(), v.minValue(0)),
});
const ZodDeep = z.object({
  id: z.string().uuid(),
  profile: z.object({
    name: z.string().min(1).max(100),
    age: z.number().min(0).max(120).int(),
    email: z.string().email(),
    address: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      zip: z.string().min(4).max(10),
      country: z.string().min(2).max(2),
    }),
  }),
  settings: z.object({
    theme: z.string(),
    language: z.string().min(2).max(5),
    notifications: z.boolean(),
  }),
  tags: z.array(z.string().min(1)),
  score: z.number().min(0),
});
const AjvDeep = ajv.compile({
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    profile: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 100 },
        age: { type: "integer", minimum: 0, maximum: 120 },
        email: { type: "string", format: "email" },
        address: {
          type: "object",
          properties: {
            street: { type: "string", minLength: 1 },
            city: { type: "string", minLength: 1 },
            zip: { type: "string", minLength: 4, maxLength: 10 },
            country: { type: "string", minLength: 2, maxLength: 2 },
          },
          required: ["street", "city", "zip", "country"],
        },
      },
      required: ["name", "age", "email", "address"],
    },
    settings: {
      type: "object",
      properties: {
        theme: { type: "string" },
        language: { type: "string", minLength: 2, maxLength: 5 },
        notifications: { type: "boolean" },
      },
      required: ["theme", "language", "notifications"],
    },
    tags: { type: "array", items: { type: "string", minLength: 1 } },
    score: { type: "number", minimum: 0 },
  },
  required: ["id", "profile", "settings", "tags", "score"],
});

// ── 5. Array of objects ───────────────────────────────────────────────────────

const LoydUserItem = object({
  id: number().int().min(0),
  name: string().minLength(1),
  email: string().email(),
  active: boolean(),
});
const LoydLargeArray = array(LoydUserItem);
const LoydLargeArrayCompiled = compile(LoydLargeArray);

const ValibotLargeArray = v.array(
  v.object({
    id: v.pipe(v.number(), v.integer(), v.minValue(0)),
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    active: v.boolean(),
  }),
);
const ZodLargeArray = z.array(
  z.object({
    id: z.number().int().min(0),
    name: z.string().min(1),
    email: z.string().email(),
    active: z.boolean(),
  }),
);
const AjvLargeArray = ajv.compile({
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "integer", minimum: 0 },
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      active: { type: "boolean" },
    },
    required: ["id", "name", "email", "active"],
  },
});

//Union / discriminated union

const LoydShape = union([
  object({ kind: literal("circle"), radius: number().min(0) }),
  object({ kind: literal("rect"), width: number().min(0), height: number().min(0) }),
  object({ kind: literal("triangle"), base: number().min(0), height: number().min(0) }),
]);
const LoydShapeCompiled = compile(LoydShape);

const ValibotShape = v.union([
  v.object({ kind: v.literal("circle"), radius: v.pipe(v.number(), v.minValue(0)) }),
  v.object({
    kind: v.literal("rect"),
    width: v.pipe(v.number(), v.minValue(0)),
    height: v.pipe(v.number(), v.minValue(0)),
  }),
  v.object({
    kind: v.literal("triangle"),
    base: v.pipe(v.number(), v.minValue(0)),
    height: v.pipe(v.number(), v.minValue(0)),
  }),
]);
const ZodShape = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("circle"), radius: z.number().min(0) }),
  z.object({ kind: z.literal("rect"), width: z.number().min(0), height: z.number().min(0) }),
  z.object({ kind: z.literal("triangle"), base: z.number().min(0), height: z.number().min(0) }),
]);

const circleData = { kind: "circle", radius: 5 };
const rectData = { kind: "rect", width: 10, height: 20 };

// String validation
describe("string — minLength + maxLength (valid)", () => {
  bench("Loyd JIT", () => {
    LoydSimpleString.safeParse("hello world");
  });
  bench("Loyd compiled", () => {
    LoydSimpleStringCompiled("hello world");
  });
  bench("Valibot", () => {
    v.safeParse(ValibotSimpleString, "hello world");
  });
  bench("Zod", () => {
    ZodSimpleString.safeParse("hello world");
  });
  bench("AJV", () => {
    AjvSimpleString("hello world");
  });
});

describe("string — minLength + maxLength (invalid)", () => {
  bench("Loyd JIT", () => {
    LoydSimpleString.safeParse("");
  });
  bench("Loyd compiled", () => {
    LoydSimpleStringCompiled("");
  });
  bench("Valibot", () => {
    v.safeParse(ValibotSimpleString, "");
  });
  bench("Zod", () => {
    ZodSimpleString.safeParse("");
  });
  bench("AJV", () => {
    AjvSimpleString("");
  });
});

//Number validation
describe("number — min + max + int (valid)", () => {
  bench("Loyd JIT", () => {
    LoydNumber.safeParse(42);
  });
  bench("Loyd compiled", () => {
    LoydNumberCompiled(42);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotNumber, 42);
  });
  bench("Zod", () => {
    ZodNumber.safeParse(42);
  });
  bench("AJV", () => {
    AjvNumber(42);
  });
});

describe("number — min + max + int (invalid — float)", () => {
  bench("Loyd JIT", () => {
    LoydNumber.safeParse(1.5);
  });
  bench("Loyd compiled", () => {
    LoydNumberCompiled(1.5);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotNumber, 1.5);
  });
  bench("Zod", () => {
    ZodNumber.safeParse(1.5);
  });
  bench("AJV", () => {
    AjvNumber(1.5);
  });
});

// Flat object - valid
describe("object flat — 3 fields (valid)", () => {
  bench("Loyd JIT", () => {
    LoydUser.safeParse(simpleUser);
  });
  bench("Loyd compiled", () => {
    LoydUserCompiled(simpleUser);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotUser, simpleUser);
  });
  bench("Zod", () => {
    ZodUser.safeParse(simpleUser);
  });
  bench("AJV", () => {
    AjvUser(simpleUser);
  });
});

describe("object flat — 3 fields (invalid — all wrong)", () => {
  bench("Loyd JIT", () => {
    LoydUser.safeParse(invalidUser);
  });
  bench("Loyd compiled", () => {
    LoydUserCompiled(invalidUser);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotUser, invalidUser);
  });
  bench("Zod", () => {
    ZodUser.safeParse(invalidUser);
  });
  bench("AJV", () => {
    AjvUser(invalidUser);
  });
});

// Deep nested object
describe("object deep nested — 5 levels (valid)", () => {
  bench("Loyd JIT", () => {
    LoydDeep.safeParse(deepObject);
  });
  bench("Loyd compiled", () => {
    LoydDeepCompiled(deepObject);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotDeep, deepObject);
  });
  bench("Zod", () => {
    ZodDeep.safeParse(deepObject);
  });
  bench("AJV", () => {
    AjvDeep(deepObject);
  });
});

describe("object deep nested — 5 levels (invalid — wrong type at root)", () => {
  bench("Loyd JIT", () => {
    LoydDeep.safeParse(null);
  });
  bench("Loyd compiled", () => {
    LoydDeepCompiled(null);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotDeep, null);
  });
  bench("Zod", () => {
    ZodDeep.safeParse(null);
  });
  bench("AJV", () => {
    AjvDeep(null);
  });
});

//Large array  1000 items
describe("array — 1000 valid items", () => {
  bench("Loyd JIT", () => {
    LoydLargeArray.safeParse(largeArray);
  });
  bench("Loyd compiled", () => {
    LoydLargeArrayCompiled(largeArray);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotLargeArray, largeArray);
  });
  bench("Zod", () => {
    ZodLargeArray.safeParse(largeArray);
  });
  bench("AJV", () => {
    AjvLargeArray(largeArray);
  });
});

describe("array — 1000 items with ~30% invalid", () => {
  bench("Loyd JIT", () => {
    LoydLargeArray.safeParse(invalidLargeArray);
  });
  bench("Loyd compiled", () => {
    LoydLargeArrayCompiled(invalidLargeArray);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotLargeArray, invalidLargeArray);
  });
  bench("Zod", () => {
    ZodLargeArray.safeParse(invalidLargeArray);
  });
  bench("AJV", () => {
    AjvLargeArray(invalidLargeArray);
  });
});

//Union
describe("union — 3 variants discriminated (valid — first variant)", () => {
  bench("Loyd JIT", () => {
    LoydShape.safeParse(circleData);
  });
  bench("Loyd compiled", () => {
    LoydShapeCompiled(circleData);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotShape, circleData);
  });
  bench("Zod", () => {
    ZodShape.safeParse(circleData);
  });
});

describe("union — 3 variants discriminated (valid — last variant)", () => {
  bench("Loyd JIT", () => {
    LoydShape.safeParse(rectData);
  });
  bench("Loyd compiled", () => {
    LoydShapeCompiled(rectData);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotShape, rectData);
  });
  bench("Zod", () => {
    ZodShape.safeParse(rectData);
  });
});

//Type check only  worst case overhead
describe("type check only — string (no rules)", () => {
  const LoydStr = string();
  const LoydStrCompiled = compile(LoydStr);
  const ValibotStr = v.string();
  const ZodStr = z.string();
  const AjvStr = ajv.compile({ type: "string" });

  bench("Loyd JIT", () => {
    LoydStr.safeParse("hello");
  });
  bench("Loyd compiled", () => {
    LoydStrCompiled("hello");
  });
  bench("Valibot", () => {
    v.safeParse(ValibotStr, "hello");
  });
  bench("Zod", () => {
    ZodStr.safeParse("hello");
  });
  bench("AJV", () => {
    AjvStr("hello");
  });
});

describe("type check only — number (no rules)", () => {
  const LoydNum = number();
  const LoydNumCompiled = compile(LoydNum);
  const ValibotNum = v.number();
  const ZodNum = z.number();
  const AjvNum = ajv.compile({ type: "number" });

  bench("Loyd JIT", () => {
    LoydNum.safeParse(42);
  });
  bench("Loyd compiled", () => {
    LoydNumCompiled(42);
  });
  bench("Valibot", () => {
    v.safeParse(ValibotNum, 42);
  });
  bench("Zod", () => {
    ZodNum.safeParse(42);
  });
  bench("AJV", () => {
    AjvNum(42);
  });
});

describe("stress — object flat repeated 10k times", () => {
  bench(
    "Loyd compiled",
    () => {
      for (let i = 0; i < 10_000; i++) LoydUserCompiled(simpleUser);
    },
    { iterations: 10 },
  );

  bench(
    "AJV",
    () => {
      for (let i = 0; i < 10_000; i++) AjvUser(simpleUser);
    },
    { iterations: 10 },
  );

  bench(
    "Valibot",
    () => {
      for (let i = 0; i < 10_000; i++) v.safeParse(ValibotUser, simpleUser);
    },
    { iterations: 10 },
  );

  bench(
    "Zod",
    () => {
      for (let i = 0; i < 10_000; i++) ZodUser.safeParse(simpleUser);
    },
    { iterations: 10 },
  );
});

describe("stress  deep nested repeated 1k times", () => {
  bench(
    "Loyd compiled",
    () => {
      for (let i = 0; i < 1_000; i++) LoydDeepCompiled(deepObject);
    },
    { iterations: 10 },
  );

  bench(
    "AJV",
    () => {
      for (let i = 0; i < 1_000; i++) AjvDeep(deepObject);
    },
    { iterations: 10 },
  );

  bench(
    "Valibot",
    () => {
      for (let i = 0; i < 1_000; i++) v.safeParse(ValibotDeep, deepObject);
    },
    { iterations: 10 },
  );

  bench(
    "Zod",
    () => {
      for (let i = 0; i < 1_000; i++) ZodDeep.safeParse(deepObject);
    },
    { iterations: 10 },
  );
});
