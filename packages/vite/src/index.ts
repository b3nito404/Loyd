import type { AotTransformOptions } from "@loyd/compiler";

//Vite plugin

export interface LoydVitePluginOptions extends AotTransformOptions {
  /**
   * @default true
   */
  enabled?: boolean;
  /**
   * @default false
   */
  verbose?: boolean;
  /**
   * @default "node_modules/.loyd-cache"
   */
  cacheDir?: string;
}

/**
 * Vite/Rollup plugin that enables AOT compilation of Loyd schemes.
 *
 * During the build process, all @loyd/schema imports are analyzed.
 * and the schemas are pre-compiled into JavaScript functions.
 * The final bundle no longer contains the JIT engine.
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from "vite";
 * import { loydPlugin } from "@loyd/vite";
 *
 * export default defineConfig({
 *   plugins: [
 *     loydPlugin({
 *       enabled: process.env.NODE_ENV === "production",
 *       verbose: true,
 *     }),
 *   ],
 * });
 */
export declare function loydPlugin(options?: LoydVitePluginOptions): unknown;
