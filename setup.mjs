#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

console.log("Loyd setup generating package configs...\n");

const packages = [
  { name: "core", description: "Loyd core zero-dependency foundation", deps: {} },
  {
    name: "types",
    description: "Loyd types zero-runtime inference",
    deps: { "@loyd/core": "workspace:*" },
  },
  {
    name: "schema",
    description: "Loyd schema functional, tree-shakeable DSL",
    deps: { "@loyd/core": "workspace:*", "@loyd/types": "workspace:*" },
  },
  {
    name: "error-engine",
    description: "Loyd error-engine structured i18n error codes",
    deps: { "@loyd/core": "workspace:*" },
    devDeps: { "@loyd/schema": "workspace:*" },
  },
  {
    name: "compiler",
    description: "Loyd compiler  JIT and AOT engine",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/error-engine": "workspace:*",
    },
    devDeps: { "@loyd/schema": "workspace:*" },
  },
  {
    name: "async",
    description: "Loyd async  two-pass async pipeline",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/compiler": "workspace:*",
    },
    devDeps: { "@loyd/schema": "workspace:*" },
  },
  {
    name: "runtime",
    description: "Loyd runtime zero-copy execution engine",
    deps: { "@loyd/core": "workspace:*", "@loyd/compiler": "workspace:*" },
  },
  {
    name: "graph",
    description: "Loyd graph  field dependency DAG",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/runtime": "workspace:*",
    },
    devDeps: { "@loyd/schema": "workspace:*" },
  },
  {
    name: "react",
    description: "Loyd react  native React hooks",
    deps: {
      "@loyd/core": "workspace:*",
      "@loyd/schema": "workspace:*",
      "@loyd/runtime": "workspace:*",
      "@loyd/graph": "workspace:*",
      "@loyd/async": "workspace:*",
      "@loyd/error-engine": "workspace:*",
    },
    peerDeps: { react: ">=18.0.0", "react-dom": ">=18.0.0" },
    devDeps: {
      "@loyd/schema": "workspace:*",
      "@types/react": "^18.3.12",
      "@types/react-dom": "^18.3.1",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "@testing-library/react": "^16.0.0",
      "@testing-library/user-event": "^14.0.0",
      jsdom: "^25.0.0",
    },
  },
  {
    name: "zod-compat",
    description: "Loyd zod-compat  Zod migration tools",
    deps: { "@loyd/core": "workspace:*", "@loyd/schema": "workspace:*" },
    peerDeps: { zod: ">=3.0.0" },
    devDeps: { "@loyd/schema": "workspace:*", zod: "^3.23.8" },
  },
  {
    name: "openapi",
    description: "Loyd openapi JSONSchema + OpenAPI export",
    deps: { "@loyd/core": "workspace:*", "@loyd/schema": "workspace:*" },
    devDeps: { "@loyd/schema": "workspace:*" },
  },
  {
    name: "vite",
    description: "Loyd vite  Vite/Rollup AOT plugin",
    deps: { "@loyd/core": "workspace:*", "@loyd/compiler": "workspace:*" },
    peerDeps: { vite: ">=5.0.0" },
    devDeps: { vite: "^5.4.11" },
  },
];

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    typeof content === "string"
      ? content
      : `${JSON.stringify(content, null, 2)}
`,
  );
}

