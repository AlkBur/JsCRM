import type { VmContext } from "./context";
import type { Value } from "./types";
import { setVar } from "./scope";
import { BreakSignal, ContinueSignal } from "./types";

export function execFor(
  ctx: VmContext,
  variable: string,
  start: number,
  end: number,
  bodyFn: () => void,
): void {
  for (let i = start; i <= end; i++) {
    setVar(ctx, variable, i as Value);
    try {
      bodyFn();
    } catch (e) {
      if (e instanceof BreakSignal) break;
      if (e instanceof ContinueSignal) continue;
      throw e;
    }
    if (ctx.result !== undefined) return;
  }
}

export function execWhile(
  ctx: VmContext,
  condFn: () => Value,
  bodyFn: () => void,
): void {
  while (condFn()) {
    try {
      bodyFn();
    } catch (e) {
      if (e instanceof BreakSignal) break;
      if (e instanceof ContinueSignal) continue;
      throw e;
    }
    if (ctx.result !== undefined) return;
  }
}

export function execForEach(
  ctx: VmContext,
  variable: string,
  collection: Value,
  bodyFn: () => void,
): void {
  if (collection && typeof collection === "object") {
    const iter = (collection as unknown as Record<string, unknown>)[Symbol.iterator as unknown as string];
    if (typeof iter === "function") {
      for (const item of iter.call(collection)) {
        setVar(ctx, variable, item as Value);
        try {
          bodyFn();
        } catch (e) {
          if (e instanceof BreakSignal) break;
          if (e instanceof ContinueSignal) continue;
          throw e;
        }
        if (ctx.result !== undefined) return;
      }
    } else if (Array.isArray(collection)) {
      for (const item of collection) {
        setVar(ctx, variable, item as Value);
        try {
          bodyFn();
        } catch (e) {
          if (e instanceof BreakSignal) break;
          if (e instanceof ContinueSignal) continue;
          throw e;
        }
        if (ctx.result !== undefined) return;
      }
    }
  }
}
