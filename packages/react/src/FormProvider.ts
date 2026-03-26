import type { UseFormReturn } from "./useForm.js";
// React typed loosely until @types/react is available
export interface FormProviderProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>;
  children: unknown;
}

export declare function FormProvider<T extends Record<string, unknown>>(
  props: FormProviderProps<T>
): unknown;

export declare function useFormContext<T extends Record<string, unknown>>(): UseFormReturn<T>;
