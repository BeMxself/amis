declare function componentClass(name: string): string;
declare function componentSelector(selector: string): string;
declare function normalizeSnapshotClassPrefixes(value: string): string;

declare namespace NodeJS {
  interface Global {
    componentClass: typeof componentClass;
    componentSelector: typeof componentSelector;
    normalizeSnapshotClassPrefixes: typeof normalizeSnapshotClassPrefixes;
  }
}
