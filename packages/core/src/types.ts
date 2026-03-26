export type LoydResult<T> =
  | { success: true; data: T; issues: [] }
  | { success: false; data: undefined; issues: [LoydIssue, ...LoydIssue[]] };

export interface LoydIssue {
  code: string;
  path: LoydPath;
  message?: string;
  meta?: Record<string, unknown>;
}

export type LoydPath = ReadonlyArray<string | number>;
export interface LoydSchema<TOutput, TInput = TOutput> {
  readonly _type: string;
  readonly _meta: SchemaMeta;
  parse(input: unknown): LoydResult<TOutput>;
  safeParse(input: unknown): LoydResult<TOutput>;
  parseOrThrow(input: unknown): TOutput;
  meta(): SchemaMeta;
  describe(description: string): this;
  readonly _output: TOutput;
  readonly _input: TInput;
}

export interface SchemaMeta {
  description?: string;
  label?: string;
  examples?: unknown[];
  deprecated?: boolean;
  [key: string]: unknown;
}

//Branded types

declare const brand: unique symbol;
export type Branded<T, B extends string> = T & { readonly [brand]: B };

export interface TransformSchema<TOutput, TInput> extends LoydSchema<TOutput, TInput> {
  readonly _hasTransform: true;
}

/**Mark a scheme as potentially asynchronous*/
export interface AsyncSchema<TOutput, TInput = TOutput> extends LoydSchema<TOutput, TInput> {
  readonly _isAsync: true;
  parseAsync(input: unknown): Promise<LoydResult<TOutput>>;
  safeParseAsync(input: unknown): Promise<LoydResult<TOutput>>;
}
