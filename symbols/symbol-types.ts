// Symbol types for SymbolIndex — a searchable index of all named entities.
//
// SymbolIndex is a flat name→kind mapping. It stores no references to
// Routine, MetadataObjectInfo, or any other runtime/metadata types.
//
// Responsibility: define the lightweight symbol contract for Layer 5.
// Non-responsibility: source locations, UUIDs, dependency graph, type info.

export type SymbolKind =
  | "module"
  | "function"
  | "procedure"
  | "catalog"
  | "document"
  | "enumeration";

export interface SymbolInfo {
  readonly name: string;
  readonly kind: SymbolKind;
  readonly moduleName?: string;
}
