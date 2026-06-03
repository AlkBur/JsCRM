export interface IRRoot {
  irVersion: 1;
  generator?: { tool: string; version: string };
  module: IRModule;
}

export interface IRModule {
  name: string;
  body: ModuleBody;
}

export interface ModuleBody {
  routines: Routine[];
  globals: GlobalVar[];
}

export interface GlobalVar {
  name: string;
}

export interface Routine {
  kind: "procedure" | "function";
  name: string;
  export: boolean;
  params: Param[];
  body: Stmt[];
}

export interface Param {
  name: string;
  byRef: boolean;
  defaultValue?: Expr;
}

export type Stmt =
  | StmtAssign
  | StmtIf
  | StmtFor
  | StmtWhile
  | StmtForEach
  | StmtCallFunc
  | StmtCallMethod
  | StmtReturn
  | StmtBreak
  | StmtContinue
  | StmtExpr
  | StmtTry
  | StmtThrow;

export interface StmtAssign {
  kind: "assign";
  target: LValue;
  expr: Expr;
  meta?: Meta;
}

export interface StmtIf {
  kind: "if";
  cond: Expr;
  then: Stmt[];
  else: Stmt[];
  meta?: Meta;
}

export interface StmtFor {
  kind: "for";
  variable: string;
  start: Expr;
  end: Expr;
  body: Stmt[];
  meta?: Meta;
}

export interface StmtWhile {
  kind: "while";
  cond: Expr;
  body: Stmt[];
  meta?: Meta;
}

export interface StmtForEach {
  kind: "foreach";
  variable: string;
  collection: Expr;
  body: Stmt[];
  meta?: Meta;
}

export interface StmtCallFunc {
  kind: "call";
  name: string;
  args: Expr[];
  meta?: Meta;
}

export interface StmtCallMethod {
  kind: "call";
  object: Expr;
  method: string;
  args: Expr[];
  meta?: Meta;
}

export interface StmtReturn {
  kind: "return";
  value?: Expr;
  meta?: Meta;
}

export interface StmtBreak {
  kind: "break";
  meta?: Meta;
}

export interface StmtContinue {
  kind: "continue";
  meta?: Meta;
}

export interface StmtExpr {
  kind: "expr";
  expr: Expr;
  meta?: Meta;
}

export interface StmtTry {
  kind: "try";
  try: Stmt[];
  catch: Stmt[];
  meta?: Meta;
}

export interface StmtThrow {
  kind: "throw";
  value: Expr;
  meta?: Meta;
}

export type Expr =
  | ExprNumber
  | ExprString
  | ExprBoolean
  | ExprNull
  | ExprUndefined
  | ExprVariable
  | ExprMember
  | ExprIndex
  | ExprCallFunc
  | ExprCallMethod
  | ExprNew
  | ExprBinary
  | ExprUnary;

export interface ExprNumber {
  kind: "number";
  value: number;
  meta?: Meta;
}

export interface ExprString {
  kind: "string";
  value: string;
  meta?: Meta;
}

export interface ExprBoolean {
  kind: "boolean";
  value: boolean;
  meta?: Meta;
}

export interface ExprNull {
  kind: "null";
  meta?: Meta;
}

export interface ExprUndefined {
  kind: "undefined";
  meta?: Meta;
}

export interface ExprVariable {
  kind: "variable";
  name: string;
  meta?: Meta;
}

export interface ExprMember {
  kind: "member";
  object: Expr;
  property: string;
  meta?: Meta;
}

export interface ExprIndex {
  kind: "index";
  object: Expr;
  index: Expr;
  meta?: Meta;
}

export interface ExprCallFunc {
  kind: "call";
  name: string;
  args: Expr[];
  meta?: Meta;
}

export interface ExprCallMethod {
  kind: "call";
  object: Expr;
  method: string;
  args: Expr[];
  meta?: Meta;
}

export interface ExprNew {
  kind: "new";
  type: string;
  args: NewArg[];
  meta?: Meta;
}

export interface NewArg {
  key: string;
  value: Expr;
}

export interface ExprBinary {
  kind: "binary";
  op: BinOp;
  left: Expr;
  right: Expr;
  meta?: Meta;
}

export interface ExprUnary {
  kind: "unary";
  op: "Минус" | "Не";
  right: Expr;
  meta?: Meta;
}

export type BinOp =
  | "Плюс" | "Минус" | "Умножить" | "Разделить"
  | "Больше" | "Меньше" | "БольшеИлиРавно" | "МеньшеИлиРавно"
  | "Равно" | "НеРавно"
  | "И" | "Или";

export type LValue =
  | LValueVariable
  | LValueMember
  | LValueIndex;

export interface LValueVariable {
  kind: "variable";
  name: string;
  meta?: Meta;
}

export interface LValueMember {
  kind: "member";
  object: Expr;
  property: string;
  meta?: Meta;
}

export interface LValueIndex {
  kind: "index";
  object: Expr;
  index: Expr;
  meta?: Meta;
}

export interface Meta {
  nodeId?: number;
  loc?: Location;
}

export interface Location {
  module?: string;
  line: number;
  column: number;
}
