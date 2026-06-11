# AGENTS.md — JsCRM (1C Clone) Work Plan

## Mission

Build a working 1C-platform compatible runtime in Bun/TypeScript/SQLite.
Primary source of truth: **IR v1** — a frozen JSON-based Intermediate Representation.

## Current Status

**91 tests, 0 failures (bun test) + 50 golden tests (compat runner).**  
IR v1 frozen. VM split into 11 single-responsibility modules.  
`bun run typecheck` → 0 errors. CI: `install → typecheck → test`.

## Consumer Signal

```
Signal #1: "Хочу увидеть настоящий интерфейс 1С в Web"

  Round 1: Forms read-only                     ✅
  M2: Editable Forms                           ✅
    Цель: открыть карточку → изменить → сохранить
  M3: TabularSection read-only                 ✅

  M4A: UI Components Layer                     ✅
    controls/  — pure presentational components
    elements/  — JSON-aware component mapping
    renderers/ — FormElementRenderer (view → component)
    gallery/   — ComponentGallery (visual test stand)

  M4B: Metadata-aware Rendering                ✅
    types-metadata.ts, resolveAttribute, UIContext

  M4C: Migration to DefaultFormView            ✅
  M5: Editable rows                            pending
  M6: DynamicList                              pending
  M7: Session + Login + MainWindow             pending
  M8: Commands                                 pending
  M9: Partial UI updates                       pending
  M10: SQL SnapshotStore                       pending
  M11: Exchange                                pending
```

## Architecture Layers

```
Layer  1  IR v1 (frozen)                    ✅
Layer  2  VM + Golden Tests                 ✅
Layer  3  Runtime + Multi-module            ✅
Layer  4  Metadata                          ✅
Layer  5  Symbol Index                      ✅
Layer  6  Dependency Graph                  ✅
Layer  7  Metadata v2                       ✅
Layer  8  LSP (Navigation Core, Phase 8.1)   ✅
Layer  9  Explorer v1 (CSR, read-only)       ✅
         Forms Phase 1 (types + projection) ✅
         Forms Phase 2 (FormIndex)           ✅
         Forms Phase 3 (Tree + REST)         ✅
         Forms Phase 4 (FormRenderer)        ✅
         Actions + Session                  🔄
         FormState + SnapshotStore          🔄
         GeneratedFormBuilder               🔄
         FormResolver                       🔄
         UI Components Layer (M4A)           ✅
         Metadata-aware Rendering (M4B)      ✅
         DefaultFormView + DTO (M4C)         ✅
Layer 10  Synchronization & Migration        ← FUTURE
```

## Stack

- **Runtime**: Bun 1.3.14
- **Language**: TypeScript (strict, `noUncheckedIndexedAccess: true`)
- **Database**: SQLite (bun:sqlite)
- **Validation**: ajv (JSON Schema)
- **Client**: Vite 6, TypeScript, CSS Modules, Design Tokens

### UI Framework Policy

React is the default framework for Layer 9.  
Rationale: Monaco ecosystem, LSP tooling, IDE components, AI-assisted development.

Alternative UI frameworks (Svelte, Solid, Vue) are allowed only if they remain
thin projections over the Index Layer and do not introduce new sources of truth.

## AI-Oriented Architecture

### File size policy

- 50–150 lines — ideal
- 150–250 lines — acceptable
- 250–400 lines — review periodically
- >400 lines — split by responsibility

Large files allowed only for: frozen legacy, generated files, schemas, tests.

### One concept per file

Files are split by responsibility, not by size.

Good: `executeStmt.ts`, `executeExpr.ts`, `callFunction.ts`  
Bad: `vm-part1.ts`, `vm-utils.ts`, `helpers.ts`, `common.ts`

### Import graph policy

Dependencies must point inward. Circular imports are forbidden.  
Runtime recursion is allowed (call → executeRoutine → execStmts → call).

### Mutable state policy

Mutable state must be centralized in context objects.

