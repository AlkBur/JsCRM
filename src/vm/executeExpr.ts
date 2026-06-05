import type { VmContext } from "./context";
import type { Expr, Value } from "./types";
import { RuntimeStructure } from "../../runtime/RuntimeStructure";
import { RuntimeArray } from "../../runtime/RuntimeArray";
import { evalBinary, evalUnary } from "./binary";
import { getVar } from "./scope";

export function evalExpr(ctx: VmContext, expr: Expr): Value {
  switch (expr.kind) {
    case "number":
    case "string":
    case "boolean":
      return expr.value;
    case "null":
      return null;
    case "undefined":
      return undefined;
    case "variable":
      return getVar(ctx, expr.name);
    case "binary": {
      const left = evalExpr(ctx, expr.left);
      const right = evalExpr(ctx, expr.right);
      return evalBinary(ctx, expr.op, left, right);
    }
    case "unary": {
      const val = evalExpr(ctx, expr.value);
      return evalUnary(ctx, expr.op, val);
    }
    case "if":
      return evalExpr(ctx, evalExpr(ctx, expr.cond) ? expr.then : expr.else);
    case "member": {
      const obj = evalExpr(ctx, expr.object);
      if (obj === null || obj === undefined) throw new Error("Значение не определено");
      if (obj instanceof RuntimeStructure) return obj.get(expr.property);
      if (obj instanceof RuntimeArray) {
        if (expr.property === "Количество") return obj.count();
        throw new Error(`Доступ к полю у Массива: ${expr.property}`);
      }
      if (typeof obj === "object" && !Array.isArray(obj) && !(obj instanceof Date)) {
        return (obj as unknown as Record<string, Value>)[expr.property] ?? undefined;
      }
      throw new Error(`Доступ к полю у значения типа ${typeof obj}`);
    }
    case "index": {
      const obj = evalExpr(ctx, expr.object);
      const idx = evalExpr(ctx, expr.index);
      if (obj instanceof RuntimeArray) return obj.get(Number(idx));
      if (obj instanceof RuntimeStructure) return obj.get(String(idx));
      if (Array.isArray(obj)) return obj[Number(idx)] as Value;
      if (obj && typeof obj === "object") {
        return (obj as unknown as Record<string, Value>)[String(idx)] ?? undefined;
      }
      throw new Error("Индексация не поддерживается");
    }
    case "call": {
      if (expr.name !== undefined) {
        const args = expr.args.map(a => evalExpr(ctx, a));
        return ctx.callFn(expr.name, args);
      }
      if (expr.object && expr.method) {
        const obj = evalExpr(ctx, expr.object);
        const args = expr.args.map(a => evalExpr(ctx, a));
        return ctx.callMethodFn(obj, expr.method, args);
      }
      throw new Error("Некорректный вызов");
    }
    case "new": {
      switch (expr.type) {
        case "Структура": {
          const entries = expr.args.map(a => ({ key: a.key, value: evalExpr(ctx, a.value) }));
          return new RuntimeStructure(entries);
        }
        case "Массив":
          return new RuntimeArray();
        case "ТаблицаЗначений": {
          const rows: RuntimeStructure[] = [];
          const cols: string[] = [];
          return {
            Колонки: {
              _cols: cols,
              Добавить: (name: string) => { cols.push(name); return cols.length; },
              Количество: () => cols.length,
              Очистить: () => { cols.length = 0; },
            },
            Добавить: () => {
              const row = new RuntimeStructure();
              rows.push(row);
              return row;
            },
            Количество: () => rows.length,
            Очистить: () => { rows.length = 0; },
            [Symbol.iterator]: function* () {
              for (const row of rows) yield row;
            },
          } as unknown as Value;
        }
        default:
          throw new Error(`Неизвестный тип: ${expr.type}`);
      }
    }
  }
}
