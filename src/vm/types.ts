import type { Value } from "../../runtime/types";
import type { BuiltinFn } from "../../runtime/BuiltinRegistry";
import type { Routine } from "../Program";

export type { Value };

export type ResolvedFunction =
  | { kind: "routine"; routine: Routine }
  | { kind: "builtin"; fn: BuiltinFn };

export type Stmt =
  | { kind: "assign"; target: LValue; expr: Expr }
  | { kind: "if"; cond: Expr; then: Stmt[]; else: Stmt[] }
  | { kind: "for"; variable: string; start: Expr; end: Expr; body: Stmt[] }
  | { kind: "while"; cond: Expr; body: Stmt[] }
  | { kind: "foreach"; variable: string; collection: Expr; body: Stmt[] }
  | { kind: "call"; name?: string; object?: Expr; method?: string; args: Expr[] }
  | { kind: "return"; value?: Expr }
  | { kind: "break" }
  | { kind: "continue" }
  | { kind: "expr"; expr: Expr }
  | { kind: "try"; try: Stmt[]; catch: Stmt[] }
  | { kind: "throw"; value: Expr };

export type Expr =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" }
  | { kind: "undefined" }
  | { kind: "variable"; name: string }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "index"; object: Expr; index: Expr }
  | { kind: "call"; name?: string; object?: Expr; method?: string; args: Expr[] }
  | { kind: "new"; type: string; args: { key: string; value: Expr }[] }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "unary"; op: string; value: Expr }
  | { kind: "if"; cond: Expr; then: Expr; else: Expr };

export type LValue =
  | { kind: "variable"; name: string }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "index"; object: Expr; index: Expr };

export class RuntimeError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RuntimeError";
  }
}

export class BreakSignal extends Error {
  constructor() {
    super("break");
    this.name = "BreakSignal";
  }
}

export class ContinueSignal extends Error {
  constructor() {
    super("continue");
    this.name = "ContinueSignal";
  }
}
