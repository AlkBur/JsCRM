import type { VmContext } from "./context";
import type { LValue, Value } from "./types";
import { RuntimeStructure } from "../../runtime/RuntimeStructure";
import { RuntimeArray } from "../../runtime/RuntimeArray";

export function assignTo(ctx: VmContext, target: LValue, value: Value): void {
  switch (target.kind) {
    case "variable":
      ctx.vars[target.name] = value;
      break;
    case "member": {
      const obj = ctx.evalFn(target.object);
      if (obj instanceof RuntimeStructure) {
        obj.set(target.property, value);
      } else if (obj && typeof obj === "object" && !Array.isArray(obj) && !(obj instanceof Date)) {
        (obj as unknown as Record<string, Value>)[target.property] = value;
      }
      break;
    }
    case "index": {
      const obj = ctx.evalFn(target.object);
      const idx = Number(ctx.evalFn(target.index));
      if (obj instanceof RuntimeArray) {
        obj.set(idx, value);
      } else if (obj instanceof RuntimeStructure) {
        obj.set(String(idx), value);
      } else if (Array.isArray(obj)) {
        obj[idx] = value;
      } else if (obj && typeof obj === "object") {
        (obj as unknown as Record<string, Value>)[String(idx)] = value;
      }
      break;
    }
  }
}
