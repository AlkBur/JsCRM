# LSP Roadmap (8.1 → 8.4)

## Architecture invariant (across ALL phases)

```
LSP MUST NOT introduce new semantic concepts not present in Index Layer.
All phases add query capability, NOT new source of truth.
All phases are thin adapters over existing indexes.
No IR parsing, no AST reconstruction inside LSP.
```

## Phase 8.1 — Static LSP Core (DONE)

- `initialize` — capabilities (definitionProvider, referencesProvider)
- `textDocument/definition` — location lookup via `LocationIndex`
- `textDocument/references` — caller lookup via `DependencyGraph`
- `workspace/symbol` — stub (returns null)
- `textDocument/hover` — stub (returns null)

**Guarantees:** index-only, no IR traversal, no document state.

## Phase 8.2 — Document Layer (NEXT)

- `didOpen` / `didChange` — basic document lifecycle
- Document cache: URI → module mapping

**Critical constraints:**
- Document cache is **NOT a model of truth.**
- It is **only a routing layer** to `Program` / IR.
- No incremental IR parsing.
- No mutation of `Program`.

## Phase 8.3 — UI Intelligence

- `textDocument/hover` — show symbol info from `SymbolIndex`
- `workspace/symbol` — full symbol list from `SymbolIndex`
- `textDocument/documentSymbol` — module-level symbols

**Critical constraint:**
- No new semantic concepts beyond what `SymbolIndex` / `DependencyGraph` / `LocationIndex` already provide.

## Phase 8.4 — Diagnostics

- `textDocument/publishDiagnostics` — push to client
- Cycle detection → `DependencyGraph.detectCycles()`
- Unused routine detection → `DependencyGraph.findUnused()`
- Reachability warnings → `DependencyGraph.getReachableFrom()`

**Critical constraint:**
- Diagnostics are snapshot-based, NOT incremental.
- No incremental analysis until `Live Document Mode` is formally designed.

## What is intentionally excluded

| Feature | Reason |
|---------|--------|
| Code actions / completions | Requires semantic model beyond Index Layer |
| Formatting / refactoring | Requires IR mutation which is frozen |
| Rename symbol | Requires full semantic model + cross-reference index |
| Incremental AST | Would require IR v2 or separate AST layer |
| `didClose` / force reload | Not needed until multi-file editing is active |
