import type { VmContext } from "./context";
import type { Value, ResolvedFunction } from "./types";
import { executeRoutine } from "./executeRoutine";
import { RuntimeStructure } from "../../runtime/RuntimeStructure";
import { RuntimeArray } from "../../runtime/RuntimeArray";

export function resolveFunction(ctx: VmContext, name: string): ResolvedFunction {
  const routine = ctx.program.findRoutine(name);
  if (routine) return { kind: "routine", routine: routine.routine };
  const builtin = ctx.builtins.get(name);
  if (builtin) return { kind: "builtin", fn: builtin };
  throw new Error(`Функция не определена: ${name}`);
}

export function callFunction(ctx: VmContext, name: string, args: Value[]): Value {
  const resolved = resolveFunction(ctx, name);
  if (resolved.kind === "builtin") return resolved.fn(args);
  return executeRoutine(ctx, resolved.routine, args);
}

export function callMethod(ctx: VmContext, obj: Value, method: string, args: Value[]): Value {
  if (obj instanceof RuntimeArray) {
    if (method === "Добавить") { obj.add(args[0]); return obj.count(); }
    if (method === "Получить") return obj.get(Number(args[0]));
    if (method === "Количество") return obj.count();
    if (method === "Очистить") { obj.clear(); return undefined; }
    if (method === "Удалить") { obj.delete(Number(args[0])); return undefined; }
    if (method === "Найти") return obj.find(args[0]);
  }
  if (obj instanceof RuntimeStructure) {
    if (method === "Вставить") { obj.insert(String(args[0]), args[1]); return undefined; }
    if (method === "Свойство") return obj.has(String(args[0]));
    return obj.get(method);
  }
  if (obj && typeof obj === "object" && !Array.isArray(obj) && !(obj instanceof Date)) {
    const val = (obj as unknown as Record<string, unknown>)[method];
    if (typeof val === "function") return (val as (...a: unknown[]) => Value).call(obj, ...args);
    return val as Value;
  }
  throw new Error(`Метод не найден: ${method}`);
}
