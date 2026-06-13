export interface DisplayType {
  kind: string;
  dateKind?: "date" | "datetime";
}

export function displayValue(
  value: unknown,
  type?: DisplayType,
): string {
  if (value == null) return "";

  if (type?.kind === "date") {
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return String(value);
    // TODO(M5/M6): use dateKind in tables and DynamicList when columns become metadata-aware
    if (type.dateKind === "datetime") {
      return d.toLocaleDateString("ru-RU") + " " + d.toLocaleTimeString("ru-RU");
    }
    return d.toLocaleDateString("ru-RU");
  }

  if (type?.kind === "ref") {
    return (value as { description?: string }).description ?? "";
  }

  if (type?.kind === "enum") {
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
