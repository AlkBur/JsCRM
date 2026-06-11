type DisplayKind =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "ref"
  | "enum"
  | "union";

export function displayValue(
  value: unknown,
  kind?: DisplayKind,
): string {
  if (value == null) return "";

  if (kind === "ref") {
    return (value as { description?: string }).description ?? "";
  }

  if (kind === "enum") {
    const v = value as { description?: string; value?: string };
    return v.description ?? v.value ?? "";
  }

  if (typeof value === "object") {
    return (value as { description?: string }).description ?? "";
  }

  return String(value);
}

export function stripObjectPrefix(name: string): string {
  return name.startsWith("Объект.") ? name.slice(7) : name;
}
