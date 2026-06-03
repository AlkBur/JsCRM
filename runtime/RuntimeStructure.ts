// RuntimeStructure implements 1C Структура — a map of string keys to Values.
//
// Supports property access (obj.Ключ), method access (obj.Вставить, obj.Свойство),
// and iteration (hidden keys via keys()).
//
// Responsibility: provide key-value storage with 1C semantics.
// Non-responsibility: recursion, nesting limits, table-part behavior.

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
