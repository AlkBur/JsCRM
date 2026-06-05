import type { VmContext } from "./context";
import type { Value } from "./types";

export function evalBinary(ctx: VmContext, op: string, left: Value, right: Value): Value {
  switch (op) {
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
    case "Больше": return (left as number) > (right as number);
    case "Меньше": return (left as number) < (right as number);
    case "БольшеИлиРавно": return (left as number) >= (right as number);
    case "МеньшеИлиРавно": return (left as number) <= (right as number);
    case "Равно": return left == right;
    case "НеРавно": return left != right;
    case "И": return left && right;
    case "Или": return left || right;
    default: throw new Error(`Неизвестная операция: ${op}`);
  }
}

export function evalUnary(_ctx: VmContext, op: string, value: Value): Value {
  switch (op) {
    case "Минус": return -(value as number);
    case "Не": return !value;
    default: throw new Error(`Неизвестная унарная операция: ${op}`);
  }
}
