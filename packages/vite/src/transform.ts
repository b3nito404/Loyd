export interface AotTransformOptions {
  outDir?: string;
  sourcemap?: boolean;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
}
export interface AotTransformResult {
  code: string;
  map?: string;
  generatedFiles: string[];
}
export type AotTransformFn = (
  source: string,
  filename: string,
  options?: AotTransformOptions,
) => AotTransformResult | null;
export function hasLoydImports(source: string): boolean {
  return (
    source.includes("@loyd/schema") ||
    source.includes("@loyd/core") ||
    source.includes("@loyd/compiler")
  );
}
export function transformLoydImports(
  source: string,
  _filename: string,
  _options: AotTransformOptions = {},
): AotTransformResult | null {
  if (!hasLoydImports(source)) return null;
  return { code: `/* @loyd/vite: AOT-ready */\n${source}`, generatedFiles: [] };
}
