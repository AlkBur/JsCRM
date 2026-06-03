# AGENTS.md — JsCRM (1C Clone) Work Plan

## 🎯 Mission

Build a working 1C-platform compatible runtime in Bun/TypeScript/SQLite.
Primary source of truth: **IR v1** — a JSON-based Intermediate Representation for 1C:Enterprise code.

## ✅ Current Status

IR v1 schema finalized and **frozen**. Exporter produces valid IR.

**30 tests, 0 failures.**

## Runtime Layer Rules

- Runtime objects are first-class entities
- VM must never use raw JS objects or arrays to represent 1C runtime types
- Every runtime object must implement `RuntimeObject` and expose `typeName`
- Builtins are registered via `BuiltinRegistry`, never hardcoded in VM

## Architecture Layers

```
Layer 1  IR v1 (frozen)              ✅ DONE
Layer 2  VM + Golden Tests           ✅ DONE
Layer 3  Runtime (3A)                ← NOW
Layer 4  Metadata                    ← Week 4
Layer 5  Symbol Index                ← Month 2
Layer 6  Dependency Graph            ← Month 3
Layer 7  Web IDE                     ← Month 4
```

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

/compat                   ← Compatibility Runner
  runner.ts               — load IR → VM → diff with expected

/compat-reports           ← Generated compat reports

/runtime                  ← Runtime Layer
  types.ts                — Value type + RuntimeObject interface
  BuiltinRegistry.ts      — Builtin function registry
  RuntimeStructure.ts     — Structure object (Map<string, Value>)
  RuntimeArray.ts         — Array object (Value[])

/builtins
  index.ts                — 14 builtin functions (СтрДлина, Дата, ...)

/src                      ← Runtime implementation
  vm.ts                   — IR v1 interpreter (async, Value-typed)
  legacy/
    ast.ts                — AST types (legacy, frozen)
    parser.ts             — 1C subset parser (test-only mode)
    vm.ts                 — Legacy VM on AST types
  runtime-object.ts       — Observable data object
  server.ts               — Bun HTTP + WebSocket server
  db.ts                   — SQLite via bun:sqlite
  handlers/               — .1c handler files (legacy, static)

/public
  index.html              — HTML + vanilla JS client

/tests
  ir-validator.test.ts    — 17 IR schema validation tests
  legacy/
    vm.test.ts            — 11 legacy VM unit tests on parser+AST
  integration.test.ts     — 4 integration tests
```

## 🔧 Stack

- **Runtime**: Bun 1.3.14
- **Language**: TypeScript (strict)
- **Database**: SQLite (bun:sqlite)
- **Transport**: WebSocket (built-in Bun)
- **Validation**: ajv (JSON Schema)
- **Client**: HTML + vanilla JS (Solid.js post-MVP)

## 🧪 Testing Strategy

- `bun test` for unit + integration
- IR validation on every fixture load
- Compatibility Runner: load export/ → VM → diff with 1C reference results
- Golden tests: IR fixtures → VM → JSON snapshots

## 🚫 What NOT to build yet

- Metadata layer (Layer 5)
- Symbol Index (Layer 6)
- Dependency Graph (Layer 7)
- Web IDE (Layer 8)
- DynamicList / QueryRuntime
- Virtual Scroll / ViewportManager
- Solid.js client
- Table parts (ТЧ)
- Full type system

## 📐 Code Conventions

- No comments in code
- Only what the current test needs
- Single-file per concept
- Prefer `const` over `let`, avoid `any`
- Error messages in Russian

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
- `number`, `string`, `boolean`, `null`, `undefined`, `variable`, `member`, `index`, `call`, `new`, `binary`, `unary`
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
`{name, byValue: boolean, defaultValue: null | Expr}`

### Optional metadata
`nodeId` and `loc` are optional on any node.
