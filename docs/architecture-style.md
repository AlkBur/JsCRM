# Architecture Style

JsCRM is a query-driven platform.

- Program and MetadataModel are immutable sources of truth.
- Indexes are derived immutable projections.
- Adapters (LSP, Web UI, SQL, Synchronization) are thin layers over indexes.
- New features should introduce new queries, not new models.
- State duplication is forbidden.
- No layer may become an alternative source of truth.

## Data layers

```
IR → execution layer
Metadata → structural layer
Index → search/navigation layer
```

These layers are independent and must not be mixed.
- IR contains executable logic.
- Metadata contains object structure (no execution logic or runtime concepts).
- Index contains searchable names only.

## Updated layer model

```
Execution Layer      Program + VM
Structural Layer     MetadataModel
Index Layer          SymbolIndex, MetadataIndex, DependencyGraph, LocationIndex
Adapter Layer        LSP, REST API, Explorer UI
Projection Layer     Sync Engine, SQL (future)
```

## Adapter Layer

Adapters translate external protocols into index queries.

Rules:
- contain no business logic
- contain no source of truth
- never modify indexes
- never reconstruct semantics from IR

## Source of truth vs derived indexes

`Program` and `MetadataModel` are immutable sources of truth.

`SymbolIndex`, `MetadataIndex`, `DependencyGraph`, and `LocationIndex` are derived
structures. They contain no source of truth and can always be rebuilt from
`Program` and `MetadataModel`.

## Execution must not depend on indexes

- VM depends on Program, BuiltinRegistry.
- VM does not depend on SymbolIndex, MetadataIndex, or DependencyGraph.
- Indexes are optimization and navigation layers only.

## Index Layer

Composed of:
- **SymbolIndex** — name → `{kind, space, module}`
- **DependencyGraph** — caller/callee edges across routines
- **LocationIndex** — name → `{URI, range}`
- **MetadataIndex** — attribute-level search within metadata

Properties:
- All indexes are precomputed once at startup
- All indexes are immutable and query-only
- All indexes are derived from `Program` and `MetadataModel`
- LSP and Web IDE MUST use indexes only, NEVER raw IR/AST
- Indexes contain no source of truth — can always be rebuilt
- Indexes are monotonic: rebuilt, never mutated
- Indexes MUST NOT infer missing semantic information — they only index existing explicit data

## DependencyGraph Rules

- DependencyGraph is IR-only.
- DependencyGraph does not analyze metadata, command handlers, forms, or attributes.
- Metadata dependencies are modeled separately and must not be mixed with IR call dependencies.
- Metadata-to-IR edges (command handler → routine) are excluded from DependencyGraph. They are handled in Layer 8+ (Language Server).

## SymbolIndex Rules

- SymbolIndex contains top-level symbols only:
  `module` | `function` | `procedure` | `catalog` | `document` | `enumeration`
- Attributes, forms, commands and tabular sections belong to `MetadataIndex`.
- SymbolIndex is derived from `Program` and `MetadataModel` only.
- Symbol names are unique within SymbolIndex. Duplicate symbols are errors.
- Every symbol has a `space` field: `"runtime"` (from Program) or `"metadata"` (from MetadataModel).
  Program is the runtime universe; MetadataModel is the structural universe. They never merge.
- `SymbolSpace` has two values: `runtime | metadata`. No `combined`.
