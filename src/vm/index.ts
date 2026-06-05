/**
 * Responsibility:
 *   Public API for IR v1 VM. Wires VmContext with all submodules.
 *
 * Owns:
 *   VM constructor, call() entry point, callback wiring.
 *
 * Does NOT own:
 *   Statement or expression evaluation, scope management, builtin dispatch.
 *
 * Used by:
 *   server, bench, compat runner.
 */

import type { Program } from "../Program";
import type { BuiltinRegistry } from "../../runtime/BuiltinRegistry";
import type { Value } from "../../runtime/types";
import type { VmContext } from "./context";
import { evalExpr } from "./executeExpr";
import { callFunction, callMethod } from "./callFunction";

export class VM {
  private ctx: VmContext;

  constructor(program: Program, builtins: BuiltinRegistry) {
    this.ctx = {
      program,
      builtins,
      vars: {},
      result: undefined,
      lastError: "",
      evalFn: (expr) => evalExpr(this.ctx, expr),
      callFn: (name, args) => callFunction(this.ctx, name, args),
      callMethodFn: (obj, method, args) => callMethod(this.ctx, obj, method, args),
    };
  }

  call(name: string, args: Value[] = []): Value {
    return this.ctx.callFn(name, args);
  }
}
