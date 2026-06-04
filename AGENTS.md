# AGENTS.md — JsCRM (1C Clone) Work Plan

## 🎯 Mission

Build a working 1C-platform compatible runtime in Bun/TypeScript/SQLite.
Primary source of truth: **IR v1** — a JSON-based Intermediate Representation for 1C:Enterprise code.

### Long-term architecture
```
                Workspace
                     │
        ┌────────────┴────────────┐
        │                         │
    Sources of truth          Index Layer
 Program + MetadataModel           │
                                   │
          ┌──────────────┬─────────┴──────────┐
          │              │                    │
         VM             LSP               Explorer
          │              │                    │
          └──────────────┴────────────────────┘
                             │
                        Sync Engine
                             │
                            SQL
```
Synchronization & Migration Engine (Layer 10) orchestrates the full pipeline.

## ✅ Current Status

IR v1 schema finalized and **frozen**. Exporter produces valid IR.

**91 tests, 0 failures (bun test) + 50 golden tests (compat runner).**

## Runtime Layer Rules

- Runtime objects are first-class entities
- VM must never use raw JS objects or arrays to represent 1C runtime types
- Every runtime object must implement `RuntimeObject` and expose `typeName`
- Builtins are registered via `BuiltinRegistry`, never hardcoded in VM

### Program invariants
- Program is immutable after loading
- Program owns modules and routine registry
- VM never stores routines itself
- All function resolution goes through `resolveFunction()`
- Duplicate routine names are fatal configuration errors (throw `DuplicateRoutineError`)

## Architecture Layers

```
Layer 1  IR v1 (frozen)                   ✅ DONE
Layer 2  VM + Golden Tests                ✅ DONE
Layer 3  Runtime + Multi-module           ✅ DONE
Layer 4  Metadata                         ✅ DONE
Layer 5  Symbol Index                     ✅ DONE
Layer 6  Dependency Graph (queries)        ✅ DONE
Layer 7  Metadata v2                       ✅ DONE
Layer 8  Language Server (Navigation Core) ✅ DONE (Phase 8.1)
Layer 9  Explorer + Web IDE                 ← TBD
Layer 10 Synchronization & Migration       ← FUTURE
```

## 🏛️ Architectural Style

JsCRM is a query-driven platform.

- Program and MetadataModel are immutable sources of truth.
- Indexes are derived immutable projections.
- Adapters (LSP, Web UI, SQL, Synchronization) are thin layers over indexes.
- New features should introduce new queries, not new models.
- State duplication is forbidden.
- No layer may become an alternative source of truth.

## 🏛️ Architecture Principles

### Data layers
```
IR → execution layer
Metadata → structural layer
SymbolIndex → search/navigation layer
```

These layers are independent and must not be mixed.
- IR contains executable logic.
- Metadata contains object structure (no execution logic or runtime concepts).
- SymbolIndex contains searchable names only.

Updated layer model:

```
Execution Layer
    Program + VM

Structural Layer
    MetadataModel

Index Layer
    SymbolIndex
    MetadataIndex
    DependencyGraph
    LocationIndex

Adapter Layer
    LSP
    REST API
    Explorer UI

Projection Layer (future)
    Sync Engine
    SQL
```

### Adapter Layer
Adapters translate external protocols into index queries.

Examples:
- LSP (JSON-RPC → SymbolIndex, LocationIndex, DependencyGraph)
- REST API (HTTP → all indexes)
- Explorer UI (React → REST API → indexes)
- Synchronization Engine (MetadataModel → Canonical Model → SQL)

Adapter rules:
- contain no business logic
- contain no source of truth
- never modify indexes
- never reconstruct semantics from IR

### Source of truth vs derived indexes
`Program` and `MetadataModel` are immutable sources of truth.

`SymbolIndex`, `MetadataIndex`, `DependencyGraph`, and `LocationIndex` are derived structures.
They contain no source of truth and can always be rebuilt from `Program` and `MetadataModel`.

### Execution must not depend on indexes
- VM depends on Program, BuiltinRegistry.
- VM does not depend on SymbolIndex, MetadataIndex, or DependencyGraph.
- Indexes are optimization and navigation layers only.

### Index Layer (derived models)
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

## 📁 Project Structure

