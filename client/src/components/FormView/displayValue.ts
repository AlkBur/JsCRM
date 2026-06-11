export function stripObjectPrefix(name: string): string {
  return name.startsWith("Объект.") ? name.slice(7) : name;
}

export function displayValue(v: unknown): string {
  if (typeof v === "object" && v !== null) {
    const rec = v as Record<string, unknown>;
    return (rec["description"] as string) ?? (rec["id"] as string) ?? JSON.stringify(v);
  }
  if (v === null || v === undefined) return "";
  return String(v);
}
