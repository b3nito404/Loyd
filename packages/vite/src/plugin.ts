import type { LoydSchema } from "@loydjs/core";
import { hasLoydImports, registerModuleSchemas, transformLoydImports } from "./transform.js";
import type { AotTransformOptions } from "./transform.js";

export interface LoydVitePluginOptions extends AotTransformOptions {
  enabled?: boolean;
  verbose?: boolean;
  cacheDir?: string;
  /**
   * @example
   * loydPlugin({
   *   schemas: {
   *     UserSchema: UserSchema,
   *     PostSchema: PostSchema,
   *   }
   * })
   */
  schemas?: Record<string, LoydSchema<unknown>>;
  forceAot?: boolean;
}

export function loydPlugin(options: LoydVitePluginOptions = {}): unknown {
  const {
    enabled = true,
    verbose = false,
    schemas = {},
    forceAot = false,
    ...transformOptions
  } = options;

  let isBuild = false;
  let transformedCount = 0;
  let skippedCount = 0;

  const globalSchemas = new Map<string, LoydSchema<unknown>>(Object.entries(schemas));

  return {
    name: "loyd-vite-plugin",
    enforce: "pre" as const,

    configResolved(config: { command: string; mode: string }) {
      isBuild = config.command === "build";

      if (verbose) {
        const mode = isBuild || forceAot ? "AOT" : "JIT";
        const status = enabled ? `enabled [${mode}]` : "disabled";
        console.log(`[@loydjs/vite] ${status} — Vite ${config.command} (${config.mode})`);

        if (globalSchemas.size > 0) {
          console.log(
            `[@loydjs/vite] Pre-registered schemas: ${[...globalSchemas.keys()].join(", ")}`,
          );
        }
      }
    },

    transform(code: string, id: string): { code: string; map?: string } | null {
      if (!enabled) return null;
      if (!/\.[jt]sx?$/.test(id)) return null;
      if (id.includes("node_modules")) return null;
      if (!hasLoydImports(code)) return null;

      if (!isBuild && !forceAot) {
        return null;
      }

      if (globalSchemas.size > 0) {
        registerModuleSchemas(id, globalSchemas);
      }

      const r = transformLoydImports(code, id, {
        ...transformOptions,
        verbose,
      });

      if (!r) {
        skippedCount++;
        return null;
      }

      transformedCount++;

      if (verbose) {
        console.log(`[@loydjs/vite] AOT-transformed: ${id}`);
      }

      return { code: r.code, map: r.map };
    },

    buildEnd() {
      if (!enabled || !verbose) return;

      if (transformedCount > 0 || skippedCount > 0) {
        console.log(
          `[@loydjs/vite] Build complete — ${transformedCount} files AOT-transformed, ${skippedCount} files left to JIT`,
        );
      }
    },

    handleHotUpdate({ file }: { file: string }) {
      if (!enabled || !verbose) return;
      if (hasLoydImports(file)) {
        console.log(`[@loydjs/vite] HMR: ${file} (JIT mode)`);
      }
    },
  };
}