```
/ir                       ← IR v1 contract (FROZEN)
  ir-schema-v1.json       — JSON Schema (additionalProperties: false)
  ir-types.ts             — TS interfaces matching schema
  ir-validator.ts         — ajv validator (used at IR load time)

/fixtures                 ← Golden IR fixtures for testing
  arithmetic.json
  function-call.json
  object-member.json

/export                   ← 1C exporter output (IR + test results)
  manifest.json           — versioned module index
  ir/*.json
  tests/*.results.json

/metadata                 ← Metadata Layer
  metadata-schema-v1.json — JSON Schema (additionalProperties: false)
  metadata-schema-v2.json — JSON Schema v2 (attributes, ТЧ, forms, commands)
  metadata-types.ts       — v1 TS types (frozen)
  metadata-types-v2.ts    — v2 TS types (FieldType discriminated union)
  MetadataModel.ts        — Immutable model (auto-detects v1/v2)
  MetadataIndex.ts        — Attribute-level search (Layer 7)

/symbols                  ← Symbol types (Layer 5)
  symbol-types.ts         — SymbolKind + SymbolInfo

/compat                   ← Compatibility Runner
  runner.ts               — load export/ → VM → diff with 1C reference results

/compat-reports           ← Generated compat reports

/runtime                  ← Runtime Layer
  types.ts                — Value type + RuntimeObject interface
  BuiltinRegistry.ts      — Builtin function registry
  RuntimeStructure.ts     — Structure object (Map<string, Value>)
  RuntimeArray.ts         — Array object (Value[])

/builtins
  index.ts                — 14 builtin functions (СтрДлина, Дата, ...)

/src                      ← Runtime implementation
  Program.ts              — Multi-module container (manifest loader + routine registry)
  Workspace.ts             — Workspace interface (composition root)
  WorkspaceLoader.ts      — loadWorkspace(exportDir)
  workspace-types.ts      — WorkspaceStats interface
  SymbolIndex.ts          — Searchable index of all named entities (Layer 5)
  DependencyGraph.ts      — Call graph across routines (Layer 6)
  LocationIndex.ts        — Symbol → URI/range mapping (Layer 8.1)
  vm.ts                   — IR v1 interpreter (async, Value-typed)
  legacy/
    ast.ts                — AST types (legacy, frozen)
    parser.ts             — 1C subset parser (test-only mode)
    vm.ts                 — Legacy VM on AST types
  runtime-object.ts       — Observable data object
  server.ts               — Bun HTTP + REST API (Program, Metadata, SymbolIndex, DependencyGraph, VM)
  explorer-types.ts       — TreeNode interface + TreeProjection contract
  tree-builder.ts         — MetadataModel → TreeNode[] pure function
  db.ts                   — SQLite via bun:sqlite
  handlers/               — .1c handler files (legacy, static)

/public
  index.html              — HTML + vanilla JS client

/client                   — React + Vite client (Explorer v1)
  index.html              — HTML entry
  vite.config.ts          — Vite config (proxy /api → localhost:3000)
  src/
    main.tsx              — React entry
    App.tsx               — Main app (tree + detail + breadcrumb + search)
    vite-env.d.ts         — CSS Modules type declarations
    types.ts              — Type mirror (TreeNode, FieldType)
    api.ts                — API client
    styles/
      tokens.css          — Design tokens (CSS variables)
      app.css             — Shell layout only
    components/
      TreeView/
        TreeView.tsx      — Tree view (recursive, expand/collapse, search filter)
        TreeView.module.css
      DetailPanel/
        DetailPanel.tsx   — Detail panel (attributes, ТЧ, forms, commands)
        DetailPanel.module.css
      Breadcrumb/
        Breadcrumb.tsx    — Breadcrumb navigation
        Breadcrumb.module.css
      SearchBar/
        SearchBar.tsx     — Search input
        SearchBar.module.css

/docs                     — Architecture specifications
  index-layer-contract.md — Index layer responsibilities, prohibitions, invariants
  lsp-roadmap.md          — LSP phases 8.1 → 8.4, constraints, excluded features
  architecture-stable-release-0.md — ASR-0 baseline freeze

/bench                    — Performance benchmarks (Layer 2.5)
  runner.ts               — Regression harness + baseline comparison
  baseline.json           — Pinned architectural snapshot
  suites/
    vm.bench.ts           — VM execution (50 golden tests, op breakdown)
    graph.bench.ts        — DependencyGraph queries (findPath, reachable, cycles)
    index.bench.ts        — SymbolIndex lookups (runtime, metadata, missing)

/lsp                      ← Language Server (Layer 8, Phase 8.1)
  server.ts               — stdio JSON-RPC main loop
  transport.ts            — LSP transport (Content-Length)
  LocationIndex.ts        — Symbol → URI/range mapping
  handlers/
    definition.ts         — textDocument/definition
    references.ts         — textDocument/references

/sync                     ← Synchronization & Migration Engine (FUTURE)
  Snapshot.ts              — Immutable versioned export state
  MetadataDiffer.ts        — Structural diff between snapshots
  MetadataDiff.ts          — Diff result types
  CanonicalField.ts        — DB-agnostic field model
  MigrationPlanner.ts      — Diff → ordered operations
  SqlGenerator.ts          — Plan → target-DB SQL

/tests
  ir-validator.test.ts    — 17 IR schema validation tests
  legacy/
    vm.test.ts            — 11 legacy VM unit tests on parser+AST
  integration.test.ts     — 4 integration tests
  dependency-graph.test.ts — 14 DependencyGraph tests (Layer 6)
  metadata-v2.test.ts      — 13 Metadata v2 + MetadataIndex tests (Layer 7)
```

