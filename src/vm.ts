import type { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import type { Value } from "../runtime/types";
import { RuntimeStructure } from "../runtime/RuntimeStructure";
import { RuntimeArray } from "../runtime/RuntimeArray";

interface Routine {
  kind: "procedure" | "function";
  name: string;
  export: boolean;
  params: { name: string; byRef: boolean; defaultValue?: unknown }[];
  body: Stmt[];
}

type Stmt =
  | { kind: "assign"; target: LValue; expr: Expr }
  | { kind: "if"; cond: Expr; then: Stmt[]; else: Stmt[] }
  | { kind: "for"; variable: string; start: Expr; end: Expr; body: Stmt[] }
  | { kind: "while"; cond: Expr; body: Stmt[] }
  | { kind: "foreach"; variable: string; collection: Expr; body: Stmt[] }
  | { kind: "call"; name?: string; object?: Expr; method?: string; args: Expr[] }
  | { kind: "return"; value?: Expr }
  | { kind: "break" }
  | { kind: "continue" }
  | { kind: "expr"; expr: Expr }
  | { kind: "try"; try: Stmt[]; catch: Stmt[] }
  | { kind: "throw"; value: Expr };

type Expr =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" }
  | { kind: "undefined" }
  | { kind: "variable"; name: string }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "index"; object: Expr; index: Expr }
  | { kind: "call"; name?: string; object?: Expr; method?: string; args: Expr[] }
  | { kind: "new"; type: string; args: { key: string; value: Expr }[] }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "unary"; op: string; value: Expr }
  | { kind: "if"; cond: Expr; then: Expr; else: Expr };

type LValue =
  | { kind: "variable"; name: string }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "index"; object: Expr; index: Expr };

class RuntimeError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RuntimeError";
  }
}

class BreakSignal extends Error {
  constructor() {
    super("break");
    this.name = "BreakSignal";
  }
}

class ContinueSignal extends Error {
  constructor() {
    super("continue");
    this.name = "ContinueSignal";
  }
}

export class VM {
  private routines = new Map<string, Routine>();
  private builtins: BuiltinRegistry;
  private vars: Record<string, Value> = {};
  private result: Value = undefined;
  lastError = "";

  constructor(builtins: BuiltinRegistry) {
    this.builtins = builtins;
  }

  loadModule(data: { irVersion: number; module: { body: { routines: Routine[] } } }): void {
    this.routines.clear();
    for (const r of data.module.body.routines) {
      this.routines.set(r.name, r);
    }
  }

  call(name: string, args: Value[] = []): Value {
    const routine = this.routines.get(name);
    if (!routine) throw new Error(`Функция не определена: ${name}`);
    this.lastError = "";
    const prevVars = this.vars;
    this.vars = {};
    for (let i = 0; i < routine.params.length; i++) {
      this.vars[routine.params[i].name] = i < args.length ? args[i] : null;
    }
    try {
      this.execStmts(routine.body);
      const r = this.result;
      this.vars = prevVars;
      return r;
    } catch (e) {
      this.vars = prevVars;
      throw e;
    }
  }

  private execStmts(stmts: Stmt[]): void {
    this.result = undefined;
    for (const stmt of stmts) {
      this.execStmt(stmt);
      if (this.result !== undefined) return;
    }
  }