Good: `evalExpr(ctx, expr)` where `ctx: VmContext`  
Bad: `evalExpr(vm, expr)` where submodule accesses `vm.vars` directly

### Context Objects

Submodules must not access VM internals directly. All var/result operations
go through `scope.ts` functions (`getVar`, `setVar`, `pushScope`, `restoreScope`).

### Public API Rule

Directories expose a single public entrypoint via `index.ts`.

Good: `import { VM } from "./vm"`  
Bad: `import { execStmt } from "./vm/executeStmt"`

Submodules are internal implementation details.

### Extension Points

Cross-cutting concerns must have dedicated extension points.  
Examples: `executeRoutine.ts` (debugger/tracing/profiler/call stack in future),
`Workspace` (loading composition), `TreeBuilder` (metadata projection).

New functionality should be added to extension points instead of spreading
logic across the system.

### Utility Files

Generic files are forbidden. Do not create `utils.ts`, `helpers.ts`,
`common.ts`, `misc.ts`, `shared.ts`. Every file must have a single
explicit responsibility.

### Consumer-driven evolution

Do not introduce new models without consumers.  
Prefer: new query → new index → new adapter.  
Avoid: new layer, new source of truth, schema inflation.

### Architectural Evolution

When adding functionality:
1. Prefer new queries over new models
2. Prefer new modules over growing existing modules
3. Prefer extension points over distributed logic
4. Prefer composition over inheritance
5. State duplication is forbidden
6. Alternative sources of truth are forbidden

New architectural changes require one of:
- external consumer demand
- inability to implement a feature inside existing boundaries
- measurable performance bottleneck

Architecture must not evolve without pressure. Stability is preferred over elegance.

## Storage Policy

Storage implementations are adapters. Domain and UI must not depend on JSON or SQL.
Start with FilesystemSnapshotStore. Introduce SqlSnapshotStore only when query complexity justifies it.

## Forms / Snapshots Ownership

Forms own layout. Snapshots own values. FormStateStore is the only bridge between them.

UI → FormStateStore → SnapshotStore. UI never knows where data comes from.

## Error Handling Policy

Projection layers may degrade gracefully.
Execution layers must fail fast.

Invalid or incomplete source data may be filtered when building projections,
but execution components (VM, runtime, builtins) must never silently ignore
errors or substitute missing behavior.

## Forms Policy

**Forms are optional.** Rendering priority:
1. Explicit form JSON (`export/forms/{kind}/{object}/{name}.json`).
2. Generated form from metadata (`GeneratedFormBuilder`).
3. Render error.

Generated forms are adapter-level projections and do not become part of MetadataModel.

GeneratedFormBuilder produces item form ("ФормаЭлемента") only — group "Основное",
all attributes, buttons "Записать"/"Закрыть". List forms are M3.

FormResolver is the bridge: queries FormIndex first, falls back to GeneratedFormBuilder.

## Data Evolution Rule

New relationships (owner, parent, references) should be added to snapshot values
immediately when available, even if no consumer exists yet. These fields are part
of the object model and do not constitute premature architecture.

## Task-oriented navigation

| To change | Look here |
|-----------|-----------|
| VM execution | `src/vm/`, `runtime/`, `builtins/` |
| Metadata | `metadata/` |
| FormProjection | `src/forms/` |
| Action System | `src/actions/` |
| Session | `src/session/` |
| FormState / SnapshotStore | `src/snapshots/`, `src/forms/form-state.ts` |
| Form Screen DTO | `src/forms/form-screen-types.ts` |
| Generated forms | `src/generated-forms/` |
| Core utilities | `src/core/` (`parseObjectName`, `buildObjectName`) |
| Navigation | `SymbolIndex`, `DependencyGraph`, `LocationIndex` |
| LSP | `lsp/` |
| UI Controls | `client/src/components/controls/` |
| UI Elements (JSON layer) | `client/src/components/elements/` |
| UI Renderers | `client/src/components/renderers/` |
| UI Gallery | `client/src/components/demo/` |
| Explorer UI | `tree-builder.ts`, `client/` |
| Benchmarks | `bench/` |
| Workspace composition | `Workspace.ts`, `WorkspaceLoader.ts` |

