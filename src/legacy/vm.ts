import type { Stmt, Expr } from "./ast";

export class VM {
  async execute(stmts: Stmt[], vars: Record<string, any>): Promise<any> {
    for (const stmt of stmts) {
      const result = await this.executeStmt(stmt, vars);
      if (result !== undefined) return result;
    }
  }

  private async executeStmt(stmt: Stmt, vars: Record<string, any>): Promise<any> {
    switch (stmt.kind) {
      case "assign": {
        const value = await this.evalExpr(stmt.expr, vars);
        vars[stmt.target] = value;
        return;
      }
      case "set": {
        const value = await this.evalExpr(stmt.expr, vars);
        await this.evalSet(stmt.target, value, vars);
        return;
      }
      case "return":
        return await this.evalExpr(stmt.expr, vars);
      case "if": {
        const cond = await this.evalExpr(stmt.cond, vars);
        if (cond) {
          return await this.execute(stmt.then, vars);
        } else if (stmt.else.length > 0) {
          return await this.execute(stmt.else, vars);
        }
        return;
      }
      case "for": {
        const start = await this.evalExpr(stmt.start, vars);
        const end = await this.evalExpr(stmt.end, vars);
        for (let i = start; i <= end; i++) {
          vars[stmt.variable] = i;
          const result = await this.execute(stmt.body, vars);
          if (result !== undefined) return result;
        }
        return;
      }
      case "call": {
        const args = await Promise.all(stmt.args.map(a => this.evalExpr(a, vars)));
        const fn = vars[stmt.name];
        if (typeof fn === "function") return fn(...args);
        throw new Error(`Процедура не определена: ${stmt.name}`);
      }
      case "expr":
        return await this.evalExpr(stmt.expr, vars);
    }
  }

  private async evalSet(target: Expr, value: any, vars: Record<string, any>): Promise<void> {
    if (target.kind === "variable") {
      vars[target.name] = value;
      return;
    }
    if (target.kind === "member") {
      const obj = await this.evalExpr(target.object, vars);
      if (obj && typeof obj.set === "function") {
        obj.set(target.property, value);
      } else if (obj !== null && obj !== undefined) {
        (obj as any)[target.property] = value;
      }
      return;
    }
    throw new Error("Недопустимый целевой объект присваивания");
  }

  private async evalExpr(expr: Expr, vars: Record<string, any>): Promise<any> {
    switch (expr.kind) {
      case "number":
        return expr.value;
      case "string":
        return expr.value;
      case "boolean":
        return expr.value;
      case "variable":
        if (expr.name in vars) return vars[expr.name];
        throw new Error(`Переменная не определена: ${expr.name}`);
      case "binary": {
        const left = await this.evalExpr(expr.left, vars);
        const right = await this.evalExpr(expr.right, vars);
        switch (expr.op) {
          case "+": return left + right;
          case "-": return left - right;
          case "*": return left * right;
          case "/": return left / right;
          case ">": return left > right;
          case "<": return left < right;
          case ">=": return left >= right;
          case "<=": return left <= right;
          case "=": return left == right;
          case "<>": return left != right;
          case "и": return left && right;
          case "или": return left || right;
          default: throw new Error(`Неизвестная операция: ${expr.op}`);
        }
      }
      case "unary": {
        const right = await this.evalExpr(expr.right, vars);
        switch (expr.op) {
          case "-": return -right;
          case "not": return !right;
          default: throw new Error(`Неизвестная унарная операция: ${expr.op}`);
        }
      }
      case "member": {
        const object = await this.evalExpr(expr.object, vars);
        if (object === null || object === undefined) {
          throw new Error("Значение не определено");
        }
        if (typeof object.get === "function") {
          return object.get(expr.property);
        }
        return object[expr.property];
      }
      case "call": {
        const args = await Promise.all(expr.args.map(a => this.evalExpr(a, vars)));

        if (expr.callee.kind === "member") {
          const base = await this.evalExpr(expr.callee.object, vars);
          const methodName = expr.callee.property;
          if (base === null || base === undefined) {
            throw new Error("Значение не определено");
          }
          const method = base[methodName];
          if (typeof method === "function") {
            return method.call(base, ...args);
          }
          if (methodName === "Добавить" && Array.isArray(base)) {
            base.push(args[0]);
            return;
          }
          if (methodName === "Получить" && Array.isArray(base)) {
            return base[args[0]];
          }
          if (methodName === "Количество" && Array.isArray(base)) {
            return base.length;
          }
          if (methodName === "Вставить" && typeof base === "object" && base !== null && !Array.isArray(base)) {
            base[args[0]] = args[1];
            return;
          }
          throw new Error(`Метод не найден: ${methodName}`);
        }

        const callee = await this.evalExpr(expr.callee, vars);
        if (typeof callee === "function") {
          return callee(...args);
        }
        throw new Error("Вызов не-функции");
      }
      case "new": {
        switch (expr.type) {
          case "Структура": {
            const result: Record<string, any> = {};
            if (expr.args.length > 0) {
              const keysVal = await this.evalExpr(expr.args[0], vars);
              if (typeof keysVal === "string") {
                const keyArray = keysVal.split(",");
                for (let i = 0; i < keyArray.length; i++) {
                  const key = keyArray[i].trim();
                  result[key] = expr.args[i + 1] ? await this.evalExpr(expr.args[i + 1], vars) : undefined;
                }
              }
            }
            return result;
          }
          case "Массив":
            return [];
          default:
            throw new Error(`Неизвестный тип: ${expr.type}`);
        }
      }
    }
  }
}
