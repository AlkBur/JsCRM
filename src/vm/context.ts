import type { Program } from "../Program";
import type { BuiltinRegistry } from "../../runtime/BuiltinRegistry";
import type { Value } from "../../runtime/types";
import type { Expr } from "./types";

export interface VmContext {
  readonly program: Program;
  readonly builtins: BuiltinRegistry;
  vars: Record<string, Value>;
  result: Value | undefined;
  lastError: string;
  evalFn: (expr: Expr) => Value;
  callFn: (name: string, args: Value[]) => Value;
  callMethodFn: (obj: Value, method: string, args: Value[]) => Value;
}
