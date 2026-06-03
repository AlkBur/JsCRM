// BuiltinRegistry stores platform (builtin) functions.
//
// Builtins are registered by name and resolved by the VM during
// expression and statement execution. The registry is populated
// once at startup by registerBuiltins() and shared across all VM instances.
//
// Responsibility: store and resolve builtin functions by name.
// Non-responsibility: BuiltinRegistry does not execute routines,
// does not know about Program, modules, or metadata.
//
// Invariant: builtins are read-only after registration.
// The lastError field is set by VM during try/catch for ИнформацияОбОшибке.

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
