# Architecture Map

Task-oriented navigation for humans and AI agents.

---

## VM execution

Responsible for IR execution.

Directories:

* `src/vm/`
* `runtime/`
* `builtins/`

Change here when:

* adding runtime behavior;
* implementing builtin functions;
* changing expression or statement execution;
* modifying scope or call semantics.

Do NOT change:

* indexes;
* metadata;
* UI projections.

---

## Metadata

Responsible for structural information.

Directories:

* `metadata/`

Main files:

* `MetadataModel.ts`
* `MetadataIndex.ts`

Change here when:

* adding metadata versions;
* introducing new object types;
* changing field definitions.

Do NOT add execution logic here.

---

## Navigation and indexes

Responsible for immutable derived projections.

Files:

* `src/SymbolIndex.ts`
* `src/DependencyGraph.ts`
* `src/LocationIndex.ts`

Change here when:

* adding queries;
* improving symbol lookup;
* adding graph algorithms.

Indexes are derived data.

Indexes must never become a source of truth.

Execution must not depend on indexes.

---

## Workspace

Responsible for composition.

Files:

* `src/Workspace.ts`
* `src/WorkspaceLoader.ts`

Owns:

* Program;
* MetadataModel;
* all indexes.

Does NOT own:

* adapters;
* execution;
* UI.

Workspace is immutable.

---

## Forms

Responsible for form projections.

Directory:

* `src/forms/`

Change here when:

* adding projection types;
* filtering invalid handlers;
* building client-facing representations.

Projection layers may degrade gracefully.

Execution layers must fail fast.

---

## Snapshots

Responsible for object instance data.

Files:

* `src/snapshots/snapshot-types.ts`
* `src/snapshots/FilesystemSnapshotStore.ts`

Change here when:

* adding data storage backends;
* implementing save/load/listing;
* introducing exchange or sync.

SnapshotStore is an adapter.

Domain and UI must not depend on JSON or SQL.

Forms own layout. Snapshots own values.
FormStateStore is the only bridge between them.

---

## Tree projections

Responsible for MetadataModel → TreeNode conversion.

Files:

* `src/tree-builder.ts`

Change here when:

* adding explorer nodes;
* changing hierarchy;
* introducing new projections.

TreeBuilder is a pure function.

---

## LSP

Responsible for navigation protocol.

Directory:

* `lsp/`

Change here when:

* adding definition/reference queries;
* extending JSON-RPC handlers.

LSP is index-driven.

LSP must not reconstruct semantics.

---

## REST API

Responsible for HTTP transport.

File:

* `src/server.ts`

Change here when:

* adding endpoints;
* changing request/response contracts.

Server is an adapter.

Business logic belongs elsewhere.

---

## Explorer UI

Responsible for presentation.

Directory:

* `client/`

Change here when:

* adding components;
* changing layout;
* improving interaction.

UI is a projection over indexes and metadata.

Client is CSR only.

---

## Benchmarks

Responsible for diagnostics.

Directory:

* `bench/`

Change here when:

* adding regression benchmarks;
* updating baselines.

Benchmarks are observability tools.

Benchmarks are not CI gates.

---

## Tests

Responsible for correctness.

Directory:

* `tests/`

Additional compatibility tests:

* `compat/`

All architectural refactorings must preserve:

* typecheck = 0 errors;
* unit tests;
* golden tests.

---

## Legacy code

Directory:

* `src/legacy/`

Frozen.

Test-only.

Avoid modifications unless absolutely necessary.

---

## Architectural evolution

New capabilities require an external consumer signal.

Prefer:

* new queries;
* new projections;
* new adapters.

Avoid:

* duplicate models;
* mutable caches;
* alternative sources of truth.
