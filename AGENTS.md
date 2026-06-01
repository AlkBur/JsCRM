# AGENTS.md — JsCRM (1C Clone) Work Plan

## 🎯 Mission
Build a working 1C-platform compatible runtime in Bun/TypeScript/SQLite.
Primary source of truth: **IR v1** — a JSON-based Intermediate Representation for 1C:Enterprise code.

## ✅ Current Status (P0 complete)

IR v1 schema is frozen. Validator + 3 golden fixtures pass. Next: Compatibility Runner.

**26 tests, 0 failures.**

## 📁 Project Structure
```
/ir                       ← IR v1 contract (frozen)
  ir-schema-v1.json       — JSON Schema (additionalProperties: false)
  ir-types.ts             — TS interfaces matching schema
  ir-validator.ts         — ajv validator (used at IR load time)

/fixtures                 ← Golden IR fixtures for testing
  arithmetic.ir.json
  function-call.ir.json
  object-member.ir.json

/export                   ← 1C exporter output (IR + test results)
  manifest.json           — versioned module index
  ir/*.ir.json
  tests/*.results.json

/compat                   ← Compatibility Runner
  runner.ts

/compat-reports           ← Generated compat reports

/src                      ← Runtime implementation (to be migrated to IR v1)
  ast.ts                  — AST types (pre-migration, will be rewritten)
  vm.ts                   — Async interpreter (pre-migration)
  parser.ts               — 1C subset parser (test-only mode)
  runtime-object.ts       — Observable data object
  server.ts               — Bun HTTP + WebSocket server
  db.ts                   — SQLite via bun:sqlite
  handlers/               — .1c handler files (legacy, static)

/public
  index.html              — HTML + vanilla JS client

/tests
  ir-validator.test.ts    — 11 IR schema validation tests
  vm.test.ts              — 11 VM unit tests (pre-migration)
  integration.test.ts     — 4 integration tests
```

## 🧭 Roadmap

```
P0  IR v1 contract        ✅ DONE
    ir-schema-v1.json, ir-types.ts, ir-validator.ts
    3 golden fixtures, validator tests, manifest

P1  Compatibility Runner  ← NEXT
    compat/runner.ts — load IR → VM → diff with expected
    compat-reports/*.report.json
    fixture-based tests

P2  Migrate AST + VM      ← AFTER P1
    src/ast.ts → IR v1 types (lvalue, while, foreach, break/continue)
    src/vm.ts  → assign(lvalue), while, break/continue, return without value
    src/parser.ts → simplified, test-only mode

P3  Metadata + E2E
    Metadata Loader (from 1C export)
    RuntimeObject → metadata-aware
    Document "ЗаказПокупателя" full scenario
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
- Manual browser testing for WebSocket + form binding

## 🚫 What NOT to build yet
- DynamicList / QueryRuntime
- Virtual Scroll / ViewportManager
- Solid.js client
- Table parts (ТЧ)
- Try/Except (deferred to IR v2)
- Full type system

## 📐 Code Conventions
- No comments in code
- Only what the current test needs
- Single-file per concept
- Prefer `const` over `let`, avoid `any`
- Error messages in Russian
