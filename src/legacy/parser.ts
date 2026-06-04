import type { Stmt, Expr, BinOp } from "./ast";

export class ParseError extends Error {
  constructor(msg: string, public pos: number) {
    super(`Ошибка парсинга на позиции ${pos}: ${msg}`);
  }
}

export function parse(code: string): Stmt[] {
  return new Parser(code).parseAll();
}

class Parser {
  private pos = 0;

  constructor(private code: string) {}

  parseAll(): Stmt[] {
    const stmts: Stmt[] = [];
    while (this.pos < this.code.length) {
      this.skipWs();
      if (this.pos >= this.code.length) break;
      stmts.push(this.parseStmt());
    }
    return stmts;
  }

  private peek(): string {
    return this.code[this.pos] ?? "\0";
  }

  private consume(expected?: string): string {
    const ch = this.code[this.pos++] ?? "";
    if (expected !== undefined && ch !== expected) {
      throw new ParseError(`Ожидается "${expected}", получено "${ch}"`, this.pos - 1);
    }
    return ch;
  }

  private skipWs(): void {
    while (this.pos < this.code.length && /\s/.test(this.peek())) this.pos++;
  }

  private startsWith(s: string): boolean {
    return this.code.startsWith(s, this.pos);
  }

  private matchKeyword(keyword: string): boolean {
    if (this.startsWith(keyword)) {
      const after = this.pos + keyword.length;
      if (after < this.code.length && /[а-яА-Яa-zA-Z0-9_]/.test(this.code[after] ?? "")) return false;
      this.pos = after;
      return true;
    }
    return false;
  }

  private expectKeyword(kw: string): void {
    if (!this.matchKeyword(kw)) throw new ParseError(`Ожидается '${kw}'`, this.pos);
  }

  private optSemi(): void {
    this.skipWs();
    if (this.peek() === ";") this.consume(";");
  }

  private isIdentStart(): boolean {
    return /[a-zA-Zа-яА-Я_]/.test(this.peek());
  }

  private parseStmt(): Stmt {
    this.skipWs();
    if (this.matchKeyword("Возврат")) {
      const expr = this.parseExpr();
      this.skipWs();
      if (this.peek() === ";") this.consume(";");
      return { kind: "return", expr };
    }
    if (this.matchKeyword("Если")) return this.parseIf();
    if (this.matchKeyword("Для")) return this.parseFor();
    if (this.matchKeyword("Пока")) return this.parseWhile();
    if (this.matchKeyword("Попытка")) return this.parseTry();
    if (this.matchKeyword("Процедура") || this.matchKeyword("Функция")) return this.parseProc();

    // Try parsing as assignment: target = expr
    // First parse any expression, then check if followed by =
    const savedPos = this.pos;
    try {
      const target = this.parsePossibleAssignTarget();
      this.skipWs();
      if (this.peek() === "=" && this.code[this.pos + 1] !== "=" && this.code[this.pos + 1] !== ">") {
        this.consume("=");
        const expr = this.parseExpr();
        this.skipWs();
        if (this.peek() === ";") this.consume(";");
        if (target.kind === "variable") {
          return { kind: "assign", target: target.name, expr };
        }
        return { kind: "set", target, expr };
      }
    } catch { /* not an assignment target, fall through */ }

    // Not assignment, parse as expression statement
    this.pos = savedPos;
    const expr = this.parseExpr();
    this.skipWs();
    if (this.peek() === ";") this.consume(";");
    return { kind: "expr", expr };
  }

  private parsePossibleAssignTarget(): Expr {
    let expr = this.parsePrimitive();
    while (true) {
      this.skipWs();
      if (this.peek() === ".") {
        this.consume(".");
        const prop = this.parseIdentifier();
        expr = { kind: "member", object: expr, property: prop };
      } else if (this.peek() === "[") {
        this.consume("[");
        const index = this.parseExpr();
        this.consume("]");
        expr = { kind: "call", callee: { kind: "member", object: expr, property: "Получить" }, args: [index] };
      } else break;
    }
    return expr;
  }

