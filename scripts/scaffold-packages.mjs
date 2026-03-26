#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const packagesDir = path.join(root, "packages");
const packages = [
  {
    name: "core",
    description: "Loyd core — zero-dependency foundation types and parse functions",
    deps: {},
    peerDeps: {},
  },
  {
    name: "types",
    description: "Loyd types — zero-runtime TypeScript inference utilities",
    deps: { "@loyd/core": "workspace:*" },
    peerDeps: {},
  },
  {
    name: "schema",
    description: "Loyd schema — functional, tree-shakeable DSL for schema definition",
    deps: { "@loyd/core": "workspace:*", "@loyd/types": "workspace:*" },
    peerDeps: {},
  },
  {
    name: "error-engine",
    description: "Loyd error-engine — structured error codes and i18n formatter",
    deps: { "@loyd/core": "workspace:*" },
    peerDeps: {},
  },
  {
    name: "compiler",
    description: "Loyd compiler — JIT and AOT schema compilation engine",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/error-engine": "workspace:*",
    },
    peerDeps: {},
  },
  {
    name: "async",
    description: "Loyd async — orchestrated two-pass async validation pipeline",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/compiler": "workspace:*",
    },
    peerDeps: {},
  },
  {
    name: "runtime",
    description: "Loyd runtime — zero-copy execution engine with strict/strip/passthrough modes",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/compiler": "workspace:*",
    },
    peerDeps: {},
  },
  {
    name: "graph",
    description: "Loyd graph — field dependency DAG for incremental form validation",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/runtime": "workspace:*",
    },
    peerDeps: {},
  },
  {
    name: "react",
    description: "Loyd react — native React hooks for form validation",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/runtime": "workspace:*",
      "@loyd/graph": "workspace:*",
      "@loyd/async": "workspace:*",
      "@loyd/error-engine": "workspace:*",
    },
    peerDeps: { react: ">=18.0.0", "react-dom": ">=18.0.0" },
    devDeps: { "@types/react": "^18.3.12", "@types/react-dom": "^18.3.1", react: "^18.3.1", "react-dom": "^18.3.1" },
  },
  {
    name: "zod-compat",
    description: "Loyd zod-compat — bidirectional Zod interop and codemod",
    deps: { "@loyd/core": "workspace:*", "@loyd/schema": "workspace:*" },
    peerDeps: { zod: ">=3.0.0" },
    devDeps: { zod: "^3.23.8" },
  },
  {
    name: "openapi",
    description: "Loyd openapi — export schemas to JSONSchema7 and OpenAPI 3.1",
    deps: { "@loyd/core": "workspace:*", "@loyd/schema": "workspace:*" },
    peerDeps: {},
  },
  {
    name: "vite",
    description: "Loyd vite — Vite/Rollup plugin for AOT schema compilation",
    deps: { "@loyd/core": "workspace:*", "@loyd/compiler": "workspace:*" },
    peerDeps: { vite: ">=5.0.0" },
    devDeps: { vite: "^5.4.11" },
  },
];
const depsToRefs = (deps) =>
  Object.keys(deps)
    .filter((d) => d.startsWith("@loyd/"))
    .map((d) => ({ path: `../${d.replace("@loyd/", "")}` }));
for (const pkg of packages) {
  const pkgDir = path.join(packagesDir, pkg.name);

  // package.json
  const pkgJson = {
    name: `@loyd/${pkg.name}`,
    version: "0.0.0",
    description: pkg.description,
    keywords: ["loyd", "validation", "typescript", "schema"],
    license: "MIT",
    author: "Loyd contributors",
    repository: {
      type: "git",
      url: "https://github.com/your-org/loyd.git",
      directory: `packages/${pkg.name}`,
    },
    type: "module",
    main: "./dist/index.cjs",
    module: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        import: { types: "./dist/index.d.ts", default: "./dist/index.js" },
        require: { types: "./dist/index.d.cts", default: "./dist/index.cjs" },
      },
    },
    files: ["dist", "src"],
    sideEffects: false,
    scripts: {
      build: "tsup",
      dev: "tsup --watch",
      typecheck: "tsc --noEmit",
      test: "vitest run",
      "test:watch": "vitest",
      bench: pkg.name === "compiler" || pkg.name === "runtime" ? "vitest bench" : "echo no benchmarks",
      clean: "rm -rf dist *.tsbuildinfo",
    },
    dependencies: pkg.deps,
    ...(pkg.peerDeps && Object.keys(pkg.peerDeps).length > 0
      ? { peerDependencies: pkg.peerDeps }
      : {}),
    devDependencies: {
      ...(pkg.devDeps || {}),
      typescript: "^5.7.2",
      tsup: "^8.3.5",
      vitest: "^2.1.8",
    },
    publishConfig: {
      access: "public",
    },
  };

  fs.writeFileSync(
    path.join(pkgDir, "package.json"),
    JSON.stringify(pkgJson, null, 2) + "\n"
  );

  // tsconfig.json
  const refs = depsToRefs(pkg.deps);
  const tsconfig = {
    extends: "../../tsconfig.base.json",
    compilerOptions: {
      outDir: "dist",
      rootDir: "src",
      tsBuildInfoFile: "dist/.tsbuildinfo",
    },
    include: ["src/**/*"],
    ...(refs.length > 0 ? { references: refs } : {}),
  };

  fs.writeFileSync(
    path.join(pkgDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n"
  );

  const tsconfigTest = {
    extends: "./tsconfig.json",
    compilerOptions: {
      noEmit: true,
      composite: false,
      incremental: false,
    },
    include: ["src/**/*", "tests/**/*"],
  };

  fs.writeFileSync(
    path.join(pkgDir, "tsconfig.test.json"),
    JSON.stringify(tsconfigTest, null, 2) + "\n"
  );

  // tsup.config.ts
  const tsupConfig = `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
`;
  fs.writeFileSync(path.join(pkgDir, "tsup.config.ts"), tsupConfig);

  const vitestConfig = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
    },
  },
});
`;
  fs.writeFileSync(path.join(pkgDir, "vitest.config.ts"), vitestConfig);

  console.log(`packages/${pkg.name}`);
}

console.log("\npackage configs generated.");
