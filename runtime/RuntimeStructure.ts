import type { Value } from "./types";
import type { RuntimeObject } from "./types";

export class RuntimeStructure implements RuntimeObject {
  readonly typeName = "Структура";
  private values = new Map<string, Value>();

  constructor(entries?: { key: string; value: Value }[]) {
    if (entries) {
      for (const e of entries) {
        this.values.set(e.key, e.value);
      }
    }
  }

  get(key: string): Value {
    return this.values.get(key) ?? undefined;
  }

  set(key: string, value: Value): void {
    this.values.set(key, value);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  insert(key: string, value: Value): void {
    this.values.set(key, value);
  }

  property(key: string): Value {
    return this.values.get(key) ?? undefined;
  }

  count(): number {
    return this.values.size;
  }

  keys(): string[] {
    return Array.from(this.values.keys());
  }

  toJSON(): Record<string, Value> {
    const obj: Record<string, Value> = {};
    for (const [k, v] of this.values) {
      obj[k] = v;
    }
    return obj;
  }
}
