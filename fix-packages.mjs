#!/usr/bin/env node
// fix-packages.mjs — recrée tous les package.json + configs des packages
// Usage : node fix-packages.mjs  (depuis la racine du projet)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

// ── Définition complète de chaque package ────────────────────────────────────
const packages = [
  {
    name: "core",
    description: "Loyd core — zero-dependency foundation types and parse functions",
    deps: {},
  },
  {
    name: "types",
    description: "Loyd types — zero-runtime TypeScript inference utilities",
    deps: { "@loyd/core": "workspace:*" },
  },
  {
    name: "schema",
    description: "Loyd schema — functional, tree-shakeable DSL for schema definition",
    deps: { "@loyd/core": "workspace:*", "@loyd/types": "workspace:*" },
  },
  {
    name: "error-engine",
    description: "Loyd error-engine — structured error codes and i18n formatter",
    deps: { "@loyd/core": "workspace:*" },
  },
  {
    name: "compiler",
    description: "Loyd compiler — JIT and AOT schema compilation engine",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/error-engine": "workspace:*",
    },
  },
  {
    name: "async",
    description: "Loyd async — orchestrated two-pass async validation pipeline",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/compiler": "workspace:*",
    },
  },
  {
    name: "runtime",
    description: "Loyd runtime — zero-copy execution engine",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/compiler": "workspace:*",
    },
  },
  {
    name: "graph",
    description: "Loyd graph — field dependency DAG for incremental form validation",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/runtime": "workspace:*",
    },
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
  },
  {
    name: "vite",
    description: "Loyd vite — Vite/Rollup plugin for AOT schema compilation",
    deps: { "@loyd/core": "workspace:*", "@loyd/compiler": "workspace:*" },
    peerDeps: { vite: ">=5.0.0" },
    devDeps: { vite: "^5.4.11" },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function json(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

// ── Génération ────────────────────────────────────────────────────────────────
for (const pkg of packages) {
  const pkgDir = path.join(root, "packages", pkg.name);

  // ── package.json ────────────────────────────────────────────────────────────
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
      bench:
        pkg.name === "compiler" || pkg.name === "runtime"
          ? "vitest bench"
          : "echo no benchmarks",
      clean: "rm -rf dist *.tsbuildinfo",
    },
    ...(Object.keys(pkg.deps).length > 0 ? { dependencies: pkg.deps } : {}),
    ...(pkg.peerDeps ? { peerDependencies: pkg.peerDeps } : {}),
    devDependencies: {
      ...(pkg.devDeps || {}),
      typescript: "^5.7.2",
      tsup: "^8.3.5",
      vitest: "^2.1.8",
    },
    publishConfig: { access: "public" },
  };

  write(path.join(pkgDir, "package.json"), json(pkgJson));

  // ── tsconfig.json ───────────────────────────────────────────────────────────
  const refs = Object.keys(pkg.deps)
    .filter((d) => d.startsWith("@loyd/"))
    .map((d) => ({ path: `../${d.replace("@loyd/", "")}` }));

  const tsconfig = {
    $schema: "https://json.schemastore.org/tsconfig",
    extends: "../../tsconfig.base.json",
    compilerOptions: {
      outDir: "dist",
      rootDir: "src",
      tsBuildInfoFile: "dist/.tsbuildinfo",
      composite: false,
      ...(pkg.name === "react"
        ? { jsx: "react-jsx", jsxImportSource: "react" }
        : {}),
    },
    include: ["src/**/*"],
    ...(refs.length > 0 ? { references: refs } : {}),
  };

  write(path.join(pkgDir, "tsconfig.json"), json(tsconfig));

  // ── tsup.config.ts ──────────────────────────────────────────────────────────
  const externals =
    pkg.name === "react"
      ? `\n  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },`
      : "";

  const tsupConfig = `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,${externals}
});
`;
  write(path.join(pkgDir, "tsup.config.ts"), tsupConfig);

  // ── vitest.config.ts ────────────────────────────────────────────────────────
  const vitestConfig = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
    },
  },
});
`;
  write(path.join(pkgDir, "vitest.config.ts"), vitestConfig);

  console.log(`✓  packages/${pkg.name}`);
}

// ── Fichiers racine ───────────────────────────────────────────────────────────

// tsconfig.base.json
write(
  path.join(root, "tsconfig.base.json"),
  json({
    $schema: "https://json.schemastore.org/tsconfig",
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      lib: ["ES2022"],
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      strict: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: false,
      exactOptionalPropertyTypes: false,
      noFallthroughCasesInSwitch: true,
      noImplicitReturns: true,
      forceConsistentCasingInFileNames: true,
      esModuleInterop: true,
      isolatedModules: true,
      verbatimModuleSyntax: true,
      skipLibCheck: true,
    },
    exclude: ["node_modules", "dist", "coverage", "**/*.test.ts", "**/*.bench.ts"],
  })
);
console.log("✓  tsconfig.base.json");

// pnpm-workspace.yaml
write(
  path.join(root, "pnpm-workspace.yaml"),
  `packages:\n  - "packages/*"\n  - "docs"\n  - "benchmarks"\n  - "examples/*"\n`
);
console.log("✓  pnpm-workspace.yaml");

// .npmrc
write(
  path.join(root, ".npmrc"),
  [
    "strict-peer-dependencies=false",
    "auto-install-peers=true",
    "shamefully-hoist=false",
    "link-workspace-packages=true",
    "prefer-workspace-packages=true",
    "save-workspace-protocol=rolling",
    "",
  ].join("\n")
);
console.log(".npmrc");

// root package.json
write(
  path.join(root, "package.json"),
  json({
    name: "loyd",
    version: "0.0.0",
    private: true,
    description: "Loyd monorepo — TypeScript-first form validator",
    engines: { node: ">=20.0.0", pnpm: ">=9.0.0" },
    scripts: {
      build: "turbo run build",
      "build:packages": "turbo run build --filter='./packages/*'",
      dev: "turbo run dev --parallel",
      test: "turbo run test",
      "test:watch": "turbo run test:watch --parallel",
      typecheck: "turbo run typecheck",
      lint: "biome check .",
      "lint:fix": "biome check --write .",
      format: "biome format --write .",
      bench: "turbo run bench",
      clean: "turbo run clean && rm -rf node_modules",
      changeset: "changeset",
      version: "changeset version",
      release: "turbo run build && changeset publish",
      "check:all": "turbo run build typecheck test lint",
    },
    devDependencies: {
      "@biomejs/biome": "^1.9.4",
      "@changesets/cli": "^2.27.10",
      turbo: "^2.3.3",
      typescript: "^5.7.2",
      tsup: "^8.3.5",
      vitest: "^2.1.8",
    },
    packageManager: "pnpm@9.15.9",
  })
);
console.log("package.json");

console.log("\nAll configs regenerated. Now run: pnpm install && pnpm build");
