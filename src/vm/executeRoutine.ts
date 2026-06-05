import type { VmContext } from "./context";
import type { Value } from "./types";
import type { Routine } from "../Program";
import { execStmts } from "./executeStmt";
import { pushScope, restoreScope, setVar } from "./scope";

export function executeRoutine(ctx: VmContext, routine: Routine, args: Value[]): Value {
  ctx.lastError = "";
  const prev = pushScope(ctx, {});
  for (let i = 0; i < routine.params.length; i++) {
    const param = routine.params[i]!;
    setVar(ctx, param.name, i < args.length ? args[i]! : null);
  }
  try {
    execStmts(ctx, routine.body as never[]);
    const r = ctx.result;
    restoreScope(ctx, prev);
    return r;
  } catch (e) {
    restoreScope(ctx, prev);
    throw e;
  }
}