## 🔧 Stack

- **Runtime**: Bun 1.3.14
- **Language**: TypeScript (strict)
- **Database**: SQLite (bun:sqlite)
- **Transport**: WebSocket (built-in Bun)
- **Validation**: ajv (JSON Schema)
- **Client**: React 19, Vite 6, TypeScript, CSS Modules, CSS Variables

## 🧪 Testing Strategy

- `bun test` for unit + integration
- IR validation on every fixture load
- Compatibility Runner: load export/ → VM → diff with 1C reference results
- Golden tests: IR fixtures → VM → JSON snapshots

## 📊 Performance Benchmarking

Performance benchmarks используются для отслеживания архитектурной деградации системы.

Они выполняются:
- перед релизом архитектурных изменений
- при подозрении на деградацию VM / Graph / Index
- при обновлении baseline

### CLI

```
bun run bench/runner.ts           — run benchmarks and compare with baseline
bun run bench/runner.ts --save     — update baseline after intentional architectural changes
```

### Правила

- Baseline — pinned architectural snapshot, не является средним значением
- Отклонение количества операций >10% делает сравнение некорректным
- Warmup (10 iterations) обязателен и не измеряется
- Benchmark НЕ является обязательным шагом для каждого коммита
- Используется как инструмент диагностики, а не CI gate

## 🚫 What NOT to build yet

- Web IDE (Layer 9)
- Synchronization Engine (Layer 10)
- DynamicList / QueryRuntime
- Virtual Scroll / ViewportManager
- Table parts (ТЧ)
- Full type system
- Do not generate SQL directly from MetadataModel

## 📐 Code Conventions

- Comments describe architecture and intent, not implementation
- Every module must have a header comment: purpose, responsibility, boundaries, non-responsibilities
- Inline comments explain only invariants and design decisions ("why", not "what")
- Comments that duplicate code are forbidden
- Only what the current test needs
- Single-file per concept
- Prefer `const` over `let`, avoid `any`
- Error messages in Russian

## 📋 Metadata Layer Rules

- Metadata is a read-only structural model of the 1C configuration
- Metadata is independent of execution (IR/VM) and must not reference runtime concepts
- Metadata is declarative only — no logic, resolution rules, or computed fields
- Metadata is immutable after loading (readonly arrays)

### Versioning
- `metadata.json` must contain explicit `"version"` field.
- Loaders may support legacy files without version for backward compatibility,
  but all newly generated metadata exports must include explicit version.

### Identity
- UUID is identity.
- Name is the symbol key and may change (rename-safe).
- UUID enables diff, rollback, and rename refactoring.

### Normalization
- Optional arrays are normalized to `[]`.
- Collections must never be `undefined` after loading.

## 📋 Metadata v2 Layer Rules

### FieldType is a discriminated union
Supported kinds: `string`, `number`, `date`, `boolean`, `ref`, `enum`, `union`.

### Scalar types are objects
```ts
{ kind: "string", length? }
{ kind: "number", precision?, scale? }
{ kind: "date" }
{ kind: "boolean" }
```
Primitive strings (`"string"`, `"number"`, etc.) are forbidden — all scalars use object form.

### Enum ≠ Ref
- Enumerations use: `{ kind: "enum", target: string }`
- References use:   `{ kind: "ref",  target: string }`
- Enums must never be represented as refs.

### Canonical naming
- References use: `Catalog.<Name>`, `Document.<Name>`
- Enumeration targets use enumeration name without prefix.

### Union rules
- `UnionType` is flat.
- `options` must not contain another `UnionType`.
- Nested unions are forbidden.

### presentation
- Presentation is a UI hint and not part of structural identity.
- It does not affect IR execution, DependencyGraph, or symbol resolution.

## 📋 DependencyGraph Rules

- DependencyGraph is IR-only.
- DependencyGraph does not analyze:
  - metadata
  - command handlers
  - forms
  - attributes
- Metadata dependencies are modeled separately and must not be mixed
  with IR call dependencies.