  private parseIf(): Stmt {
    const cond = this.parseExpr();
    this.skipWs();
    this.expectKeyword("Тогда");
    const then = this.parseBlock(["КонецЕсли", "Иначе"]);
    let elseStmts: Stmt[] = [];
    if (this.matchKeyword("Иначе")) {
      elseStmts = this.parseBlock(["КонецЕсли"]);
    }
    this.expectKeyword("КонецЕсли");
    this.optSemi();
    return { kind: "if", cond, then, else: elseStmts };
  }

  private parseFor(): Stmt {
    this.skipWs();
    const variable = this.parseIdentifier();
    this.skipWs();
    if (this.peek() === "=") this.consume("=");
    const start = this.parseExpr();
    this.skipWs();
    this.expectKeyword("По");
    const end = this.parseExpr();
    this.skipWs();
    this.expectKeyword("Цикл");
    const body = this.parseBlock(["КонецЦикла"]);
    this.expectKeyword("КонецЦикла");
    this.optSemi();
    return { kind: "for", variable, start, end, body };
  }

  private parseWhile(): Stmt {
    const cond = this.parseExpr();
    this.skipWs();
    this.expectKeyword("Цикл");
    const body = this.parseBlock(["КонецЦикла"]);
    this.expectKeyword("КонецЦикла");
    this.optSemi();
    return { kind: "for", variable: "_while", start: { kind: "number", value: 0 }, end: { kind: "number", value: 0 }, body };
  }

  private parseTry(): Stmt {
    const tryBody = this.parseBlock(["Исключение"]);
    this.expectKeyword("Исключение");
    const exceptBody = this.parseBlock(["КонецПопытки"]);
    this.expectKeyword("КонецПопытки");
    this.optSemi();
    return { kind: "try", try: tryBody, except: exceptBody } as any;
  }

  private parseProc(): Stmt {
    this.skipWs();
    this.parseIdentifier(); // procedure name
    this.skipWs();
    if (this.peek() === "(") {
      this.consume("(");
      while (this.pos < this.code.length && this.peek() !== ")") {
        this.skipWs();
        if (this.peek() === ")") break;
        this.parseIdentifier();
        this.skipWs();
        if (this.peek() === ",") this.consume(",");
      }
      if (this.peek() === ")") this.consume(")");
    }
    const body = this.parseBlock(["КонецПроцедуры", "КонецФункции"]);
    this.skipWs();
    const terminator = this.startsWith("КонецПроцедуры") ? "КонецПроцедуры" : "КонецФункции";
    this.matchKeyword(terminator);
    this.optSemi();

    // Flatten: execute body directly
    // For now, just execute body statements in sequence
    // We'll wrap in a synthetic "sequential" execution
    // by returning the last expression if there's a return
    const returnStmt = body.find(s => s.kind === "return");
    if (returnStmt) return returnStmt;
    // Otherwise, just execute all statements
    // We create an artificial sequential block:
    // Wrap all stmts into one by returning a special wrapper
    return { kind: "if", cond: { kind: "boolean", value: true }, then: body, else: [] };
  }

  private parseBlock(terminators: string[]): Stmt[] {
    const stmts: Stmt[] = [];
    while (this.pos < this.code.length) {
      this.skipWs();
      if (terminators.some(t => this.startsWith(t))) break;
      stmts.push(this.parseStmt());
    }
    return stmts;
  }

