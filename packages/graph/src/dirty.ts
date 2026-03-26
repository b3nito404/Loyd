export interface DirtyTracker {
  markDirty(path: string[]): void;
  markClean(path: string[]): void;
  markAllDirty(): void;
  markAllClean(): void;
  isDirty(path: string[]): boolean;
  getDirtyPaths(): string[][];
  readonly hasDirtyFields: boolean;
}

export declare function createDirtyTracker(): DirtyTracker;
