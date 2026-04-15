#!/bin/bash

# Corrige tsconfig.base.json
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
EOF

# Liste des packages dans l'ordre de dépendance (pour references)
# core -> aucun
# types -> aucun
# error-engine -> core
# schema -> core, types
# async -> core
# compiler -> core, schema, error-engine
# runtime -> core
# graph -> core
# react -> core, graph, async
# openapi -> core, schema
# vite -> core, compiler
# zod-compat -> core, schema

# Pour chaque package, on régénère un tsconfig.json propre
for pkg in packages/*; do
  name=$(basename "$pkg")
  refs=""
  case "$name" in
    core|types) refs="" ;;
    error-engine) refs='{ "path": "../core" }' ;;
    schema) refs='{ "path": "../core" }, { "path": "../types" }' ;;
    async) refs='{ "path": "../core" }' ;;
    compiler) refs='{ "path": "../core" }, { "path": "../schema" }, { "path": "../error-engine" }' ;;
    runtime) refs='{ "path": "../core" }' ;;
    graph) refs='{ "path": "../core" }' ;;
    react) refs='{ "path": "../core" }, { "path": "../graph" }, { "path": "../async" }' ;;
    openapi) refs='{ "path": "../core" }, { "path": "../schema" }' ;;
    vite) refs='{ "path": "../core" }, { "path": "../compiler" }' ;;
    zod-compat) refs='{ "path": "../core" }, { "path": "../schema" }' ;;
    *) refs="" ;;
  esac

  cat > "$pkg/tsconfig.json" << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [$refs]
}
EOF
done
