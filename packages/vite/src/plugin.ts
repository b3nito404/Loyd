import { type AotTransformOptions, hasLoydImports, transformLoydImports } from "./transform.js";
export interface LoydVitePluginOptions extends AotTransformOptions {
  enabled?: boolean;
  verbose?: boolean;
  cacheDir?: string;
}
export function loydPlugin(options: LoydVitePluginOptions = {}): unknown {
  const { enabled = true, verbose = false, ...transformOptions } = options;
  let transformedCount = 0;
  return {
    name: "loyd-vite-plugin",
    enforce: "pre" as const,
    configResolved(config: { command: string; mode: string }) {
      if (verbose)
        console.log(
          `[@loyd/vite] ${enabled ? "enabled" : "disabled"} — ${config.command === "build" ? "production (AOT)" : "development (JIT)"}`,
        );
    },
    transform(code: string, id: string): { code: string; map?: string } | null {
      if (
        !enabled ||
        !/\.[jt]sx?$/.test(id) ||
        id.includes("node_modules") ||
        !hasLoydImports(code)
      )
        return null;
      const r = transformLoydImports(code, id, { ...transformOptions, verbose });
      if (!r) return null;
      transformedCount++;
      if (verbose) console.log(`[@loyd/vite] Transformed: ${id}`);
      return { code: r.code, map: r.map };
    },
    buildEnd() {
      if (enabled && verbose && transformedCount > 0)
        console.log(`[@loyd/vite] Transformed ${transformedCount} files`);
    },
    handleHotUpdate({ file }: { file: string }) {
      if (enabled && verbose && hasLoydImports(file)) console.log(`[@loyd/vite] HMR: ${file}`);
    },
  };
}
