#!/usr/bin/env node
// build-ordered.mjs — Build all @loyd/* packages in dependency order
// Run: node build-ordered.mjs

import { execSync } from "node:child_process";

const ORDER = [
  "core",
  "types",
  "schema",
  "error-engine",
  "compiler",
  "async",
  "runtime",
  "graph",
  "react",
  "zod-compat",
  "openapi",
  "vite",
];

let passed = 0;
let failed = 0;

for (const pkg of ORDER) {
  process.stdout.write(`  building @loyd/${pkg}... `);
  try {
    execSync(`pnpm --filter @loyd/${pkg} build`, {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    console.log("✓");
    passed++;
  } catch (err) {
    console.log("✗ FAILED");
    const output = err.stderr?.toString() ?? err.stdout?.toString() ?? "";
    // Show only error lines
    const lines = output.split("\n").filter((l) => l.includes("error") || l.includes("Error"));
    for (const line of lines.slice(0, 5)) {
      console.log(`    ${line.trim()}`);
    }
    failed++;
  }
}

console.log(`\n${passed}/${ORDER.length} packages built successfully.`);
if (failed > 0) {
  console.log(`${failed} failed — check errors above.`);
  process.exit(1);
}
