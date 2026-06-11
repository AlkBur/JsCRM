export interface FormState {
  values: Record<string, unknown>;
  dirty: boolean;
}

export function stripObjectPrefix(name: string): string {
  if (name.startsWith("Объект.")) {
    return name.slice(7);
  }
  return name;
}
