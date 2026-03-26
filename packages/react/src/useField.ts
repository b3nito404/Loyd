import type { LoydIssue } from "@loyd/core";

export interface FieldState<T = unknown> {
  value: T;
  errors: LoydIssue[];
  error: LoydIssue | undefined;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  isValid: boolean;
}

export interface UseFieldReturn<T = unknown> {
  state: FieldState<T>;
  onChange(value: T): void;
  onBlur(): void;
  validate(): Promise<boolean>;
  reset(): void;
  inputProps: {
    value: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBlur: (e: any) => void;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
}

export declare function useField<T = unknown>(name: string): UseFieldReturn<T>;
