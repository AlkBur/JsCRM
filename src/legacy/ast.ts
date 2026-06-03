export type Stmt =
  | { kind: "assign"; target: string; expr: Expr }
  | { kind: "set"; target: Expr; expr: Expr }
  | { kind: "return"; expr: Expr }
  | { kind: "if"; cond: Expr; then: Stmt[]; else: Stmt[] }
  | { kind: "for"; variable: string; start: Expr; end: Expr; body: Stmt[] }
  | { kind: "call"; name: string; args: Expr[] }
  | { kind: "expr"; expr: Expr };

export type Expr =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "variable"; name: string }
  | { kind: "binary"; op: BinOp; left: Expr; right: Expr }
  | { kind: "unary"; op: "-" | "not"; right: Expr }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "call"; callee: Expr; args: Expr[] }
  | { kind: "new"; type: string; args: Expr[] };

export type BinOp = "+" | "-" | "*" | "/" | ">" | "<" | ">=" | "<=" | "=" | "<>" | "и" | "или";