- Metadata-to-IR edges (e.g., command handler → routine) are intentionally
  excluded from DependencyGraph. They are handled in Layer 8+ (Language Server).

## 📋 SymbolIndex Rules

- SymbolIndex contains top-level symbols only:
  `module` | `function` | `procedure` | `catalog` | `document` | `enumeration`
- Attributes, forms, commands and tabular sections belong to `MetadataIndex`.
- SymbolIndex is derived from `Program` and `MetadataModel` only.
- Symbol names are unique within SymbolIndex.
- Duplicate symbols are errors.
- Every symbol has a `space` field: `"runtime"` (from Program) or `"metadata"` (from MetadataModel).
  Program is the runtime universe; MetadataModel is the structural universe. They never merge.
- `SymbolSpace` has two values: `runtime | metadata`. No `combined` — mixing orthogonal axes
  is forbidden.

## ⚙️ Synchronization Engine Layer Rules (FUTURE)

### Principle
SQL must never be generated directly from MetadataModel.
1C metadata is not SQL metadata. SQL must be generated from a Canonical Model.

### Canonical pipeline
```
1C
 ↓
MetadataModel
 ↓
Canonical Model (DB-agnostic)
 ↓
MetadataDiff
 ↓
MigrationPlan
 ↓
SqlGenerator
 ↓
PostgreSQL / SQLite / MSSQL
```

### Snapshot rules
- Snapshots are immutable. Existing snapshots must never be modified.
- Every export creates a new timestamped snapshot (e.g. `snapshot-2026-06-04/`).
- Immutability enables rollback, diff history, CI replay.

### Core types
- `Snapshot` — immutable versioned export state (metadata + program)
- `MetadataDiffer` — old MetadataModel vs new MetadataModel → MetadataDiff
- `MetadataDiff` — structural changes (added/removed/changed catalogs, attributes, types)
- `MigrationPlanner` — MetadataDiff → ordered list of migration operations
- `SqlGenerator` — MigrationPlan → target-DB-specific SQL statements
- `CanonicalField` — DB-agnostic field model between Metadata and SQL

### Architectural boundaries
- Synchronization Engine is independent from VM and Web IDE.
- It depends on Metadata v2, SymbolIndex, DependencyGraph.
- Not before Layer 7 (Metadata v2 with attributes and tabular parts).

## 🧬 IR v1 Contract (FROZEN)

### ❌ Forbidden (no IR v2)

- adding nodes
- changing field names
- changing statement semantics
- changing call formats
- introducing normalizers

### ✅ Allowed

- builtin functions
- runtime objects
- tests

### Module structure
```
module.body.routines: Routine[]   — единый массив (kind: "procedure" | "function")
module.body.globals: GlobalVar[]
```

### Stmt nodes
- `assign`, `if`, `for`, `while`, `foreach`, `call`, `return`, `break`, `continue`, `expr`, `try`, `throw`
- `call` has two variants: `{name, args}` (function) and `{object, method, args}` (method)
- `if.else` is always `Stmt[]`. `ИначеЕсли` = вложенный `{kind: "if"}` внутри `else: [if]`
- `try` = `{ kind: "try", try: Stmt[], catch: Stmt[] }`
- `throw` = `{ kind: "throw", value: Expr }`
- `foreach` uses `variable` (not `item`)

### Expr nodes
- `number`, `string`, `boolean`, `null`, `undefined`, `variable`, `member`, `index`, `call`, `new`, `binary`, `unary`, `if`
- `call` uses `{name: string, args: Expr[]}` (function) or `{object, method, args}` (method)
- `new` uses `{type: string, args: [{key, value}]}` (not flat Expr[])
- `binary.op` = Russian: `Плюс`, `Минус`, `Умножить`, `Разделить`, `Больше`, `Меньше`, `БольшеИлиРавно`, `МеньшеИлиРавно`, `Равно`, `НеРавно`, `И`, `Или`
- `unary.op` = `Минус`, `Не`

### Else rule (critical)
`if.else` is **always** `Stmt[]`. Never a single object.
- `Иначе` → `else: [stmt1, stmt2, ...]`
- `ИначеЕсли` → `else: [{kind: "if", cond, then, else}]`

### No normalizers
Exporter must match schema exactly. No normalizers on Bun side.

### Param
`{name, byRef: boolean, defaultValue?: Expr}`

### results.json rule
`results.json` contains runtime values, not IR nodes. Since JSON has no `undefined`, both 1C `Null` and `Неопределено` serialize as JSON `null`. Runner normalizes via `normalizeResult()` before comparison. This is part of the frozen contract.

### Optional metadata
`nodeId` and `loc` are optional on any node.

