import type { Value } from "./types";

export type BuiltinFn = (args: Value[]) => Value;

export class BuiltinRegistry {
  private map = new Map<string, BuiltinFn>();
  lastError = "";

  register(name: string, fn: BuiltinFn): void {
    this.map.set(name, fn);
  }

  get(name: string): BuiltinFn | undefined {
    return this.map.get(name);
  }

  has(name: string): boolean {
    return this.map.has(name);
  }
}
