# Architecture Map

Start here when making changes. Links to specialized contracts in `docs/`.

## Where to change things

| Area | Location | Contracts |
|------|----------|-----------|
| VM execution | `src/vm/`, `runtime/`, `builtins/` | [ir-v1-contract](ir-v1-contract.md) |
| Metadata | `metadata/` | — |
| Navigation | `SymbolIndex`, `DependencyGraph`, `LocationIndex` | [index-layer-contract](index-layer-contract.md) |
| LSP | `lsp/` | [lsp-roadmap](lsp-roadmap.md) |
| Explorer UI | `tree-builder.ts`, `client/` | [tree-projection-contract](tree-projection-contract.md) |
| Benchmarks | `bench/` | — |
| Workspace composition | `Workspace.ts`, `WorkspaceLoader.ts` | [workspace-contract](workspace-contract.md) |
| Synchronization | `sync/` (future) | [sync-engine](sync-engine.md) |

## Ownership Map

- **Program** — owns modules and routine registry
- **MetadataModel** — owns structural metadata
- **SymbolIndex** — owns symbol lookup
- **DependencyGraph** — owns call graph queries
- **LocationIndex** — owns URI/range mapping
- **MetadataIndex** — owns attribute search
- **Workspace** — composes all sources and indexes
- **TreeBuilder** — builds TreeNode projection
- **VM** — executes Program
- **LSP** — serves navigation requests
- **Explorer UI** — renders projections

## Composition Roots

- `WorkspaceLoader.ts` — builds Workspace (Program + MetadataModel + indexes)
- `server.ts` — builds HTTP adapter (REST API)
- `lsp/server.ts` — builds LSP adapter (JSON-RPC)
- `compat/runner.ts` — builds compatibility runner (VM + golden tests)
- `bench/runner.ts` — builds benchmark harness

## Project structure

```
/ir             IR v1 contract (frozen)
/fixtures       Golden IR fixtures
/export         1C exporter output (IR + results)
/metadata       MetadataModel, MetadataIndex, FieldType
/symbols        SymbolKind, SymbolInfo
/compat         Compatibility runner
/runtime        RuntimeObject types, BuiltinRegistry
/builtins       Builtin functions (14)
/src/vm/        VM (executeStmt, executeExpr, callFunction, ...)
/src/           Program, Workspace, SymbolIndex, DependencyGraph, LocationIndex, server, tree-builder
/lsp            Language Server (JSON-RPC, definition, references)
/bench          Performance benchmarks (regression harness)
/docs           Architecture contracts
/client         React + Vite Explorer UI
/sync           Synchronization Engine (future)
/tests          Unit + integration tests
```

## Architecture layers

```
Execution Layer:      Program + VM
Structural Layer:     MetadataModel
Index Layer:          SymbolIndex, MetadataIndex, DependencyGraph, LocationIndex
Adapter Layer:        LSP, REST API, Explorer UI
Projection Layer:     Sync Engine, SQL (future)
```

For detailed rules see [architecture-style](architecture-style.md).
