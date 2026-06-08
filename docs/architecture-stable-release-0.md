# Architecture Stable Release 0 (ASR-0)

**Date:** 2026-06-04
**Status:** FROZEN

## Summary

JsCRM has reached an internal architecture convergence point. All core layers are complete, stable, and formally contracted. The system is not driven by external consumers — no further expansion is justified without a demand signal.

## Layers completed

| Layer | Status | Notes |
|-------|--------|-------|
| 1. IR v1 | FROZEN | Schema + validator, no IRv2 allowed |
| 2. VM + Golden Tests | STABLE | 91 unit tests, 50 golden (compat runner) |
| 3. Runtime + Multi-module | STABLE | Program, RuntimeStructure, RuntimeArray |
| 4. Metadata v1 | FROZEN | Schema, types, MetadataModel |
| 5. Symbol Index | STABLE | SymbolIndex with `SymbolSpace` (runtime / metadata) |
| 6. Dependency Graph | STABLE | Extended: findPath, getReachableFrom, detectCycles |
| 7. Metadata v2 | STABLE | FieldType discriminated union, MetadataIndex |
| 8.1 LSP Navigation Core | STABLE | stdio transport, LocationIndex, definition + references |

## Index Layer contract

- All indexes are **derived**: rebuilt from Program + MetadataModel, never mutated.
- All indexes are **query-only**: no write-back path, no side effects.
- LSP is **index-driven**: no IR traversal, no AST reconstruction.
- Indexes are **independent**: no shared domain models, no inference between them.
- See `docs/index-layer-contract.md` for full specification.

## What is intentionally excluded

- LSP Phase 8.2+ (document layer, hover, diagnostics, workspace symbols)
- Web IDE (Layer 9)
- Synchronization Engine (Layer 10)
- New 1C export expansions (object modules, commands, synonyms, forms)
- Union expansion in metadata
- UI layers of any kind

## Expansion rule

> **No new capabilities without an external consumer requirement.**

All future extensions must be triggered by a real downstream consumer:
- Editor integration (LSP client)
- Live diagnostics demand
- SQL/Sync pipeline
- Web IDE

Extensions driven by "model beauty" or "completeness" are forbidden.

## Test statistics

- `bun test`: 91 tests, 0 failures (8 test files)
- `compat/runner`: 50/50 golden tests, 0 failures
- Total routines in export: 55
- DependencyGraph nodes: 55
- SymbolIndex entries: 75
- LocationIndex entries: 55