## Extension Points

New functionality should extend `builtins/`, `runtime/`, indexes, or adapters.
Avoid creating new global models.

## IR Policy

IR v1 is frozen. Allowed: builtins, runtime objects, tests.  
Forbidden: new nodes, field renames, semantic changes, normalizers.  
Exporter must match schema exactly.

Full spec: [docs/ir-v1-contract.md](docs/ir-v1-contract.md)

## Testing Strategy

- `bun test` — unit + integration (91 tests)
- `bun run compat/runner.ts` — golden IR fixtures vs 1C reference (50 tests)
- IR validation on every fixture load via ajv

## Performance Benchmarking

```
bun run bench/runner.ts        — run, compare vs baseline
bun run bench/runner.ts --save — update baseline after intentional changes
```

Rules: baseline is pinned, >10% deviation invalidates comparison,
10 iteration warmup required, diagnostic tool not CI gate.

## Verification Gates (CI)

`.github/workflows/ci.yml`: `bun install` → `bun run typecheck` → `bun test`

## What NOT to build yet

- Web IDE (Layer 9)
- Synchronization Engine (Layer 10)
- DynamicList / QueryRuntime (M6)
- Virtual Scroll / ViewportManager
- Table parts (ТЧ)
- Full type system
- Do not generate SQL directly from MetadataModel
- Screens (login, desktop — M7)
- Session auth (tokens, LDAP, permissions — M7)
- SQL backend (M10)
- WebSocket / live sync
- Complex layout engine v2

## UI Architecture Rules

```
controls/  — Pure presentational components.
             Must not import form-types, metadata types,
             ActionDispatcher, REST clients or Session.

elements/  — JSON-aware component mapping.
             May depend on form-types.
             Must not import REST clients or Session.

renderers/ — Only map view → element component.

views/     — May orchestrate context, state and actions.
```

## Startup Policy

Клиент никогда не знает стартовую форму.  
Клиент спрашивает сервер (`GET /api/startup`), какую форму открыть первой.

Сейчас `GET /api/startup` возвращает `{ form: "System.Start" }`.  
В будущем Session.mode или код запуска будет определять `System.Login | System.MainWindow | ...`.

Всегда используется универсальный `GET /api/form/:path` для загрузки любой формы,  
включая System-формы (`System.Start`) и объектные (`Catalog.X.ФормаЭлемента`).

## Export Policy

The `export/` directory is managed by the user (metadata, forms, data, IR).
Do NOT edit any file under `export/`. If changes are needed, inform the user.

## Code Conventions

- Comments describe architecture decisions ("why"), not implementation ("what")
- Single-file per concept
- Prefer `const` over `let`, avoid `any`
- Error messages in Russian

## Documentation

Start here, then follow links:

| Document | Purpose |
|----------|---------|
| [architecture-map](docs/architecture-map.md) | **Start here** — where to change things, ownership, composition roots |
| [architecture-style](docs/architecture-style.md) | Query-driven platform, layers, index rules, adapter rules |
| [ir-v1-contract](docs/ir-v1-contract.md) | Full IR v1 specification (frozen) |
| [workspace-contract](docs/workspace-contract.md) | Workspace composition root rules |
| [index-layer-contract](docs/index-layer-contract.md) | Index responsibilities, prohibitions, invariants |
| [lsp-roadmap](docs/lsp-roadmap.md) | LSP phases, constraints, excluded features |
| [tree-projection-contract](docs/tree-projection-contract.md) | TreeNode, TreeBuilder, CSR rendering rules |
| [sync-engine](docs/sync-engine.md) | Synchronization pipeline (future) |
| [architecture-stable-release-0](docs/architecture-stable-release-0.md) | ASR-0 baseline freeze |
