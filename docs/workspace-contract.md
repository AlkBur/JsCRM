# Workspace Contract

Workspace is the composition root of the platform.

## Workspace owns

- Program
- MetadataModel
- SymbolIndex
- MetadataIndex
- DependencyGraph
- LocationIndex
- WorkspaceStats (readonly, computed once at construction)

## Rules

- Workspace contains no business logic and no I/O.
- I/O is the responsibility of WorkspaceLoader (loadWorkspace).
- All adapters (LSP, REST, Bench, Explorer, Sync Engine) must depend on Workspace
  instead of assembling indexes manually.

## LSP / Navigation Layer Rules

- LSP is index-driven, NOT IR-driven.
- LSP MUST NOT perform full IR traversal per request.
- All queries must be served from precomputed indexes:
  SymbolIndex, DependencyGraph, LocationIndex.
- LSP MUST NOT reconstruct semantics from IR. Any semantic query must be
  answered by DependencyGraph, SymbolIndex, or LocationIndex.
