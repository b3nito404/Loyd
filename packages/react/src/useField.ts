import type { LoydIssue } from "@loydjs/core";
import type { ChangeEvent, FocusEvent } from "react";

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
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
}

export declare function useField<T = unknown>(name: string): UseFieldReturn<T>;
