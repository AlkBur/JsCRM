# IR v1 Contract (FROZEN)

## Forbidden

- adding nodes
- changing field names
- changing statement semantics
- changing call formats
- introducing normalizers

## Allowed

- builtin functions
- runtime objects
- tests

## Module structure

```
module.body.routines: Routine[]   — единый массив (kind: "procedure" | "function")
module.body.globals: GlobalVar[]
```

## Stmt nodes

- `assign`, `if`, `for`, `while`, `foreach`, `call`, `return`, `break`, `continue`, `expr`, `try`, `throw`
- `call` has two variants: `{name, args}` (function) and `{object, method, args}` (method)
- `if.else` is always `Stmt[]`. `ИначеЕсли` = вложенный `{kind: "if"}` внутри `else: [if]`
- `try` = `{ kind: "try", try: Stmt[], catch: Stmt[] }`
- `throw` = `{ kind: "throw", value: Expr }`
- `foreach` uses `variable` (not `item`)

## Expr nodes

- `number`, `string`, `boolean`, `null`, `undefined`, `variable`, `member`, `index`, `call`, `new`, `binary`, `unary`, `if`
- `call` uses `{name: string, args: Expr[]}` (function) or `{object, method, args}` (method)
- `new` uses `{type: string, args: [{key, value}]}` (not flat Expr[])
- `binary.op` = Russian: `Плюс`, `Минус`, `Умножить`, `Разделить`, `Больше`, `Меньше`, `БольшеИлиРавно`, `МеньшеИлиРавно`, `Равно`, `НеРавно`, `И`, `Или`
- `unary.op` = `Минус`, `Не`

## Else rule (critical)

`if.else` is **always** `Stmt[]`. Never a single object.
- `Иначе` → `else: [stmt1, stmt2, ...]`
- `ИначеЕсли` → `else: [{kind: "if", cond, then, else}]`

## No normalizers

Exporter must match schema exactly. No normalizers on Bun side.

## Param

`{name, byRef: boolean, defaultValue?: Expr}`

## results.json rule

`results.json` contains runtime values, not IR nodes. Since JSON has no
`undefined`, both 1C `Null` and `Неопределено` serialize as JSON `null`.
Runner normalizes via `normalizeResult()` before comparison.
This is part of the frozen contract.

## Optional metadata

`nodeId` and `loc` are optional on any node.

## IR Location Contract

- `meta.loc` on Stmt/Expr nodes is OPTIONAL — IR v1 does not guarantee it.
- LSP MUST NOT require loc — fallback to null/empty is required.
- IR is not source of truth for IDE navigation. IR location data is optional
  debug metadata only.
- LocationIndex is a best-effort derived structure. It does not guarantee
  completeness of symbol locations.
- LSP MUST NOT depend on IR structure for navigation correctness.