for (const pkg of packages) {
  const pkgDir = path.join(root, "packages", pkg.name);
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.mkdirSync(path.join(pkgDir, "src"), { recursive: true });
  fs.mkdirSync(path.join(pkgDir, "tests"), { recursive: true });

  // package.json
  const deps = pkg.deps ?? {};
  const refs = Object.keys(deps)
    .filter((d) => d.startsWith("@loyd/"))
    .map((d) => ({ path: `../${d.replace("@loyd/", "")}` }));

  write(path.join(pkgDir, "package.json"), {
    name: `@loyd/${pkg.name}`,
    version: "0.0.0",
    description: pkg.description,
    keywords: ["loyd", "validation", "typescript", "schema"],
    license: "MIT",
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
      bench: ["compiler", "runtime"].includes(pkg.name) ? "vitest bench" : "echo no benchmarks",
      clean: "rm -rf dist *.tsbuildinfo",
    },
    ...(Object.keys(deps).length > 0 ? { dependencies: deps } : {}),
    ...(pkg.peerDeps ? { peerDependencies: pkg.peerDeps } : {}),
    devDependencies: {
      ...(pkg.devDeps ?? {}),
      typescript: "^5.7.2",
      tsup: "^8.3.5",
      vitest: "^2.1.8",
    },
    publishConfig: { access: "public" },
  });

  // tsconfig.json
  write(path.join(pkgDir, "tsconfig.json"), {
    $schema: "https://json.schemastore.org/tsconfig",
    extends: "../../tsconfig.base.json",
    compilerOptions: {
      outDir: "dist",
      rootDir: "src",
      tsBuildInfoFile: "dist/.tsbuildinfo",
      composite: false,
      ...(pkg.name === "react" ? { jsx: "react-jsx", jsxImportSource: "react" } : {}),
    },
    include: ["src/**/*"],
    ...(refs.length > 0 ? { references: refs } : {}),
  });

  // tsup.config.ts
  const externals =
    pkg.name === "react"
      ? `\n  external: ["react", "react-dom"],\n  esbuildOptions(options) {\n    options.jsx = "automatic";\n    options.jsxImportSource = "react";\n  },`
      : "";
  write(
    path.join(pkgDir, "tsup.config.ts"),
    `import { defineConfig } from "tsup";\nexport default defineConfig({\n  entry: ["src/index.ts"],\n  format: ["esm", "cjs"],\n  dts: true,\n  splitting: false,\n  sourcemap: true,\n  clean: true,\n  treeshake: true,\n  minify: false,${externals}\n});\n`,
  );

  // vitest.config.ts
  const isReact = pkg.name === "react";
  write(
    path.join(pkgDir, "vitest.config.ts"),
    `import { defineConfig } from "vitest/config";\nexport default defineConfig({\n  test: {\n    globals: true,\n    environment: "${isReact ? "jsdom" : "node"}",\n    include: ["tests/**/*.test.ts"${isReact ? ', "tests/**/*.test.tsx"' : ""}],\n    passWithNoTests: true,\n  },\n});\n`,
  );

  console.log(`  ✓  packages/${pkg.name}`);
}

// ── Root files ────────────────────────────────────────────────────────────────

// tsconfig.base.json
write(path.join(root, "tsconfig.base.json"), {
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
});
console.log("  ✓  tsconfig.base.json");

// pnpm-workspace.yaml
write(
  path.join(root, "pnpm-workspace.yaml"),
  `packages:\n  - "packages/*"\n  - "docs"\n  - "benchmarks"\n  - "examples/*"\n`,
);

// .npmrc
write(
  path.join(root, ".npmrc"),
  "strict-peer-dependencies=false\nauto-install-peers=true\nshamefully-hoist=false\nlink-workspace-packages=true\nprefer-workspace-packages=true\nsave-workspace-protocol=rolling\n",
);

// root package.json
write(path.join(root, "package.json"), {
  name: "loyd",
  version: "0.0.0",
  private: true,
  description: "Loyd monorepo — TypeScript-first form validator",
  engines: { node: ">=20.0.0", pnpm: ">=9.0.0" },
  scripts: {
    build: "turbo run build",
    test: "turbo run test",
    typecheck: "turbo run typecheck",
    lint: "biome check .",
    "lint:fix": "biome check --write .",
    bench: "turbo run bench",
    clean: "turbo run clean && rm -rf node_modules",
    changeset: "changeset",
    version: "changeset version",
    release: "turbo run build && changeset publish",
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
});
console.log("  ✓  package.json");

console.log("\n✅  Setup complete!\n");
console.log("Next steps:");
console.log("  1. pnpm install");
console.log("  2. pnpm build");
console.log("  3. pnpm test");
console.log("  4. git init && git add . && git commit -m 'chore: initial commit'\n");
