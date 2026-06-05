import type { VmContext } from "./context";
import type { Stmt } from "./types";
import { evalExpr } from "./executeExpr";
import { assignTo } from "./assign";
import { execFor, execWhile, execForEach } from "./loops";
import { setResult, setVar } from "./scope";
import { RuntimeError, BreakSignal, ContinueSignal } from "./types";

export function execStmts(ctx: VmContext, stmts: Stmt[]): void {
  ctx.result = undefined;
  for (const stmt of stmts) {
    execStmt(ctx, stmt);
    if (ctx.result !== undefined) return;
  }
}

function execStmt(ctx: VmContext, stmt: Stmt): void {
  switch (stmt.kind) {
    case "assign": {
      const value = evalExpr(ctx, stmt.expr);
      assignTo(ctx, stmt.target, value);
      return;
    }
    case "if": {
      if (evalExpr(ctx, stmt.cond)) {
        execStmts(ctx, stmt.then);
      } else {
        execStmts(ctx, stmt.else);
      }
      return;
    }
    case "for":
      execFor(
        ctx,
        stmt.variable,
        Number(evalExpr(ctx, stmt.start)),
        Number(evalExpr(ctx, stmt.end)),
        () => execStmts(ctx, stmt.body),
      );
      return;
    case "while":
      execWhile(
        ctx,
        () => evalExpr(ctx, stmt.cond),
        () => execStmts(ctx, stmt.body),
      );
      return;
    case "foreach":
      execForEach(
        ctx,
        stmt.variable,
        evalExpr(ctx, stmt.collection),
        () => execStmts(ctx, stmt.body),
      );
      return;
    case "call": {
      if (stmt.name !== undefined) {
        const args = stmt.args.map(a => evalExpr(ctx, a));
        ctx.callFn(stmt.name, args);
      } else if (stmt.object && stmt.method) {
        const obj = evalExpr(ctx, stmt.object);
        const args = stmt.args.map(a => evalExpr(ctx, a));
        ctx.callMethodFn(obj, stmt.method, args);
      }
      return;
    }
    case "return": {
      setResult(ctx, stmt.value !== undefined ? evalExpr(ctx, stmt.value) : undefined);
      return;
    }
    case "break":
      throw new BreakSignal();
    case "continue":
      throw new ContinueSignal();
    case "expr":
      evalExpr(ctx, stmt.expr);
      return;
    case "try": {
      try {
        execStmts(ctx, stmt.try);
      } catch (e) {
        if (e instanceof RuntimeError || e instanceof Error) {
          ctx.lastError = e.message;
          ctx.builtins.lastError = e.message;
        }
        execStmts(ctx, stmt.catch);
      }
      return;
    }
    case "throw": {
      const val = evalExpr(ctx, stmt.value);
      throw new RuntimeError(String(val));
    }
  }
}
