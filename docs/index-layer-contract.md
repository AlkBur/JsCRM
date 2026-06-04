# Index Layer Contract

## 1. What is the Index Layer

The Index Layer is a set of derived, immutable, query-only structures built from `Program` and `MetadataModel`.

**Four indexes:**

| Index | Responsibility | Query type |
|-------|---------------|------------|
| `SymbolIndex` | name → `{kind, space, module}` | lookup |
| `DependencyGraph` | caller/callee edges across routines | traversal |
| `LocationIndex` | name → `{uri, range}` | navigation |
| `MetadataIndex` | attribute-level search within metadata | metadata search |

## 2. Data contracts (no shared domain)

Each index defines its **own data contract**. No shared domain models between indexes.

- `SymbolIndex` owns `SymbolInfo` (`name`, `kind`, `space`, `moduleName`).
- `DependencyGraph` owns adjacency maps (`outgoing`, `incoming`, `allNodes`).
- `LocationIndex` owns `LSPLocation` (`uri`, `range`).
- `MetadataIndex` owns `AttributeIndexEntry`.

`SymbolIndex` node space ≠ `DependencyGraph` node space ≠ `LocationIndex` identity space.

## 3. Source of truth

`Program` and `MetadataModel` are the **only mutable sources of truth** in the system.
They are immutable after load.

All indexes are derived projections with **no write-back path**.
No index can modify `Program` or `MetadataModel`.

## 4. Prohibitions (hard contract)

- **No overlap in responsibility.** Indexes must not answer questions assigned to another index.
- **No inference.** Indexes must not infer data from each other. Each index is built from `Program`/`MetadataModel` independently.
- **No IR semantics reconstruction.** Indexes must not reverse-engineer IR structure, resolve names semantically, or rebuild AST.
- **No source of truth.** No index is allowed to become a primary data store.
- **No write-back.** LSP and Web IDE must never write through indexes back to `Program` or `MetadataModel`.

## 5. Monotonicity

- Indexes are **rebuild-only**, never mutated in place.
- Incremental updates are forbidden until a formal `Live Document` phase (see LSP roadmap).
- Rebuilding is always from `Program` + `MetadataModel` — never from another index.

## 6. LSP rule

```
LSP MUST NOT use IR traversal.
LSP MUST NOT reconstruct AST.
LSP MUST rely exclusively on indexes.
```

All LSP queries must be served from precomputed indexes: `SymbolIndex`, `DependencyGraph`, `LocationIndex`, `MetadataIndex`.
