import type { LoydSchema, LoydIssue } from "@loyd/core";
import type { ParseAsyncOptions } from "@loyd/async";
import type { DagBuildOptions } from "@loyd/graph";

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: FormErrors;
  touched: Set<string>;
  dirty: Set<string>;
  isDirty: boolean;
  isValid: boolean;
  isValidating: boolean;
  isSubmitted: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

export type FormErrors = Record<string, LoydIssue[]>;

export interface UseFormOptions<T extends Record<string, unknown>> {
  schema: LoydSchema<T>;
  defaultValues?: Partial<T>;
  mode?: "onChange" | "onBlur" | "onSubmit";
  revalidateMode?: "onChange" | "onBlur";
  dagOptions?: DagBuildOptions;
  asyncOptions?: ParseAsyncOptions;
  asyncDebounceMs?: number;
}

export interface RegisterReturn {
  name: string;
  ref: (el: any) => void;
  onChange: (e: any) => void;
  onBlur: (e: any) => void;
}

export interface SetValueOptions {
  shouldDirty?: boolean;
  shouldTouch?: boolean;
  shouldValidate?: boolean;
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  state: FormState<T>;
  register(name: string): RegisterReturn;
  setValue(name: string, value: unknown, options?: SetValueOptions): void;
  setValues(values: Partial<T>, options?: SetValueOptions): void;
  setTouched(name: string, touched?: boolean): void;
  trigger(name?: string | string[]): Promise<boolean>;
  reset(values?: Partial<T>): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSubmit(onValid: (data: T) => void | Promise<void>, onInvalid?: (errors: FormErrors) => void): (e: any) => void;
  getFieldError(name: string): LoydIssue | undefined;
  getFieldErrors(name: string): LoydIssue[];
  isFieldDirty(name: string): boolean;
  isFieldTouched(name: string): boolean;
}

export declare function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T>;
