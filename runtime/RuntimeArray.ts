import type { Value } from "./types";
import type { RuntimeObject } from "./types";

export class RuntimeArray implements RuntimeObject {
  readonly typeName = "Массив";
  private items: Value[] = [];

  constructor(values?: Value[]) {
    if (values) {
      this.items = [...values];
    }
  }

  add(value: Value): void {
    this.items.push(value);
  }

  get(index: number): Value {
    return this.items[index] ?? undefined;
  }

  set(index: number, value: Value): void {
    this.items[index] = value;
  }

  count(): number {
    return this.items.length;
  }

  clear(): void {
    this.items.length = 0;
  }

  delete(index: number): void {
    this.items.splice(index, 1);
  }

  find(value: Value): number {
    return this.items.indexOf(value);
  }

  [Symbol.iterator](): Iterator<Value> {
    return this.items[Symbol.iterator]();
  }

  toArray(): Value[] {
    return [...this.items];
  }
}
