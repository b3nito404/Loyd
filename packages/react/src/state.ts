import type { LoydIssue } from "@loydjs/core";
export interface FormStore<T extends Record<string, unknown>> {
  values: T;
  errors: Map<string, LoydIssue[]>;
  touched: Set<string>;
  dirty: Set<string>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
}
export function createFormStore<T extends Record<string, unknown>>(defaultValues: T): FormStore<T> {
  return {
    values: { ...defaultValues },
    errors: new Map(),
    touched: new Set(),
    dirty: new Set(),
    isSubmitting: false,
    isSubmitted: false,
    submitCount: 0,
  };
}
export function getFieldErrors(
  store: FormStore<Record<string, unknown>>,
  name: string,
): LoydIssue[] {
  return store.errors.get(name) ?? [];
}
export function getFieldError(
  store: FormStore<Record<string, unknown>>,
  name: string,
): LoydIssue | undefined {
  return (store.errors.get(name) ?? [])[0];
}