  private execStmt(stmt: Stmt): void {
    switch (stmt.kind) {
      case "assign": {
        const value = this.evalExpr(stmt.expr);
        this.assignTo(stmt.target, value);
        return;
      }
      case "if": {
        if (this.evalExpr(stmt.cond)) {
          this.execStmts(stmt.then);
        } else {
          this.execStmts(stmt.else);
        }
        return;
      }
      case "for": {
        const start = Number(this.evalExpr(stmt.start));
        const end = Number(this.evalExpr(stmt.end));
        for (let i = start; i <= end; i++) {
          this.vars[stmt.variable] = i as Value;
          try {
            this.execStmts(stmt.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
          if (this.result !== undefined) return;
        }
        return;
      }
      case "while": {
        while (this.evalExpr(stmt.cond)) {
          try {
            this.execStmts(stmt.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
          if (this.result !== undefined) return;
        }
        return;
      }
      case "foreach": {
        const coll = this.evalExpr(stmt.collection);
        if (coll && typeof coll === "object") {
          const iter = (coll as unknown as Record<string, unknown>)[Symbol.iterator];
          if (typeof iter === "function") {
            for (const item of iter.call(coll)) {
              this.vars[stmt.variable] = item as Value;
              try {
                this.execStmts(stmt.body);
              } catch (e) {
                if (e instanceof BreakSignal) break;
                if (e instanceof ContinueSignal) continue;
                throw e;
              }
              if (this.result !== undefined) return;
            }
          } else if (Array.isArray(coll)) {
            for (const item of coll) {
              this.vars[stmt.variable] = item as Value;
              try {
                this.execStmts(stmt.body);
              } catch (e) {
                if (e instanceof BreakSignal) break;
                if (e instanceof ContinueSignal) continue;
                throw e;
              }
              if (this.result !== undefined) return;
            }
          }
        }
        return;
      }
      case "call": {
        if (stmt.name !== undefined) {
          const args = stmt.args.map(a => this.evalExpr(a));
          const fn = this.routines.get(stmt.name);
          if (fn) {
            const saved = this.vars;
            this.vars = {};
            for (let i = 0; i < fn.params.length; i++) {
              this.vars[fn.params[i].name] = i < args.length ? args[i] : null;
            }
            this.execStmts(fn.body);
            this.vars = saved;
          } else if (this.builtins.has(stmt.name)) {
            this.builtins.get(stmt.name)!(args);
          }
        } else if (stmt.object && stmt.method) {
          const obj = this.evalExpr(stmt.object);
          const args = stmt.args.map(a => this.evalExpr(a));
          this.callMethod(obj, stmt.method, args);
        }
        return;
      }
      case "return": {
        this.result = stmt.value !== undefined ? this.evalExpr(stmt.value) : undefined;
        return;
      }
      case "break":
        throw new BreakSignal();
      case "continue":
        throw new ContinueSignal();
      case "expr":
        this.evalExpr(stmt.expr);
        return;
      case "try": {
        try {
          this.execStmts(stmt.try);
        } catch (e) {
          if (e instanceof RuntimeError || e instanceof Error) {
            this.lastError = e.message;
            this.builtins.lastError = e.message;
          }
          this.execStmts(stmt.catch);
        }
        return;
      }
      case "throw": {
        const val = this.evalExpr(stmt.value);
        throw new RuntimeError(String(val));
      }
    }
  }

  private callMethod(obj: Value, method: string, args: Value[]): Value {
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
      const val = (obj as Record<string, unknown>)[method];
      if (typeof val === "function") return (val as (...a: unknown[]) => Value).call(obj, ...args);
      return val as Value;
    }
    throw new Error(`Метод не найден: ${method}`);
  }

  private evalExpr(expr: Expr): Value {
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
        if (expr.name in this.vars) return this.vars[expr.name];
        throw new Error(`Переменная не определена: ${expr.name}`);
      case "binary": {
        const left = this.evalExpr(expr.left);
        const right = this.evalExpr(expr.right);
        switch (expr.op) {
          case "Плюс": {
            if (left instanceof Date || right instanceof Date) {
              const l = left instanceof Date ? left.getTime() : Number(left);
              const r = right instanceof Date ? right.getTime() : Number(right);
              return l + r;
            }
            if (typeof left === "string" || typeof right === "string") {
              return String(left) + String(right);
            }
            return (left as number) + (right as number);
          }
          case "Минус": {
            if (left instanceof Date && right instanceof Date) {
              return (left.getTime() - right.getTime()) / 1000;
            }
            if (left instanceof Date || right instanceof Date) {
              const l = left instanceof Date ? left.getTime() : Number(left);
              const r = right instanceof Date ? right.getTime() : Number(right);
              return (l - r) / 1000;
            }
            return (left as number) - (right as number);
          }
          case "Умножить": return (left as number) * (right as number);
          case "Разделить": return (left as number) / (right as number);
          case "Больше": return left > right;
          case "Меньше": return left < right;
          case "БольшеИлиРавно": return left >= right;
          case "МеньшеИлиРавно": return left <= right;
          case "Равно": return left == right;
          case "НеРавно": return left != right;
          case "И": return left && right;
          case "Или": return left || right;
          default: throw new Error(`Неизвестная операция: ${expr.op}`);
        }
      }
      case "unary": {
        const val = this.evalExpr(expr.value);
        switch (expr.op) {
          case "Минус": return -(val as number);
          case "Не": return !val;
          default: throw new Error(`Неизвестная унарная операция: ${expr.op}`);
        }
      }
      case "if":
        return this.evalExpr(this.evalExpr(expr.cond) ? expr.then : expr.else);
      case "member": {
        const obj = this.evalExpr(expr.object);
        if (obj === null || obj === undefined) throw new Error("Значение не определено");
        if (obj instanceof RuntimeStructure) return obj.get(expr.property);
        if (obj instanceof RuntimeArray) {
          if (expr.property === "Количество") return obj.count();
          throw new Error(`Доступ к полю у Массива: ${expr.property}`);
        }
        if (typeof obj === "object" && !Array.isArray(obj) && !(obj instanceof Date)) {
          return (obj as Record<string, Value>)[expr.property] ?? undefined;
        }
        throw new Error(`Доступ к полю у значения типа ${typeof obj}`);
      }
      case "index": {
        const obj = this.evalExpr(expr.object);
        const idx = this.evalExpr(expr.index);
        if (obj instanceof RuntimeArray) return obj.get(Number(idx));
        if (obj instanceof RuntimeStructure) return obj.get(String(idx));
        if (Array.isArray(obj)) return obj[Number(idx)] as Value;
        if (obj && typeof obj === "object") {
          return (obj as Record<string, Value>)[String(idx)] ?? undefined;
        }
        throw new Error("Индексация не поддерживается");
      }
      case "call": {
        if (expr.name !== undefined) {
          const args = expr.args.map(a => this.evalExpr(a));
          const fn = this.routines.get(expr.name);
          if (fn) return this.call(expr.name, args);
          if (this.builtins.has(expr.name)) return this.builtins.get(expr.name)!(args);
          throw new Error(`Функция не определена: ${expr.name}`);
        }
        if (expr.object && expr.method) {
          const obj = this.evalExpr(expr.object);
          const args = expr.args.map(a => this.evalExpr(a));
          return this.callMethod(obj, expr.method, args);
        }
        throw new Error("Некорректный вызов");
      }
      case "new": {
        switch (expr.type) {
          case "Структура": {
            const entries = expr.args.map(a => ({ key: a.key, value: this.evalExpr(a.value) }));
            return new RuntimeStructure(entries);
          }
          case "Массив":
            return new RuntimeArray();
          case "ТаблицаЗначений": {
            const rows: RuntimeStructure[] = [];
            const cols: string[] = [];
            const tableObj = {
              Колонки: (() => {
                const colObj: Record<string, unknown> = {
                  _cols: cols,
                  Добавить: (name: string) => { cols.push(name); return cols.length; },
                  Количество: () => cols.length,
                  Очистить: () => { cols.length = 0; },
                };
                return colObj;
              })(),
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
            };
            return tableObj as unknown as Value;
          }
          default:
            throw new Error(`Неизвестный тип: ${expr.type}`);
        }
      }
    }
  }

  private assignTo(target: LValue, value: Value): void {
    switch (target.kind) {
      case "variable":
        this.vars[target.name] = value;
        break;
      case "member": {
        const obj = this.evalExpr(target.object);
        if (obj instanceof RuntimeStructure) {
          obj.set(target.property, value);
        } else if (obj && typeof obj === "object" && !Array.isArray(obj) && !(obj instanceof Date)) {
          (obj as Record<string, Value>)[target.property] = value;
        }
        break;
      }
      case "index": {
        const obj = this.evalExpr(target.object);
        const idx = Number(this.evalExpr(target.index));
        if (obj instanceof RuntimeArray) {
          obj.set(idx, value);
        } else if (obj instanceof RuntimeStructure) {
          obj.set(String(idx), value);
        } else if (Array.isArray(obj)) {
          obj[idx] = value;
        } else if (obj && typeof obj === "object") {
          (obj as Record<string, Value>)[String(idx)] = value;
        }
        break;
      }
    }
  }
}