  private parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.matchKeyword("Или")) {
      const right = this.parseAnd();
      left = { kind: "binary", op: "или", left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseComparison();
    while (this.matchKeyword("И")) {
      const right = this.parseComparison();
      left = { kind: "binary", op: "и", left, right };
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAddSub();
    const ops = ["=", "<>", ">=", "<=", ">", "<"];
    while (true) {
      this.skipWs();
      let matched: string | undefined;
      const two = this.peek() + (this.code[this.pos + 1] ?? "");
      for (const op of ops) {
        if (two.startsWith(op) || this.peek() === op) {
          if (!matched || op.length > matched.length) matched = op;
        }
      }
      if (!matched) break;
      this.pos += matched.length;
      const right = this.parseAddSub();
      left = { kind: "binary", op: matched as BinOp, left, right };
    }
    return left;
  }

  private parseAddSub(): Expr {
    let left = this.parseMulDiv();
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.consume() as "+" | "-";
      const right = this.parseMulDiv();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseMulDiv(): Expr {
    let left = this.parseUnary();
    while (this.peek() === "*" || this.peek() === "/") {
      const op = this.consume() as "*" | "/";
      const right = this.parseUnary();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    this.skipWs();
    if (this.peek() === "-") {
      this.consume();
      return { kind: "unary", op: "-", right: this.parseUnary() };
    }
    if (this.matchKeyword("Не")) {
      return { kind: "unary", op: "not", right: this.parseUnary() };
    }
    return this.parseCall();
  }

  private parseCall(): Expr {
    let expr = this.parsePrimitive();
    while (true) {
      this.skipWs();
      if (this.peek() === ".") {
        this.consume(".");
        const prop = this.parseIdentifier();
        expr = { kind: "member", object: expr, property: prop };
      } else if (this.peek() === "[") {
        this.consume("[");
        const index = this.parseExpr();
        this.consume("]");
        expr = { kind: "call", callee: { kind: "member", object: expr, property: "Получить" }, args: [index] };
      } else if (this.peek() === "(") {
        this.consume("(");
        const args: Expr[] = [];
        if (this.peek() !== ")") {
          args.push(this.parseExpr());
          while (this.peek() === ",") {
            this.consume(",");
            this.skipWs();
            args.push(this.parseExpr());
          }
        }
        this.consume(")");
        expr = { kind: "call", callee: expr, args };
      } else break;
    }
    return expr;
  }

  private parsePrimitive(): Expr {
    this.skipWs();
    if (this.matchKeyword("Новый")) {
      this.skipWs();
      const type = this.parseIdentifier();
      this.skipWs();
      let args: Expr[] = [];
      if (this.peek() === "(") {
        this.consume("(");
        if (this.peek() !== ")") {
          args.push(this.parseExpr());
          while (this.peek() === ",") {
            this.consume(",");
            this.skipWs();
            args.push(this.parseExpr());
          }
        }
        this.consume(")");
      }
      return { kind: "new", type, args };
    }
    if (this.matchKeyword("Истина")) return { kind: "boolean", value: true };
    if (this.matchKeyword("Ложь")) return { kind: "boolean", value: false };
    if (this.peek() === "(") {
      this.consume("(");
      const expr = this.parseExpr();
      this.consume(")");
      return expr;
    }
    if (this.peek() === '"' || this.peek() === "'") return this.parseString();
    if ("0123456789".includes(this.peek())) return this.parseNumber();
    if (this.isIdentStart()) return { kind: "variable", name: this.parseIdentifier() };
    throw new ParseError(`Неожиданный символ: "${this.peek()}"`, this.pos);
  }

  private parseNumber(): Expr {
    let num = "";
    let hasDot = false;
    while (this.pos < this.code.length) {
      const ch = this.peek();
      if (ch >= "0" && ch <= "9") {
        num += this.consume();
      } else if ((ch === "." || ch === ",") && !hasDot) {
        hasDot = true;
        num += ".";
        this.consume();
      } else break;
    }
    return { kind: "number", value: parseFloat(num) || 0 };
  }

  private parseString(): Expr {
    const quote = this.consume();
    let value = "";
    while (this.pos < this.code.length && this.peek() !== quote) {
      if (this.peek() === "|" && this.code[this.pos + 1] === "\n") {
        this.pos += 2;
        continue;
      }
      value += this.consume();
    }
    if (this.pos < this.code.length) this.consume(quote);
    return { kind: "string", value };
  }

  private parseIdentifier(): string {
    let id = "";
    while (this.pos < this.code.length && /[a-zA-Zа-яА-Я0-9_]/.test(this.peek())) {
      id += this.consume();
    }
    if (!id) throw new ParseError("Ожидается идентификатор", this.pos);
    return id;
  }
}
