import type { VmContext } from "./context";
import type { Value } from "../../runtime/types";

export function pushScope(ctx: VmContext, initial?: Record<string, Value>): Record<string, Value> {
  const prev = ctx.vars;
  ctx.vars = initial ?? {};
  return prev;
}

export function restoreScope(ctx: VmContext, prev: Record<string, Value>): void {
  ctx.vars = prev;
}

export function getVar(ctx: VmContext, name: string): Value {
  if (name in ctx.vars) return ctx.vars[name]!;
  throw new Error(`Переменная не определена: ${name}`);
}

export function setVar(ctx: VmContext, name: string, value: Value): void {
  ctx.vars[name] = value;
}

export function setResult(ctx: VmContext, value: Value): void {
  ctx.result = value;
}
