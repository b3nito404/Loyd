import type { LoydIssue } from "@loyd/core";

export interface FieldArrayItem<T> {
  id: string;
  value: T;
  errors: LoydIssue[];
  isTouched: boolean;
  isDirty: boolean;
}

export interface UseFieldArrayReturn<T> {
  fields: FieldArrayItem<T>[];
  append(value: T | T[]): void;
  prepend(value: T | T[]): void;
  insert(index: number, value: T): void;
  remove(index: number): void;
  removeMany(indexes: number[]): void;
  swap(indexA: number, indexB: number): void;
  move(from: number, to: number): void;
  update(index: number, value: T): void;
  replace(values: T[]): void;
  reset(): void;
  errors: LoydIssue[];
}

/**
 * Hook for managing dynamic lists in a Loyd form.
 * Each item is validated individually by the scheme.
 *
 * @example
 * const InvoiceSchema = object({
 *   lines: array(object({
 *     description: string(),
 *     quantity: number().int().positive(),
 *     unitPrice: number().positive(),
 *   })),
 * });
 *
 * function InvoiceLines() {
 *   const { fields, append, remove } = useFieldArray<InvoiceLine>("lines");
 *   return (
 *     <>
 *       {fields.map((field, i) => (
 *         <LineRow key={field.id} index={i} onRemove={() => remove(i)} />
 *       ))}
 *       <button onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
 *         Add line
 *       </button>
 *     </>
 *   );
 * }
 */
export declare function useFieldArray<T>(name: string): UseFieldArrayReturn<T>;