### IR Location Contract
- `meta.loc` on Stmt/Expr nodes is OPTIONAL — IR v1 does not guarantee it.
- LSP MUST NOT require loc — fallback to null/empty is required.
- IR is not source of truth for IDE navigation. IR location data is optional
  debug metadata only.
- LocationIndex is a best-effort derived structure. It does not guarantee
  completeness of symbol locations.
- LSP MUST NOT depend on IR structure for navigation correctness.

## 📋 Tree Projection Contract

### Определение
TreeView — это чистая проекция MetadataIndex. Она не содержит доменной логики, не вычисляет структуру, не интерпретирует метаданные. Единственная ответственность — отображение существующей иерархии метаданных в виде дерева.

### TreeNode
```ts
interface TreeNode {
  id: string;        // стабильный идентификатор: Catalog.Имя, Document.Имя.Реквизит
  label: string;     // отображаемое имя
  kind: "root" | "folder" | "entity" | "attribute" | "tabular" | "form" | "command" | "enum_value";
  parentKind?: "catalog" | "document" | "enumeration" | "";
  metaRef?: string;  // ссылка на MetadataIndex
  children?: TreeNode[];
}
```

### Правила
- `TreeBuilder` — чистая функция без состояния и побочных эффектов
- `TreeNode.id` = стабильный составной ID, он же будет мостом к LSP bridge
- Дерево не содержит доменной логики — только отображение metadata → TreeNode
- React — только dumb renderer, без интерпретации структуры
- Источник структуры — MetadataIndex, источник имён — SymbolIndex (через MetadataModel)

### Node identity contract
```
Catalog.Организации
Document.ЗаказКлиента
Enum.ТипДоговора
Catalog.Организации.Реквизит.ИНН
Catalog.Организации.ТабличныеЧасти.Товары
```

### State model (UI only)
```ts
interface ExplorerUIState {
  selectedNodeId: string | null;
  expandedNodes: Set<string>;    // локальный UI state, не бизнес-состояние
  searchFilter: string;          // локальный фильтр по имени (substring)
}
```

### Rendering model
UI rendering is client-side only (CSR). Server provides data exclusively via JSON API:
- Index Layer data
- LSP responses
- optional query endpoints

Server MUST NOT render UI structure (no SSR). SSR would duplicate the Index Layer and create a second model of tree structure, which violates the single-source-of-truth principle. SSR may be reconsidered at Phase 9+ (Web IDE with 100k+ node configs, multi-user, or cloud IDE scenarios), but is explicitly excluded for Explorer v1 and LSP Phase 8.x.

### Workspace Contract

Workspace is the composition root of the platform.

Workspace owns:
- Program
- MetadataModel
- SymbolIndex
- MetadataIndex
- DependencyGraph
- LocationIndex
- WorkspaceStats (readonly, computed once at construction)

Workspace contains no business logic and no I/O.
I/O is the responsibility of WorkspaceLoader (loadWorkspace).

All adapters (LSP, REST, Bench, Explorer, Sync Engine)
must depend on Workspace instead of assembling indexes manually.

### LSP / Navigation Layer Rules
- LSP is index-driven, NOT IR-driven.
- LSP MUST NOT perform full IR traversal per request.
- All queries must be served from precomputed indexes:
  SymbolIndex, DependencyGraph, LocationIndex.
- LSP MUST NOT reconstruct semantics from IR. Any semantic query must be
  answered by DependencyGraph, SymbolIndex, or LocationIndex.

## 🛡️ Type Hardening Pass (Layer 0.5)

Type hardening — отдельный архитектурный слой, обеспечивающий type-level safety.

### Completed
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`
- `BuiltinArg = Value | undefined` — `undefined` в аргументах встроенных функций — это 1С-контракт, не баг типа
- `BuiltinFn` widened to `(args: readonly BuiltinArg[]) => Value`
- `exactOptionalPropertyTypes` permanently excluded (слишком дорого для IR v1 optional полей)
- Все indexed access errors исправлены по категориям:
  1. **1C semantics** → widen types (`BuiltinArg`)
  2. **Loop invariant** → `!` (`routine.params[i]!`, `args[i]!`)
  3. **Regex/split** → guards (`parts[0] ?? ""`, `match[1] ?? null`)
  4. **Map.get after has** → признаны отсутствующими (rely on `has()` contract)

### Metrics
```
bun run typecheck  → 0 errors
bun test           → 91 pass, 0 fail (8 files, 534 expect calls)
bun run compat     → 50 pass, 0 fail
```

### Verification gates (CI)
- `.github/workflows/ci.yml`: `bun install` → `typecheck` → `test`
