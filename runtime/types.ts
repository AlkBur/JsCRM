// Value type system for 1C runtime.
//
// Value is the universal type flowing through the VM — all 1C values
// at runtime must be one of these TypeScript types.
//
// RuntimeObject is the interface for first-class 1C objects
// (Структура, Массив, etc.). Every runtime object exposes typeName
// so builtins like ТипЗнч can identify the 1C type.
//
// Responsibility: define the type contract between VM, builtins, and runtime objects.
// Non-responsibility: Value does not define operators or coercion rules —
// those live in the VM evaluator.

export interface RuntimeObject {
  readonly typeName: string;
}

export type Value =
  | number
  | string
  | boolean
  | Date
  | null
  | undefined
  | RuntimeObject;
