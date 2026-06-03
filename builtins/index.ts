// Builtin function implementations for the 1C platform runtime.
//
// This module registers all available builtins with the BuiltinRegistry
// at startup. Builtins are first-class 1C functions accessible from any module
// without qualification.
//
// Responsibility: implement 1C platform builtins (СтрДлина, Дата, ТипЗнч, etc.)
// Non-responsibility: user-defined functions, module routines, metadata methods.
//
// Invariant: user routines are resolved BEFORE builtins in the call chain,
// so user-defined functions can shadow builtins.

import type { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import { RuntimeStructure } from "../runtime/RuntimeStructure";

export function registerBuiltins(registry: BuiltinRegistry): void {
  registry.register("СтрДлина", (args) => {
    return String(args[0]).length;
  });

  registry.register("Лев", (args) => {
    const s = String(args[0]);
    const n = Math.max(0, Number(args[1]));
    return s.slice(0, n);
  });

  registry.register("Прав", (args) => {
    const s = String(args[0]);
    const n = Math.max(0, Number(args[1]));
    return s.slice(-n) || "";
  });

  registry.register("Сред", (args) => {
    const s = String(args[0]);
    const start = Math.max(0, Number(args[1]) - 1);
    const len = args.length > 2 ? Number(args[2]) : s.length;
    return s.slice(start, start + len);
  });

  registry.register("ВРег", (args) => {
    return String(args[0]).toUpperCase();
  });

  registry.register("НРег", (args) => {
    return String(args[0]).toLowerCase();
  });

  registry.register("СокрЛП", (args) => {
    return String(args[0]).trim();
  });

  registry.register("СокрЛ", (args) => {
    return String(args[0]).trimStart();
  });

  registry.register("СокрП", (args) => {
    return String(args[0]).trimEnd();
  });

  registry.register("Строка", (args) => {
    if (args[0] === null) return "";
    if (args[0] === undefined) return "";
    if (typeof args[0] === "boolean") return args[0] ? "Да" : "Нет";
    if (args[0] instanceof Date) {
      const d = args[0];
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    }
    return String(args[0]);
  });

  registry.register("Число", (args) => {
    if (args[0] === null || args[0] === undefined) return 0;
    const n = Number(String(args[0]).replace(",", "."));
    return isNaN(n) ? 0 : n;
  });

  registry.register("ТипЗнч", (args) => {
    const v = args[0];
    if (v === null) return "Null";
    if (v === undefined) return "Неопределено";
    if (typeof v === "boolean") return "Булево";
    if (typeof v === "number") return "Число";
    if (typeof v === "string") return "Строка";
    if (v instanceof Date) return "Дата";
    return (v as { typeName: string }).typeName;
  });

  registry.register("ОписаниеОшибки", () => {
    return "";
  });

  registry.register("ИнформацияОбОшибке", () => {
    const err = registry.lastError || "";
    const struct = new RuntimeStructure();
    struct.set("Описание", err);
    return struct;
  });

  registry.register("Дата", (args) => {
    const s = String(args[0]);
    const year = parseInt(s.slice(0, 4), 10);
    const month = parseInt(s.slice(4, 6), 10) - 1;
    const day = parseInt(s.slice(6, 8), 10);
    const hour = s.length > 8 ? parseInt(s.slice(8, 10), 10) : 0;
    const min = s.length > 10 ? parseInt(s.slice(10, 12), 10) : 0;
    const sec = s.length > 12 ? parseInt(s.slice(12, 14), 10) : 0;
    return new Date(year, month, day, hour, min, sec);
  });
}
