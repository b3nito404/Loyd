import { pathToKey } from "./dag.js";
export interface DirtyTracker {
  markDirty(path: string[]): void;
  markClean(path: string[]): void;
  markAllDirty(paths: string[][]): void;
  markAllClean(): void;
  isDirty(path: string[]): boolean;
  getDirtyPaths(): string[][];
  readonly hasDirtyFields: boolean;
}
export function createDirtyTracker(): DirtyTracker {
  const dirty = new Set<string>();
  return {
    markDirty(path) {
      dirty.add(pathToKey(path));
    },
    markClean(path) {
      dirty.delete(pathToKey(path));
    },
    markAllDirty(paths) {
      for (const p of paths) dirty.add(pathToKey(p));
    },
    markAllClean() {
      dirty.clear();
    },
    isDirty(path) {
      return dirty.has(pathToKey(path));
    },
    getDirtyPaths() {
      return [...dirty].map((k) => k.split("."));
    },
    get hasDirtyFields() {
      return dirty.size > 0;
    },
  };
}
