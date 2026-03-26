#!/usr/bin/env node

import { gzipSync } from "zlib";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const LIMITS = {
  "schema-minimal": { maxGzip: 820, description: "string() + email() only" },
  "core-full": { maxGzip: 2000, description: "@loyd/core full bundle" },
  "schema-full": { maxGzip: 8000, description: "@loyd/schema full bundle" },
};

const results = [];
let hasFailure = false;

function checkFile(label, filePath, limit) {
  if (!existsSync(filePath)) {
    console.warn(`⚠  ${label}: file not found (${filePath}) — skipping`);
    return;
  }

  const content = readFileSync(filePath);
  const gzipped = gzipSync(content);
  const gzipBytes = gzipped.byteLength;
  const passed = gzipBytes <= limit.maxGzip;

  if (!passed) hasFailure = true;

  results.push({
    label,
    description: limit.description,
    gzipBytes,
    limit: limit.maxGzip,
    passed,
  });
}

const schemaDistDir = resolve(process.cwd(), "dist");

checkFile("schema-full", resolve(schemaDistDir, "index.js"), LIMITS["schema-full"]);

console.log("\nBundle size report");
for (const r of results) {
  const status = r.passed ? "passed" : "failed";
  const ratio = ((r.gzipBytes / r.limit) * 100).toFixed(1);
  const bar = r.passed ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(
    `${bar}${status}${reset}  ${r.label.padEnd(20)} ${String(r.gzipBytes).padStart(6)} B gzip  ` +
    `(limit: ${r.limit} B, ${ratio}%)  — ${r.description}`
  );
}


if (hasFailure) {
  console.error("Bundle size check FAILED — one or more limits exceeded.");
  process.exit(1);
} else {
  console.log("All bundle size checks passed.");
}
