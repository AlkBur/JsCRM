# Synchronization & Migration Engine (FUTURE)

## Principle

SQL must never be generated directly from MetadataModel.
1C metadata is not SQL metadata. SQL must be generated from a Canonical Model.

## Canonical pipeline

```
1C → MetadataModel → Canonical Model (DB-agnostic) → MetadataDiff → MigrationPlan → SqlGenerator → PostgreSQL / SQLite / MSSQL
```

## Snapshot rules

- Snapshots are immutable. Existing snapshots must never be modified.
- Every export creates a new timestamped snapshot (e.g. `snapshot-2026-06-04/`).
- Immutability enables rollback, diff history, CI replay.

## Core types

- `Snapshot` — immutable versioned export state (metadata + program)
- `MetadataDiffer` — old MetadataModel vs new MetadataModel → MetadataDiff
- `MetadataDiff` — structural changes (added/removed/changed catalogs, attributes, types)
- `MigrationPlanner` — MetadataDiff → ordered list of migration operations
- `SqlGenerator` — MigrationPlan → target-DB-specific SQL statements
- `CanonicalField` — DB-agnostic field model between Metadata and SQL

## Architectural boundaries

- Synchronization Engine is independent from VM and Web IDE.
- It depends on Metadata v2, SymbolIndex, DependencyGraph.
- Not before Layer 7 (Metadata v2 with attributes and tabular parts).
